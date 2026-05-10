import { Router } from "express";
import {
  featuredActivities,
  getActivityById,
  listActivities,
} from "../controllers/activityController.js";

const router = Router();

router.get("/", listActivities);
router.get("/featured", featuredActivities);
router.get("/:id", getActivityById);

export default router;
