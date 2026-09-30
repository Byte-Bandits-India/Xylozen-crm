import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  size: number | null;
  formattedSize?: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  hasThumbnail?: boolean;
  iconLink?: string;
  parentFolderId?: string;
  owner?: {
    name: string;
    email?: string;
    photoLink?: string;
    isMe?: boolean;
  };
  shared?: boolean;
}

class GoogleDriveService {
  private driveClient: drive_v3.Drive | null = null;
  private serviceAccountClient: drive_v3.Drive | null = null;
  private isConfigured = false;
  private rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "1fU0Hvf_pSGilCEonywI21kjjS4_htade";

  constructor() {
    this.init();
  }

  private init() {
    try {
      const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
      const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

      const email = process.env.GOOGLE_DRIVE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;
      const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_DRIVE_KEY_FILE;

      if (privateKey) {
        privateKey = privateKey.replace(/\\n/g, "\n");
      }

      if (email && privateKey) {
        const saAuth = new google.auth.JWT({
          email,
          key: privateKey,
          scopes: ["https://www.googleapis.com/auth/drive"],
        });
        this.serviceAccountClient = google.drive({ version: "v3", auth: saAuth });
      }

      if (clientId && clientSecret && refreshToken) {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        this.driveClient = google.drive({ version: "v3", auth: oauth2Client });
        console.log("✅ Google Drive API initialized successfully with OAuth 2.0 (User Quota)");
      } else if (this.serviceAccountClient) {
        this.driveClient = this.serviceAccountClient;
        console.log("✅ Google Drive API initialized successfully with Service Account JWT");
      } else if (keyFilePath) {
        const auth = new google.auth.GoogleAuth({
          keyFile: keyFilePath,
          scopes: ["https://www.googleapis.com/auth/drive"],
        });
        this.driveClient = google.drive({ version: "v3", auth });
      }

      if (this.driveClient) {
        this.isConfigured = true;
        this.rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || "1fU0Hvf_pSGilCEonywI21kjjS4_htade";
        console.log("✅ Google Drive Root Folder:", this.rootFolderId);
      } else {
        console.warn("⚠️ Google Drive credentials not provided.");
      }
    } catch (error) {
      console.error("❌ Failed to initialize Google Drive client:", error);
      this.isConfigured = false;
    }
  }

  private getClients(): drive_v3.Drive[] {
    const clients: drive_v3.Drive[] = [];
    if (this.driveClient) clients.push(this.driveClient);
    if (this.serviceAccountClient && this.serviceAccountClient !== this.driveClient) {
      clients.push(this.serviceAccountClient);
    }
    return clients;
  }

