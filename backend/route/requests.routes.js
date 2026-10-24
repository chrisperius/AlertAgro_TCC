import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  createRequest,
  listRequests,
  reviewRequest,
} from "../controller/requests.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listRequests);
router.post("/", createRequest);
router.put("/:id", reviewRequest);

export default router;
