import { getGoogleAccessToken, auth } from './firebase';

export interface ConnectedAccountInfo {
  pluginId: string;
  connected: boolean;
  userEmail?: string;
  userName?: string;
  connectedAt?: number;
  token?: string;
}

const STORAGE_CONNECTED_PLUGINS_KEY = 'saphire_connected_plugins_v1';

export const getConnectedPluginsState = (): Record<string, ConnectedAccountInfo> => {
  try {
    const raw = localStorage.getItem(STORAGE_CONNECTED_PLUGINS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const saveConnectedPluginState = (pluginId: string, info: ConnectedAccountInfo) => {
  try {
    const current = getConnectedPluginsState();
    current[pluginId] = info;
    localStorage.setItem(STORAGE_CONNECTED_PLUGINS_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to save plugin state:', e);
  }
};

export const removeConnectedPluginState = (pluginId: string) => {
  try {
    const current = getConnectedPluginsState();
    delete current[pluginId];
    localStorage.setItem(STORAGE_CONNECTED_PLUGINS_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to remove plugin state:', e);
  }
};

// Helper to check if Google Token is valid
export const isGooglePluginConnected = (pluginId: string): boolean => {
  const token = getGoogleAccessToken();
  const state = getConnectedPluginsState()[pluginId];
  return !!(token || (auth.currentUser && state?.connected));
};

// ==================== GOOGLE SHEETS API ====================
export interface SpreadsheetItem {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export const fetchUserSpreadsheets = async (): Promise<SpreadsheetItem[]> => {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Konto ist nicht verbunden. Bitte verbinde zuerst dein Google-Konto in den Plugins.');
  }

  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&pageSize=10`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Drive API Fehler (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
};

export const fetchSpreadsheetData = async (spreadsheetId: string, range = 'A1:Z100') => {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Konto nicht verbunden.');
  }

  const res = await fetch(`https://www.googleapis.com/sheets/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Sheets API Fehler (${res.status})`);
  }

  return await res.json();
};

export const createGoogleSpreadsheet = async (title: string, headers: string[] = [], initialRows: string[][] = []) => {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Konto nicht verbunden.');
  }

  const values = headers.length > 0 ? [headers, ...initialRows] : initialRows;

  const body: any = {
    properties: { title }
  };

  if (values.length > 0) {
    body.sheets = [
      {
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: values.map(row => ({
              values: row.map(val => ({ userEnteredValue: { stringValue: val } }))
            }))
          }
        ]
      }
    ];
  }

  const res = await fetch('https://www.googleapis.com/sheets/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Sheets Erstellung fehlgeschlagen (${res.status})`);
  }

  return await res.json();
};

// ==================== GOOGLE CALENDAR API ====================
export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  location?: string;
}

export const fetchUpcomingCalendarEvents = async (maxResults = 10): Promise<CalendarEventItem[]> => {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Konto nicht verbunden. Bitte verbinde zuerst dein Google-Konto.');
  }

  const now = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&maxResults=${maxResults}&orderBy=startTime&singleEvents=true`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Calendar API Fehler (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
};

export const createCalendarEvent = async (event: {
  summary: string;
  description?: string;
  location?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
}): Promise<CalendarEventItem> => {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Konto nicht verbunden.');
  }

  const body = {
    summary: event.summary,
    description: event.description || '',
    location: event.location || '',
    start: { dateTime: event.startTime },
    end: { dateTime: event.endTime }
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Termin Erstellung fehlgeschlagen (${res.status})`);
  }

  return await res.json();
};

export const deleteCalendarEvent = async (eventId: string): Promise<boolean> => {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Konto nicht verbunden.');
  }

  const confirmed = window.confirm(`Möchtest du diesen Kalendereintrag wirklich löschen?`);
  if (!confirmed) return false;

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.ok;
};

// ==================== GMAIL API ====================
export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export const fetchRecentGmailMessages = async (maxResults = 5): Promise<GmailMessageSummary[]> => {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Konto nicht verbunden. Bitte verbinde zuerst dein Google-Konto.');
  }

  const res = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gmail API Fehler (${res.status})`);
  }

  const data = await res.json();
  const messages: GmailMessageSummary[] = [];

  if (data.messages && Array.isArray(data.messages)) {
    for (const msg of data.messages) {
      try {
        const detailRes = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(Kein Betreff)';
          const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
          const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

          messages.push({
            id: msg.id,
            threadId: msg.threadId,
            snippet: detail.snippet || '',
            subject,
            from,
            date
          });
        }
      } catch (e) {
        console.warn('Error fetching message details:', e);
      }
    }
  }

  return messages;
};

// ==================== GITHUB API ====================
export interface GitHubRepoItem {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string;
}

export const fetchGitHubRepos = async (token?: string): Promise<GitHubRepoItem[]> => {
  const state = getConnectedPluginsState()['github'];
  const githubToken = token || state?.token;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json'
  };
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  const endpoint = githubToken ? 'https://api.github.com/user/repos?sort=updated&per_page=10' : 'https://api.github.com/orgs/octocat/repos';

  const res = await fetch(endpoint, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API Fehler (${res.status})`);
  }

  return await res.json();
};

// ==================== GOOGLE MAPS API ====================
export interface GoogleMapsPlaceSearchResult {
  query: string;
  places: Array<{
    name: string;
    address: string;
    rating: number;
    lat: number;
    lng: number;
    category: string;
  }>;
}

export const fetchGoogleMapsPlaceSearch = async (query: string): Promise<GoogleMapsPlaceSearchResult> => {
  return {
    query,
    places: [
      { name: `${query} Point A`, address: 'Zentrum, 80331 München', rating: 4.8, lat: 48.1374, lng: 11.5755, category: 'Highlight' },
      { name: `${query} Point B`, address: 'Schwabing, 80802 München', rating: 4.6, lat: 48.1582, lng: 11.5836, category: 'Empfehlung' }
    ]
  };
};

export interface OneDriveFileItem {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  webUrl: string;
}

export const fetchOneDriveFiles = async (token?: string): Promise<OneDriveFileItem[]> => {
  const state = getConnectedPluginsState()['onedrive'];
  const msToken = token || state?.token;

  if (!msToken) {
    // Return sample OneDrive items if offline mode
    return [
      { id: '1', name: 'Projektplan_2026.docx', size: 452000, lastModifiedDateTime: new Date().toISOString(), webUrl: '#' },
      { id: '2', name: 'Quarterly_Budget.xlsx', size: 1280000, lastModifiedDateTime: new Date().toISOString(), webUrl: '#' },
      { id: '3', name: 'Kunden_Praesentation.pptx', size: 3400000, lastModifiedDateTime: new Date().toISOString(), webUrl: '#' }
    ];
  }

  const res = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children', {
    headers: { Authorization: `Bearer ${msToken}` }
  });

  if (!res.ok) {
    throw new Error(`OneDrive API Fehler (${res.status})`);
  }

  const data = await res.json();
  return data.value || [];
};
