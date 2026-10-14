// src/db/chatHistory.ts
import { db, isCloudSqlEnabled } from './index.ts';
import { chatSessions, chatMessages, systemLogs, aiGenerations } from './schema.ts';
import { eq, desc, and, sql } from 'drizzle-orm';

export async function createChatSession(userId: string, title?: string, model?: string, systemInstruction?: string) {
  if (!isCloudSqlEnabled || !db) {
    return {
      id: Date.now(),
      userId,
      title: title || 'Neuer Chat',
      model: model || 'dice-coder-enterprise',
      systemInstruction: systemInstruction || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  try {
    const result = await db.insert(chatSessions)
      .values({
        userId,
        title: title || 'Neuer Chat',
        model: model || 'dice-coder-enterprise',
        systemInstruction: systemInstruction || null,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.warn('Database query bypassed in createChatSession:', error);
    return null;
  }
}

export async function getChatSessions(userId: string) {
  if (!isCloudSqlEnabled || !db) {
    return [];
  }
  try {
    return await db.select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));
  } catch (error) {
    console.warn('Database query bypassed in getChatSessions:', error);
    return [];
  }
}

export async function getChatSessionById(sessionId: number, userId: string) {
  if (!isCloudSqlEnabled || !db) {
    return null;
  }
  try {
    const session = await db.select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .limit(1);

    if (!session.length) return null;

    const messages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);

    return {
      session: session[0],
      messages,
    };
  } catch (error) {
    console.warn('Database query bypassed in getChatSessionById:', error);
    return null;
  }
}

export async function deleteChatSession(sessionId: number, userId: string) {
  if (!isCloudSqlEnabled || !db) {
    return { success: true };
  }
  try {
    await db.delete(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));
    return { success: true };
  } catch (error) {
    console.warn('Database query bypassed in deleteChatSession:', error);
    return { success: true };
  }
}

export async function addChatMessage(
  sessionId: number,
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  tokensInput = 0,
  tokensOutput = 0,
  latencyMs = 0,
  model?: string
) {
  if (!isCloudSqlEnabled || !db) {
    return {
      id: Date.now(),
      sessionId,
      userId,
      role,
      content,
      tokensInput,
      tokensOutput,
      latencyMs,
      model: model || null,
      createdAt: new Date().toISOString()
    };
  }
  try {
    const result = await db.insert(chatMessages)
      .values({
        sessionId,
        userId,
        role,
        content,
        tokensInput,
        tokensOutput,
        latencyMs,
        model: model || null,
      })
      .returning();

    await db.update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));

    return result[0];
  } catch (error) {
    console.warn('Database query bypassed in addChatMessage:', error);
    return null;
  }
}

export async function logSystemEvent(
  userId: string | null,
  eventType: string,
  details: Record<string, any> = {},
  tokenCount = 0,
  level: 'info' | 'warn' | 'error' = 'info',
  ipAddress?: string
) {
  if (!isCloudSqlEnabled || !db) {
    return null;
  }
  try {
    const result = await db.insert(systemLogs)
      .values({
        userId,
        eventType,
        details,
        tokenCount,
        level,
        ipAddress: ipAddress || null,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.warn('Failed to insert system log into Cloud SQL:', error);
    return null;
  }
}

export async function getTelemetryStats(userId: string) {
  if (!isCloudSqlEnabled || !db) {
    return {
      totalTokens: 0,
      totalEvents: 0,
      recentLogs: []
    };
  }
  try {
    const [totalTokensRes] = await db.select({
      totalTokens: sql<number>`coalesce(sum(${systemLogs.tokenCount}), 0)`,
      totalEvents: sql<number>`count(*)`,
    })
      .from(systemLogs)
      .where(eq(systemLogs.userId, userId));

    const recentLogs = await db.select()
      .from(systemLogs)
      .where(eq(systemLogs.userId, userId))
      .orderBy(desc(systemLogs.createdAt))
      .limit(20);

    return {
      totalTokens: Number(totalTokensRes?.totalTokens || 0),
      totalEvents: Number(totalTokensRes?.totalEvents || 0),
      recentLogs,
    };
  } catch (error) {
    console.warn('Database query bypassed in getTelemetryStats:', error);
    return {
      totalTokens: 0,
      totalEvents: 0,
      recentLogs: []
    };
  }
}

export async function saveAiGeneration(
  userId: string,
  prompt: string,
  codeSnippet: string,
  language = 'html',
  model = 'dice-coder-enterprise',
  executionStatus = 'success',
  metadata: Record<string, any> = {}
) {
  if (!isCloudSqlEnabled || !db) {
    return {
      id: Date.now(),
      userId,
      prompt,
      codeSnippet,
      language,
      model,
      executionStatus,
      metadata,
      createdAt: new Date().toISOString()
    };
  }
  try {
    const result = await db.insert(aiGenerations)
      .values({
        userId,
        prompt,
        codeSnippet,
        language,
        model,
        executionStatus,
        metadata,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.warn('Database query bypassed in saveAiGeneration:', error);
    return null;
  }
}

export async function getAiGenerations(userId: string, limit = 30) {
  if (!isCloudSqlEnabled || !db) {
    return [];
  }
  try {
    return await db.select()
      .from(aiGenerations)
      .where(eq(aiGenerations.userId, userId))
      .orderBy(desc(aiGenerations.createdAt))
      .limit(limit);
  } catch (error) {
    console.warn('Database query bypassed in getAiGenerations:', error);
    return [];
  }
}

