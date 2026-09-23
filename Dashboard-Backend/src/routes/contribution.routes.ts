import { Router } from "express";
import {
  createContribution,
  getContributions,
  getContributionById,
  updateContribution,
  deleteContribution,
} from "../controllers/contribution.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.middleware";
import { createContributionSchema, updateContributionSchema } from "../validators/contribution.validator";

const router = Router();

router.post("/", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), validate(createContributionSchema), createContribution);
router.get("/", authMiddleware, getContributions);
router.get("/:publicId", authMiddleware, getContributionById);
router.put("/:publicId", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), validate(updateContributionSchema), updateContribution);
router.delete("/:publicId", authMiddleware, authorize(["SUPER_ADMIN"]), deleteContribution);

export default router;
