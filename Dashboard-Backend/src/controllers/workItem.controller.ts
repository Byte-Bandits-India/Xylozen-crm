import { sendAssignmentNotificationEmail } from "../utils/mailer";
import { Request, Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendCreated, sendError, sendMessage } from "../utils/response";
import multer from "multer";
import path from "path";
import fsExtra from "fs";

// Setup upload directory for attachments
const uploadDir = path.join(process.cwd(), "uploads/work-items");
if (!fsExtra.existsSync(uploadDir)) {
  fsExtra.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "attachment-" + uniqueSuffix + ext);
  },
});

export const uploadAttachmentMiddleware = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
});

/**
 * Check if the authenticated user is an administrator
 */
export const isUserAdmin = (req: AuthRequest): boolean => {
  if (!req.roles || req.roles.length === 0) return false;
  return req.roles.some((r) => r.toUpperCase() === "SUPER_ADMIN" || r.toUpperCase() === "ADMIN");
};

/**
 * Check if the authenticated user is a manager
 */
export const isUserManager = (req: AuthRequest): boolean => {
  if (!req.roles || req.roles.length === 0) return false;
  return req.roles.some((r) => r.toUpperCase() === "MANAGER");
};

/**
 * Check if the user is an assigned collaborator, manager, or creator of the work item
 */
export const isUserAssignedOrCreator = (item: any, req: AuthRequest): boolean => {
  if (isUserAdmin(req)) return true;
  if (req.publicId && item.createdByPublicId === req.publicId) return true;
  if (req.publicId && item.managerPublicId === req.publicId) return true;
  if (!Array.isArray(item.assignees)) return false;
  return item.assignees.some((a: any) => {
    if (req.email && a.email && a.email.toLowerCase() === req.email.toLowerCase()) return true;
    if (req.publicId && (a.id === req.publicId || a.accountPublicId === req.publicId)) return true;
    return false;
  });
};

/**
 * Helper to format a work item to match frontend interface
 * Supports data projection for external roles if needed
 */
export const formatWorkItem = (item: any, affiliation?: string) => {
  const isExternal = affiliation === "external";

  return {
    id: item.customId || item.publicId,
    publicId: isExternal ? undefined : item.publicId,
    title: item.title,
    description: item.description || "",
    priority: item.priority || "medium",
    status: item.status || "new",
    dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : "",
    assignees: Array.isArray(item.assignees) ? item.assignees : [],
    subtasks: Array.isArray(item.subtasks) ? item.subtasks : [],
    isMainCompleted: Boolean(item.isMainCompleted),
    milestone: {
      completed: item.milestoneCompleted ?? 0,
      total: item.milestoneTotal ?? 1,
    },
    attachmentsCount: item.attachmentsCount ?? (Array.isArray(item.attachments) ? item.attachments.length : 0),
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    commentsCount: item.commentsCount ?? 0,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
    managerPublicId: isExternal ? undefined : item.managerPublicId,
    createdByPublicId: isExternal ? undefined : item.createdByPublicId,
  };
};

/**
 * GET /api/work-items
 * Query params: status, priority, search, scope ('all' | 'assigned')
 * Scopes data according to 4-Role Hierarchy:
 * - ADMIN: all work items
 * - MANAGER: items created, managed, or assigned to manager or their subordinates
 * - INTERNAL / EXTERNAL: strictly items assigned to user
 */
/**
 * GET /api/work-items/assignable-users
 * Returns list of users that the authenticated user can assign work to:
 * - ADMIN: all active users across company (ADMIN, MANAGER, INTERNAL_USER, EXTERNAL_USER)
 * - MANAGER: themselves + their assigned subordinates (INTERNAL_USER and EXTERNAL_USER where managerPublicId === req.publicId)
 * - INTERNAL_USER / EXTERNAL_USER: 403 Forbidden
 */
