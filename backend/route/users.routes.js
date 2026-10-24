import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { listUsers, updateUserRole } from "../controller/users.controller.js";

const router = Router();

function requireSupervisorGeral(req, res, next) {
  if (req.user?.role !== "supervisor_geral") {
    return res.status(403).json({ message: "Apenas Supervisor Geral pode gerenciar usuários." });
  }
  return next();
}

router.use(requireAuth, requireSupervisorGeral);
router.get("/", listUsers);
router.patch("/:id/role", updateUserRole);

export default router;
