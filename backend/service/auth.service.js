import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { pool } from "../database/db.js";
import { sendAuthEmail } from "../config/mailer.js";

const hashToken = (token) => createHash("sha256").update(token).digest("hex");
const publicUser = (row) => ({
  id: row.id,
  full_name: row.full_name,
  email: row.email,
  role: row.role,
  telefone: row.telefone,
  email_verified: Boolean(row.email_verified),
});

let resolvedJwtExpiresIn;

function getJwtExpiresIn() {
  if (resolvedJwtExpiresIn) return resolvedJwtExpiresIn;
  const raw = process.env.JWT_EXPIRES_IN?.trim();
  if (!raw) {
    resolvedJwtExpiresIn = "1h";
    return resolvedJwtExpiresIn;
  }
  try {
    jwt.sign({ ping: 1 }, "jwt-expires-in-check", { expiresIn: raw });
    resolvedJwtExpiresIn = raw;
  } catch {
    console.warn(
      `[auth] JWT_EXPIRES_IN inválido (${JSON.stringify(raw)}); usando "1h".`,
    );
    resolvedJwtExpiresIn = "1h";
  }
  return resolvedJwtExpiresIn;
}

function createJwt(user) {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    const e = new Error(
      "JWT_SECRET não configurado no servidor. Defina a variável no Render.",
    );
    e.status = 503;
    throw e;
  }
  if (!user?.id) {
    const e = new Error("Usuário sem identificador válido.");
    e.status = 500;
    throw e;
  }
  try {
    return jwt.sign(
      { sub: user.id, role: user.role },
      secret,
      { expiresIn: getJwtExpiresIn() },
    );
  } catch (error) {
    console.error("[auth] Falha ao emitir JWT:", error.message);
    const e = new Error(
      "Não foi possível gerar o token de acesso. Verifique JWT_SECRET e JWT_EXPIRES_IN no Render.",
    );
    e.status = 503;
    throw e;
  }
}

async function createEmailToken(connection, userId, purpose, minutes) {
  const rawToken = randomBytes(32).toString("hex");
  await connection.execute(
    "DELETE FROM auth_tokens WHERE user_id = ? AND purpose = ?",
    [userId, purpose],
  );
  await connection.execute(
    "INSERT INTO auth_tokens (user_id, token_hash, purpose, expires_at) VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE))",
    [userId, hashToken(rawToken), purpose, minutes],
  );
  return rawToken;
}

export async function register({ full_name, email, telefone, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await pool.execute(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [normalizedEmail],
  );

  if (existing.length) {
    const error = new Error("Este e-mail já está cadastrado.");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = randomUUID().replaceAll("-", "").slice(0, 24);

  try {
    await pool.execute(
      `INSERT INTO users
       (id, full_name, email, role, telefone, password_hash, email_verified)
       VALUES (?, ?, ?, 'comum', ?, ?, 1)`,
      [
        userId,
        full_name.trim(),
        normalizedEmail,
        telefone?.trim() || null,
        passwordHash,
      ],
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      error.status = 409;
      error.message = "Este e-mail já está cadastrado.";
    }
    throw error;
  }

  return {
    message: "Cadastro realizado com sucesso. Você já pode entrar.",
  };
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
}

export async function verifyEmail(token) {
  if (!token) {
    const e = new Error("Token de confirmação não informado.");
    e.status = 400;
    throw e;
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [tokens] = await connection.execute(
      `SELECT id, user_id FROM auth_tokens WHERE token_hash = ? AND purpose = 'verify_email' AND expires_at > UTC_TIMESTAMP() LIMIT 1 FOR UPDATE`,
      [hashToken(token)],
    );
    if (!tokens.length) {
      const e = new Error(
        "Link inválido ou expirado. Solicite um novo cadastro ou link.",
      );
      e.status = 400;
      throw e;
    }
    const userId = tokens[0].user_id;
    await connection.execute(
      "UPDATE users SET email_verified = 1 WHERE id = ?",
      [userId],
    );
    await connection.execute("DELETE FROM auth_tokens WHERE id = ?", [
      tokens[0].id,
    ]);
    await connection.commit();
    const [users] = await connection.execute(
      "SELECT id, full_name, email, role, telefone, email_verified FROM users WHERE id = ?",
      [userId],
    );
    return {
      message: "E-mail confirmado. Agora você pode entrar.",
      user: publicUser(users[0]),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function login({ email, password }) {
  const [rows] = await pool.execute(
    "SELECT id, full_name, email, role, telefone, password_hash, email_verified FROM users WHERE email = ? LIMIT 1",
    [email.trim().toLowerCase()],
  );
  if (
    !rows.length ||
    !rows[0].password_hash ||
    !(await bcrypt.compare(password, rows[0].password_hash))
  ) {
    const e = new Error("E-mail ou senha inválidos.");
    e.status = 401;
    throw e;
  }

  const user = publicUser(rows[0]);
  return { token: createJwt(user), user };
}

export async function me(userId) {
  const [rows] = await pool.execute(
    "SELECT id, full_name, email, role, telefone, email_verified FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  if (!rows.length) {
    const e = new Error("Usuário não encontrado.");
    e.status = 404;
    throw e;
  }
  return publicUser(rows[0]);
}

export async function forgotPassword(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const [users] = await pool.execute(
    "SELECT id, full_name, email FROM users WHERE email = ? AND email_verified = 1 LIMIT 1",
    [normalizedEmail],
  );
  // Resposta genérica evita revelar se o e-mail existe.
  if (!users.length)
    return {
      message:
        "Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.",
    };
  const user = users[0];
  const connection = await pool.getConnection();
  let rawToken;
  try {
    await connection.beginTransaction();
    rawToken = await createEmailToken(
      connection,
      user.id,
      "reset_password",
      30,
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await sendAuthEmail({
    to: user.email,
    subject: "Redefinição de senha - AlertAgro",
    text: `Olá, ${user.full_name}. Para redefinir sua senha, acesse: ${link}\nO link expira em 30 minutos. Se você não solicitou, ignore este e-mail.`,
    html: `<p>Olá, ${escapeHtml(user.full_name)}!</p><p><a href="${link}">Redefinir minha senha</a></p><p>O link expira em 30 minutos. Se você não solicitou, ignore este e-mail.</p>`,
  });
  return {
    message:
      "Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.",
  };
}

export async function resetPassword({ token, password }) {
  if (!token) {
    const e = new Error("Token de redefinição não informado.");
    e.status = 400;
    throw e;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [tokens] = await connection.execute(
      `SELECT id, user_id FROM auth_tokens WHERE token_hash = ? AND purpose = 'reset_password' AND expires_at > UTC_TIMESTAMP() LIMIT 1 FOR UPDATE`,
      [hashToken(token)],
    );
    if (!tokens.length) {
      const e = new Error(
        "Link inválido ou expirado. Solicite uma nova redefinição.",
      );
      e.status = 400;
      throw e;
    }
    await connection.execute(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [passwordHash, tokens[0].user_id],
    );
    await connection.execute(
      "DELETE FROM auth_tokens WHERE user_id = ? AND purpose = 'reset_password'",
      [tokens[0].user_id],
    );
    await connection.commit();
    return { message: "Senha redefinida com sucesso. Você já pode entrar." };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
