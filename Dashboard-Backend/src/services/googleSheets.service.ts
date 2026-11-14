import { google, sheets_v4 } from "googleapis";

export function parseSpreadsheetId(input: string): string | null {
  const s = input.trim();
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  return /^[a-zA-Z0-9_-]{20,}$/.test(s) ? s : null;
}

export function getServiceAccountEmail(): string | undefined {
  return process.env.GOOGLE_DRIVE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
}

function buildClients(): sheets_v4.Sheets[] {
  const scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
  const clients: sheets_v4.Sheets[] = [];

  const email = getServiceAccountEmail();
  const key = (process.env.GOOGLE_DRIVE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY)?.replace(/\\n/g, "\n");
  if (email && key) {
    clients.push(google.sheets({ version: "v4", auth: new google.auth.JWT({ email, key, scopes }) }));
  }

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;
  if (clientId && clientSecret && refreshToken) {
    const oauth = new google.auth.OAuth2(clientId, clientSecret);
    oauth.setCredentials({ refresh_token: refreshToken });
    clients.push(google.sheets({ version: "v4", auth: oauth }));
  }

  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_DRIVE_KEY_FILE;
  if (keyFile) {
    clients.push(google.sheets({ version: "v4", auth: new google.auth.GoogleAuth({ keyFile, scopes }) }));
  }
  return clients;
}

/** Reads the first (or named) tab of a spreadsheet as rows of strings. Row 0 is the header. */
export async function readSheetRows(spreadsheetId: string, tab?: string): Promise<string[][]> {
  const clients = buildClients();
  if (!clients.length) throw new Error("Google credentials are not configured on the server.");

  let lastError: any;
  for (const sheets of clients) {
    try {
      let range = tab?.trim();
      if (!range) {
        const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties.title" });
        range = meta.data.sheets?.[0]?.properties?.title ?? undefined;
        if (!range) throw new Error("Spreadsheet has no tabs.");
      }
      const quoted = `'${range.replace(/'/g, "''")}'`;
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: quoted,
        valueRenderOption: "FORMATTED_VALUE",
      });
      return (res.data.values ?? []).map((r) => r.map((c) => String(c ?? "")));
    } catch (e) {
      lastError = e;
    }
  }
  const code = lastError?.code ?? lastError?.response?.status;
  if (code === 403 || code === 404) {
    const sa = getServiceAccountEmail();
    throw new Error(
      `Cannot access this spreadsheet.${sa ? ` Share it (Viewer) with ${sa}.` : ""}`
    );
  }
  throw new Error(lastError?.message || "Failed to read spreadsheet.");
}
