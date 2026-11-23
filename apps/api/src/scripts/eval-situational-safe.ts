import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { ScreenFieldEmbeddingService } from '../services/search/screen-field-embedding.service';
import { RerankEngine } from '../services/search/rerank-engine';
import { UX_BENCH_V2_DATASET } from '../benchmark/ux-bench-v2.dataset';
import { calculateDCG, calculateIDCG } from '../benchmark/ux-bench-runner';
import { prisma } from '../db/prisma';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function evalSituationalSafe() {
  console.log('======================================================');
  console.log('EVALUATING GATE 1 (SITUATIONAL ScreenFieldEmbedding ROUTE)');
  console.log('Using 22s rate-limit cooldown to respect Voyage Free Tier (3 RPM)');
  console.log('======================================================\n');

  const baselinePath = path.join(__dirname, '../../scratch/arm_a_full_dev_baseline.json');
  const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const cachedSituational = baselineData.results.filter((r: any) => r.intent === 'situational' && r.ndcg10 !== null);

  const dsMap = new Map(UX_BENCH_V2_DATASET.map((q) => [q.id, q]));
  console.log(`Evaluating ${cachedSituational.length} situational queries with exact rate-limit spacing...\n`);

  interface EvalRow {
    id: string;
    query: string;
    armA_ndcg: number;
    gate1_ndcg: number;
    diff: number;
    topMatches: string[];
  }

  const rows: EvalRow[] = [];

  for (let i = 0; i < cachedSituational.length; i++) {
    const r = cachedSituational[i];
    const qMeta = dsMap.get(r.id)!;
    const oldScore = r.ndcg10 || 0;

    console.log(`[${i + 1}/${cachedSituational.length}] Query: "${r.query.slice(0, 50)}..."`);

    let newScore = 0;
    let topMatches: string[] = [];

    let success = false;
    let attempts = 0;

    while (!success && attempts < 3) {
      attempts++;
      try {
        // 1. Embed query (1 call to Voyage multimodal embedding)
        const [queryVector] = await ScreenFieldEmbeddingService.embedTexts([r.query]);

        // 2. Search situational fields
        const fieldMatches = await ScreenFieldEmbeddingService.searchFields(queryVector, {
          fields: ['WHERE_TO_USE', 'WHERE_NOT_TO_USE'],
          limit: 15,
          minSimilarity: 0.35,
        });

        // 3. Group by (appSlug, flowSlug)
        const flowScores = new Map<string, { appSlug: string; flowSlug: string; score: number; bestSnippet: string }>();

        // Incorporate existing candidate flows as baseline candidates
        for (const f of r.firstStageCandidates || []) {
          const key = `${f.appSlug.toLowerCase()}:::${f.flowSlug.toLowerCase()}`;
          flowScores.set(key, {
            appSlug: f.appSlug,
            flowSlug: f.flowSlug,
            score: f.anchorSimilarity || 0.4,
            bestSnippet: f.description || '',
          });
        }

        // Add / elevate flows matching situational field embeddings
        for (const fm of fieldMatches) {
          if (!fm.screen?.flowId) continue;
          // Look up flow and app slug for this screen
          const screenWithMeta = await prisma.screen.findUnique({
            where: { id: fm.screenId },
            include: { app: true, flow: true },
          });

          if (screenWithMeta?.app?.slug && screenWithMeta?.flow?.slug) {
            const key = `${screenWithMeta.app.slug.toLowerCase()}:::${screenWithMeta.flow.slug.toLowerCase()}`;
            const existing = flowScores.get(key);
            const boostedScore = (existing?.score || 0.4) + fm.similarity * 0.5;
            flowScores.set(key, {
              appSlug: screenWithMeta.app.slug,
              flowSlug: screenWithMeta.flow.slug,
              score: boostedScore,
              bestSnippet: fm.sourceText.slice(0, 200),
            });
          }
        }

        // Rank flows
        const ranked = Array.from(flowScores.values()).sort((a, b) => b.score - a.score);
        topMatches = ranked.slice(0, 3).map((f) => `${f.appSlug}:${f.flowSlug}`);

        // Compute nDCG
        const targetMap = new Map<string, number>();
        for (const t of qMeta.targets) {
          targetMap.set(`${t.appSlug.toLowerCase()}:::${t.flowSlug.toLowerCase()}`, t.grade);
        }

        const retrievedRel = ranked.map((f) => {
          const key = `${f.appSlug.toLowerCase()}:::${f.flowSlug.toLowerCase()}`;
          return targetMap.get(key) || 0;
        });

        const idealRel = qMeta.targets.map((t) => t.grade).sort((a, b) => b - a);
        const dcg = calculateDCG(retrievedRel);
        const idcg = calculateIDCG(idealRel);
        newScore = idcg > 0 ? dcg / idcg : 0;

        success = true;
      } catch (err: any) {
        console.warn(`  Attempt ${attempts} error:`, err.message);
        if (err.message.includes('429')) {
          console.log('  Rate limit hit. Waiting 25s...');
          await sleep(25000);
        } else {
          await sleep(5000);
        }
      }
    }

    const diff = newScore - oldScore;
    const diffSign = diff >= 0 ? '+' : '';
    console.log(`  -> Baseline: ${oldScore.toFixed(4)} | Gate 1: ${newScore.toFixed(4)} (${diffSign}${diff.toFixed(4)})`);
    console.log(`  -> Top matches: ${topMatches.join(', ')}\n`);

    rows.push({
      id: r.id,
      query: r.query,
      armA_ndcg: oldScore,
      gate1_ndcg: newScore,
      diff,
      topMatches,
    });

    // 22-second cooldown to stay strictly under 3 RPM free tier
    if (i < cachedSituational.length - 1) {
      await sleep(22000);
    }
  }

  const meanOld = rows.reduce((s, r) => s + r.armA_ndcg, 0) / rows.length;
  const meanNew = rows.reduce((s, r) => s + r.gate1_ndcg, 0) / rows.length;
  const netDiff = meanNew - meanOld;

  console.log('======================================================');
  console.log('GATE 1 SITUATIONAL EVALUATION COMPLETED');
  console.log('======================================================');
  console.log(`Baseline Arm A Situational Mean nDCG: ${meanOld.toFixed(4)}`);
  console.log(`Gate 1 Multi-Vector Situational Mean: ${meanNew.toFixed(4)}`);
  console.log(`Net Improvement:                      ${netDiff >= 0 ? '+' : ''}${netDiff.toFixed(4)}`);
  console.log('======================================================');

  fs.writeFileSync(
    path.join(__dirname, '../../scratch/situational_gate1_safe_results.json'),
    JSON.stringify({ meanOld, meanNew, netDiff, rows }, null, 2)
  );
}

evalSituationalSafe()
  .catch((err) => {
    console.error('Fatal evaluation error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

