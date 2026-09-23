import { Router } from "express";
import {
  getAssignableUsers,
  getWorkItems,
  getWorkItemById,
  createWorkItem,
  updateWorkItem,
  updateWorkItemMilestone,
  updateWorkItemStatus,
  updateWorkItemPriority,
  deleteWorkItem,
  uploadAttachment,
  uploadAttachmentMiddleware,
} from "../controllers/workItem.controller";
import { authMiddleware, optionalAuth } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.middleware";
import {
  createWorkItemSchema,
  updateWorkItemSchema,
  updateWorkItemMilestoneSchema,
  updateWorkItemStatusSchema,
  updateWorkItemPrioritySchema,
} from "../validators/workItem.validator";

const router = Router();

// GET /api/work-items/assignable-users - Only Admin and Manager can fetch assignable collaborators
router.get("/assignable-users", authMiddleware, getAssignableUsers);

// Apply optionalAuth so user role, email, and publicId are captured
router.use(optionalAuth);

// GET /api/work-items - List work items (role-filtered for regular users unless scope=all)
router.get("/", getWorkItems);

// POST /api/work-items/upload - File attachment upload
router.post("/upload", uploadAttachmentMiddleware.array("files"), uploadAttachment);

// POST /api/work-items - Create new work assessment with attachments
router.post("/", validate(createWorkItemSchema), createWorkItem);

// GET /api/work-items/:id - Get single work item
router.get("/:id", getWorkItemById);

// PATCH /api/work-items/:id/milestone - Users update milestone progress as completed
router.patch("/:id/milestone", validate(updateWorkItemMilestoneSchema), updateWorkItemMilestone);

// PATCH /api/work-items/:id/status - Status Board drag-and-drop / stage update
router.patch("/:id/status", validate(updateWorkItemStatusSchema), updateWorkItemStatus);

// PATCH /api/work-items/:id/priority - Impact Board drag-and-drop / priority update (Admins only)
router.patch("/:id/priority", validate(updateWorkItemPrioritySchema), updateWorkItemPriority);

// PATCH /api/work-items/:id - Full or partial update
router.patch("/:id", validate(updateWorkItemSchema), updateWorkItem);

// DELETE /api/work-items/:id - Delete work item (Admins only)
router.delete("/:id", deleteWorkItem);

export default router;
