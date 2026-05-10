import { Router } from "express";
import { deleteTrip, deleteUser, getStats, listAllTrips, listUsers } from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/dashboard", requireAuth, requireRole(["admin"]), getStats);
router.get("/stats", requireAuth, requireRole(["admin"]), getStats);
router.get("/users", requireAuth, requireRole(["admin"]), listUsers);
router.get("/trips", requireAuth, requireRole(["admin"]), listAllTrips);
router.delete("/users/:userId", requireAuth, requireRole(["admin"]), deleteUser);
router.delete("/trips/:tripId", requireAuth, requireRole(["admin"]), deleteTrip);

export default router;
