import { Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendCreated, sendPaginated, sendError, sendMessage } from "../utils/response";
import { parsePagination, parseSorting } from "../utils/pagination";

// ─── CREATE CLIENT ───────────────────────────────────────
export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, email, phone, companyName, avatar,
      billingAddressLine1, billingAddressLine2,
      city, state, country, postalCode, notes,
    } = req.body;

    const client = await prisma.client.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        companyName: companyName || null,
        avatar: avatar || null,
        billingAddressLine1: billingAddressLine1 || null,
        billingAddressLine2: billingAddressLine2 || null,
        city: city || null,
        state: state || null,
        country: country || null,
        postalCode: postalCode || null,
        notes: notes || null,
        createdByPublicId: req.publicId,
      },
    });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId,
        action: "CREATE",
        entityType: "CLIENT",
        entityId: client.publicId,
      },
    });

    return sendCreated(res, client, "Client created successfully");
  } catch (error) {
    console.error("CREATE CLIENT ERROR:", error);
    return sendError(res, "Failed to create client");
  }
};

// ─── GET ALL CLIENTS ─────────────────────────────────────
export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    const { skip, take, page, pageSize } = parsePagination(req.query);
    const { orderBy } = parseSorting(req.query, ["name", "createdAt", "email"]);

    const where: any = { isActive: true };
    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { companyName: { contains: search } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { _count: { select: { invoices: true } } },
      }),
      prisma.client.count({ where }),
    ]);

    return sendPaginated(res, clients, total, page, pageSize);
  } catch (error) {
    console.error("GET CLIENTS ERROR:", error);
    return sendError(res, "Failed to fetch clients");
  }
};

// ─── GET CLIENT BY ID ────────────────────────────────────
export const getClientById = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;

    const client = await prisma.client.findUnique({
      where: { publicId },
      include: {
        invoices: {
          include: {
            invoice: {
              select: {
                publicId: true, invoiceNumber: true, status: true,
                totalAmount: true, balanceDue: true, issuedDate: true, dueDate: true,
              },
            },
          },
        },
      },
    });

    if (!client) return sendError(res, "Client not found", 404);
    return sendSuccess(res, client);
  } catch (error) {
    console.error("GET CLIENT ERROR:", error);
    return sendError(res, "Failed to fetch client");
  }
};

// ─── UPDATE CLIENT ───────────────────────────────────────
export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    const {
      name, email, phone, companyName, avatar,
      billingAddressLine1, billingAddressLine2,
      city, state, country, postalCode, notes, isActive,
    } = req.body;

    const existing = await prisma.client.findUnique({ where: { publicId } });
    if (!existing) return sendError(res, "Client not found", 404);

    const updated = await prisma.client.update({
      where: { publicId },
      data: {
        name, email, phone, companyName, avatar,
        billingAddressLine1, billingAddressLine2,
        city, state, country, postalCode, notes, isActive,
      },
    });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId,
        action: "UPDATE",
        entityType: "CLIENT",
        entityId: publicId,
      },
    });

    return sendSuccess(res, updated, "Client updated successfully");
  } catch (error) {
    console.error("UPDATE CLIENT ERROR:", error);
    return sendError(res, "Failed to update client");
  }
};

// ─── DELETE CLIENT (soft-delete) ─────────────────────────
export const deleteClient = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;

    const existing = await prisma.client.findUnique({
      where: { publicId },
      include: { _count: { select: { invoices: true } } },
    });
    if (!existing) return sendError(res, "Client not found", 404);

    // Block deletion if client has linked invoices
    if (existing._count.invoices > 0) {
      return sendError(
        res,
        "Cannot delete client with linked invoices. Deactivate instead.",
        400
      );
    }

    // Soft delete: set isActive = false
    await prisma.client.update({
      where: { publicId },
      data: { isActive: false },
    });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId,
        action: "DELETE",
        entityType: "CLIENT",
        entityId: publicId,
      },
    });

    return sendMessage(res, "Client deactivated successfully");
  } catch (error) {
    console.error("DELETE CLIENT ERROR:", error);
    return sendError(res, "Failed to delete client");
  }
};
