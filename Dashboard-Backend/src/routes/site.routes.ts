import { Router } from "express";
import {
  createSite,
  getSites,
  getSiteById,
  updateSite,
  deleteSite,
} from "../controllers/site.controller";
import { authMiddleware, requirePageEdit } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.middleware";
import { createSiteSchema, updateSiteSchema } from "../validators/site.validator";

const router = Router();

// Only SUPER_ADMIN allowed based on SiteManagement.tsx logic
router.post("/", authMiddleware, requirePageEdit("site-management"), validate(createSiteSchema), createSite);
router.get("/", authMiddleware, requirePageEdit("site-management"), getSites);
router.get("/:id", authMiddleware, requirePageEdit("site-management"), getSiteById);
router.put("/:id", authMiddleware, requirePageEdit("site-management"), validate(updateSiteSchema), updateSite);
router.delete("/:id", authMiddleware, requirePageEdit("site-management"), deleteSite);

export default router;
