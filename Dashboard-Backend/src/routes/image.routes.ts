import express from "express";
import { upload, convertToWebp } from "../controllers/image.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

router.post(
  "/convert",
  authMiddleware,
  upload.single("image"),
  convertToWebp
);

export default router;