  private formatBytes(bytes: number | null): string {
    if (bytes === null || bytes === undefined || isNaN(bytes) || bytes === 0) return "—";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  async listItems(
    parentFolderId = "root",
    search?: string,
    type?: string
  ): Promise<DriveItem[]> {
    return this.listFiles(parentFolderId, search, type);
  }

  async listFiles(
    parentFolderId = "root",
    search?: string,
    type?: string
  ): Promise<DriveItem[]> {
    if (!this.driveClient) {
      this.init();
    }
    if (!this.driveClient) {
      throw new Error("Google Drive is not configured. Please check your credentials.");
    }

    const targetParent = parentFolderId === "root" ? this.rootFolderId : parentFolderId;
    let q = `'${targetParent}' in parents and trashed = false`;

    if (search && search.trim()) {
      const safeSearch = search.trim().replace(/'/g, "\\'");
      q += ` and name contains '${safeSearch}'`;
    }

    if (type && type !== "ALL") {
      if (type === "folder") {
        q += " and mimeType = 'application/vnd.google-apps.folder'";
      } else if (type === "document") {
        q += " and (mimeType contains 'document' or mimeType contains 'word' or mimeType contains 'text')";
      } else if (type === "spreadsheet") {
        q += " and (mimeType contains 'spreadsheet' or mimeType contains 'excel' or mimeType contains 'sheet')";
      } else if (type === "pdf") {
        q += " and mimeType = 'application/pdf'";
      } else if (type === "image") {
        q += " and mimeType contains 'image/'";
      }
    }

    const res = await this.driveClient.files.list({
      q,
      fields: "files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, thumbnailLink, hasThumbnail, iconLink, parents, owners, shared)",
      orderBy: "folder,modifiedTime desc",
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = res.data.files || [];
    return files.map((file: any) => {
      const isFolder = file.mimeType === "application/vnd.google-apps.folder";
      const sizeNum = file.size ? parseInt(file.size, 10) : null;
      let ownerDisplayName = "me";
      if (file.owners && file.owners[0]) {
        const rawName = file.owners[0].displayName || file.owners[0].emailAddress || "";
        if (rawName.includes("gserviceaccount.com") || rawName.includes("drive-bot") || file.owners[0].me) {
          ownerDisplayName = "me";
        } else if (rawName) {
          ownerDisplayName = rawName;
        }
      }
      const ownerObj = {
        name: ownerDisplayName,
        email: file.owners && file.owners[0] ? file.owners[0].emailAddress : undefined,
        photoLink: file.owners && file.owners[0] ? file.owners[0].photoLink : undefined,
        isMe: ownerDisplayName === "me",
      };

      return {
        id: file.id || "",
        name: file.name || "",
        mimeType: file.mimeType || "",
        isFolder,
        size: sizeNum,
        formattedSize: isFolder ? "—" : this.formatBytes(sizeNum),
        modifiedTime: file.modifiedTime || new Date().toISOString(),
        webViewLink: file.webViewLink || undefined,
        webContentLink: file.webContentLink || undefined,
        thumbnailLink: file.thumbnailLink || undefined,
        hasThumbnail: Boolean(file.hasThumbnail),
        iconLink: file.iconLink || undefined,
        parentFolderId: parentFolderId,
        owner: ownerObj,
        shared: Boolean(file.shared),
      };
    });
  }

  async createFolder(name: string, parentFolderId = "root", ownerName = "me"): Promise<DriveItem> {
    if (!this.driveClient) {
      this.init();
    }
    if (!this.driveClient) {
      throw new Error("Google Drive is not configured.");
    }

    const targetParent = parentFolderId === "root" ? this.rootFolderId : parentFolderId;
    const res = await this.driveClient.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: name.trim(),
        mimeType: "application/vnd.google-apps.folder",
        parents: [targetParent],
      },
      fields: "id, name, mimeType, modifiedTime, webViewLink, parents, owners, shared",
    });

    const file = res.data;
    return {
      id: file.id || "",
      name: file.name || name.trim(),
      mimeType: file.mimeType || "application/vnd.google-apps.folder",
      isFolder: true,
      size: null,
      formattedSize: "—",
      modifiedTime: file.modifiedTime || new Date().toISOString(),
      webViewLink: file.webViewLink || undefined,
      parentFolderId: parentFolderId,
      owner: { name: ownerName, isMe: true },
      shared: false,
    };
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    parentFolderId = "root",
    ownerName = "me"
  ): Promise<DriveItem> {
    if (!this.driveClient) {
      this.init();
    }
    if (!this.driveClient) {
      throw new Error("Google Drive is not configured.");
    }

    const targetParent = parentFolderId === "root" ? this.rootFolderId : parentFolderId;
    const stream = Readable.from(fileBuffer);

    const res = await this.driveClient.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: fileName,
        parents: [targetParent],
      },
      media: {
        mimeType: mimeType || "application/octet-stream",
        body: stream,
      },
      fields: "id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, parents, owners, shared",
    });

    const file = res.data;
    const sizeNum = file.size ? parseInt(file.size, 10) : fileBuffer.length;

    return {
      id: file.id || "",
      name: file.name || fileName,
      mimeType: file.mimeType || mimeType,
      isFolder: false,
      size: sizeNum,
      formattedSize: this.formatBytes(sizeNum),
      modifiedTime: file.modifiedTime || new Date().toISOString(),
      webViewLink: file.webViewLink || undefined,
      webContentLink: file.webContentLink || undefined,
      parentFolderId: parentFolderId,
      owner: { name: ownerName, isMe: true },
      shared: false,
    };
  }

  async renameItem(fileId: string, newName: string): Promise<DriveItem | null> {
    if (!this.driveClient) {
      this.init();
    }
    if (!this.driveClient) {
      throw new Error("Google Drive is not configured.");
    }

    const clientsToTry = this.getClients();
    let lastError: any = null;
    let file: any = null;

    for (const client of clientsToTry) {
      try {
        const res = await client.files.update({
          supportsAllDrives: true,
          fileId,
          requestBody: {
            name: newName.trim(),
          },
          fields: "id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, parents, owners, shared",
        });
        file = res.data;
        break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!file) {
      throw lastError || new Error("Failed to rename item");
    }

    const isFolder = file.mimeType === "application/vnd.google-apps.folder";
    const sizeNum = file.size ? parseInt(file.size, 10) : null;

    return {
      id: file.id || fileId,
      name: file.name || newName.trim(),
      mimeType: file.mimeType || "",
      isFolder,
      size: sizeNum,
      formattedSize: isFolder ? "—" : this.formatBytes(sizeNum),
      modifiedTime: file.modifiedTime || new Date().toISOString(),
      webViewLink: file.webViewLink || undefined,
      webContentLink: file.webContentLink || undefined,
      owner: { name: "me", isMe: true },
      shared: Boolean(file.shared),
    };
  }

  async moveItem(fileId: string, targetFolderId: string, currentParentId = "root"): Promise<DriveItem | null> {
    if (!this.driveClient) {
      this.init();
    }
    if (!this.driveClient) {
      throw new Error("Google Drive is not configured.");
    }

    const addParent = targetFolderId === "root" ? this.rootFolderId : targetFolderId;
    const removeParent = currentParentId === "root" ? this.rootFolderId : currentParentId;

    const clientsToTry = this.getClients();
    let lastError: any = null;
    let file: any = null;

    for (const client of clientsToTry) {
      try {
        const res = await client.files.update({
          supportsAllDrives: true,
          fileId,
          addParents: addParent,
          removeParents: removeParent,
          fields: "id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, parents, owners, shared",
        });
        file = res.data;
        break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!file) {
      throw lastError || new Error("Failed to move item");
    }

    const isFolder = file.mimeType === "application/vnd.google-apps.folder";
    const sizeNum = file.size ? parseInt(file.size, 10) : null;

    return {
      id: file.id || fileId,
      name: file.name || "",
      mimeType: file.mimeType || "",
      isFolder,
      size: sizeNum,
      formattedSize: isFolder ? "—" : this.formatBytes(sizeNum),
      modifiedTime: file.modifiedTime || new Date().toISOString(),
      webViewLink: file.webViewLink || undefined,
      webContentLink: file.webContentLink || undefined,
      parentFolderId: targetFolderId,
      owner: { name: "me", isMe: true },
      shared: Boolean(file.shared),
    };
  }

  async deleteItem(fileId: string): Promise<boolean> {
    if (!this.driveClient) {
      this.init();
    }
    if (!this.driveClient) {
      throw new Error("Google Drive is not configured.");
    }

    const clientsToTry = this.getClients();
    let lastError: any = null;

    // 1. Try standard Move to Trash first across available clients
    for (const client of clientsToTry) {
      try {
        await client.files.update({
          fileId,
          requestBody: { trashed: true },
          supportsAllDrives: true,
        });
        return true;
      } catch (trashErr: any) {
        lastError = trashErr;
      }

      // 2. Try permanent deletion
      try {
        await client.files.delete({
          fileId,
          supportsAllDrives: true,
        });
        return true;
      } catch (deleteErr: any) {
        lastError = deleteErr;
      }
    }

    // 3. Fallback: if not owner of the file (e.g. shared folder item), remove item from parents
    for (const client of clientsToTry) {
      try {
        const meta = await client.files.get({
          fileId,
          fields: "id, parents",
          supportsAllDrives: true,
        });
        const parents = meta.data.parents;
        if (parents && parents.length > 0) {
          await client.files.update({
            fileId,
            removeParents: parents.join(","),
            supportsAllDrives: true,
          });
          return true;
        }
      } catch (unparentErr: any) {
        lastError = unparentErr;
      }
    }

    console.error("DELETE DRIVE ITEM ERROR:", lastError?.message || lastError);
    throw lastError || new Error("Failed to delete item from Google Drive");
  }

  async getFileContent(fileId: string): Promise<{ stream: any; mimeType: string; name: string; size?: string }> {
    if (!this.driveClient) {
      this.init();
    }
    const clients = this.getClients();
    let lastError: any = null;

    for (const client of clients) {
      try {
        const meta = await client.files.get({
          fileId,
          fields: "id, name, mimeType, size",
          supportsAllDrives: true,
        });

        const mimeType = meta.data.mimeType || "application/octet-stream";
        const name = meta.data.name || "file";

        // If it's a Google Workspace file (docs, sheets, slides), export it as PDF
        if (mimeType.startsWith("application/vnd.google-apps.")) {
          const exportMime = "application/pdf";
          const exportRes = await client.files.export(
            { fileId, mimeType: exportMime },
            { responseType: "stream" }
          );
          return { stream: exportRes.data, mimeType: exportMime, name: `${name}.pdf` };
        }

        const res = await client.files.get(
          { fileId, alt: "media", supportsAllDrives: true },
          { responseType: "stream" }
        );

        return {
          stream: res.data,
          mimeType,
          name,
          size: meta.data.size || undefined,
        };
      } catch (err: any) {
        lastError = err;
      }
    }

    console.error("GET FILE CONTENT ERROR:", lastError?.message || lastError);
    throw lastError || new Error("Failed to retrieve file content");
  }
}

export const googleDriveService = new GoogleDriveService();
