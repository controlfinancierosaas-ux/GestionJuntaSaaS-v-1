import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const FOLDER_ID = process.env.GOOGLE_FOLDER_ID || '1EUuaVuTMwv6Uitj57MZkF0t-UysqO0R_';

let drive: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (drive) return drive;

  console.log("--- GOOGLE DRIVE AUTH DEBUG ---");
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

  console.log("GOOGLE_SERVICE_ACCOUNT_JSON exists:", !!credentialsJson);
  console.log("GOOGLE_PRIVATE_KEY exists:", !!privateKey);
  console.log("GOOGLE_CLIENT_EMAIL exists:", !!clientEmail);
  console.log("FOLDER_ID:", FOLDER_ID);

  let auth;

  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson);
      console.log("Auth Method: GOOGLE_SERVICE_ACCOUNT_JSON");
      console.log("Service Account Email:", credentials.client_email);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
      });
    } catch (error: any) {
      console.error("FATAL: Error parsing GOOGLE_SERVICE_ACCOUNT_JSON:", error.message);
      throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON format: " + error.message);
    }
  } else if (privateKey && clientEmail) {
    console.log("Auth Method: Individual Env Vars");
    console.log("Service Account Email:", clientEmail);
    const credentials = {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key: privateKey.replace(/\\n/g, '\n'),
      client_email: clientEmail,
    };
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    });
  } else {
    console.error("FATAL: No credentials found in environment variables");
    throw new Error("Google Drive credentials not configured.");
  }

  drive = google.drive({ version: 'v3', auth });
  return drive;
}

export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = 'application/octet-stream'
): Promise<{ id: string; webViewLink: string }> {
  console.log(`--- START UPLOAD: ${fileName} (${fileBuffer.length} bytes) ---`);
  
  try {
    const driveClient = getDriveClient();
    
    // Crear el stream de forma compatible con Node.js y Next.js
    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null);

    const response = await driveClient.files.create({
      requestBody: {
        name: fileName,
        parents: [FOLDER_ID],
      },
      media: {
        mimeType,
        body: stream,
      },
      supportsAllDrives: true,
      fields: 'id, name, webViewLink'
    } as any);

    const fileId = response.data.id || '';
    console.log(`SUCCESS: File ${fileName} uploaded with ID: ${fileId}`);
    
    return {
      id: fileId,
      webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    };
  } catch (error: any) {
    console.error(`--- ERROR UPLOADING ${fileName} ---`);
    console.error('Error Message:', error.message);
    
    if (error.response) {
      console.error('Google API Error Response:', JSON.stringify(error.response.data, null, 2));
      console.error('Status Code:', error.response.status);
    } else if (error.request) {
      console.error('No response received from Google API. Check network/Vercel limits.');
    } else {
      console.error('General Error Stack:', error.stack);
    }
    
    throw error;
  }
}

export function getFolderUrl(): string {
  return `https://drive.google.com/drive/folders/${FOLDER_ID}`;
}