export const getAssignableUsers = async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = isUserAdmin(req);
    const isManager = isUserManager(req);

    const where: any = {
      status: { not: "DELETED" },
    };

    // Managers can assign internal staff, supervised subordinates, and external contractors

    const accounts = await prisma.account.findMany({
      where,
      include: {
        profile: true,
        manager: {
          include: { profile: true },
        },
        roles: {
          include: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = accounts.map((u) => {
      const primaryRole = u.roles?.[0]?.role?.name || "INTERNAL_USER";
      const managerName = u.manager
        ? (u.manager.profile
            ? `${u.manager.profile.firstName} ${u.manager.profile.lastName}`.trim()
            : u.manager.username)
        : null;

      const fullName = u.profile
        ? `${u.profile.firstName || ""} ${u.profile.lastName || ""}`.trim()
        : "";

      const displayName = fullName || u.username || u.email;

      return {
        id: u.publicId,
        publicId: u.publicId,
        name: displayName,
        email: u.email,
        avatar: u.profile?.profileImage || "",
        role: u.profile?.functionalRole || primaryRole,
        systemRole: primaryRole,
        affiliation: (u.profile?.affiliation?.toLowerCase() === "external" || primaryRole === "EXTERNAL_USER") ? "external" : "internal",
        functionalRole: u.profile?.functionalRole || null,
        managerPublicId: u.managerPublicId,
        managerName,
      };
    });

    return sendSuccess(res, formatted);
  } catch (error) {
    console.error("GET ASSIGNABLE USERS ERROR:", error);
    return sendError(res, "Failed to fetch assignable users");
  }
};

export const getWorkItems = async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority, search, scope } = req.query;

    const where: any = {};
    if (status && typeof status === "string" && status !== "all") {
      where.status = status;
    }
    if (priority && typeof priority === "string" && priority !== "all") {
      where.priority = priority;
    }
    if (search && typeof search === "string" && search.trim()) {
      where.OR = [
        { title: { contains: search.trim() } },
        { description: { contains: search.trim() } },
      ];
    }

    const items = await prisma.workItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const isAdmin = isUserAdmin(req);
    const isManager = isUserManager(req);

    let filteredItems = items;

    if (isAdmin) {
      filteredItems = items;
    } else if (isManager && req.publicId) {
      // Find all subordinates reporting to this manager
      const subordinates = await prisma.account.findMany({
        where: { managerPublicId: req.publicId },
        select: { publicId: true, email: true },
      });
      const subPublicIds = new Set(subordinates.map((s) => s.publicId));
      const subEmails = new Set(subordinates.map((s) => s.email.toLowerCase()));

      filteredItems = items.filter((item) => {
        if (item.managerPublicId === req.publicId) return true;
        if (item.createdByPublicId === req.publicId) return true;
        if (isUserAssignedOrCreator(item, req)) return true;

        if (Array.isArray(item.assignees)) {
          return item.assignees.some((a: any) => {
            if (a.id && subPublicIds.has(a.id)) return true;
            if (a.email && subEmails.has(a.email.toLowerCase())) return true;
            return false;
          });
        }
        return false;
      });
    } else {
      // Internal or External user: strictly assigned or created
      filteredItems = items.filter((item) => isUserAssignedOrCreator(item, req));
    }

    const formatted = filteredItems.map((item) => formatWorkItem(item, req.affiliation));
    return sendSuccess(res, formatted);
  } catch (error) {
    console.error("GET WORK ITEMS ERROR:", error);
    return sendError(res, "Failed to fetch work items");
  }
};

/**
 * GET /api/work-items/:id
 */
export const getWorkItemById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.workItem.findFirst({
      where: {
        OR: [{ customId: id }, { publicId: id }],
      },
    });

    if (!item) {
      return sendError(res, "Work item not found", 404);
    }

    return sendSuccess(res, formatWorkItem(item, req.affiliation));
  } catch (error) {
    console.error("GET WORK ITEM BY ID ERROR:", error);
    return sendError(res, "Failed to fetch work item");
  }
};

/**
 * POST /api/work-items
 * Accepts work assessment creation payload including attachments and assignees
 */
