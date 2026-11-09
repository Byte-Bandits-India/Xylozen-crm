import express from "express";
import { upload, convertToWebp, uploadImageMemory, saveImage } from "../controllers/image.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

router.post(
  "/convert",
  authMiddleware,
  upload.single("image"),
  convertToWebp
);

router.post("/upload", authMiddleware, uploadImageMemory.single("image"), saveImage);

export default router;
