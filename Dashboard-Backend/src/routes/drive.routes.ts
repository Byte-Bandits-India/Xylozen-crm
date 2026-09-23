import { Router } from "express";
import multer from "multer";
import {
  getDriveFiles,
  createDriveFolder,
  uploadDriveFile,
  renameDriveItem,
  moveDriveItem,
  deleteDriveItem,
} from "../controllers/drive.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

// In-memory multer storage: streams directly into Google Drive with zero server disk footprint
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

const router = Router();

router.use(authMiddleware);

router.get("/files", getDriveFiles);
router.post("/folders", createDriveFolder);
router.post("/upload", upload.single("file"), uploadDriveFile);
router.patch("/files/:id/rename", renameDriveItem);
router.patch("/files/:id/move", moveDriveItem);
router.delete("/files/:id", deleteDriveItem);

export default router;
