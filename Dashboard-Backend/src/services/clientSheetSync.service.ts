import prisma from "../prisma/client";
import { readSheetRows } from "./googleSheets.service";

const SOURCES: Record<string, string> = {
  rb_pranam: "RB Pranam", connection: "Connection", linkedin: "LinkedIn", instagram: "Instagram",
  meta_ads: "Meta Ads", google_ads: "Google Ads", website: "Website enquiry",
  whatsapp_group: "WhatsApp group", other: "Other",
};
const STATUSES = ["lead", "active", "on_hold", "past", "lost"];
const TEXT_FIELDS = [
  "name", "email", "phone", "whatsapp", "companyName", "city", "state", "country",
  "postalCode", "industry", "website", "taxId", "currency", "language", "notes",
] as const;

const normHeader = (h: string) => h.trim().toLowerCase().replace(/[\s_-]+/g, "");
const HEADER_MAP: Record<string, string> = Object.fromEntries(
  [...TEXT_FIELDS, "source", "status"].map((f) => [normHeader(f), f])
);
HEADER_MAP["company"] = "companyName";
HEADER_MAP["clientname"] = "name";
HEADER_MAP["mobile"] = "phone";

const normSource = (v: string) => {
  const t = v.trim().toLowerCase();
  if (!t) return undefined;
  const hit = Object.entries(SOURCES).find(([k, l]) => k === t || l.toLowerCase() === t);
  return hit ? hit[0] : "other";
};
const normStatus = (v: string) => {
  const t = v.trim().toLowerCase().replace(/\s+/g, "_");
  return STATUSES.includes(t) ? t : undefined;
};

/** Digits only, last 10, so "+91 98765-43210" and "9876543210" match. */
const phoneKey = (v?: string | null) => {
  const d = (v ?? "").replace(/\D/g, "");
  return d.length >= 7 ? d.slice(-10) : "";
};

export class SheetSyncError extends Error {}

export interface SyncResult { created: number; updated: number; errors: string[] }

/** Adds only NEW clients from a sheet. Rows whose phone already exists are skipped untouched. Never updates or deletes. */
export async function syncClientsFromSheet(
  spreadsheetId: string,
  tab: string | null | undefined,
  actorPublicId?: string
): Promise<SyncResult> {
  const rows = await readSheetRows(spreadsheetId, tab ?? undefined);
  if (rows.length < 2) throw new SheetSyncError("The sheet needs a header row and at least one data row");

  const cols = rows[0].map((h) => HEADER_MAP[normHeader(h)]);
  if (!cols.includes("name")) throw new SheetSyncError("The header row needs a 'name' column");

  const existingClients = await prisma.client.findMany({ select: { phone: true } });
  const knownPhones = new Set(existingClients.map((c) => phoneKey(c.phone)).filter(Boolean));

  let created = 0;
  const updated = 0;
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r.some((c) => c.trim())) continue;
    const rec: Record<string, string> = {};
    cols.forEach((f, idx) => { if (f) rec[f] = (r[idx] ?? "").trim(); });
    if (!rec.name) { errors.push(`Row ${i + 1}: name is required`); continue; }
    if (rec.email && !/^\S+@\S+\.\S+$/.test(rec.email)) { errors.push(`Row ${i + 1} (${rec.name}): invalid email`); continue; }

    const key = phoneKey(rec.phone);
    if (!key) { errors.push(`Row ${i + 1} (${rec.name}): phone number is required`); continue; }
    if (knownPhones.has(key)) continue; // already in the CRM (or earlier in the sheet): leave untouched

    const data: Record<string, any> = {};
    for (const f of TEXT_FIELDS) if (rec[f]) data[f] = rec[f];
    const source = normSource(rec.source ?? "");
    const status = normStatus(rec.status ?? "");
    if (source) data.source = source;
    if (status) data.status = status;

    try {
      await prisma.client.create({ data: { ...data, name: rec.name, createdByPublicId: actorPublicId } as any });
      knownPhones.add(key);
      created++;
    } catch (e) {
      console.error("SHEET SYNC ROW ERROR:", e);
      errors.push(`Row ${i + 1} (${rec.name}): failed to save`);
    }
  }
  return { created, updated, errors };
}

/** Runs the sync for the saved link and records the outcome on it. */
export async function runClientsLinkSync(actorPublicId?: string) {
  const link = await prisma.sheetLink.findUnique({ where: { kind: "clients" } });
  if (!link) throw new SheetSyncError("No sheet is linked");
  try {
    const result = await syncClientsFromSheet(link.spreadsheetId, link.tab, actorPublicId ?? link.createdByPublicId ?? undefined);
    await prisma.sheetLink.update({
      where: { id: link.id },
      data: {
        lastSyncedAt: new Date(),
        lastStatus: "ok",
        lastMessage: result.errors.length ? `${result.errors.length} row(s) skipped` : null,
        lastCreated: result.created,
        lastUpdated: result.updated,
      },
    });
    return result;
  } catch (e: any) {
    await prisma.sheetLink.update({
      where: { id: link.id },
      data: { lastSyncedAt: new Date(), lastStatus: "error", lastMessage: String(e?.message || e).slice(0, 500) },
    });
    throw e;
  }
}

const SHEET_SYNC_INTERVAL_MS = 5 * 60_000;
let running = false;
/** Starts a background poller: every 5 min, sync the link if enabled. */
export function startSheetSyncScheduler() {
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const link = await prisma.sheetLink.findUnique({ where: { kind: "clients" } });
      if (!link || !link.enabled) return;
      await runClientsLinkSync();
    } catch (e: any) {
      console.error("[SheetSync] scheduled sync failed:", e?.message || e);
    } finally {
      running = false;
    }
  };
  setInterval(tick, SHEET_SYNC_INTERVAL_MS);
  console.log("[SheetSync] scheduler started");
}
