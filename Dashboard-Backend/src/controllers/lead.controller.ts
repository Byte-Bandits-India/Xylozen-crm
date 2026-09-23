import { Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendCreated, sendError, sendMessage } from "../utils/response";

const formatLead = (lead: any) => {
  let assignedUser = null;
  if (lead.assignedUser) {
    const profile = lead.assignedUser.profile;
    const name = profile
      ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
      : lead.assignedUser.username;
    assignedUser = {
      publicId: lead.assignedUser.publicId,
      username: lead.assignedUser.username,
      name: name || lead.assignedUser.username,
      email: lead.assignedUser.email,
    };
  }

  return {
    id: lead.publicId,
    publicId: lead.publicId,
    companyName: lead.companyName,
    industry: lead.industry,
    email: lead.email,
    phone: lead.phone || "",
    clientName: lead.clientName,
    service: lead.service,
    description: lead.description || "",
    status: lead.status,
    assignedUserId: lead.assignedUserId,
    assignedUser,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
};

export const getLeads = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, assignedUserId } = req.query;

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status as string;
    }

    if (assignedUserId && assignedUserId !== "ALL") {
      if (assignedUserId === "UNASSIGNED") {
        where.assignedUserId = null;
      } else {
        where.assignedUserId = assignedUserId as string;
      }
    }

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      where.OR = [
        { companyName: { contains: q } },
        { clientName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { service: { contains: q } },
        { industry: { contains: q } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        assignedUser: {
          select: {
            publicId: true,
            username: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const formatted = leads.map(formatLead);
    return sendSuccess(res, formatted, "Leads retrieved successfully");
  } catch (error) {
    console.error("GET LEADS ERROR:", error);
    return sendError(res, "Failed to retrieve sales leads");
  }
};

export const createLead = async (req: AuthRequest, res: Response) => {
  try {
    const {
      companyName,
      industry,
      email,
      phone,
      clientName,
      service,
      description,
      status,
      assignedUserId,
    } = req.body;

    const created = await prisma.lead.create({
      data: {
        companyName: (companyName || "").trim(),
        industry: industry || "Technology",
        email: (email || "").trim(),
        phone: phone ? phone.trim() : null,
        clientName: (clientName || "").trim(),
        service: service || "Web Development",
        description: description ? description.trim() : null,
        status: status || "enquired",
        assignedUserId: assignedUserId || null,
      },
      include: {
        assignedUser: {
          select: {
            publicId: true,
            username: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return sendCreated(res, formatLead(created), "Sales lead created successfully");
  } catch (error) {
    console.error("CREATE LEAD ERROR:", error);
    return sendError(res, "Failed to create sales lead");
  }
};

export const updateLead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: any = {};

    const allowedFields = [
      "companyName",
      "industry",
      "email",
      "phone",
      "clientName",
      "service",
      "description",
      "status",
      "assignedUserId",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field];
      }
    }

    const updated = await prisma.lead.update({
      where: { publicId: id },
      data,
      include: {
        assignedUser: {
          select: {
            publicId: true,
            username: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return sendSuccess(res, formatLead(updated), "Sales lead updated successfully");
  } catch (error) {
    console.error("UPDATE LEAD ERROR:", error);
    return sendError(res, "Failed to update sales lead");
  }
};

export const updateLeadStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["enquired", "converted", "not-converted"].includes(status)) {
      return sendError(res, "Invalid status", 400);
    }

    const updated = await prisma.lead.update({
      where: { publicId: id },
      data: { status },
      include: {
        assignedUser: {
          select: {
            publicId: true,
            username: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return sendSuccess(res, formatLead(updated), "Lead status updated");
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);
    return sendError(res, "Failed to update lead status");
  }
};

export const assignLead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedUserId } = req.body;

    const updated = await prisma.lead.update({
      where: { publicId: id },
      data: { assignedUserId: assignedUserId || null },
      include: {
        assignedUser: {
          select: {
            publicId: true,
            username: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return sendSuccess(res, formatLead(updated), "Sales rep assigned successfully");
  } catch (error) {
    console.error("ASSIGN LEAD ERROR:", error);
    return sendError(res, "Failed to assign lead");
  }
};

export const deleteLead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.lead.delete({
      where: { publicId: id },
    });

    return sendMessage(res, "Sales lead deleted successfully");
  } catch (error) {
    console.error("DELETE LEAD ERROR:", error);
    return sendError(res, "Failed to delete sales lead");
  }
};
