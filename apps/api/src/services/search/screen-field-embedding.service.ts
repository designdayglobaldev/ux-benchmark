import crypto from 'crypto';
import { prisma } from '../../db/prisma';

const getVoyageApiKey = () => process.env.VOYAGE_API_KEY || '';

export type ScreenFieldType = 'WHERE_TO_USE' | 'WHERE_NOT_TO_USE' | 'TONALITY';

export interface FieldEmbeddingCandidate {
  screenId: string;
  field: ScreenFieldType;
  sourceText: string;
  similarity: number;
}

export class ScreenFieldEmbeddingService {
  public static readonly MODEL = 'voyage-multimodal-3';
  public static readonly SUPPORTED_FIELDS: ScreenFieldType[] = [
    'WHERE_TO_USE',
    'WHERE_NOT_TO_USE',
    'TONALITY',
  ];

  /**
   * Computes a SHA-256 hash of the trimmed text for idempotency.
   */
  public static computeHash(text: string): string {
    return crypto.createHash('sha256').update(text.trim()).digest('hex');
  }

  /**
   * Calls Voyage AI multimodal embeddings API for text-only inputs.
   * Keeps inputs safely under 16,000 characters per item.
   */
  public static async embedTexts(texts: string[]): Promise<number[][]> {
    const apiKey = getVoyageApiKey();
    if (!apiKey) {
      throw new Error('VOYAGE_API_KEY is not configured in environment');
    }
    if (texts.length === 0) return [];

    const inputs = texts.map((t) => ({
      content: [{ type: 'text', text: t.trim().slice(0, 16000) }],
    }));

    const res = await fetch('https://api.voyageai.com/v1/multimodalembeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.MODEL,
        inputs,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Voyage AI field embedding error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data.data.map((item: any) => item.embedding);
  }

  /**
   * Searches for screens matching a query embedding against specific field types
   * using cosine similarity (<=> operator on vector).
   */
  public static async searchFields(
    queryVector: number[],
    options: {
      fields?: ScreenFieldType[];
      limit?: number;
      minSimilarity?: number;
    } = {}
  ): Promise<FieldEmbeddingCandidate[]> {
    const fields = options.fields || ['WHERE_TO_USE', 'WHERE_NOT_TO_USE'];
    const limit = options.limit || 30;
    const minSim = options.minSimilarity ?? 0.3;
    const vectorJson = JSON.stringify(queryVector);

    const rows: any[] = await prisma.$queryRaw`
      SELECT 
        sfe."screenId",
        sfe."field",
        sfe."sourceText",
        1 - (sfe."embedding" <=> ${vectorJson}::vector) AS similarity
      FROM "ScreenFieldEmbedding" sfe
      WHERE sfe."field" = ANY(${fields}::text[])
        AND sfe."model" = ${this.MODEL}
        AND (1 - (sfe."embedding" <=> ${vectorJson}::vector)) >= ${minSim}
      ORDER BY sfe."embedding" <=> ${vectorJson}::vector ASC
      LIMIT ${limit};
    `;

    return rows.map((r) => ({
      screenId: String(r.screenId),
      field: r.field as ScreenFieldType,
      sourceText: r.sourceText || '',
      similarity: Number(r.similarity),
    }));
  }
}

