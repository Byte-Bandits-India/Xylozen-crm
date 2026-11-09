import { Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendCreated, sendError, sendMessage } from "../utils/response";

export function serializeProject(p: any) {
  return {
    id: p.publicId,
    name: p.name,
    companyName: p.companyName ?? undefined,
    logoUrl: p.logoUrl ?? undefined,
    status: p.status,
    summaryTitle: p.summaryTitle ?? undefined,
    summaryText: p.summaryText ?? undefined,
    memberIds: p.memberIds ? JSON.parse(p.memberIds) : [],
    startDate: p.startDate ? p.startDate.toISOString() : undefined,
    progress: p.progress,
    payment: Number(p.payment),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

const toData = (b: any) => ({
  name: b.name,
  companyName: b.companyName,
  logoUrl: b.logoUrl,
  status: b.status,
  summaryTitle: b.summaryTitle,
  summaryText: b.summaryText,
  memberIds: b.memberIds === undefined ? undefined : JSON.stringify(b.memberIds ?? []),
  startDate: b.startDate === undefined ? undefined : b.startDate ? new Date(b.startDate) : null,
  progress: b.progress,
  payment: b.payment,
});

export const getClientProjects = async (req: AuthRequest, res: Response) => {
  try {
    const client = await prisma.client.findUnique({ where: { publicId: req.params.publicId } });
    if (!client) return sendError(res, "Client not found", 404);
    const projects = await prisma.clientProject.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "asc" },
    });
    return sendSuccess(res, projects.map(serializeProject));
  } catch (error) {
    console.error("GET CLIENT PROJECTS ERROR:", error);
    return sendError(res, "Failed to fetch projects");
  }
};

export const createClientProject = async (req: AuthRequest, res: Response) => {
  try {
    const client = await prisma.client.findUnique({ where: { publicId: req.params.publicId } });
    if (!client) return sendError(res, "Client not found", 404);
    const project = await prisma.clientProject.create({
      data: { ...toData(req.body), name: req.body.name, clientId: client.id },
    });
    return sendCreated(res, serializeProject(project), "Project created successfully");
  } catch (error) {
    console.error("CREATE CLIENT PROJECT ERROR:", error);
    return sendError(res, "Failed to create project");
  }
};

export const updateClientProject = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId, projectId } = req.params;
    const existing = await prisma.clientProject.findFirst({
      where: { publicId: projectId, client: { publicId } },
    });
    if (!existing) return sendError(res, "Project not found", 404);
    const project = await prisma.clientProject.update({
      where: { id: existing.id },
      data: toData(req.body),
    });
    return sendSuccess(res, serializeProject(project), "Project updated successfully");
  } catch (error) {
    console.error("UPDATE CLIENT PROJECT ERROR:", error);
    return sendError(res, "Failed to update project");
  }
};

export const deleteClientProject = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId, projectId } = req.params;
    const existing = await prisma.clientProject.findFirst({
      where: { publicId: projectId, client: { publicId } },
    });
    if (!existing) return sendError(res, "Project not found", 404);
    await prisma.clientProject.delete({ where: { id: existing.id } });
    return sendMessage(res, "Project deleted successfully");
  } catch (error) {
    console.error("DELETE CLIENT PROJECT ERROR:", error);
    return sendError(res, "Failed to delete project");
  }
};
