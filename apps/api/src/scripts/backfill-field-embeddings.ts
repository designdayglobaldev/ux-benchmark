import dotenv from 'dotenv';
import path from 'path';
import { prisma } from '../db/prisma';
import { ScreenFieldEmbeddingService, ScreenFieldType } from '../services/search/screen-field-embedding.service';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface FieldTarget {
  screenId: string;
  field: ScreenFieldType;
  text: string;
  hash: string;
}

function cleanHtml(str?: string | null): string {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

export async function backfillScreenFieldEmbeddings(options: {
  maxScreens?: number;
  benchmarkOnly?: boolean;
  batchSize?: number;
  delayMs?: number;
} = {}) {
  const batchSize = options.batchSize || 16;
  const delayMs = options.delayMs || 22000;
  const benchmarkOnly = options.benchmarkOnly ?? false;

  console.log('======================================================');
  console.log('SYNC SCREEN FIELD EMBEDDINGS (WHERE_TO_USE, WHERE_NOT_TO_USE, TONALITY)');
  console.log(`Model: ${ScreenFieldEmbeddingService.MODEL}`);
  console.log(`Batch Size: ${batchSize} | Cooldown: ${delayMs / 1000}s`);
  console.log(`Benchmark Only: ${benchmarkOnly}`);
  console.log('======================================================\n');

  let benchmarkScreenIds: Set<string> | null = null;
  if (benchmarkOnly) {
    const fs = await import('fs');
    const datasetPath = path.join(__dirname, '../../../../docs/UX_BENCH_V2_DATASET.json');
    const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    const devQueries = dataset.filter((q: any) => q.split === 'dev');
    const targetSlugs = new Set<string>();
    devQueries.forEach((q: any) => {
      (q.targets || []).forEach((t: any) => targetSlugs.add(`${t.appSlug}:${t.flowSlug}`));
    });

    const journeys = await prisma.screenJourney.findMany({
      where: {
        buildId: 'build-v1',
        journeySlug: { in: Array.from(targetSlugs) },
      },
      select: { screenId: true },
    });
    benchmarkScreenIds = new Set(journeys.map((j) => j.screenId));
    console.log(`Targeting ${benchmarkScreenIds.size} screens associated with dev benchmark gold journeys.`);
  }

  // 1. Fetch existing hashes to guarantee zero duplicate embedding calls
  const existingRows: any[] = await prisma.$queryRaw`
    SELECT "screenId", "field", "textHash" 
    FROM "ScreenFieldEmbedding"
    WHERE "model" = ${ScreenFieldEmbeddingService.MODEL};
  `;
  const existingMap = new Map<string, string>();
  for (const r of existingRows) {
    existingMap.set(`${r.screenId}:${r.field}`, r.textHash);
  }
  console.log(`Found ${existingMap.size} existing field embeddings in database.`);

  // 2. Query screens needing field embeddings
  const screenQueryWhere: any = {};
  if (benchmarkScreenIds) {
    screenQueryWhere.id = { in: Array.from(benchmarkScreenIds) };
  }

  const screens = await prisma.screen.findMany({
    where: screenQueryWhere,
    select: {
      id: true,
      whereToUse: true,
      whereNotToUse: true,
      tonalityAndContent: true,
    },
    take: options.maxScreens || undefined,
  });

  console.log(`Scanning ${screens.length} screens for missing/updated field embeddings...`);

  const pendingTargets: FieldTarget[] = [];
  for (const screen of screens) {
    const fieldsToCheck: Array<{ field: ScreenFieldType; text?: string | null }> = [
      { field: 'WHERE_TO_USE', text: screen.whereToUse },
      { field: 'WHERE_NOT_TO_USE', text: screen.whereNotToUse },
      { field: 'TONALITY', text: screen.tonalityAndContent },
    ];

    for (const item of fieldsToCheck) {
      if (!item.text || item.text.trim().length === 0) continue;
      const cleanText = cleanHtml(item.text);
      if (cleanText.length === 0) continue;
      const hash = ScreenFieldEmbeddingService.computeHash(cleanText);
      const key = `${screen.id}:${item.field}`;
      const existingHash = existingMap.get(key);

      if (existingHash !== hash) {
        pendingTargets.push({
          screenId: screen.id,
          field: item.field,
          text: cleanText,
          hash,
        });
      }
    }
  }

  console.log(`Pending field embeddings to process: ${pendingTargets.length}\n`);
  if (pendingTargets.length === 0) {
    console.log('✅ All target field embeddings are up to date! Nothing to process.');
    return;
  }

  let processedCount = 0;
  let batchIndex = 0;
  const totalBatches = Math.ceil(pendingTargets.length / batchSize);

  for (let i = 0; i < pendingTargets.length; i += batchSize) {
    batchIndex++;
    const batch = pendingTargets.slice(i, i + batchSize);
    console.log(`[Batch ${batchIndex}/${totalBatches}] Embedding ${batch.length} text fields...`);

    let success = false;
    let attempts = 0;

    while (!success && attempts < 5) {
      attempts++;
      try {
        const texts = batch.map((item) => `${item.field}: ${item.text}`);
        const embeddings = await ScreenFieldEmbeddingService.embedTexts(texts);

        // Upsert into database
        for (let j = 0; j < batch.length; j++) {
          const item = batch[j];
          const vectorJson = JSON.stringify(embeddings[j]);

          await prisma.$executeRaw`
            INSERT INTO "ScreenFieldEmbedding" (
              "id",
              "screenId",
              "field",
              "sourceText",
              "textHash",
              "model",
              "embedding",
              "updatedAt"
            ) VALUES (
              gen_random_uuid(),
              ${item.screenId},
              ${item.field},
              ${item.text},
              ${item.hash},
              ${ScreenFieldEmbeddingService.MODEL},
              ${vectorJson}::vector,
              NOW()
            )
            ON CONFLICT ("screenId", "field", "model")
            DO UPDATE SET
              "sourceText" = EXCLUDED."sourceText",
              "textHash" = EXCLUDED."textHash",
              "embedding" = EXCLUDED."embedding",
              "updatedAt" = NOW();
          `;
        }

        processedCount += batch.length;
        console.log(`  ✓ Successfully stored batch ${batchIndex}. Total processed: ${processedCount}/${pendingTargets.length}`);
        success = true;

        if (i + batchSize < pendingTargets.length) {
          console.log(`  Waiting ${delayMs / 1000}s cooldown to respect Voyage Free Tier (3 RPM / 10k TPM)...`);
          await sleep(delayMs);
        }
      } catch (err: any) {
        console.warn(`  [Batch ${batchIndex} - Attempt ${attempts}] Error:`, err.message);
        if (err.message.includes('429')) {
          console.warn('  Rate limit 429 hit. Backing off for 30s...');
          await sleep(30000);
        } else {
          await sleep(5000);
        }
      }
    }

    if (!success) {
      console.error(`  ❌ Failed batch ${batchIndex} after ${attempts} attempts. Aborting remaining run.`);
      break;
    }
  }

  console.log('\n======================================================');
  console.log(`Backfill run completed. Processed: ${processedCount}/${pendingTargets.length} field embeddings.`);
  console.log('======================================================');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const benchmarkOnly = args.includes('--benchmark-only');
  const maxScreensArg = args.find((a) => a.startsWith('--max='));
  const maxScreens = maxScreensArg ? parseInt(maxScreensArg.split('=')[1], 10) : undefined;

  backfillScreenFieldEmbeddings({
    benchmarkOnly,
    maxScreens,
  })
    .catch((err) => {
      console.error('Fatal error in backfill script:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
