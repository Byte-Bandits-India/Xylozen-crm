import { Router } from "express";
import {
  login,
  verifyEmail,
  sendLoginOtp,
  verifyLoginOtp,
  googleAuth as googleLogin,
  forgotPassword,
  resetPassword,
  refresh as refreshAccessToken,
  logout,
  getMe,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.middleware";
import {
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sendLoginOtpSchema,
  verifyLoginOtpSchema,
} from "../validators/auth.validator";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post("/login/send-otp", validate(sendLoginOtpSchema), sendLoginOtp);
router.post("/login/verify-otp", validate(verifyLoginOtpSchema), verifyLoginOtp);
router.post("/google", googleLogin);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/refresh", refreshAccessToken);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getMe);

export default router;
