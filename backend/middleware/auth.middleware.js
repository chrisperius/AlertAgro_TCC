import jwt from "jsonwebtoken";
import { pool } from "../database/db.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res
        .status(401)
        .json({ message: "Token de acesso não informado." });
    }
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET não configurado.");
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.execute(
      "SELECT id, full_name, email, role, telefone, email_verified FROM users WHERE id = ? LIMIT 1",
      [payload.sub],
    );
    if (!rows.length || !rows[0].email_verified) {
      return res
        .status(401)
        .json({ message: "Sessão inválida ou conta não confirmada." });
    }
    req.user = rows[0];
    return next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({ message: "Token inválido ou expirado." });
    }
    return next(error);
  }
}
