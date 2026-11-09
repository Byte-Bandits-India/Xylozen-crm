import { useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Download, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { message } from "antd";
import { apiClient } from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { CLIENT_SOURCES, CLIENT_STATUSES } from "./clients";

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

  const reset = () => {
    setFile(null);
    setErrors([]);
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
                Upload a CSV file with one client per row.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
              <X className="size-4" />
            </Dialog.Close>
          </div>

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
            <Button className="!text-white" onClick={runImport} disabled={!file || busy}>
              {busy ? "Importing…" : "Import"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
