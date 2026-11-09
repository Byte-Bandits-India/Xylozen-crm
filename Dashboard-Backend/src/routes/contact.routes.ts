import { Router } from "express";
import { createContact, getContacts, deleteContact, exportContacts } from "../controllers/contact.controller";
import { authMiddleware, requirePageEdit } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.middleware";
import { createContactSchema } from "../validators/contact.validator";

const router = Router();

// POST /api/contacts - Public contact submission
router.post("/", validate(createContactSchema), createContact);

// GET /api/contacts/export - Export contacts as excel (SUPER_ADMIN and ADMIN only)
router.get("/export", authMiddleware, requirePageEdit("contact-messages"), exportContacts);

// GET /api/contacts - Protected (SUPER_ADMIN and ADMIN only)
router.get("/", authMiddleware, requirePageEdit("contact-messages"), getContacts);

// DELETE /api/contacts/:publicId - Protected (SUPER_ADMIN and ADMIN only)
router.delete("/:publicId", authMiddleware, requirePageEdit("contact-messages"), deleteContact);

export default router;
