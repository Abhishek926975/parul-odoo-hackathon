import { Router } from "express";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
} from "../controllers/expenseController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, listExpenses);
router.post("/", requireAuth, createExpense);
router.put("/:expId", requireAuth, updateExpense);
router.delete("/:expId", requireAuth, deleteExpense);

export default router;
