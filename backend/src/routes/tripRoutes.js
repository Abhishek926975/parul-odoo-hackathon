import { Router } from "express";
import {
  createTrip,
  deleteTrip,
  getPublicTrip,
  getTripById,
  listTrips,
  updateTrip,
} from "../controllers/tripController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, listTrips);
router.post("/", requireAuth, createTrip);
router.get("/public/:slug", getPublicTrip);
router.get("/:id", requireAuth, getTripById);
router.put("/:id", requireAuth, updateTrip);
router.delete("/:id", requireAuth, deleteTrip);

export default router;
