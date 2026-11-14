import { Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendError } from "../utils/response";
import { parseSpreadsheetId, readSheetRows } from "../services/googleSheets.service";
import { runClientsLinkSync, SheetSyncError } from "../services/clientSheetSync.service";

const serializeLink = (l: any) =>
  l && {
    url: l.url,
    tab: l.tab,
    intervalMinutes: l.intervalMinutes,
    enabled: l.enabled,
    lastSyncedAt: l.lastSyncedAt,
    lastStatus: l.lastStatus,
    lastMessage: l.lastMessage,
    lastCreated: l.lastCreated,
    lastUpdated: l.lastUpdated,
  };

// GET /clients/sheet-link
export const getSheetLink = async (_req: AuthRequest, res: Response) => {
  const link = await prisma.sheetLink.findUnique({ where: { kind: "clients" } });
  return sendSuccess(res, serializeLink(link) ?? null);
};

// PUT /clients/sheet-link  { url, tab?, intervalMinutes?, enabled? }  — saves the link and syncs immediately.
export const saveSheetLink = async (req: AuthRequest, res: Response) => {
  try {
    const { url, tab, intervalMinutes, enabled } = req.body ?? {};
    const id = typeof url === "string" ? parseSpreadsheetId(url) : null;
    if (!id) return sendError(res, "Enter a valid Google Sheets link", 400);
    const interval = Math.min(1440, Math.max(5, Number(intervalMinutes) || 15));
    const tabName = typeof tab === "string" && tab.trim() ? tab.trim() : null;

    // Verify access before saving so a bad link never gets stored.
    try {
      await readSheetRows(id, tabName ?? undefined);
    } catch (e: any) {
      return sendError(res, e.message || "Failed to read spreadsheet", 400);
    }

    const data = {
      spreadsheetId: id,
      url: url.trim(),
      tab: tabName,
      intervalMinutes: interval,
      enabled: enabled !== false,
    };
    await prisma.sheetLink.upsert({
      where: { kind: "clients" },
      create: { kind: "clients", ...data, createdByPublicId: req.publicId },
      update: data,
    });

    const result = await runClientsLinkSync(req.publicId);
    const link = await prisma.sheetLink.findUnique({ where: { kind: "clients" } });
    return sendSuccess(res, { link: serializeLink(link), ...result }, "Sheet linked and synced");
  } catch (e: any) {
    if (e instanceof SheetSyncError) return sendError(res, e.message, 400);
    console.error("SAVE SHEET LINK ERROR:", e);
    return sendError(res, e?.message || "Failed to link sheet");
  }
};

// POST /clients/sheet-link/sync  — sync now
export const syncSheetLinkNow = async (req: AuthRequest, res: Response) => {
  try {
    const result = await runClientsLinkSync(req.publicId);
    const link = await prisma.sheetLink.findUnique({ where: { kind: "clients" } });
    return sendSuccess(res, { link: serializeLink(link), ...result }, "Synced");
  } catch (e: any) {
    if (e instanceof SheetSyncError) return sendError(res, e.message, 400);
    return sendError(res, e?.message || "Failed to sync", 400);
  }
};

// DELETE /clients/sheet-link — unlink (clients already imported are kept)
export const deleteSheetLink = async (_req: AuthRequest, res: Response) => {
  await prisma.sheetLink.deleteMany({ where: { kind: "clients" } });
  return sendSuccess(res, null, "Sheet unlinked");
};
