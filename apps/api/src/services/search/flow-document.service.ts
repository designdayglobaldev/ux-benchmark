import crypto from 'crypto';
import { prisma } from '../../db/prisma';

const getVoyageApiKey = () => process.env.VOYAGE_API_KEY || '';

export interface FlowCandidate {
  flowId: string;
  flowName: string;
  flowSlug: string;
  appName: string;
  appSlug: string;
  summaryText: string;
  similarity: number;
}

export interface GenerateFlowDocumentOptions {
  promptVersion?: string;
  forceRebuild?: boolean;
}

export class FlowDocumentService {
  public static readonly MODEL = 'voyage-multimodal-3';
  public static readonly DEFAULT_PROMPT_VERSION = 'concat-v1-2000';

  /**
   * Generates the deterministic summary text for a flow (Arm B-concat).
   * Combines flow metadata with constituent journey step names, UI components,
   * and aggregated whereToUse / whereNotToUse guidelines.
   */
  public static buildSummaryText(flow: {
    name: string;
    description?: string | null;
    appFlows?: Array<{ app?: { name: string; slug: string } | null }>;
    screens: Array<{
      id: string;
      name: string;
      screenNo?: number | null;
      uxAnalysis?: string | null;
      keyHighlights?: string | null;
      whereToUse?: string | null;
      whereNotToUse?: string | null;
      uiElements?: Array<{ title: string }>;
      patterns?: Array<{ title: string }>;
    }>;
  }): string {
    const appName = flow.appFlows?.[0]?.app?.name || 'App';
    const descriptionPart = flow.description?.trim() ? `Description: ${flow.description.trim()}\n` : '';

    const sortedScreens = flow.screens.sort((a, b) => (a.screenNo ?? 0) - (b.screenNo ?? 0));
    
    // Sample representative steps (first 5, middle 2, last 3) if flow is very long
    const representativeScreens = sortedScreens.length > 10 
      ? [
          ...sortedScreens.slice(0, 5),
          ...sortedScreens.slice(Math.floor(sortedScreens.length / 2) - 1, Math.floor(sortedScreens.length / 2) + 1),
          ...sortedScreens.slice(-3)
        ]
      : sortedScreens;

    const screenSteps = representativeScreens
      .map((s, idx) => {
        const stepNum = s.screenNo ?? idx + 1;
        const details: string[] = [];

        if (s.uiElements && s.uiElements.length > 0) {
          const uiTitles = s.uiElements.map((e) => e.title).filter(Boolean).slice(0, 3);
          if (uiTitles.length > 0) {
            details.push(`UI: ${uiTitles.join(', ')}`);
          }
        }

        const detailString = details.length > 0 ? ` (${details.join(' | ')})` : '';
        return `- Step ${stepNum}: ${s.name}${detailString}`;
      })
      .join('\n');

    // Aggregate unique whereToUse and whereNotToUse rationale across the flow
    const whereToUseSet = new Set<string>();
    const whereNotToUseSet = new Set<string>();

    for (const s of sortedScreens) {
      if (s.whereToUse?.trim() && whereToUseSet.size < 3) {
        whereToUseSet.add(s.whereToUse.trim().slice(0, 140));
      }
      if (s.whereNotToUse?.trim() && whereNotToUseSet.size < 2) {
        whereNotToUseSet.add(s.whereNotToUse.trim().slice(0, 140));
      }
    }

    const whereToUseSection = whereToUseSet.size > 0 
      ? `\nWhere To Use:\n${Array.from(whereToUseSet).map(w => `• ${w}`).join('\n')}` 
      : '';
    const whereNotToUseSection = whereNotToUseSet.size > 0 
      ? `\nWhere NOT To Use:\n${Array.from(whereNotToUseSet).map(w => `• ${w}`).join('\n')}` 
      : '';

    const fullDoc = `App: ${appName}\nFlow: ${flow.name} (${sortedScreens.length} screens)\n${descriptionPart}\nScreen Journey:\n${screenSteps}${whereToUseSection}${whereNotToUseSection}`.trim();
    return fullDoc.slice(0, 2000);
  }

