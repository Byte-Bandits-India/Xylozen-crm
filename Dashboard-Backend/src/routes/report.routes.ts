import { Router } from "express";
import {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  deleteReport,
} from "../controllers/report.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), createReport);
router.get("/", authMiddleware, getReports);
router.get("/:publicId", authMiddleware, getReportById);
router.patch("/:publicId/status", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), updateReportStatus);
router.delete("/:publicId", authMiddleware, authorize(["SUPER_ADMIN"]), deleteReport);

export default router;
