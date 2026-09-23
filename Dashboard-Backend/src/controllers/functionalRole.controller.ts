import { Request, Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendCreated, sendError, sendMessage } from "../utils/response";

export const formatFunctionalRole = (role: any) => ({
  id: role.publicId,
  publicId: role.publicId,
  name: role.name,
  description: role.description || "",
  color: role.color || "indigo",
  createdAt: role.createdAt ? new Date(role.createdAt).toISOString() : new Date().toISOString(),
});

/**
 * GET /api/admin/functional-roles
 */
export const getFunctionalRoles = async (_req: Request, res: Response) => {
  try {
    const roles = await prisma.functionalRole.findMany({
      orderBy: { createdAt: "asc" },
    });
    return sendSuccess(res, roles.map(formatFunctionalRole));
  } catch (error) {
    console.error("GET FUNCTIONAL ROLES ERROR:", error);
    return sendError(res, "Failed to fetch functional roles");
  }
};

/**
 * POST /api/admin/functional-roles
 */
export const createFunctionalRole = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, color = "indigo" } = req.body;
    if (!name || !name.trim()) {
      return sendError(res, "Role name is required", 400);
    }

    const trimmedName = name.trim();
    const existing = await prisma.functionalRole.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      return sendError(res, "A role with this name already exists", 400);
    }

    const role = await prisma.functionalRole.create({
      data: {
        name: trimmedName,
        description: description?.trim() || null,
        color: color || "indigo",
      },
    });

    return sendCreated(res, formatFunctionalRole(role), "Functional role created successfully");
  } catch (error) {
    console.error("CREATE FUNCTIONAL ROLE ERROR:", error);
    return sendError(res, "Failed to create functional role");
  }
};

/**
 * DELETE /api/admin/functional-roles/:publicId
 */
export const deleteFunctionalRole = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;

    const existing = await prisma.functionalRole.findUnique({
      where: { publicId },
    });

    if (!existing) {
      return sendError(res, "Functional role not found", 404);
    }

    await prisma.functionalRole.delete({
      where: { publicId },
    });

    return sendMessage(res, "Functional role deleted successfully");
  } catch (error) {
    console.error("DELETE FUNCTIONAL ROLE ERROR:", error);
    return sendError(res, "Failed to delete functional role");
  }
};
