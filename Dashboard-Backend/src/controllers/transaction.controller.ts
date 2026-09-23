import { Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendCreated, sendPaginated, sendError } from "../utils/response";
import { parsePagination, parseSorting } from "../utils/pagination";

// ─── GET ALL TRANSACTIONS (paginated) ────────────────────
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { type, category, fromDate, toDate } = req.query;
    const { skip, take, page, pageSize } = parsePagination(req.query);
    const { orderBy } = parseSorting(req.query, ["date", "amount", "createdAt"]);

    const where: any = {};

    if (type && typeof type === "string") {
      where.type = type; // CREDIT or DEBIT
    }
    if (category && typeof category === "string") {
      where.category = category; // REVENUE, EXPENSE, CAPITAL, etc.
    }
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate && typeof fromDate === "string") {
        where.date.gte = new Date(fromDate);
      }
      if (toDate && typeof toDate === "string") {
        where.date.lte = new Date(toDate);
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          invoice: { select: { publicId: true, invoiceNumber: true } },
          expense: { select: { publicId: true, title: true } },
          contribution: { select: { publicId: true, contributorName: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return sendPaginated(res, transactions, total, page, pageSize);
  } catch (error) {
    console.error("GET TRANSACTIONS ERROR:", error);
    return sendError(res, "Failed to fetch transactions");
  }
};

// ─── GET TRANSACTION BY ID ───────────────────────────────
export const getTransactionById = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { publicId },
      include: {
        invoice: true,
        invoicePayment: true,
        expense: true,
        contribution: true,
      },
    });

    if (!transaction) return sendError(res, "Transaction not found", 404);
    return sendSuccess(res, transaction);
  } catch (error) {
    console.error("GET TRANSACTION ERROR:", error);
    return sendError(res, "Failed to fetch transaction");
  }
};

// ─── GET LEDGER SUMMARY ─────────────────────────────────
export const getLedgerSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;

    const dateFilter: any = {};
    if (fromDate && typeof fromDate === "string") {
      dateFilter.gte = new Date(fromDate);
    }
    if (toDate && typeof toDate === "string") {
      dateFilter.lte = new Date(toDate);
    }

    const where: any = {};
    if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter;
    }

    const [credits, debits] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: "CREDIT" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: "DEBIT" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalCredits = Number(credits._sum.amount || 0);
    const totalDebits = Number(debits._sum.amount || 0);

    return sendSuccess(res, {
      totalCredits,
      totalDebits,
      netBalance: totalCredits - totalDebits,
      creditCount: credits._count,
      debitCount: debits._count,
    });
  } catch (error) {
    console.error("LEDGER SUMMARY ERROR:", error);
    return sendError(res, "Failed to compute ledger summary");
  }
};

// ─── CREATE MANUAL TRANSACTION ───────────────────────────
export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { type, category, amount, currency, date, description, referenceNo } =
      req.body;

    if (!type || !category || !amount || !date) {
      return sendError(res, "type, category, amount, and date are required", 400);
    }

    const transaction = await prisma.transaction.create({
      data: {
        type, category, amount,
        currency: currency || "INR",
        date: new Date(date),
        description: description || null,
        referenceNo: referenceNo || null,
        createdByPublicId: req.publicId,
      },
    });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId,
        action: "CREATE",
        entityType: "TRANSACTION",
        entityId: transaction.publicId,
      },
    });

    return sendCreated(res, transaction, "Transaction created successfully");
  } catch (error) {
    console.error("CREATE TRANSACTION ERROR:", error);
    return sendError(res, "Failed to create transaction");
  }
};
