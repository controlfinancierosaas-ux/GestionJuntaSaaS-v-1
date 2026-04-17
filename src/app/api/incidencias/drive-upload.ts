import { google } from "googleapis";
import { Readable } from "stream";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

interface DriveFileResult {
  name: string;
  webViewLink: string;
  id: string;
}

export async function uploadFilesToDrive(
  files: Array<{ name: string; content: string }>,
  folderId: string = "1EUuaVuTMwv6Uitj57MZkF0t-UysqO0R_"
): Promise<DriveFileResult[]> {
  console.log("=== DRIVE UPLOAD START ===");
  console.log("Files to upload:", files.length);
  console.log("Folder ID:", folderId);
  
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  
  console.log("GOOGLE_SERVICE_ACCOUNT_JSON set:", !!credentialsJson);
  console.log("GOOGLE_PRIVATE_KEY set:", !!privateKey);
  console.log("GOOGLE_CLIENT_EMAIL set:", !!clientEmail);
  
  let credentials: any;
  
  if (credentialsJson) {
    credentials = JSON.parse(credentialsJson);
  } else if (privateKey && clientEmail) {
    credentials = {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID || 'chromatic-tree-493221-h4',
      private_key: privateKey.replace(/\\n/g, '\n'),
      client_email: clientEmail,
      client_id: process.env.GOOGLE_CLIENT_ID,
    };
  } else {
    throw new Error("Google Drive credentials not configured. Please set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_PRIVATE_KEY and GOOGLE_CLIENT_EMAIL environment variables.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  const drive = google.drive({ version: "v3", auth });

  const uploadedFiles: DriveFileResult[] = [];
  
  // The folder ID is the correct shared folder
  const FOLDER_ID = folderId;

  for (const file of files) {
    const buffer = Buffer.from(file.content, "base64");
    const stream = Readable.from(buffer);

    try {
      const response = await drive.files.create({
        requestBody: {
          name: file.name,
          parents: [FOLDER_ID],
        },
        media: {
          mimeType: getMimeType(file.name),
          body: stream,
        },
      });

      if (response.data.id && response.data.name) {
        console.log("File uploaded successfully:", response.data.name, "ID:", response.data.id);
        uploadedFiles.push({
          name: response.data.name,
          webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
          id: response.data.id,
        });
      }
    } catch (error: any) {
      console.error("Error uploading " + file.name + ":", error.message);
      console.error("Full error:", error);
      if (error.message?.includes("storage quota")) {
        throw new Error("Service Accounts do not have storage quota. Use a Shared Drive or OAuth.");
      }
      throw error;
    }
  }

  return uploadedFiles;
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}
