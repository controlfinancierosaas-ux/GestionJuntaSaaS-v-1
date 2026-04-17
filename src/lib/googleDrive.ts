import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const FOLDER_ID = process.env.GOOGLE_FOLDER_ID || '1EUuaVuTMwv6Uitj57MZkF0t-UysqO0R_';

let driveClient: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (driveClient) return driveClient;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  // Intentar OAuth2 primero (Recomendado)
  if (clientId && clientSecret && refreshToken) {
    console.log("Attempting OAuth2 Auth...");
    try {
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'https://developers.google.com/oauthplayground'
      );
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      driveClient = google.drive({ version: 'v3', auth: oauth2Client });
      return driveClient;
    } catch (e: any) {
      console.error("OAuth2 setup failed:", e.message);
    }
  }

  // Fallback a Service Account
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (credentialsJson) {
    console.log("Attempting Service Account Auth...");
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(credentialsJson),
        scopes: SCOPES,
      });
      driveClient = google.drive({ version: 'v3', auth });
      return driveClient;
    } catch (e: any) {
      console.error("Service Account setup failed:", e.message);
    }
  }

  throw new Error("No valid Google Drive credentials found.");
}

export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = 'application/octet-stream'
): Promise<{ id: string; webViewLink: string }> {
  console.log(`Uploading: ${fileName}`);
  
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
      fields: 'id, webViewLink',
      supportsAllDrives: true,
    } as any);

    console.log(`Upload successful: ${response.data.id}`);
    
    return {
      id: response.data.id || '',
      webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
    };
  } catch (error: any) {
    console.error(`Upload error [${fileName}]:`, error.message);
    if (error.response?.data) {
      console.error("Google Error Details:", JSON.stringify(error.response.data));
    }
    throw error;
  }
}

export function getFolderUrl(): string {
  return `https://drive.google.com/drive/folders/${FOLDER_ID}`;
}
