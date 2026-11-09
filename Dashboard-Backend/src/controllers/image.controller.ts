import { Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import crypto from "crypto";
import { promises as fs } from "fs";
import { sendSuccess, sendError } from "../utils/response";

// Configure Multer to store the uploaded file in memory
// This allows us to pass the buffer directly to Sharp
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
});

// The Controller Function to handle conversion
export const convertToWebp = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, "No image file provided", 400);
    }

    const originalSize = req.file.buffer.length;

    // Process the image buffer with Sharp
    const webpBuffer = await sharp(req.file.buffer)
      .webp({ quality: 80 }) // 80% quality by default
      .toBuffer();

    const compressedSize = webpBuffer.length;
    const compressionPercent = Math.round(
      ((originalSize - compressedSize) / originalSize) * 100
    );

    // Send the converted WebP image back to the client
    // Include compression stats in headers for the frontend
    res.set("Content-Type", "image/webp");
    res.set("X-Original-Size", String(originalSize));
    res.set("X-Compressed-Size", String(compressedSize));
    res.set("X-Compression-Percent", String(compressionPercent));
    res.set(
      "Access-Control-Expose-Headers",
      "X-Original-Size, X-Compressed-Size, X-Compression-Percent"
    );
    return res.status(200).send(webpBuffer);
  } catch (error) {
    console.error("Image conversion error:", error);
    return sendError(res, "Failed to convert image", 500);
  }
};

// Stores an uploaded image on disk (resized, WebP) and returns its public URL.
const imagesDir = path.join(process.cwd(), "uploads", "images");

export const uploadImageMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

export const saveImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) return sendError(res, "No image file provided", 400);
    await fs.mkdir(imagesDir, { recursive: true });
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.webp`;
    await sharp(req.file.buffer)
      .resize(512, 512, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(imagesDir, filename));
    return sendSuccess(res, { url: `/uploads/images/${filename}` }, "Image uploaded");
  } catch (error) {
    console.error("Image upload error:", error);
    return sendError(res, "Failed to upload image", 500);
  }
};
