import { google, drive_v3 } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const FOLDER_ID = process.env.GOOGLE_FOLDER_ID || '1EUuaVuTMwv6Uitj57MZkF0t-UysqO0R_';

let drive: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (drive) return drive;

  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

  let auth;

  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson);
      console.log("Using GOOGLE_SERVICE_ACCOUNT_JSON for Drive authentication");
      console.log("Service Account Email:", credentials.client_email);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
      });
    } catch (error) {
      console.error("Error parsing GOOGLE_SERVICE_ACCOUNT_JSON:", error);
      throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON format");
    }
  } else if (privateKey && clientEmail) {
    console.log("Using individual GOOGLE_PRIVATE_KEY and GOOGLE_CLIENT_EMAIL for Drive authentication");
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
    throw new Error("Google Drive credentials not configured. Please set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_PRIVATE_KEY and GOOGLE_CLIENT_EMAIL.");
  }

  drive = google.drive({ version: 'v3', auth });
  return drive;
}

export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = 'application/octet-stream'
): Promise<{ id: string; webViewLink: string }> {
  try {
    const driveClient = getDriveClient();
    
    console.log(`Attempting to upload file: ${fileName} to folder: ${FOLDER_ID}`);

    const response = await driveClient.files.create({
      requestBody: {
        name: fileName,
        parents: [FOLDER_ID],
      },
      media: {
        mimeType,
        body: require('stream').Readable.from(fileBuffer),
      },
      supportsAllDrives: true,
    } as any);

    const fileId = response.data.id || '';
    
    // Ensure the file is readable by everyone if needed, or at least get the link
    // By default, it inherits folder permissions
    
    const fileInfo = await driveClient.files.get({ 
      fileId, 
      fields: 'webViewLink' 
    });
    
    console.log(`Successfully uploaded: ${fileName} - ID: ${fileId}`);
    return {
      id: fileId,
      webViewLink: fileInfo.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    };
  } catch (error: any) {
    console.error('Error in uploadFileToDrive:', error.message);
    if (error.response) {
      console.error('Data:', error.response.data);
    }
    throw error;
  }
}

export function getFolderUrl(): string {
  return `https://drive.google.com/drive/folders/${FOLDER_ID}`;
}
