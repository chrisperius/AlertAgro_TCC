import { randomUUID } from "node:crypto";
import { pool } from "../database/db.js";

const fields = [
  "nome",
  "categoria",
  "categoria_tipo",
  "quantidade",
  "nivel_toxicidade",
  "dasa_cor",
  "nome_cientifico",
  "caracteristica",
  "horario",
  "embalagem_tipo",
  "embalagem_quantidade",
  "preco",
  "preco_total",
  "estoque_minimo",
];

const canManageProducts = (role) =>
  role === "supervisor" || role === "supervisor_geral";

function cleanProduct(body = {}) {
  const product = {};
  for (const field of fields) {
    product[field] = body[field] ?? null;
  }

  product.nome = String(product.nome ?? "").trim();
  product.categoria = String(product.categoria ?? "").trim();
  product.categoria_tipo = String(product.categoria_tipo ?? "NPK");
  product.nivel_toxicidade = String(product.nivel_toxicidade ?? "Baixo");
  product.dasa_cor = String(product.dasa_cor ?? "Verde");
  product.embalagem_tipo = String(product.embalagem_tipo ?? "kg");

  for (const field of [
    "quantidade",
    "embalagem_quantidade",
    "preco",
    "estoque_minimo",
  ]) {
    product[field] = Number(product[field] ?? 0);
    if (!Number.isFinite(product[field]) || product[field] < 0) {
      const error = new Error(`O campo ${field} deve ser um número não negativo.`);
      error.status = 400;
      throw error;
    }
  }

  product.preco_total = Number((product.preco * product.quantidade).toFixed(2));
  product.nome_cientifico = product.nome_cientifico
    ? String(product.nome_cientifico).trim()
    : null;
  product.caracteristica = product.caracteristica
    ? String(product.caracteristica).trim()
    : null;
  product.horario = product.horario || null;

  if (!product.nome || !product.categoria) {
    const error = new Error("Informe o nome e a categoria do produto.");
    error.status = 400;
    throw error;
  }

  if (!["NPK", "NFP"].includes(product.categoria_tipo)) {
    const error = new Error("Tipo de categoria inválido.");
    error.status = 400;
    throw error;
  }
  if (!["Baixo", "Médio", "Alto", "Extremo"].includes(product.nivel_toxicidade)) {
    const error = new Error("Nível de toxicidade inválido.");
    error.status = 400;
    throw error;
  }
  if (!["Verde", "Amarelo", "Laranja", "Vermelho", "Roxo", "Branco", "Preto", "Azul"].includes(product.dasa_cor)) {
    const error = new Error("Classificação DASA inválida.");
    error.status = 400;
    throw error;
  }
  if (!["kg", "litro"].includes(product.embalagem_tipo)) {
    const error = new Error("Tipo de embalagem inválido.");
    error.status = 400;
    throw error;
  }
  if (product.embalagem_quantidade <= 0) {
    const error = new Error("A quantidade da embalagem deve ser maior que zero.");
    error.status = 400;
    throw error;
  }

  return product;
}

export async function listProducts(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM products ORDER BY nome ASC LIMIT 500",
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    if (!canManageProducts(req.user.role)) {
      return res.status(403).json({ message: "Você não tem permissão para cadastrar produtos." });
    }

    const product = cleanProduct(req.body);
    const id = randomUUID().replaceAll("-", "").slice(0, 24);
    const columns = ["id", "created_by_id", ...fields];
    const values = [id, req.user.id, ...fields.map((field) => product[field])];
    const placeholders = columns.map(() => "?").join(", ");
    await pool.execute(
      `INSERT INTO products (${columns.join(", ")}) VALUES (${placeholders})`,
      values,
    );

    const [rows] = await pool.execute("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    if (!canManageProducts(req.user.role)) {
      return res.status(403).json({ message: "Você não tem permissão para editar produtos." });
    }

    const product = cleanProduct(req.body);
    const assignments = fields.map((field) => `${field} = ?`).join(", ");
    const values = [...fields.map((field) => product[field]), req.params.id];
    const [result] = await pool.execute(
      `UPDATE products SET ${assignments} WHERE id = ?`,
      values,
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    const [rows] = await pool.execute("SELECT * FROM products WHERE id = ? LIMIT 1", [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    if (!canManageProducts(req.user.role)) {
      return res.status(403).json({ message: "Você não tem permissão para excluir produtos." });
    }

    const [result] = await pool.execute("DELETE FROM products WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
