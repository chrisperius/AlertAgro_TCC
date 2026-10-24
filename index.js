import express from "express";
import cors from "cors";
import { pool } from "./backend/database/db.js";
import authRoutes from "./backend/route/auth.routes.js";
import { errorHandler } from "./backend/controller/auth.controller.js";
import usersRoutes from "./backend/route/users.routes.js";
import productsRoutes from "./backend/route/products.routes.js";
import movementsRoutes from "./backend/route/movements.routes.js";
import culturesRoutes from "./backend/route/cultures.routes.js";
import requestsRoutes from "./backend/route/requests.routes.js";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/movements", movementsRoutes);
app.use("/api/cultures", culturesRoutes);
app.use("/api/requests", requestsRoutes);
app.use(errorHandler);

app.get("/api/teste", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS total FROM users");
    res.json({ ok: true, usuarios: rows[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, erro: err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
