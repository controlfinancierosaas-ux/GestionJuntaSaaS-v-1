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

  if (clientId && clientSecret && refreshToken) {
    console.log("--- OAUTH2 DEBUG INFO ---");
    const idParts = clientId.split("-");
    const uniquePart = idParts.length > 1 ? idParts[1].split(".")[0] : "invalid-format";
    console.log("Client ID Unique Part (verify this):", uniquePart);
    console.log("Refresh Token (starts with):", refreshToken.substring(0, 10) + "...");
    
    if (refreshToken.startsWith('4/')) {
      console.error("WARNING: GOOGLE_REFRESH_TOKEN looks like an Authorization Code, not a Refresh Token!");
    }

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
      console.error("Error creating OAuth2 client:", e.message);
      throw e;
    }
  }

  // Fallback a cuenta de servicio
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (credentialsJson) {
    console.log("Using Service Account fallback");
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(credentialsJson),
      scopes: SCOPES,
    });
    driveClient = google.drive({ version: 'v3', auth });
    return driveClient;
  }

  throw new Error("No Google Drive credentials found in environment variables.");
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
      if (error.response.status === 401) {
        console.error("CONSEJO: El Refresh Token o el Client ID/Secret son inválidos. Vuelve a generarlos en el OAuth2 Playground.");
      }
    } else {
      console.error("Message:", error.message);
    }
    throw error;
  }
}

export function getFolderUrl(): string {
  return `https://drive.google.com/drive/folders/${FOLDER_ID}`;
}
