import { Router } from "express";
import {
  getTransactions,
  getTransactionById,
  getLedgerSummary,
  createTransaction,
} from "../controllers/transaction.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getTransactions);
router.get("/summary", authMiddleware, getLedgerSummary);
router.get("/:publicId", authMiddleware, getTransactionById);
router.post("/", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), createTransaction);

export default router;
