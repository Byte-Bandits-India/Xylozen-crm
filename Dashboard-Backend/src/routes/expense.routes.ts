import { Router } from "express";
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  markExpenseAsPaid,
} from "../controllers/expense.controller";
import { authMiddleware, requirePageEdit } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.middleware";
import { createExpenseSchema, updateExpenseSchema } from "../validators/expense.validator";

const router = Router();

router.post("/", authMiddleware, requirePageEdit(["fixed-costs", "operational-costs"]), validate(createExpenseSchema), createExpense);
router.get("/", authMiddleware, getExpenses);
router.get("/:publicId", authMiddleware, getExpenseById);
router.put("/:publicId", authMiddleware, requirePageEdit(["fixed-costs", "operational-costs"]), validate(updateExpenseSchema), updateExpense);
router.patch("/:publicId/pay", authMiddleware, requirePageEdit(["fixed-costs", "operational-costs"]), markExpenseAsPaid);
router.delete("/:publicId", authMiddleware, requirePageEdit(["fixed-costs", "operational-costs"]), deleteExpense);

export default router;
