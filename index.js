import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
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

app.get("/api/health", async (_req, res) => {
  const health = { ok: true, database: false, jwt: false };
  try {
    await pool.query("SELECT 1");
    health.database = true;
  } catch (error) {
    health.ok = false;
    health.databaseError = error.message;
  }
  try {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) throw new Error("JWT_SECRET ausente ou vazio");
    jwt.sign({ ping: 1 }, secret, { expiresIn: "1s" });
    health.jwt = true;
  } catch (error) {
    health.ok = false;
    health.jwtError = error.message;
  }
  res.status(health.ok ? 200 : 503).json(health);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
