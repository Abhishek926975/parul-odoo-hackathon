import { Router } from "express";
import {
  createStop,
  deleteStop,
  listStops,
  updateStop,
} from "../controllers/stopController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, listStops);
router.post("/", requireAuth, createStop);
router.put("/:stopId", requireAuth, updateStop);
router.delete("/:stopId", requireAuth, deleteStop);

export default router;
