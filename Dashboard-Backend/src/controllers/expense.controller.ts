import { Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendCreated, sendPaginated, sendError, sendMessage } from "../utils/response";
import { parsePagination, parseSorting } from "../utils/pagination";

// ─── GENERATE EXPENSE ID ─────────────────────────────────
async function generateExpenseId(expenseType: "FIXED" | "OPERATIONAL"): Promise<string> {
  const prefix = expenseType === "FIXED" ? "FIX" : "OPE";

  const lastExpense = await prisma.expense.findFirst({
    where: { expenseType } as any,
    orderBy: { id: "desc" },
    select: { expenseId: true } as any,
  });

  let nextNum = 1;
  if ((lastExpense as any)?.expenseId) {
    const match = (lastExpense as any).expenseId.match(/\d+$/);
    if (match) nextNum = parseInt(match[0], 10) + 1;
  }

  return `#${prefix}${String(nextNum).padStart(3, "0")}`;
}

// ─── CREATE EXPENSE ──────────────────────────────────────
export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    const {
      expenseType, title, category, description, comments,
      amount, expenseDate, dueDate, status,
      recurring, frequency, vendorName, paymentMethod,
      receiptUrl, notes, paidByPublicId,
    } = req.body;

    const expenseId = await generateExpenseId(expenseType);

    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          expenseId,
          expenseType,
          title,
          category,
          description: description || null,
          comments: comments || null,
          amount,
          expenseDate: new Date(expenseDate),
          dueDate: dueDate ? new Date(dueDate) : null,
          status: status || "PENDING",
          recurring: recurring || false,
          frequency: frequency || null,
          vendorName: vendorName || null,
          paymentMethod: paymentMethod || null,
          receiptUrl: receiptUrl || null,
          notes: notes || null,
          paidByPublicId: paidByPublicId || null,
          createdByPublicId: req.publicId,
        },
      });

      // Only create DEBIT ledger entry if status is PAID
      if (expense.status === "PAID") {
        await tx.transaction.create({
          data: {
            type: "DEBIT",
            category: "EXPENSE",
            amount,
            currency: "INR",
            date: new Date(expenseDate),
            description: `Expense: ${title}`,
            expenseId: expense.id,
            createdByPublicId: req.publicId,
          },
        });
      }

      await tx.activityAuditLog.create({
        data: {
          accountPublicId: req.publicId,
          action: "CREATE",
          entityType: "EXPENSE",
          entityId: expense.publicId,
        },
      });

      return expense;
    });

    return sendCreated(res, result, "Expense created successfully");
  } catch (error) {
    console.error("CREATE EXPENSE ERROR:", error);
    return sendError(res, "Failed to create expense");
  }
};

