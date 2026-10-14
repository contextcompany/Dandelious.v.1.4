// src/lib/cloudSqlService.ts
import { auth } from './firebase';

export const IS_CLOUDSQL_ENABLED = false;

export interface CloudSqlUserProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  tier: string;
  diceCubeUnlocked: string[];
  preferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CloudSqlChatSession {
  id: number;
  userId: string;
  title: string;
  model: string;
  systemInstruction?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CloudSqlChatMessage {
  id: number;
  sessionId: number;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokensInput: number;
  tokensOutput: number;
  latencyMs: number;
  model?: string;
  createdAt: string;
}

export interface CloudSqlRagDocument {
  id: number;
  userId: string;
  title: string;
  sourceType: string;
  rawContent: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CloudSqlAiGeneration {
  id: number;
  userId: string;
  prompt: string;
  codeSnippet: string;
  language: string;
  model: string;
  executionStatus: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CloudSqlTelemetryStats {
  totalTokens: number;
  totalEvents: number;
  recentLogs: Array<{
    id: number;
    eventType: string;
    level: string;
    tokenCount: number;
    details: Record<string, any>;
    createdAt: string;
  }>;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (!IS_CLOUDSQL_ENABLED) return {};
  const user = auth.currentUser;
  if (!user) return {};
  try {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch (err) {
    console.warn('Failed to acquire ID token for Cloud SQL API:', err);
    return {};
  }
}

// 1. User Profile & Preferences
export async function syncUserProfile(displayName?: string, photoUrl?: string): Promise<CloudSqlUserProfile | null> {
  if (!IS_CLOUDSQL_ENABLED) return null;
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) return null;

    const res = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ displayName, photoUrl }),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Cloud SQL profile sync warning:', e);
    return null;
  }
}

export async function fetchUserProfile(): Promise<CloudSqlUserProfile | null> {
  if (!IS_CLOUDSQL_ENABLED) return null;
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) return null;

    const res = await fetch('/api/user/profile', { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Cloud SQL fetch user profile warning:', e);
    return null;
  }
}

export async function saveUserPreferencesToSql(preferences: Record<string, any>, diceCubeUnlocked?: string[]): Promise<boolean> {
  if (!IS_CLOUDSQL_ENABLED) return false;
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) return false;

    const res = await fetch('/api/user/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ preferences, diceCubeUnlocked }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Cloud SQL preferences save warning:', e);
    return false;
  }
}

// 2. Chat Sessions & History in PostgreSQL
export async function fetchSqlChatSessions(): Promise<CloudSqlChatSession[]> {
  if (!IS_CLOUDSQL_ENABLED) return [];
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) return [];

    const res = await fetch('/api/chat/sessions', { headers });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.warn('Cloud SQL fetch chat sessions warning:', e);
    return [];
  }
}

export async function createSqlChatSession(title: string, model: string, systemInstruction?: string): Promise<CloudSqlChatSession | null> {
  if (!IS_CLOUDSQL_ENABLED) return null;
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) return null;

    const res = await fetch('/api/chat/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ title, model, systemInstruction }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Cloud SQL create chat session warning:', e);
    return null;
  }
}


export async function saveSqlChatMessage(
  sessionId: number,
  role: 'user' | 'assistant' | 'system',
  content: string,
  tokensInput = 0,
  tokensOutput = 0,
  latencyMs = 0,
  model?: string
): Promise<CloudSqlChatMessage | null> {
  if (!IS_CLOUDSQL_ENABLED) return null;
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) return null;

    const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        role,
        content,
        tokensInput,
        tokensOutput,
        latencyMs,
        model,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Cloud SQL save chat message warning:', e);
    return null;
  }
}

// 3. AI Generations & Dice Snippet Repository
export async function saveSqlAiGeneration(
  prompt: string,
  codeSnippet: string,
  language = 'html',
  model = 'dice-coder-enterprise',
  executionStatus = 'success',
  metadata: Record<string, any> = {}
): Promise<CloudSqlAiGeneration | null> {
  if (!IS_CLOUDSQL_ENABLED) return null;
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) return null;

    const res = await fetch('/api/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        prompt,
        codeSnippet,
        language,
        model,
        executionStatus,
        metadata,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Cloud SQL save AI generation warning:', e);
    return null;
  }
}

export async function fetchSqlAiGenerations(): Promise<CloudSqlAiGeneration[]> {
  if (!IS_CLOUDSQL_ENABLED) return [];
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) return [];

    const res = await fetch('/api/generations', { headers });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.warn('Cloud SQL fetch AI generations warning:', e);
    return [];
  }
}

// 4. Long-Term Memory & RAG Knowledge Base
export async function addSqlRagDocument(
  title: string,
  rawContent: string,
  sourceType = 'text',
  metadata: Record<string, any> = {}
): Promise<CloudSqlRagDocument | null> {
  if (!IS_CLOUDSQL_ENABLED) return null;
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) return null;

    const res = await fetch('/api/rag/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        title,
        rawContent,
        sourceType,
        metadata,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Cloud SQL add RAG document warning:', e);
    return null;
  }
}

export async function fetchSqlRagDocuments(): Promise<CloudSqlRagDocument[]> {
  if (!IS_CLOUDSQL_ENABLED) return [];
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) return [];

    const res = await fetch('/api/rag/documents', { headers });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.warn('Cloud SQL fetch RAG documents warning:', e);
    return [];
  }
}

export async function deleteSqlRagDocument(docId: number): Promise<boolean> {
  if (!IS_CLOUDSQL_ENABLED) return false;
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) return false;

    const res = await fetch(`/api/rag/documents/${docId}`, {
      method: 'DELETE',
      headers,
    });
    return res.ok;
  } catch (e) {
    console.warn('Cloud SQL delete RAG document warning:', e);
    return false;
  }
}

export async function querySqlRagMemory(query: string, limit = 4): Promise<Array<{
  id: number;
  documentId: number;
  chunkContent: string;
  chunkIndex: number;
  docTitle: string;
  sourceType: string;
  similarityScore: number;
}>> {
  if (!IS_CLOUDSQL_ENABLED) return [];
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) return [];

    const res = await fetch('/api/rag/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ query, limit }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.warn('Cloud SQL query RAG memory warning:', e);
    return [];
  }
}

// 5. Telemetry & Token Stats
export async function fetchSqlTelemetry(): Promise<CloudSqlTelemetryStats | null> {
  if (!IS_CLOUDSQL_ENABLED) return null;
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) return null;

    const res = await fetch('/api/telemetry/stats', { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Cloud SQL fetch telemetry stats warning:', e);
    return null;
  }
}

