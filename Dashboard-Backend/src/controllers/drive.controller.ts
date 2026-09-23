import { Request, Response } from "express";
import { googleDriveService } from "../services/googleDrive.service";
import { sendSuccess, sendCreated, sendError, sendMessage } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getDriveFiles = async (req: AuthRequest, res: Response) => {
  try {
    const parentFolderId = (req.query.folderId as string) || "root";
    const search = (req.query.search as string) || "";
    const type = (req.query.type as string) || "ALL";

    const items = await googleDriveService.listItems(parentFolderId, search, type);
    return sendSuccess(res, items, "Files retrieved successfully");
  } catch (error) {
    console.error("GET DRIVE FILES ERROR:", error);
    return sendError(res, "Failed to retrieve drive files");
  }
};

export const createDriveFolder = async (req: AuthRequest, res: Response) => {
  try {
    const { name, parentFolderId } = req.body;
    if (!name || !name.trim()) {
      return sendError(res, "Folder name is required", 400);
    }

    const ownerName = req.email ? req.email.split("@")[0] : "me";
    const folder = await googleDriveService.createFolder(name, parentFolderId || "root", ownerName);
    return sendCreated(res, folder, "Folder created successfully");
  } catch (error) {
    console.error("CREATE FOLDER ERROR:", error);
    return sendError(res, "Failed to create folder");
  }
};

export const uploadDriveFile = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return sendError(res, "No file uploaded", 400);
    }

    const parentFolderId = req.body.parentFolderId || "root";
    const ownerName = req.email ? req.email.split("@")[0] : "me";

    const uploaded = await googleDriveService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      parentFolderId,
      ownerName
    );

    return sendCreated(res, uploaded, "File uploaded to Google Drive successfully");
  } catch (error) {
    console.error("UPLOAD FILE ERROR:", error);
    return sendError(res, "Failed to upload file to Google Drive");
  }
};

export const renameDriveItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return sendError(res, "Name is required", 400);
    }

    const updated = await googleDriveService.renameItem(id, name);
    if (!updated) {
      return sendError(res, "Item not found", 404);
    }

    return sendSuccess(res, updated, "Item renamed successfully");
  } catch (error) {
    console.error("RENAME DRIVE ITEM ERROR:", error);
    return sendError(res, "Failed to rename item");
  }
};

export const moveDriveItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { targetFolderId, currentParentId } = req.body;

    const updated = await googleDriveService.moveItem(id, targetFolderId || "root", currentParentId || "root");
    if (!updated) {
      return sendError(res, "Item not found", 404);
    }

    return sendSuccess(res, updated, "Item moved successfully");
  } catch (error) {
    console.error("MOVE DRIVE ITEM ERROR:", error);
    return sendError(res, "Failed to move item");
  }
};

export const deleteDriveItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await googleDriveService.deleteItem(id);
    if (!deleted) {
      return sendError(res, "Failed to delete item", 400);
    }

    return sendMessage(res, "Item deleted successfully");
  } catch (error) {
    console.error("DELETE DRIVE ITEM ERROR:", error);
    return sendError(res, "Failed to delete item");
  }
};
