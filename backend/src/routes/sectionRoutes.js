import { Router } from "express";
import {
  createSection,
  deleteSection,
  listSections,
  updateSection,
} from "../controllers/sectionController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, listSections);
router.post("/", requireAuth, createSection);
router.put("/:sectionId", requireAuth, updateSection);
router.delete("/:sectionId", requireAuth, deleteSection);

export default router;
