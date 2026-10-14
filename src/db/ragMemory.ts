// src/db/ragMemory.ts
import { db, isCloudSqlEnabled } from './index.ts';
import { knowledgeDocuments, knowledgeChunks } from './schema.ts';
import { eq, desc, and, sql } from 'drizzle-orm';

export async function addKnowledgeDocument(
  userId: string,
  title: string,
  rawContent: string,
  sourceType = 'text',
  metadata: Record<string, any> = {}
) {
  if (!isCloudSqlEnabled || !db) {
    return {
      id: Date.now(),
      userId,
      title,
      sourceType,
      rawContent,
      metadata,
      createdAt: new Date().toISOString()
    };
  }
  try {
    const docResult = await db.insert(knowledgeDocuments)
      .values({
        userId,
        title,
        sourceType,
        rawContent,
        metadata,
      })
      .returning();

    const document = docResult[0];

    // Split document into chunks (~500 chars with overlap)
    const chunks = splitIntoChunks(rawContent, 500, 100);

    for (let i = 0; i < chunks.length; i++) {
      await db.insert(knowledgeChunks)
        .values({
          documentId: document.id,
          userId,
          chunkIndex: i,
          chunkContent: chunks[i],
          metadata: { ...metadata, chunkIndex: i },
        });
    }

    return document;
  } catch (error) {
    console.warn('Database query bypassed in addKnowledgeDocument:', error);
    return null;
  }
}

export async function saveChunkEmbedding(chunkId: number, embeddingVector: number[]) {
  if (!isCloudSqlEnabled || !db) return;
  try {
    const vectorStr = `[${embeddingVector.join(',')}]`;
    await db.execute(
      sql`UPDATE knowledge_chunks SET embedding = ${vectorStr}::vector WHERE id = ${chunkId}`
    );
  } catch (error) {
    console.warn('Failed to save chunk embedding:', error);
  }
}

export async function searchKnowledgeChunks(
  userId: string,
  queryVector?: number[],
  queryText?: string,
  limit = 5
) {
  if (!isCloudSqlEnabled || !db) {
    return [];
  }
  try {
    if (queryVector && queryVector.length > 0) {
      const vectorStr = `[${queryVector.join(',')}]`;
      const result = await db.execute(
        sql`
          SELECT 
            kc.id,
            kc.document_id as "documentId",
            kc.chunk_content as "chunkContent",
            kc.chunk_index as "chunkIndex",
            kd.title as "docTitle",
            kd.source_type as "sourceType",
            1 - (kc.embedding <=> ${vectorStr}::vector) as "similarityScore"
          FROM knowledge_chunks kc
          JOIN knowledge_documents kd ON kc.document_id = kd.id
          WHERE kc.user_id = ${userId} AND kc.embedding IS NOT NULL
          ORDER BY kc.embedding <=> ${vectorStr}::vector ASC
          LIMIT ${limit}
        `
      );

      return result.rows || [];
    }

    if (queryText) {
      const searchPattern = `%${queryText}%`;
      const result = await db.execute(
        sql`
          SELECT 
            kc.id,
            kc.document_id as "documentId",
            kc.chunk_content as "chunkContent",
            kc.chunk_index as "chunkIndex",
            kd.title as "docTitle",
            kd.source_type as "sourceType",
            0.85 as "similarityScore"
          FROM knowledge_chunks kc
          JOIN knowledge_documents kd ON kc.document_id = kd.id
          WHERE kc.user_id = ${userId} AND (kc.chunk_content ILIKE ${searchPattern} OR kd.title ILIKE ${searchPattern})
          LIMIT ${limit}
        `
      );
      return result.rows || [];
    }

    return [];
  } catch (error) {
    console.warn('Database query bypassed in searchKnowledgeChunks:', error);
    return [];
  }
}

export async function getKnowledgeDocuments(userId: string) {
  if (!isCloudSqlEnabled || !db) {
    return [];
  }
  try {
    return await db.select()
      .from(knowledgeDocuments)
      .where(eq(knowledgeDocuments.userId, userId))
      .orderBy(desc(knowledgeDocuments.createdAt));
  } catch (error) {
    console.warn('Database query bypassed in getKnowledgeDocuments:', error);
    return [];
  }
}

export async function deleteKnowledgeDocument(documentId: number, userId: string) {
  if (!isCloudSqlEnabled || !db) {
    return { success: true };
  }
  try {
    await db.delete(knowledgeDocuments)
      .where(and(eq(knowledgeDocuments.id, documentId), eq(knowledgeDocuments.userId, userId)));
    return { success: true };
  } catch (error) {
    console.warn('Database query bypassed in deleteKnowledgeDocument:', error);
    return { success: true };
  }
}

function splitIntoChunks(text: string, chunkSize = 500, overlap = 100): string[] {
  if (!text || text.length <= chunkSize) return [text || ''];
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(chunk.trim());
    i += (chunkSize - overlap);
  }
  return chunks;
}

