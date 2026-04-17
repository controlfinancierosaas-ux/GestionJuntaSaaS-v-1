import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const FOLDER_ID = process.env.GOOGLE_FOLDER_ID || '1EUuaVuTMwv6Uitj57MZkF0t-UysqO0R_';

let driveClient: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (driveClient) return driveClient;

  // Prioridad 1: OAuth2 (Recomendado para cuentas @gmail.com personales)
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    console.log("Using OAuth2 authentication (User Quota)");
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    driveClient = google.drive({ version: 'v3', auth: oauth2Client });
    return driveClient;
  }

  // Prioridad 2: Service Account (Solo funciona bien con Google Workspace / Shared Drives)
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

  let auth;

  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson);
      console.log("Using Service Account JSON (Service Account Quota)");
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
      });
    } catch (error: any) {
      console.error("Error parsing JSON credentials:", error.message);
      throw error;
    }
  } else if (privateKey && clientEmail) {
    console.log("Using Service Account Individual Vars");
    auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: clientEmail,
      },
      scopes: SCOPES,
    });
  } else {
    throw new Error("No Google Drive credentials found. Please set GOOGLE_REFRESH_TOKEN or GOOGLE_SERVICE_ACCOUNT_JSON.");
  }

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = 'application/octet-stream'
): Promise<{ id: string; webViewLink: string }> {
  console.log(`--- INICIO UPLOAD DRIVE: ${fileName} ---`);
  
  try {
    const drive = getDriveClient();
    
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [FOLDER_ID],
      },
      media: {
        mimeType,
        body: Readable.from(fileBuffer),
      },
      fields: 'id, webViewLink, name',
      supportsAllDrives: true,
    } as any);

    if (!response.data.id) {
      throw new Error("Google Drive response missing file ID");
    }

    console.log(`--- EXITO DRIVE: ${response.data.name} (ID: ${response.data.id}) ---`);
    
    return {
      id: response.data.id,
      webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
    };
  } catch (error: any) {
    console.error(`--- ERROR DRIVE UPLOAD [${fileName}] ---`);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data));
    } else {
      console.error("Message:", error.message);
    }
    throw error;
  }
}

export function getFolderUrl(): string {
  return `https://drive.google.com/drive/folders/${FOLDER_ID}`;
}
