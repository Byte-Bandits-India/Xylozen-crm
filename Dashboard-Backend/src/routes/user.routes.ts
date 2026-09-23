import { Router } from "express";
import {
  getProfile,
  updateProfile,
  deleteAccount,
} from "../controllers/user.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), updateProfile);
router.delete("/account", authMiddleware, authorize(["SUPER_ADMIN"]), deleteAccount);

export default router;
