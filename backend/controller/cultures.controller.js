import { randomUUID } from "crypto";
import { pool } from "../database/db.js";

export async function listCultures(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM cultures ORDER BY nome ASC",
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function createCulture(req, res, next) {
  try {
    const nome = String(req.body.nome || "").trim();
    const area = Number(req.body.area_hectares);

    if (!nome) {
      return res.status(400).json({
        message: "Informe o nome da cultura.",
      });
    }

    if (!Number.isFinite(area) || area < 0) {
      return res.status(400).json({
        message: "A área deve ser um número igual ou maior que zero.",
      });
    }

    const id = randomUUID().replaceAll("-", "").slice(0, 24);

    await pool.execute(
      `INSERT INTO cultures (id, nome, area_hectares, created_by_id)
       VALUES (?, ?, ?, ?)`,
      [id, nome, area, req.user.id],
    );

    const [rows] = await pool.execute(
      "SELECT * FROM cultures WHERE id = ? LIMIT 1",
      [id],
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function updateCulture(req, res, next) {
  try {
    const nome = String(req.body.nome || "").trim();
    const area = Number(req.body.area_hectares);

    if (!nome) {
      return res.status(400).json({
        message: "Informe o nome da cultura.",
      });
    }

    if (!Number.isFinite(area) || area < 0) {
      return res.status(400).json({
        message: "A área deve ser um número igual ou maior que zero.",
      });
    }

    const [result] = await pool.execute(
      "UPDATE cultures SET nome = ?, area_hectares = ? WHERE id = ?",
      [nome, area, req.params.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Cultura não encontrada.",
      });
    }

    const [rows] = await pool.execute(
      "SELECT * FROM cultures WHERE id = ? LIMIT 1",
      [req.params.id],
    );

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function deleteCulture(req, res, next) {
  try {
    const [result] = await pool.execute("DELETE FROM cultures WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Cultura não encontrada.",
      });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