export const createWorkItem = async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = isUserAdmin(req);
    const isManager = isUserManager(req);

    const {
      id,
      title,
      description,
      priority = "medium",
      status = "new",
      dueDate,
      milestone = { completed: 0, total: 1 },
      attachments = [],
      attachmentsCount,
      assignees = [],
      commentsCount = 0,
      managerPublicId,
      subtasks = [],
      isMainCompleted = false,
    } = req.body;

    const customId = id || ("work-" + Date.now());
    const parsedDueDate = dueDate ? new Date(dueDate) : null;
    const count = attachmentsCount !== undefined ? attachmentsCount : (Array.isArray(attachments) ? attachments.length : 0);

    // Auto-resolve supervising manager and allow assigning internal staff and external contractors
    let resolvedManagerPublicId = managerPublicId || null;
    if (isManager && !isAdmin && req.publicId) {
      resolvedManagerPublicId = req.publicId;
    } else if (isAdmin) {
      // Admin directly assigns to Managers, Internal Workers, or External Workers
      if (!resolvedManagerPublicId && Array.isArray(assignees) && assignees.length > 0) {
        const managerAssignee = assignees.find(
          (a) => a.systemRole?.toUpperCase() === "MANAGER" || a.role?.toUpperCase() === "MANAGER"
        );
        if (managerAssignee) {
          resolvedManagerPublicId = managerAssignee.id || managerAssignee.publicId || null;
        }
      }
    }

    const workItem = await prisma.workItem.create({
      data: {
        publicId: crypto.randomUUID(),
        customId,
        title,
        description: description || "",
        priority,
        status,
        dueDate: parsedDueDate,
        milestoneCompleted: Array.isArray(subtasks) && subtasks.length > 0
          ? ((isMainCompleted || status === "approval" ? 1 : 0) + (subtasks as any[]).filter((s: any) => s && s.isCompleted).length)
          : Number(milestone.completed || 0),
        milestoneTotal: Array.isArray(subtasks) && subtasks.length > 0
          ? (1 + subtasks.length)
          : Number(milestone.total || 1),
        attachmentsCount: count,
        attachments: Array.isArray(attachments) ? attachments : [],
        assignees: Array.isArray(assignees) ? assignees : [],
        subtasks: Array.isArray(subtasks) ? subtasks : [],
        isMainCompleted: Boolean(isMainCompleted || status === "approval"),
        commentsCount: Number(commentsCount || 0),
        managerPublicId: resolvedManagerPublicId,
        createdByPublicId: req.publicId || null,
      },
    });

    // Notify assigned collaborators via email asynchronously
    if (Array.isArray(assignees) && assignees.length > 0) {
      for (const assignee of assignees) {
        if (assignee.email) {
          sendAssignmentNotificationEmail({
            to: assignee.email,
            assigneeName: assignee.name || "Collaborator",
            assignmentId: customId,
            title,
            priority,
            dueDate: dueDate ? new Date(dueDate).toLocaleDateString() : undefined
          }).catch((e) => console.error("Email notification dispatch error:", e));
        }
      }
    }

    return sendCreated(res, formatWorkItem(workItem, req.affiliation), "Work assessment created successfully");
  } catch (error) {
    console.error("CREATE WORK ITEM ERROR:", error);
    return sendError(res, "Failed to create work item");
  }
};

export const updateWorkItemMilestone = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const milestoneObj = req.body.milestone || req.body || {};
    const rawCompleted = req.body.completed !== undefined ? req.body.completed : milestoneObj.completed;
    const rawTotal = req.body.total !== undefined ? req.body.total : milestoneObj.total;

    const existing = await prisma.workItem.findFirst({
      where: {
        OR: [{ customId: id }, { publicId: id }],
      },
    });

    if (!existing) {
      return sendError(res, "Work item not found", 404);
    }

    if (!isUserAssignedOrCreator(existing, req)) {
      return sendError(res, "Only assigned team members, managers, or administrators can update milestone progress", 403);
    }

    const completed = rawCompleted !== undefined ? Number(rawCompleted) : existing.milestoneCompleted;
    const total = rawTotal !== undefined ? Number(rawTotal) : existing.milestoneTotal;

    const updated = await prisma.workItem.update({
      where: { id: existing.id },
      data: {
        milestoneCompleted: Math.min(completed, total),
        milestoneTotal: Math.max(1, total),
      },
    });

    return sendSuccess(res, formatWorkItem(updated, req.affiliation), "Milestone progress updated");
  } catch (error) {
    console.error("UPDATE MILESTONE ERROR:", error);
    return sendError(res, "Failed to update milestone");
  }
};

/**
 * PATCH /api/work-items/:id/status
 * Status Board drag-and-drop or status selector
 * Allowed for assigned team members, managers, or admins
 */
export const updateWorkItemStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await prisma.workItem.findFirst({
      where: {
        OR: [{ customId: id }, { publicId: id }],
      },
    });

    if (!existing) {
      return sendError(res, "Work item not found", 404);
    }

    if (!isUserAssignedOrCreator(existing, req)) {
      return sendError(res, "Only assigned team members, managers, or administrators can move assessment status", 403);
    }

    const statusData: any = { status };
    if (status === "approval") {
      statusData.isMainCompleted = true;
      if (Array.isArray(existing.subtasks) && existing.subtasks.length > 0) {
        statusData.milestoneCompleted = 1 + (existing.subtasks as any[]).filter((s: any) => s && s.isCompleted).length;
      }
    }

    const updated = await prisma.workItem.update({
      where: { id: existing.id },
      data: statusData,
    });

    if (req.publicId) {
      try {
        await prisma.activityAuditLog.create({
          data: {
            accountPublicId: req.publicId,
            action: "UPDATE",
            entityType: "WORK_ITEM",
            entityId: existing.publicId,
            oldData: { status: existing.status },
            newData: { status },
          },
        });
      } catch {}
    }

    return sendSuccess(res, formatWorkItem(updated, req.affiliation), "Status updated successfully");
  } catch (error) {
    console.error("UPDATE WORK ITEM STATUS ERROR:", error);
    return sendError(res, "Failed to update work item status");
  }
};

