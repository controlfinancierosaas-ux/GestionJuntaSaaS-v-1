import { google, drive_v3 } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

interface ServiceAccountConfig {
  type: string;
  project_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
}

const serviceAccount: ServiceAccountConfig = {
  type: 'service_account',
  project_id: process.env.GOOGLE_PROJECT_ID || 'chromatic-tree-493221-h4',
  private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL || 'controljuntasaas@chromatic-tree-493221-h4.iam.gserviceaccount.com',
  client_id: process.env.GOOGLE_CLIENT_ID || '112341978489619506167',
};

const FOLDER_ID = process.env.GOOGLE_FOLDER_ID || '1EUuaVuTMwv6Uitj57MZkF0t-UysqO0R_';

let auth: any = null;
let drive: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (drive) return drive;
  
  auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: SCOPES,
  });
  
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
    
    const response = await driveClient.files.create({
      requestBody: {
        name: fileName,
        parents: [FOLDER_ID],
      },
      media: {
        mimeType,
        body: fileBuffer,
      },
    });

    const fileId = response.data.id || '';
    
    // Obtener link de visualización
    const fileInfo = await driveClient.files.get({ 
      fileId, 
      fields: 'webViewLink' 
    });
    
    console.log(`Archivo subido: ${fileName} - ID: ${fileId}`);
    return {
      id: fileId,
      webViewLink: fileInfo.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    };
  } catch (error) {
    console.error('Error subiendo archivo a Drive:', error);
    throw error;
  }
}

export function getFolderUrl(): string {
  return `https://drive.google.com/drive/folders/${FOLDER_ID}`;
}