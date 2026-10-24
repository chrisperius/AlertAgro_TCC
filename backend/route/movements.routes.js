import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  listMovements,
  createMovement,
} from "../controller/movements.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listMovements);
router.post("/", createMovement);

export default router;
