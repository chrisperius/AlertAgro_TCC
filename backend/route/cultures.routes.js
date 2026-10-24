import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  listCultures,
  createCulture,
  updateCulture,
  deleteCulture,
} from "../controller/cultures.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listCultures);
router.post("/", createCulture);
router.put("/:id", updateCulture);
router.delete("/:id", deleteCulture);

export default router;
