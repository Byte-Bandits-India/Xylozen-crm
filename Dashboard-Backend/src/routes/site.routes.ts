import { Router } from "express";
import {
  createSite,
  getSites,
  getSiteById,
  updateSite,
  deleteSite,
} from "../controllers/site.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.middleware";
import { createSiteSchema, updateSiteSchema } from "../validators/site.validator";

const router = Router();

// Only SUPER_ADMIN allowed based on SiteManagement.tsx logic
router.post("/", authMiddleware, authorize(["SUPER_ADMIN"]), validate(createSiteSchema), createSite);
router.get("/", authMiddleware, authorize(["SUPER_ADMIN"]), getSites);
router.get("/:id", authMiddleware, authorize(["SUPER_ADMIN"]), getSiteById);
router.put("/:id", authMiddleware, authorize(["SUPER_ADMIN"]), validate(updateSiteSchema), updateSite);
router.delete("/:id", authMiddleware, authorize(["SUPER_ADMIN"]), deleteSite);

export default router;