// ─── GET ALL EXPENSES (paginated) ────────────────────────
export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const { category, status, expenseType } = req.query;
    const { skip, take, page, pageSize } = parsePagination(req.query);
    const { orderBy } = parseSorting(req.query, ["createdAt", "expenseDate", "amount", "title", "dueDate"]);

    const where: any = {};
    if (category && typeof category === "string") where.category = category;
    if (status && typeof status === "string") where.status = status;
    if (expenseType && typeof expenseType === "string") where.expenseType = expenseType;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          paidBy: {
            select: {
              publicId: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    // Compute overdueByDays for each expense
    const now = new Date();
    const enriched = expenses.map((exp) => {
      let overdueByDays = 0;
      if (exp.status === "PENDING" && exp.dueDate && new Date(exp.dueDate) < now) {
        const diffMs = now.getTime() - new Date(exp.dueDate).getTime();
        overdueByDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      // Explicitly providing the requested data fields for the table
      // (Expense ID, Paid by, Title, Comments, Amount, Due Date, Overdue by, Status, Action)
      return {
        ...exp,
        // The table columns rely on these exact fields:
        expenseId: exp.expenseId,
        paidBy: exp.paidBy,
        title: exp.title,
        comments: exp.comments,
        amount: exp.amount,
        dueDate: exp.dueDate,
        overdueByDays,
        status: exp.status,
        // Action is handled in the frontend using publicId
        publicId: exp.publicId,
      };
    });

    return sendPaginated(res, enriched, total, page, pageSize);
  } catch (error) {
    console.error("GET EXPENSES ERROR:", error);
    return sendError(res, "Failed to fetch expenses");
  }
};

// ─── GET EXPENSE BY ID ──────────────────────────────────
export const getExpenseById = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    const expense = await prisma.expense.findUnique({
      where: { publicId },
      include: {
        transactions: true,
        paidBy: {
          select: {
            publicId: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
    if (!expense) return sendError(res, "Expense not found", 404);

    // Compute overdueByDays
    let overdueByDays = 0;
    const now = new Date();
    if (expense.status === "PENDING" && expense.dueDate && new Date(expense.dueDate) < now) {
      const diffMs = now.getTime() - new Date(expense.dueDate).getTime();
      overdueByDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    return sendSuccess(res, {
      ...expense,
      // Explicitly providing the requested data fields
      expenseId: expense.expenseId,
      paidBy: expense.paidBy,
      title: expense.title,
      comments: expense.comments,
      amount: expense.amount,
      dueDate: expense.dueDate,
      overdueByDays,
      status: expense.status,
      // Action is handled in the frontend using publicId
      publicId: expense.publicId,
    });
  } catch (error) {
    console.error("GET EXPENSE ERROR:", error);
    return sendError(res, "Failed to fetch expense");
  }
};

// ─── UPDATE EXPENSE ──────────────────────────────────────
export const updateExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    const {
      title, category, description, comments, amount, expenseDate,
      dueDate, status, recurring, frequency, vendorName,
      paymentMethod, receiptUrl, notes, paidByPublicId,
    } = req.body;

    const existing = await prisma.expense.findUnique({ where: { publicId } });
    if (!existing) return sendError(res, "Expense not found", 404);

    const updated = await prisma.expense.update({
      where: { publicId },
      data: {
        title, category, description, comments, amount,
        expenseDate: expenseDate ? new Date(expenseDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status, recurring, frequency,
        vendorName, paymentMethod, receiptUrl, notes,
        paidByPublicId,
      },
    });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId,
        action: "UPDATE",
        entityType: "EXPENSE",
        entityId: publicId,
      },
    });

    return sendSuccess(res, updated, "Expense updated successfully");
  } catch (error) {
    console.error("UPDATE EXPENSE ERROR:", error);
    return sendError(res, "Failed to update expense");
  }
};

// ─── MARK EXPENSE AS PAID ────────────────────────────────
export const markExpenseAsPaid = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;

    const existing = await prisma.expense.findUnique({ where: { publicId } });
    if (!existing) return sendError(res, "Expense not found", 404);
    if (existing.status === "PAID") return sendError(res, "Expense is already paid", 400);

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.expense.update({
        where: { publicId },
        data: { status: "PAID" },
      });

      // Create DEBIT ledger entry
      await tx.transaction.create({
        data: {
          type: "DEBIT",
          category: "EXPENSE",
          amount: existing.amount,
          currency: "INR",
          date: new Date(),
          description: `Expense paid: ${existing.title}`,
          expenseId: existing.id,
          createdByPublicId: req.publicId,
        },
      });

      await tx.activityAuditLog.create({
        data: {
          accountPublicId: req.publicId,
          action: "MARK_PAID",
          entityType: "EXPENSE",
          entityId: publicId,
        },
      });

      return updated;
    });

    return sendSuccess(res, result, "Expense marked as paid");
  } catch (error) {
    console.error("MARK EXPENSE PAID ERROR:", error);
    return sendError(res, "Failed to mark expense as paid");
  }
};

// ─── DELETE EXPENSE (soft-delete with safeguard) ─────────
export const deleteExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    const existing = await prisma.expense.findUnique({
      where: { publicId },
      include: { _count: { select: { transactions: true } } },
    });
    if (!existing) return sendError(res, "Expense not found", 404);

    if (existing._count.transactions > 0) {
      return sendError(
        res,
        "Cannot delete expense with linked transactions. Mark as REJECTED instead.",
        400
      );
    }

    // Soft delete: set status to REJECTED
    await prisma.expense.update({
      where: { publicId },
      data: { status: "REJECTED" },
    });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId,
        action: "DELETE",
        entityType: "EXPENSE",
        entityId: publicId,
      },
    });

    return sendMessage(res, "Expense rejected successfully");
  } catch (error) {
    console.error("DELETE EXPENSE ERROR:", error);
    return sendError(res, "Failed to delete expense");
  }
};
