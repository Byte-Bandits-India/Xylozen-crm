import { Router } from "express";
import {
  getLeads,
  createLead,
  updateLead,
  updateLeadStatus,
  assignLead,
  deleteLead,
} from "../controllers/lead.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.middleware";
import { createLeadSchema, updateLeadSchema } from "../validators/lead.validator";

const router = Router();

router.use(authMiddleware);

router.get("/", getLeads);
router.post("/", validate(createLeadSchema), createLead);
router.patch("/:id", validate(updateLeadSchema), updateLead);
router.patch("/:id/status", updateLeadStatus);
router.patch("/:id/assign", assignLead);
router.delete("/:id", deleteLead);

export default router;
