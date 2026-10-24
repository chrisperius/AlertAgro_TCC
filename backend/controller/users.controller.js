import { pool } from "../database/db.js";

export async function listUsers(req, res, next) {
  try {
    const [users] = await pool.execute(
      "SELECT id, full_name, email, telefone, role FROM users ORDER BY full_name ASC, email ASC"
    );
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    const allowedRoles = ["comum", "supervisor", "supervisor_geral"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Hierarquia inválida." });
    }
    const [result] = await pool.execute("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    return res.json({ message: "Hierarquia atualizada com sucesso." });
  } catch (error) {
    return next(error);
  }
}
