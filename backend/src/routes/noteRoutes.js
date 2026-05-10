import { Router } from "express";
import {
  createNote,
  deleteNote,
  listNotes,
  updateNote,
} from "../controllers/noteController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, listNotes);
router.post("/", requireAuth, createNote);
router.put("/:noteId", requireAuth, updateNote);
router.delete("/:noteId", requireAuth, deleteNote);

export default router;