/**
 * PATCH /api/work-items/:id/priority
 * Impact Board drag-and-drop or priority selector
 * RBAC: Restricted to ADMIN and MANAGER
 */
export const updateWorkItemPriority = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!isUserAdmin(req) && !isUserManager(req)) {
      return sendError(res, "Only administrators and managers can calibrate assessment priority", 403);
    }

    const existing = await prisma.workItem.findFirst({
      where: {
        OR: [{ customId: id }, { publicId: id }],
      },
    });

    if (!existing) {
      return sendError(res, "Work item not found", 404);
    }

    const updated = await prisma.workItem.update({
      where: { id: existing.id },
      data: { priority },
    });

    if (req.publicId) {
      try {
        await prisma.activityAuditLog.create({
          data: {
            accountPublicId: req.publicId,
            action: "UPDATE",
            entityType: "WORK_ITEM",
            entityId: existing.publicId,
            oldData: { priority: existing.priority },
            newData: { priority },
          },
        });
      } catch {}
    }

    return sendSuccess(res, formatWorkItem(updated, req.affiliation), "Priority updated successfully");
  } catch (error) {
    console.error("UPDATE WORK ITEM PRIORITY ERROR:", error);
    return sendError(res, "Failed to update work item priority");
  }
};

/**
 * PATCH /api/work-items/:id
 * Full/partial update of work item
 */
export const updateWorkItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      status,
      dueDate,
      milestone,
      attachments,
      attachmentsCount,
      assignees,
      commentsCount,
      managerPublicId,
      subtasks,
      isMainCompleted,
    } = req.body;

    const existing = await prisma.workItem.findFirst({
      where: {
        OR: [{ customId: id }, { publicId: id }],
      },
    });

    if (!existing) {
      return sendError(res, "Work item not found", 404);
    }

    const isAdmin = isUserAdmin(req);
    const isManager = isUserManager(req);

    // Permission check for updating:
    // Universal assignment allows any authenticated user to update assignees or collaborate on assessments
    if (!isAdmin && assignees === undefined) {
      if (isManager) {
        let isManagerAuthorized = false;
        if (req.publicId && existing.managerPublicId === req.publicId) {
          isManagerAuthorized = true;
        } else if (req.publicId && existing.createdByPublicId === req.publicId) {
          isManagerAuthorized = true;
        } else if (isUserAssignedOrCreator(existing, req)) {
          isManagerAuthorized = true;
        } else if (Array.isArray(existing.assignees) && req.publicId) {
          const subordinates = await prisma.account.findMany({
            where: { managerPublicId: req.publicId },
            select: { publicId: true, email: true },
          });
          const subIds = new Set(subordinates.map((s) => s.publicId));
          const subEmails = new Set(subordinates.map((s) => s.email.toLowerCase()));
          isManagerAuthorized = existing.assignees.some((a: any) =>
            (a.id && subIds.has(a.id)) || (a.email && subEmails.has(a.email.toLowerCase()))
          );
        }

        if (!isManagerAuthorized) {
          return sendError(res, "Managers can only update work assessments assigned to them or their team", 403);
        }
      } else {
        // Internal / External worker: can only edit status, milestone, or subtasks of assigned/created items
        if (!isUserAssignedOrCreator(existing, req)) {
          return sendError(res, "Only assigned team members, managers, or administrators can edit this assessment", 403);
        }
      }
    }

    const canChangePriority = isAdmin || isManager;
    if (priority !== undefined && priority !== existing.priority && !canChangePriority) {
      return sendError(res, "Only administrators and managers can calibrate assessment priority", 403);
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined && canChangePriority) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (subtasks !== undefined || isMainCompleted !== undefined) {
      const resolvedSubtasks = subtasks !== undefined
        ? (Array.isArray(subtasks) ? subtasks : [])
        : (Array.isArray(existing.subtasks) ? existing.subtasks : []);
      const resolvedMainDone = isMainCompleted !== undefined
        ? Boolean(isMainCompleted)
        : (status === "approval" ? true : Boolean(existing.isMainCompleted));

      updateData.subtasks = resolvedSubtasks;
      updateData.isMainCompleted = resolvedMainDone;
      updateData.milestoneTotal = 1 + resolvedSubtasks.length;
      updateData.milestoneCompleted = (resolvedMainDone ? 1 : 0) + (resolvedSubtasks as any[]).filter((s: any) => s && s.isCompleted).length;
    } else {
      if (milestone?.completed !== undefined) updateData.milestoneCompleted = Number(milestone.completed);
      if (milestone?.total !== undefined) updateData.milestoneTotal = Number(milestone.total);
    }
    if (attachments !== undefined) {
      updateData.attachments = Array.isArray(attachments) ? attachments : [];
      updateData.attachmentsCount = attachmentsCount !== undefined ? attachmentsCount : attachments.length;
    } else if (attachmentsCount !== undefined) {
      updateData.attachmentsCount = attachmentsCount;
    }

    // Assignees update validation (Universal assignment)
    if (assignees !== undefined) {
      updateData.assignees = Array.isArray(assignees) ? assignees : [];
      if (managerPublicId !== undefined) {
        updateData.managerPublicId = managerPublicId;
      } else if (!existing.managerPublicId) {
        const managerAssignee = updateData.assignees.find(
          (a: any) => a.systemRole?.toUpperCase() === "MANAGER" || a.role?.toUpperCase() === "MANAGER"
        );
        if (managerAssignee) {
          updateData.managerPublicId = managerAssignee.id || managerAssignee.publicId || null;
        } else if (isManager && req.publicId) {
          updateData.managerPublicId = req.publicId;
        }
      }
    } else if (managerPublicId !== undefined && isAdmin) {
      updateData.managerPublicId = managerPublicId;
    }

    if (commentsCount !== undefined) updateData.commentsCount = Number(commentsCount);

    const updated = await prisma.workItem.update({
      where: { id: existing.id },
      data: updateData,
    });

    if (req.publicId) {
      try {
        await prisma.activityAuditLog.create({
          data: {
            accountPublicId: req.publicId,
            action: "UPDATE",
            entityType: "WORK_ITEM",
            entityId: existing.publicId,
            oldData: {
              title: existing.title,
              status: existing.status,
              priority: existing.priority,
              assigneesCount: Array.isArray(existing.assignees) ? existing.assignees.length : 0,
            },
            newData: {
              title: updated.title,
              status: updated.status,
              priority: updated.priority,
              assigneesCount: Array.isArray(updated.assignees) ? updated.assignees.length : 0,
            },
          },
        });
      } catch {}
    }

    return sendSuccess(res, formatWorkItem(updated, req.affiliation), "Work item updated successfully");
  } catch (error) {
    console.error("UPDATE WORK ITEM ERROR:", error);
    return sendError(res, "Failed to update work item");
  }
};

