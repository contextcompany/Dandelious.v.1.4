import { getGoogleAccessToken, signInWithGoogleWorkspace } from './firebase';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
  isUnread?: boolean;
}

export interface ConnectedAppStatus {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  lastSynced?: string;
  accountEmail?: string;
}

/**
 * Ensures a valid access token is available.
 */
export async function getValidAccessToken(): Promise<string> {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Kein aktiver Context Workspace Zugriffstoken vorhanden. Bitte melde dich mit Google an.');
  }
  return token;
}

/**
 * Lists files from user's Google Drive.
 */
export async function listDriveFiles(queryParam = '', pageSize = 15): Promise<DriveFile[]> {
  const token = await getValidAccessToken();
  let url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink)&orderBy=modifiedTime desc`;
  
  if (queryParam) {
    url += `&q=${encodeURIComponent(queryParam)}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Context Drive Fehler: ${response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Creates a text file or note in Google Drive.
 */
export async function createDriveFile(name: string, content: string, mimeType = 'text/plain'): Promise<DriveFile> {
  const token = await getValidAccessToken();
  
  const metadata = {
    name,
    mimeType,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: mimeType }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Context Drive Upload-Fehler: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetches recent Gmail messages with subject, from, and snippet.
 */
export async function listGmailMessages(maxResults = 8): Promise<GmailMessage[]> {
  const token = await getValidAccessToken();
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;

  const response = await fetch(listUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gmail Fehler: ${response.statusText}`);
  }

  const data = await response.json();
  const messagesList = data.messages || [];

  const detailedMessages: GmailMessage[] = [];

  for (const m of messagesList) {
    try {
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        const headers = msgData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(Kein Betreff)';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unbekannt';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
        const isUnread = msgData.labelIds?.includes('UNREAD');

        detailedMessages.push({
          id: msgData.id,
          threadId: msgData.threadId,
          snippet: msgData.snippet,
          subject,
          from,
          date,
          isUnread
        });
      }
    } catch (e) {
      // Continue next message
    }
  }

  return detailedMessages;
}

/**
 * Sends an email via Gmail API with explicit user authorization.
 */
export async function sendGmailEmail(to: string, subject: string, bodyText: string): Promise<{ id: string }> {
  const token = await getValidAccessToken();

  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    bodyText
  ];
  const message = messageParts.join('\r\n');

  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gmail Sende-Fehler: ${response.statusText}`);
  }

  return await response.json();
}