  /**
   * Computes a deterministic SHA-256 hash of the flow's constituent screens and summary text.
   */
  public static computeSourceHash(flow: {
    id: string;
    updatedAt?: Date;
    description?: string | null;
    screens: Array<{ id: string; updatedAt?: Date }>;
  }, summaryText: string): string {
    const screenSignatures = flow.screens.map((s) => `${s.id}:${s.updatedAt?.getTime() || 0}`).join(';');
    const raw = `${flow.id}:${flow.description || ''}:${screenSignatures}:${summaryText}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Calls Voyage AI to embed a batch of texts using voyage-multimodal-3 (1024-d).
   */
  public static async embedTextsBatch(texts: string[]): Promise<number[][]> {
    const apiKey = getVoyageApiKey();
    if (!apiKey) {
      throw new Error('VOYAGE_API_KEY is not configured');
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
      throw new Error(`Voyage AI embedding error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data.data.map((item: any) => item.embedding);
  }

  /**
   * Syncs and generates FlowDocument records for all flows that have active screens.
   */
  public static async syncAllFlowDocuments(options: GenerateFlowDocumentOptions = {}): Promise<{
    processed: number;
    created: number;
    skipped: number;
    failed: number;
  }> {
    const promptVersion = options.promptVersion || this.DEFAULT_PROMPT_VERSION;
    const forceRebuild = options.forceRebuild || false;

    // Fetch all flows with screens
    const flows = await prisma.flow.findMany({
      where: {
        screens: { some: {} },
      },
      include: {
        appFlows: {
          include: {
            app: {
              select: { name: true, slug: true },
            },
          },
        },
        screens: {
          orderBy: { screenNo: 'asc' },
          select: {
            id: true,
            name: true,
            screenNo: true,
            uxAnalysis: true,
            keyHighlights: true,
            whereToUse: true,
            whereNotToUse: true,
            updatedAt: true,
            uiElements: { select: { title: true } },
            patterns: { select: { title: true } },
          },
        },
        flowDocuments: {
          where: { promptVersion },
        },
      },
    });

    console.log(`[FlowDocumentService] Found ${flows.length} flows with screens.`);

    const toEmbed: Array<{
      flowId: string;
      summaryText: string;
      sourceHash: string;
    }> = [];

    let skipped = 0;

    for (const flow of flows) {
      const summaryText = this.buildSummaryText(flow);
      const sourceHash = this.computeSourceHash(flow, summaryText);

      const existing = flow.flowDocuments[0];
      if (!forceRebuild && existing && existing.sourceHash === sourceHash && existing.status === 'READY') {
        skipped++;
        continue;
      }

      toEmbed.push({
        flowId: flow.id,
        summaryText,
        sourceHash,
      });
    }

    console.log(`[FlowDocumentService] Need to embed ${toEmbed.length} flows (${skipped} already up to date).`);

    let created = 0;
    let failed = 0;

    // Voyage Free Tier has strict limits: 3 RPM (Requests Per Minute) and 10K TPM (Tokens Per Minute).
    // Using batch size of 4 ensures token volume remains comfortably under 10k TPM.
    const BATCH_SIZE = 4;
    for (let i = 0; i < toEmbed.length; i += BATCH_SIZE) {
      const batch = toEmbed.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(toEmbed.length / BATCH_SIZE);
      console.log(`[FlowDocumentService] Embedding batch ${batchIndex}/${totalBatches} (size: ${batch.length})...`);

      let success = false;
      let attempt = 0;
      let embeddings: number[][] = [];

      while (!success && attempt < 10) {
        attempt++;
        try {
          embeddings = await this.embedTextsBatch(batch.map((b) => b.summaryText));
          success = true;
        } catch (err: any) {
          if (err.message.includes('429')) {
            console.warn(`[FlowDocumentService] Hit 429 rate limit on attempt ${attempt}. Waiting 30s before retry...`);
            await new Promise((r) => setTimeout(r, 30000));
          } else {
            console.error(`[FlowDocumentService] Non-rate-limit error on attempt ${attempt}:`, err.message);
            break;
          }
        }
      }

      if (success) {
        for (let j = 0; j < batch.length; j++) {
          const item = batch[j];
          const embedding = embeddings[j];
          const vectorStr = `[${embedding.join(',')}]`;

          // First deactivate any previous active versions for this flow to satisfy FlowDocument_one_active
          await prisma.$executeRawUnsafe(
            `UPDATE "FlowDocument" SET "isActive" = false WHERE "flowId" = $1 AND "promptVersion" != $2;`,
            item.flowId,
            promptVersion
          );

          // Upsert using raw query for the pgvector column
          await prisma.$executeRawUnsafe(
            `
            INSERT INTO "FlowDocument" (
              "id", "flowId", "promptVersion", "summaryText", "sourceHash", "modelVersion", "status", "isActive", "embedding", "updatedAt"
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $4, $5, 'READY', true, $6::vector, NOW()
            )
            ON CONFLICT ("flowId", "promptVersion") DO UPDATE SET
              "summaryText" = EXCLUDED."summaryText",
              "sourceHash" = EXCLUDED."sourceHash",
              "modelVersion" = EXCLUDED."modelVersion",
              "status" = 'READY',
              "isActive" = true,
              "embedding" = EXCLUDED."embedding",
              "updatedAt" = NOW();
            `,
            item.flowId,
            promptVersion,
            item.summaryText,
            item.sourceHash,
            this.MODEL,
            vectorStr
          );
          created++;
        }
        console.log(`[FlowDocumentService] Batch ${batchIndex}/${totalBatches} persisted successfully (${created}/${toEmbed.length}).`);
      } else {
        console.error(`[FlowDocumentService] Batch ${batchIndex}/${totalBatches} failed after ${attempt} attempts.`);
        failed += batch.length;
      }

      // Respect Voyage 3 RPM limit (22-second cooldown between API calls)
      if (i + BATCH_SIZE < toEmbed.length) {
        console.log('[FlowDocumentService] Waiting 22s cooldown for Voyage 3 RPM limit...');
        await new Promise((r) => setTimeout(r, 22000));
      }
    }

    return {
      processed: flows.length,
      created,
      skipped,
      failed,
    };
  }

