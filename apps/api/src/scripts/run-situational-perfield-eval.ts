import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { ScreenFieldEmbeddingService } from '../services/search/screen-field-embedding.service';
import { UX_BENCH_V2_DATASET } from '../benchmark/ux-bench-v2.dataset';
import { calculateDCG, calculateIDCG } from '../benchmark/ux-bench-runner';
import { prisma } from '../db/prisma';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function bootstrapPairDeltaCI(deltas: number[], iterations: number = 10000, alpha: number = 0.05): [number, number, number] {
  const n = deltas.length;
  const means: number[] = new Array(iterations);
  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      const idx = Math.floor(Math.random() * n);
      sum += deltas[idx];
    }
    means[i] = sum / n;
  }
  means.sort((a, b) => a - b);
  const lower = Math.floor((alpha / 2) * iterations);
  const upper = Math.floor((1 - alpha / 2) * iterations);
  const pVal = means.filter((m) => m <= 0).length / iterations;
  return [means[lower], means[upper], pVal];
}

async function evalSituational() {
  console.log('======================================================');
  console.log('EVALUATING PER-FIELD EMBEDDINGS (21 SITUATIONAL DEV QUERIES)');
  console.log('Rate Limit Safety: 22s pause between Voyage API calls (3 RPM ceiling)');
  console.log('======================================================\n');

  const baselinePath = path.join(__dirname, '../../scratch/arm_a_full_dev_baseline.json');
  const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const cachedSituational = baselineData.results.filter((r: any) => r.intent === 'situational' && r.ndcg10 !== null);

  const dsMap = new Map(UX_BENCH_V2_DATASET.map((q) => [q.id, q]));
  console.log(`Evaluating ${cachedSituational.length} situational queries...\n`);

  interface EvalRow {
    id: string;
    query: string;
    armA_ndcg: number;
    perField_ndcg: number;
    delta: number;
    topMatches: string[];
  }

  const rows: EvalRow[] = [];

  for (let i = 0; i < cachedSituational.length; i++) {
    const r = cachedSituational[i];
    const qMeta = dsMap.get(r.id)!;
    const oldScore = r.ndcg10 || 0;

    console.log(`[${i + 1}/${cachedSituational.length}] Query ${r.id}: "${r.query.slice(0, 55)}..."`);

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
          limit: 20,
          minSimilarity: 0.35,
        });

        // 3. Score candidate flows
        const flowScores = new Map<string, { appSlug: string; flowSlug: string; score: number }>();

        // Incorporate initial dense candidate flows as base
        for (const f of r.firstStageCandidates || []) {
          const key = `${f.appSlug.toLowerCase()}:::${f.flowSlug.toLowerCase()}`;
          flowScores.set(key, {
            appSlug: f.appSlug,
            flowSlug: f.flowSlug,
            score: f.anchorSimilarity || 0.4,
          });
        }

        // Elevate flows matching per-field situational embeddings
        for (const fm of fieldMatches) {
          if (!fm.screen?.flowId) continue;
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
            });
          }
        }

        // Rank flows
        const ranked = Array.from(flowScores.values()).sort((a, b) => b.score - a.score);
        topMatches = ranked.slice(0, 3).map((f) => `${f.appSlug}:${f.flowSlug}`);

        // Compute nDCG with standard fuzzy target matching
        const targetMap = new Map<string, number>();
        for (const t of qMeta.targets) {
          targetMap.set(`${t.appSlug.toLowerCase()}:::${t.flowSlug.toLowerCase()}`, t.grade);
        }

        const retrievedRel = ranked.map((f) => {
          const key = `${f.appSlug.toLowerCase()}:::${f.flowSlug.toLowerCase()}`;
          let g = targetMap.get(key) || 0;
          if (g === 0) {
            for (const [tKey, tGrade] of targetMap.entries()) {
              const [tApp, tFlow] = tKey.split(':::');
              if (f.appSlug.toLowerCase() === tApp && f.flowSlug.toLowerCase().includes(tFlow)) {
                g = Math.max(g, tGrade);
              }
            }
          }
          return g;
        });

        const dcg = calculateDCG(retrievedRel, 10);
        const idcg = qMeta.targets.length > 0 ? calculateIDCG(qMeta.targets, 10) : 0;
        newScore = idcg > 0 ? Math.min(1.0, dcg / idcg) : 0;

        success = true;
      } catch (err: any) {
        console.warn(`  Attempt ${attempts} error:`, err.message);
        if (err.message?.includes('429')) {
          console.log('  Rate limit hit. Waiting 25s...');
          await sleep(25000);
        } else {
          await sleep(5000);
        }
      }
    }

    const delta = newScore - oldScore;
    const diffSign = delta >= 0 ? '+' : '';
    console.log(`  -> Arm A Baseline: ${oldScore.toFixed(4)} | Per-Field: ${newScore.toFixed(4)} (${diffSign}${delta.toFixed(4)})`);
    console.log(`  -> Top candidates: ${topMatches.join(', ')}\n`);

    rows.push({
      id: r.id,
      query: r.query,
      armA_ndcg: oldScore,
      perField_ndcg: newScore,
      delta,
      topMatches,
    });

    if (i < cachedSituational.length - 1) {
      await sleep(22000);
    }
  }

  const meanBaseline = rows.reduce((s, r) => s + r.armA_ndcg, 0) / rows.length;
  const meanPerField = rows.reduce((s, r) => s + r.perField_ndcg, 0) / rows.length;
  const deltas = rows.map((r) => r.delta);
  const [ciLow, ciHigh, pVal] = bootstrapPairDeltaCI(deltas);

  console.log('======================================================');
  console.log('PER-FIELD SITUATIONAL EVALUATION COMPLETED');
  console.log('======================================================');
  console.log(`Arm A Baseline Mean nDCG@10 (n=21):   ${meanBaseline.toFixed(4)}`);
  console.log(`Per-Field Embeddings Mean nDCG@10:    ${meanPerField.toFixed(4)}`);
  console.log(`Paired Mean Delta:                    ${(meanPerField - meanBaseline >= 0 ? '+' : '')}${(meanPerField - meanBaseline).toFixed(4)}`);
  console.log(`95% Bootstrap Confidence Interval:    [${ciLow.toFixed(4)}, ${ciHigh.toFixed(4)}]`);
  console.log(`Empirical p-value (p <= 0):           ${pVal.toFixed(4)}`);
  console.log('======================================================');

  fs.writeFileSync(
    path.join(__dirname, '../../scratch/situational_per_field_results.json'),
    JSON.stringify({ meanBaseline, meanPerField, meanDelta: meanPerField - meanBaseline, ciLow, ciHigh, pVal, rows }, null, 2)
  );
}

evalSituational()
  .catch((err) => {
    console.error('Fatal evaluation error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

