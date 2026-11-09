import { Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendCreated, sendPaginated, sendError, sendMessage } from "../utils/response";
import { serializeProject } from "./clientProject.controller";
import { parsePagination, parseSorting } from "../utils/pagination";

// preferredChannels/sourceDetails are stored as JSON text since they're small, variable-shape values.
function serializeClient<T extends { preferredChannels?: unknown; sourceDetails?: unknown }>(client: T) {
  return {
    ...client,
    preferredChannels: client.preferredChannels
      ? JSON.parse(client.preferredChannels as string)
      : [],
    sourceDetails: client.sourceDetails
      ? JSON.parse(client.sourceDetails as string)
      : {},
  };
}

// ─── CREATE CLIENT ───────────────────────────────────────
export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const {
      clientType, name, email, phone, whatsapp, companyName, avatar, status,
      billingAddressLine1, billingAddressLine2,
      city, state, country, postalCode, timezone,
      source, sourceDetails,
      industry, website, taxId, currency,
      preferredChannels, language, notes,
    } = req.body;

    const client = await prisma.client.create({
      data: {
        clientType: clientType || "individual",
        name,
        email: email || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        companyName: companyName || null,
        avatar: avatar || null,
        status: status || "lead",
        billingAddressLine1: billingAddressLine1 || null,
        billingAddressLine2: billingAddressLine2 || null,
        city: city || null,
        state: state || null,
        country: country || null,
        postalCode: postalCode || null,
        timezone: timezone || null,
        source: source || null,
        sourceDetails: sourceDetails ? JSON.stringify(sourceDetails) : null,
        industry: industry || null,
        website: website || null,
        taxId: taxId || null,
        currency: currency || null,
        preferredChannels: preferredChannels ? JSON.stringify(preferredChannels) : null,
        language: language || null,
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

    return sendCreated(res, serializeClient(client), "Client created successfully");
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
        include: { _count: { select: { invoices: true } }, projects: { orderBy: { createdAt: "asc" } } },
      }),
      prisma.client.count({ where }),
    ]);

    return sendPaginated(res, clients.map((c) => ({ ...serializeClient(c), projects: c.projects.map(serializeProject) })), total, page, pageSize);
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
    return sendSuccess(res, serializeClient(client));
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
      clientType, name, email, phone, whatsapp, companyName, avatar, status,
      billingAddressLine1, billingAddressLine2,
      city, state, country, postalCode, timezone,
      source, sourceDetails,
      industry, website, taxId, currency,
      preferredChannels, language, notes, isActive,
    } = req.body;

    const existing = await prisma.client.findUnique({ where: { publicId } });
    if (!existing) return sendError(res, "Client not found", 404);

    const updated = await prisma.client.update({
      where: { publicId },
      data: {
        clientType, name, email, phone, whatsapp, companyName, avatar, status,
        billingAddressLine1, billingAddressLine2,
        city, state, country, postalCode, timezone,
        source,
        sourceDetails: sourceDetails === undefined ? undefined : sourceDetails === null ? null : JSON.stringify(sourceDetails),
        industry, website, taxId, currency,
        preferredChannels: preferredChannels === undefined ? undefined : preferredChannels === null ? null : JSON.stringify(preferredChannels),
        language, notes, isActive,
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

    return sendSuccess(res, serializeClient(updated), "Client updated successfully");
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
