import { pgTable, serial, text, timestamp, integer, jsonb, customType, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Custom pgvector type for 768-dimensional embeddings (Gemini embedding-004 / text-embedding)
export const vector768 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(768)';
  },
  toDriver(value: number[]): string {
    if (!value || !Array.isArray(value)) return '[]';
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    if (!value) return [];
    try {
      if (value.startsWith('[') && value.endsWith(']')) {
        return JSON.parse(value);
      }
      return value.replace(/[\[\]]/g, '').split(',').map(Number);
    } catch {
      return [];
    }
  },
});

// -------------------------------------------------------------
// 1. Users & Profiles (Nutzer- & Anwendungsdaten)
// -------------------------------------------------------------
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  tier: text('tier').default('Nautilus Enterprise'),
  diceCubeUnlocked: text('dice_cube_unlocked').array(),
  preferences: jsonb('preferences').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// -------------------------------------------------------------
// 2. Chat Sessions & Messages (Chat-Historie, Prompts, Tokens)
// -------------------------------------------------------------
export const chatSessions = pgTable('chat_sessions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // References Firebase UID
  title: text('title').notNull().default('Neuer Chat'),
  model: text('model').notNull().default('dice-coder-enterprise'),
  systemInstruction: text('system_instruction'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('chat_sessions_user_idx').on(table.userId),
]);

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => chatSessions.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  tokensInput: integer('tokens_input').default(0),
  tokensOutput: integer('tokens_output').default(0),
  latencyMs: integer('latency_ms').default(0),
  model: text('model'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('chat_messages_session_idx').on(table.sessionId),
  index('chat_messages_user_idx').on(table.userId),
]);

// -------------------------------------------------------------
// 3. System Logs & Telemetry (Logs & Token-Verbrauch)
// -------------------------------------------------------------
export const systemLogs = pgTable('system_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  eventType: text('event_type').notNull(), // 'chat_completion' | 'code_generation' | 'auth_login' | 'rag_query'
  level: text('level').notNull().default('info'), // 'info' | 'warn' | 'error'
  details: jsonb('details').default({}),
  tokenCount: integer('token_count').default(0),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('system_logs_user_idx').on(table.userId),
  index('system_logs_event_idx').on(table.eventType),
]);

// -------------------------------------------------------------
// 4. Long-Term Memory & RAG (Embeddings für Dokumente & Wissen)
// -------------------------------------------------------------
export const knowledgeDocuments = pgTable('knowledge_documents', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  sourceType: text('source_type').notNull().default('text'), // 'file' | 'text' | 'url' | 'code'
  rawContent: text('raw_content').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('knowledge_docs_user_idx').on(table.userId),
]);

export const knowledgeChunks = pgTable('knowledge_chunks', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => knowledgeDocuments.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  chunkIndex: integer('chunk_index').notNull().default(0),
  chunkContent: text('chunk_content').notNull(),
  embedding: vector768('embedding'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('knowledge_chunks_doc_idx').on(table.documentId),
  index('knowledge_chunks_user_idx').on(table.userId),
]);

// -------------------------------------------------------------
// 5. AI Generation Results & Artifacts
// -------------------------------------------------------------
export const aiGenerations = pgTable('ai_generations', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  prompt: text('prompt').notNull(),
  codeSnippet: text('code_snippet').notNull(),
  language: text('language').notNull().default('html'),
  model: text('model').notNull().default('dice-coder-enterprise'),
  executionStatus: text('execution_status').default('success'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('ai_generations_user_idx').on(table.userId),
]);

// -------------------------------------------------------------
// Relations
// -------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  chatSessions: many(chatSessions),
  knowledgeDocuments: many(knowledgeDocuments),
  aiGenerations: many(aiGenerations),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.uid],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));

export const knowledgeDocumentsRelations = relations(knowledgeDocuments, ({ one, many }) => ({
  user: one(users, {
    fields: [knowledgeDocuments.userId],
    references: [users.uid],
  }),
  chunks: many(knowledgeChunks),
}));

export const knowledgeChunksRelations = relations(knowledgeChunks, ({ one }) => ({
  document: one(knowledgeDocuments, {
    fields: [knowledgeChunks.documentId],
    references: [knowledgeDocuments.id],
  }),
}));