  /**
   * Dense vector search on FlowDocument (Hierarchical Level-1 Retrieval / Arm B)
   */
  public static async searchFlowDocuments(
    vectorJson: string,
    limit: number = 20,
    promptVersion: string = this.DEFAULT_PROMPT_VERSION
  ): Promise<FlowCandidate[]> {
    try {
      const rows: any = await prisma.$queryRawUnsafe(
        `
        SELECT 
          f."id" as "flowId",
          f."name" as "flowName",
          f."slug" as "flowSlug",
          COALESCE(a."name", 'Unknown') as "appName",
          COALESCE(a."slug", 'unknown') as "appSlug",
          fd."summaryText",
          1 - (fd."embedding" <=> $1::vector) AS "similarity"
        FROM "FlowDocument" fd
        JOIN "Flow" f ON fd."flowId" = f."id"
        LEFT JOIN "AppFlow" af ON f."id" = af."flowId"
        LEFT JOIN "App" a ON af."appId" = a."id"
        WHERE fd."isActive" = true 
          AND fd."status" = 'READY'
          AND fd."promptVersion" = $3
          AND fd."embedding" IS NOT NULL
        ORDER BY fd."embedding" <=> $1::vector ASC
        LIMIT $2;
        `,
        vectorJson,
        limit,
        promptVersion
      );

      return (rows || []).map((r: any) => ({
        flowId: r.flowId,
        flowName: r.flowName,
        flowSlug: r.flowSlug,
        appName: r.appName,
        appSlug: r.appSlug,
        summaryText: r.summaryText,
        similarity: Number(r.similarity) || 0,
      }));
    } catch (err) {
      console.error('[FlowDocumentService] searchFlowDocuments query error:', err);
      return [];
    }
  }
}
