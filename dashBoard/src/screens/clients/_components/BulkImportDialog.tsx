import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import { Download, FileSpreadsheet, Link2, RefreshCw, UploadCloud, X } from "lucide-react";
import { message } from "antd";
import { apiClient } from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { CLIENT_SOURCES, CLIENT_STATUSES } from "./clients";

type SheetLink = {
  url: string;
  intervalMinutes: number;
  enabled: boolean;
  lastSyncedAt: string | null;
  lastStatus: "ok" | "error" | null;
  lastMessage: string | null;
  lastCreated: number;
  lastUpdated: number;
};

const HEADERS = ["name", "email", "phone", "companyName", "source", "status", "city", "country", "notes"];
const SAMPLE_ROWS = [
  ["Jane Doe", "jane@example.com", "+91 90000 00000", "Acme Inc", "linkedin", "lead", "Chennai", "India", "Met at expo"],
  ["John Smith", "john@example.com", "", "", "website", "active", "", "", ""],
];

const toCsv = (rows: string[][]) =>
  rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

const normalizeSource = (v: string) => {
  const t = v.trim().toLowerCase();
  if (!t) return undefined;
  const hit = Object.entries(CLIENT_SOURCES).find(([k, l]) => k === t || l.toLowerCase() === t);
  return hit ? hit[0] : "other";
};
const normalizeStatus = (v: string) => {
  const t = v.trim().toLowerCase().replace(/\s+/g, "_");
  return t in CLIENT_STATUSES ? t : undefined;
};

