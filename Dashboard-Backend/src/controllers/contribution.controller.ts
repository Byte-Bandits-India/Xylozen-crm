import { Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendCreated, sendPaginated, sendError, sendMessage } from "../utils/response";
import { parsePagination, parseSorting } from "../utils/pagination";

// ─── CREATE CONTRIBUTION ─────────────────────────────────
export const createContribution = async (req: AuthRequest, res: Response) => {
  try {
    const { contributorName, amount, contributionDate, notes, color } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const contribution = await tx.contribution.create({
        data: {
          contributorName, amount,
          contributionDate: new Date(contributionDate),
          notes: notes || null,
          color: color || null,
          createdByPublicId: req.publicId,
        },
      });

      // CREDIT ledger entry
      await tx.transaction.create({
        data: {
          type: "CREDIT",
          category: "CAPITAL",
          amount,
          currency: "INR",
          date: new Date(contributionDate),
          description: `Capital contribution from ${contributorName}`,
          contributionId: contribution.id,
          createdByPublicId: req.publicId,
        },
      });

      await tx.activityAuditLog.create({
        data: {
          accountPublicId: req.publicId,
          action: "CREATE",
          entityType: "CONTRIBUTION",
          entityId: contribution.publicId,
        },
      });

      return contribution;
    });

    return sendCreated(res, result, "Contribution created successfully");
  } catch (error) {
    console.error("CREATE CONTRIBUTION ERROR:", error);
    return sendError(res, "Failed to create contribution");
  }
};

// ─── GET ALL CONTRIBUTIONS (paginated) ───────────────────
export const getContributions = async (req: AuthRequest, res: Response) => {
  try {
    const { contributor } = req.query;
    const { skip, take, page, pageSize } = parsePagination(req.query);
    const { orderBy } = parseSorting(req.query, ["contributionDate", "amount", "createdAt"]);

    const where: any = {};
    if (contributor && typeof contributor === "string") {
      where.contributorName = { contains: contributor };
    }

    const [contributions, total] = await Promise.all([
      prisma.contribution.findMany({ where, orderBy, skip, take }),
      prisma.contribution.count({ where }),
    ]);

    return sendPaginated(res, contributions, total, page, pageSize);
  } catch (error) {
    console.error("GET CONTRIBUTIONS ERROR:", error);
    return sendError(res, "Failed to fetch contributions");
  }
};

// ─── GET CONTRIBUTION BY ID ─────────────────────────────
export const getContributionById = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    const contribution = await prisma.contribution.findUnique({
      where: { publicId },
      include: { transactions: true },
    });
    if (!contribution) return sendError(res, "Contribution not found", 404);
    return sendSuccess(res, contribution);
  } catch (error) {
    console.error("GET CONTRIBUTION ERROR:", error);
    return sendError(res, "Failed to fetch contribution");
  }
};

// ─── UPDATE CONTRIBUTION ─────────────────────────────────
export const updateContribution = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    const { contributorName, amount, contributionDate, notes, color } = req.body;

    const existing = await prisma.contribution.findUnique({ where: { publicId } });
    if (!existing) return sendError(res, "Contribution not found", 404);

    const updated = await prisma.contribution.update({
      where: { publicId },
      data: {
        contributorName, amount, notes, color,
        contributionDate: contributionDate ? new Date(contributionDate) : undefined,
      },
    });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId,
        action: "UPDATE",
        entityType: "CONTRIBUTION",
        entityId: publicId,
      },
    });

    return sendSuccess(res, updated, "Contribution updated successfully");
  } catch (error) {
    console.error("UPDATE CONTRIBUTION ERROR:", error);
    return sendError(res, "Failed to update contribution");
  }
};

// ─── DELETE CONTRIBUTION (safeguard) ─────────────────────
export const deleteContribution = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    const existing = await prisma.contribution.findUnique({
      where: { publicId },
      include: { _count: { select: { transactions: true } } },
    });
    if (!existing) return sendError(res, "Contribution not found", 404);

    if (existing._count.transactions > 0) {
      return sendError(
        res,
        "Cannot delete contribution with linked transactions",
        400
      );
    }

    await prisma.contribution.delete({ where: { publicId } });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId,
        action: "DELETE",
        entityType: "CONTRIBUTION",
        entityId: publicId,
      },
    });

    return sendMessage(res, "Contribution deleted successfully");
  } catch (error) {
    console.error("DELETE CONTRIBUTION ERROR:", error);
    return sendError(res, "Failed to delete contribution");
  }
};
