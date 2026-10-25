import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

// Scopes autorizados para Google Drive
export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.appdata',
];

SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

// Cache in-memory del access token (nunca en localStorage por seguridad)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initDriveAuth = (
  onSuccess?: (user: User, token: string) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onSuccess) onSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onFailure) onFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onFailure) onFailure();
    }
  });
};

export const signInWithGoogleDrive = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Drive.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogleDrive = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Interface para archivos de Google Drive
export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
}

const GSI_FOLDER_NAME = 'GSI - Gestión de Flota';

/**
 * Obtiene o crea la carpeta de GSI en Google Drive del usuario
 */
export async function getOrCreateGsiFolder(accessToken: string): Promise<string> {
  const query = `name = '${GSI_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Crear la carpeta si no existe
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: GSI_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Carpeta oficial de respaldos y archivos de la flota vehicular GSI',
    }),
  });

  if (!createRes.ok) {
    throw new Error('No se pudo crear la carpeta en Google Drive');
  }

  const folder = await createRes.json();
  return folder.id;
}

/**
 * Lista los archivos de Google Drive pertenecientes a la carpeta de GSI
 */
export async function listGsiDriveFiles(accessToken: string): Promise<DriveFileItem[]> {
  try {
    const folderId = await getOrCreateGsiFolder(accessToken);
    const query = `'${folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink)&orderBy=modifiedTime desc&pageSize=100`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error('Error al listar archivos de Google Drive');
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('Error in listGsiDriveFiles:', error);
    throw error;
  }
}

/**
 * Sube un archivo a Google Drive (Multipart)
 */
export async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  content: Blob | string,
  contentType: string,
  description?: string
): Promise<DriveFileItem> {
  const folderId = await getOrCreateGsiFolder(accessToken);

  const metadata = {
    name: fileName,
    parents: [folderId],
    description: description || 'Archivo de flota vehicular GSI',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let mediaBlob: Blob;
  if (typeof content === 'string') {
    mediaBlob = new Blob([content], { type: contentType });
  } else {
    mediaBlob = content;
  }

  const metadataBlob = new Blob([JSON.stringify(metadata)], {
    type: 'application/json; charset=UTF-8',
  });

  const multipartBody = new Blob(
    [
      delimiter,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      metadataBlob,
      delimiter,
      `Content-Type: ${contentType}\r\n\r\n`,
      mediaBlob,
      closeDelimiter,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const uploadUrl =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink';

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Google Drive upload error:', errorText);
    throw new Error('Error al subir el archivo a Google Drive');
  }

  return res.json();
}

/**
 * Descarga el contenido de un archivo de Google Drive
 */
export async function downloadDriveFile(
  accessToken: string,
  fileId: string
): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('No se pudo descargar el archivo desde Google Drive');
  }

  return res.text();
}

/**
 * Elimina un archivo de Google Drive (Requisito: debe confirmarse por el usuario antes)
 */
export async function deleteDriveFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    throw new Error('No se pudo eliminar el archivo de Google Drive');
  }
}
