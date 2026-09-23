import { Router } from "express";
import {
  getOverview,
  getAccountBalance,
  getSummary,
  getContributionsSummary,
  getStats,
  getChartData,
  getPendingInvoices,
  getRecentTransactions,
} from "../controllers/dashboard.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/overview", authMiddleware, getOverview);
router.get("/account-balance", authMiddleware, getAccountBalance);
router.get("/summary", authMiddleware, getSummary);
router.get("/contributions", authMiddleware, getContributionsSummary);
router.get("/stats", authMiddleware, getStats);
router.get("/chart-data", authMiddleware, getChartData);
router.get("/table/pending-invoices", authMiddleware, getPendingInvoices);
router.get("/table/recent-transactions", authMiddleware, getRecentTransactions);

export default router;
