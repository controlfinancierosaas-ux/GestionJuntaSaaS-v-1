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

  console.log("--- GOOGLE DRIVE AUTH ATTEMPT ---");
  
  if (clientId && clientSecret && refreshToken) {
    // Log para verificar qué credenciales está tomando Vercel realmente
    const idSnippet = clientId.includes('-') ? clientId.split('-')[1].substring(0, 10) : "invalid";
    console.log(`Auth Method: OAuth2. Client ID unique part starts with: ${idSnippet}`);
    console.log(`Refresh Token starts with: ${refreshToken.substring(0, 6)}...`);

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
      console.error("OAuth2 client initialization failed:", e.message);
    }
  }

  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (credentialsJson) {
    console.log("Auth Method: Service Account fallback");
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(credentialsJson),
        scopes: SCOPES,
      });
      driveClient = google.drive({ version: 'v3', auth });
      return driveClient;
    } catch (e: any) {
      console.error("Service account initialization failed:", e.message);
    }
  }

  throw new Error("Missing valid Google Drive credentials in Vercel environment variables.");
}

export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = 'application/octet-stream'
): Promise<{ id: string; webViewLink: string }> {
  console.log(`[Upload] Processing file: ${fileName}`);
  
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

    console.log(`[Upload] Success! File ID: ${response.data.id}`);
    
    return {
      id: response.data.id || '',
      webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
    };
  } catch (error: any) {
    console.error(`[Upload] Error [${fileName}]:`, error.message);
    if (error.response?.data) {
      console.error("Google API detailed error:", JSON.stringify(error.response.data));
      if (error.response.status === 401) {
        console.error("CRITICAL: The credentials (ID, Secret, or Refresh Token) do not match. Please follow the 'Zero to Hero' procedure.");
      }
    }
    throw error;
  }
}

export function getFolderUrl(): string {
  return `https://drive.google.com/drive/folders/${FOLDER_ID}`;
}
