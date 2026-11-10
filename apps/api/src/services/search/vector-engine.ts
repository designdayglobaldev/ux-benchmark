import { prisma } from '../../db/prisma';
import type { RetrievedApp } from './types';

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || '';

export interface DenseSeedScreen {
  id: string;
  name: string;
  appName: string;
  similarity: number;
}

export class VectorEngine {
  /**
   * Embed query text using Voyage-3 (1024-dim dense vector)
   */
  public static async embedQuery(queryText: string): Promise<number[]> {
    if (!VOYAGE_API_KEY) {
      throw new Error('VOYAGE_API_KEY is not configured');
    }

    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'voyage-3',
        input: [queryText.trim()],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Voyage AI embedding error: ${err}`);
    }

    const data = await res.json();
    return data.data[0].embedding;
  }

  /**
   * Dense vector search on AppEmbedding
   */
  public static async searchApps(vectorJson: string, limit: number = 8): Promise<RetrievedApp[]> {
    try {
      const rows: any = await prisma.$queryRawUnsafe(
        `
        SELECT 
          a."id",
          a."name",
          a."slug",
          COALESCE(c."title", 'Finance & Banking') as "category",
          1 - (ae."embedding" <=> $1::vector) AS "similarity"
        FROM "AppEmbedding" ae
        JOIN "App" a ON ae."appId" = a."id"
        LEFT JOIN "Category" c ON a."categoryId" = c."id"
        ORDER BY ae."embedding" <=> $1::vector ASC
        LIMIT $2;
        `,
        vectorJson,
        limit
      );

      return (rows || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        category: a.category,
        similarity: Number(a.similarity) || 0,
      }));
    } catch (err) {
      console.warn('[VectorEngine.searchApps] Error:', err);
      return [];
    }
  }

  /**
   * Dense vector search on ScreenEmbedding to find initial anchor screens
   */
  public static async searchAnchorScreens(vectorJson: string, limit: number = 16): Promise<DenseSeedScreen[]> {
    try {
      const rows: any = await prisma.$queryRawUnsafe(
        `
        SELECT 
          s."id",
          s."name",
          a."name" as "appName",
          1 - (se."embedding" <=> $1::vector) AS "similarity"
        FROM "ScreenEmbedding" se
        JOIN "Screen" s ON se."screenId" = s."id"
        JOIN "App" a ON s."appId" = a."id"
        ORDER BY se."embedding" <=> $1::vector ASC
        LIMIT $2;
        `,
        vectorJson,
        limit
      );

      return (rows || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        appName: s.appName,
        similarity: Number(s.similarity) || 0,
      }));
    } catch (err) {
      console.warn('[VectorEngine.searchAnchorScreens] Error:', err);
      return [];
    }
  }
}

