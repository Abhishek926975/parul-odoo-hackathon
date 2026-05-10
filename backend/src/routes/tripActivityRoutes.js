import { Router } from "express";
import {
  addTripActivity,
  listTripActivities,
  removeTripActivity,
  updateTripActivity,
} from "../controllers/tripActivityController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, listTripActivities);
router.post("/", requireAuth, addTripActivity);
router.put("/:id", requireAuth, updateTripActivity);
router.delete("/:id", requireAuth, removeTripActivity);

export default router;