export function BulkImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [mode, setMode] = useState<"csv" | "sheet">("sheet");
  const [sheetUrl, setSheetUrl] = useState("");

  const reset = () => {
    setFile(null);
    setErrors([]);
    setSheetUrl("");
  };

  const linkQuery = useQuery({
    queryKey: ["clients-sheet-link"],
    queryFn: async () => (await apiClient.get("/clients/sheet-link")).data?.data as SheetLink | null,
    enabled: open,
  });
  const link = linkQuery.data ?? null;
  const [interval] = useState(15);

  const afterSync = (data: any) => {
    message.success(`Synced: ${data.created} created, ${data.updated} updated`);
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    queryClient.invalidateQueries({ queryKey: ["clients-sheet-link"] });
    setErrors(data.errors ?? []);
  };

  const linkSheet = async () => {
    setBusy(true);
    setErrors([]);
    try {
      const res = await apiClient.put("/clients/sheet-link", {
        url: sheetUrl.trim(),
        intervalMinutes: interval,
      });
      setSheetUrl("");
      afterSync(res.data?.data ?? {});
    } catch (e: any) {
      setErrors([e?.response?.data?.message || "Failed to link Google Sheet"]);
    } finally {
      setBusy(false);
    }
  };

  const syncNow = async () => {
    setBusy(true);
    setErrors([]);
    try {
      const res = await apiClient.post("/clients/sheet-link/sync");
      afterSync(res.data?.data ?? {});
    } catch (e: any) {
      setErrors([e?.response?.data?.message || "Failed to sync"]);
      queryClient.invalidateQueries({ queryKey: ["clients-sheet-link"] });
    } finally {
      setBusy(false);
    }
  };

  const unlink = async () => {
    setBusy(true);
    try {
      await apiClient.delete("/clients/sheet-link");
      message.success("Sheet unlinked");
      queryClient.invalidateQueries({ queryKey: ["clients-sheet-link"] });
    } finally {
      setBusy(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([toCsv([HEADERS, ...SAMPLE_ROWS])], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const runImport = async () => {
    if (!file) return;
    setBusy(true);
    setErrors([]);
    try {
      const [head, ...body] = parseCsv(await file.text());
      const cols = (head || []).map((h) => h.trim());
      if (!cols.includes("name") || body.length === 0) {
        setErrors(["The file needs a header row with a 'name' column and at least one data row."]);
        return;
      }
      let ok = 0;
      const failed: string[] = [];
      for (let i = 0; i < body.length; i++) {
        const rec: Record<string, string> = {};
        cols.forEach((c, idx) => (rec[c] = (body[i][idx] ?? "").trim()));
        if (!rec.name) {
          failed.push(`Row ${i + 2}: name is required`);
          continue;
        }
        const payload: Record<string, unknown> = {};
        for (const c of cols) if (rec[c] && c !== "source" && c !== "status") payload[c] = rec[c];
        const source = normalizeSource(rec.source || "");
        const status = normalizeStatus(rec.status || "");
        if (source) payload.source = source;
        if (status) payload.status = status;
        try {
          await apiClient.post("/clients", payload);
          ok++;
        } catch (e: any) {
          failed.push(`Row ${i + 2} (${rec.name}): ${e?.response?.data?.message || "failed"}`);
        }
      }
      if (ok) {
        message.success(`${ok} client${ok === 1 ? "" : "s"} imported`);
        queryClient.invalidateQueries({ queryKey: ["clients"] });
      }
      if (failed.length) setErrors(failed);
      else {
        reset();
        onOpenChange(false);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-xl border border-border bg-background p-6 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold">Bulk import clients</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Import clients from a Google Sheet or a CSV file, one client per row.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm font-medium">
            {(["sheet", "csv"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setErrors([]);
                }}
                className={`rounded-md px-3 py-1.5 ${mode === m ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              >
                {m === "sheet" ? "Google Sheet" : "CSV file"}
              </button>
            ))}
          </div>

          {mode === "sheet" && link && (
            <div className="space-y-3 rounded-lg border border-border p-3 text-sm">
              <div className="flex items-start gap-2">
                <Link2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <a href={link.url} target="_blank" rel="noreferrer" className="block truncate font-medium text-primary hover:underline">
                    {link.url}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    Auto-syncs every 5 minutes ·{" "}
                    {link.lastSyncedAt
                      ? `last ${link.lastStatus === "error" ? "attempt failed" : "synced"} ${new Date(link.lastSyncedAt).toLocaleString()}`
                      : "not synced yet"}
                    {link.lastStatus === "ok" && ` (${link.lastCreated} new, ${link.lastUpdated} updated)`}
                  </p>
                  {link.lastStatus === "error" && link.lastMessage && (
                    <p className="mt-1 text-xs text-destructive">{link.lastMessage}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={unlink} disabled={busy}>
                  Unlink
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Only new leads are added. Rows whose phone number already exists in the CRM are skipped and existing
                clients are never changed or deleted. Every row needs a phone number.
              </p>
            </div>
          )}

          {mode === "sheet" && !link && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm">
                <Link2 className="size-4 text-muted-foreground" />
                <input
                  value={sheetUrl}
                  onChange={(e) => {
                    setSheetUrl(e.target.value);
                    setErrors([]);
                  }}
                  placeholder="https://docs.google.com/spreadsheets/d/…"
                  className="w-full bg-transparent outline-none"
                />
              </label>
              <p className="text-sm">Syncs automatically every 5 minutes.</p>
              <p className="text-xs text-muted-foreground">
                The first tab is used; row 1 must be a header with <b>name</b> and <b>phone</b> columns (optional:{" "}
                {HEADERS.filter((h) => h !== "name" && h !== "phone").join(", ")}). Make sure the Google account connected to the CRM can
                open the sheet.
              </p>
            </div>
          )}

          {mode === "csv" && (<>
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-primary hover:bg-muted"
          >
            <Download className="size-4" /> Download sample template
          </button>

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-10 text-center hover:bg-muted/50"
          >
            {file ? (
              <>
                <FileSpreadsheet className="size-8 text-primary" />
                <span className="text-sm font-medium">{file.name}</span>
              </>
            ) : (
              <>
                <UploadCloud className="size-8 text-muted-foreground" />
                <span className="text-sm font-medium">Click to upload or drag and drop</span>
                <span className="text-xs text-muted-foreground">CSV files only</span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setErrors([]);
              }}
            />
          </div>
          </>)}

          {errors.length > 0 && (
            <ul className="max-h-32 space-y-1 overflow-auto rounded-md bg-destructive/10 p-3 text-xs text-destructive">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {mode === "sheet" && link && (
              <Button className="!text-white" onClick={syncNow} disabled={busy}>
                <RefreshCw className="mr-1 size-3.5" /> {busy ? "Syncing…" : "Live sync"}
              </Button>
            )}
            {!(mode === "sheet" && link) && (
              <Button
                className="!text-white"
                onClick={mode === "sheet" ? linkSheet : runImport}
                disabled={busy || (mode === "sheet" ? !sheetUrl.trim() : !file)}
              >
                {busy ? (mode === "sheet" ? "Linking…" : "Importing…") : mode === "sheet" ? "Link & sync" : "Import"}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
