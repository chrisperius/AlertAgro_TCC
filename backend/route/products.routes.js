import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controller/products.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", listProducts);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
