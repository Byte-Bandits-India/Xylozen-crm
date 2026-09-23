import { Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendCreated, sendPaginated, sendError, sendMessage } from "../utils/response";
import { parsePagination, parseSorting } from "../utils/pagination";

// ─── CREATE REPORT REQUEST ───────────────────────────────
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, fromDate, toDate, format } = req.body;

    if (!name || !type || !format) {
      return sendError(res, "name, type, and format are required", 400);
    }

    const validTypes = [
      "FINANCIAL_SUMMARY", "REVENUE_REPORT", "EXPENSE_REPORT",
      "INVOICE_REPORT", "CLIENT_REPORT", "CASHFLOW_REPORT",
    ];

    if (!validTypes.includes(type)) {
      return sendError(res, `Invalid report type. Must be one of: ${validTypes.join(", ")}`, 400);
    }

    const validFormats = ["pdf", "csv", "xlsx"];
    if (!validFormats.includes(format)) {
      return sendError(res, `Invalid format. Must be one of: ${validFormats.join(", ")}`, 400);
    }

    const report = await prisma.report.create({
      data: {
        name, type, status: "PENDING",
        fromDate: fromDate ? new Date(fromDate) : null,
        toDate: toDate ? new Date(toDate) : null,
        format,
        generatedByPublicId: req.publicId,
      },
    });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId,
        action: "GENERATE_REPORT",
        entityType: "REPORT",
        entityId: report.publicId,
      },
    });

    return sendCreated(res, report, "Report requested successfully");
  } catch (error) {
    console.error("CREATE REPORT ERROR:", error);
    return sendError(res, "Failed to create report");
  }
};

// ─── GET ALL REPORTS (paginated) ─────────────────────────
export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const { type, status } = req.query;
    const { skip, take, page, pageSize } = parsePagination(req.query);
    const { orderBy } = parseSorting(req.query, ["createdAt", "status"]);

    const where: any = {};
    if (type && typeof type === "string") where.type = type;
    if (status && typeof status === "string") where.status = status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({ where, orderBy, skip, take }),
      prisma.report.count({ where }),
    ]);

    return sendPaginated(res, reports, total, page, pageSize);
  } catch (error) {
    console.error("GET REPORTS ERROR:", error);
    return sendError(res, "Failed to fetch reports");
  }
};

// ─── GET REPORT BY ID ────────────────────────────────────
export const getReportById = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    const report = await prisma.report.findUnique({ where: { publicId } });
    if (!report) return sendError(res, "Report not found", 404);
    return sendSuccess(res, report);
  } catch (error) {
    console.error("GET REPORT ERROR:", error);
    return sendError(res, "Failed to fetch report");
  }
};

// ─── UPDATE REPORT STATUS ────────────────────────────────
export const updateReportStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    const { status, fileUrl, errorMessage } = req.body;

    const existing = await prisma.report.findUnique({ where: { publicId } });
    if (!existing) return sendError(res, "Report not found", 404);

    const validStatuses = ["PENDING", "GENERATED", "FAILED"];
    if (status && !validStatuses.includes(status)) {
      return sendError(res, `Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
    }

    const updated = await prisma.report.update({
      where: { publicId },
      data: {
        status,
        fileUrl: fileUrl || undefined,
        errorMessage: errorMessage || undefined,
      },
    });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId, action: "UPDATE",
        entityType: "REPORT", entityId: publicId,
      },
    });

    return sendSuccess(res, updated, "Report status updated");
  } catch (error) {
    console.error("UPDATE REPORT ERROR:", error);
    return sendError(res, "Failed to update report");
  }
};

// ─── DELETE REPORT ───────────────────────────────────────
export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    const existing = await prisma.report.findUnique({ where: { publicId } });
    if (!existing) return sendError(res, "Report not found", 404);

    await prisma.report.delete({ where: { publicId } });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId, action: "DELETE",
        entityType: "REPORT", entityId: publicId,
      },
    });

    return sendMessage(res, "Report deleted successfully");
  } catch (error) {
    console.error("DELETE REPORT ERROR:", error);
    return sendError(res, "Failed to delete report");
  }
};
