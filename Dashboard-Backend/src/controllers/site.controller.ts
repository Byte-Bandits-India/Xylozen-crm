import { Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendCreated, sendPaginated, sendError, sendMessage } from "../utils/response";
import { parsePagination, parseSorting } from "../utils/pagination";

// ─── CREATE SITE ───────────────────────────────────────
export const createSite = async (req: AuthRequest, res: Response) => {
  try {
    const { name, userName, url, password } = req.body;

    const site = await prisma.site.create({
      data: {
        name,
        userName,
        url,
        password,
        createdByPublicId: req.publicId,
      },
    });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId,
        action: "CREATE",
        entityType: "SITE",
        entityId: site.publicId,
      },
    });

    return sendCreated(res, site, "Site created successfully");
  } catch (error) {
    console.error("CREATE SITE ERROR:", error);
    return sendError(res, "Failed to create site");
  }
};

// ─── GET ALL SITES ─────────────────────────────────────
export const getSites = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    const { skip, take, page, pageSize } = parsePagination(req.query);
    const { orderBy } = parseSorting(req.query, ["name", "createdAt", "url", "userName"]);

    const where: any = {};
    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search } },
        { url: { contains: search } },
        { userName: { contains: search } },
      ];
    }

    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.site.count({ where }),
    ]);

    // Map properties to match frontend interface if needed
    const mappedSites = sites.map(site => ({
      ...site,
      id: site.publicId, // Frontend uses id
    }));

    return sendPaginated(res, mappedSites, total, page, pageSize);
  } catch (error) {
    console.error("GET SITES ERROR:", error);
    return sendError(res, "Failed to fetch sites");
  }
};

// ─── GET SITE BY ID ────────────────────────────────────
export const getSiteById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const site = await prisma.site.findUnique({
      where: { publicId: id },
    });

    if (!site) return sendError(res, "Site not found", 404);
    
    return sendSuccess(res, {
      ...site,
      id: site.publicId
    });
  } catch (error) {
    console.error("GET SITE ERROR:", error);
    return sendError(res, "Failed to fetch site");
  }
};

// ─── UPDATE SITE ───────────────────────────────────────
export const updateSite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, userName, url, password } = req.body;

    const existing = await prisma.site.findUnique({ where: { publicId: id } });
    if (!existing) return sendError(res, "Site not found", 404);

    const updated = await prisma.site.update({
      where: { publicId: id },
      data: {
        name,
        userName,
        url,
        password,
      },
    });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId,
        action: "UPDATE",
        entityType: "SITE",
        entityId: id,
      },
    });

    return sendSuccess(res, {
      ...updated,
      id: updated.publicId
    }, "Site updated successfully");
  } catch (error) {
    console.error("UPDATE SITE ERROR:", error);
    return sendError(res, "Failed to update site");
  }
};

// ─── DELETE SITE ───────────────────────────────────────
export const deleteSite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.site.findUnique({
      where: { publicId: id }
    });
    
    if (!existing) return sendError(res, "Site not found", 404);

    await prisma.site.delete({
      where: { publicId: id },
    });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId,
        action: "DELETE",
        entityType: "SITE",
        entityId: id,
      },
    });

    return sendMessage(res, "Site deleted successfully");
  } catch (error) {
    console.error("DELETE SITE ERROR:", error);
    return sendError(res, "Failed to delete site");
  }
};