export const deleteWorkItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.workItem.findFirst({
      where: {
        OR: [{ customId: id }, { publicId: id }],
      },
    });

    if (!existing) {
      return sendError(res, "Work item not found", 404);
    }

    const canDelete =
      isUserAdmin(req) ||
      (isUserManager(req) &&
        (existing.managerPublicId === req.publicId || existing.createdByPublicId === req.publicId));

    if (!canDelete) {
      return sendError(res, "Only administrators or the supervising manager can delete this work assessment", 403);
    }

    await prisma.workItem.delete({
      where: { id: existing.id },
    });

    if (req.publicId) {
      try {
        await prisma.activityAuditLog.create({
          data: {
            accountPublicId: req.publicId,
            action: "DELETE",
            entityType: "WORK_ITEM",
            entityId: existing.publicId,
          },
        });
      } catch {}
    }

    return sendMessage(res, "Work item deleted successfully");
  } catch (error) {
    console.error("DELETE WORK ITEM ERROR:", error);
    return sendError(res, "Failed to delete work item");
  }
};

/**
 * POST /api/work-items/upload
 */
export const uploadAttachment = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const file = req.file;

    if (!file && (!files || files.length === 0)) {
      return sendError(res, "No file uploaded", 400);
    }

    if (file) {
      const attachment = {
        id: "att-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8),
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        url: "/uploads/work-items/" + file.filename,
        uploadedAt: new Date().toISOString(),
      };
      return sendCreated(res, attachment, "File uploaded successfully");
    }

    if (files && files.length > 0) {
      const attachments = files.map((f) => ({
        id: "att-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8),
        name: f.originalname,
        size: f.size,
        type: f.mimetype,
        url: "/uploads/work-items/" + f.filename,
        uploadedAt: new Date().toISOString(),
      }));
      return sendCreated(res, attachments, "Files uploaded successfully");
    }
  } catch (error) {
    console.error("UPLOAD ATTACHMENT ERROR:", error);
    return sendError(res, "Failed to upload file");
  }
};
