import { Router } from "express";
import {
  createPackingItem,
  deletePackingItem,
  listPacking,
  resetPacking,
  togglePackingItem,
} from "../controllers/packingController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, listPacking);
router.post("/", requireAuth, createPackingItem);
router.post("/reset", requireAuth, resetPacking);
router.patch("/:itemId", requireAuth, togglePackingItem);
router.delete("/:itemId", requireAuth, deletePackingItem);

export default router;
