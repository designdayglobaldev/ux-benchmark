import fs from 'fs';
import path from 'path';
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

async function evalRoutedSituationalFullIndex() {
  console.log('======================================================');
  console.log('SEPARATING INDEX SIZE FROM ROUTING EFFECT');
  console.log('21 Situational Queries against FULL 11,014 Index');
  console.log('Fields: WHERE_TO_USE and WHERE_NOT_TO_USE only');
  console.log('======================================================\n');

  const baselinePath = path.join(__dirname, '../../../../docs/arm_a_full_dev_baseline.json');
  const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const cachedSituational = baselineData.results.filter((r: any) => r.intent === 'situational' && r.ndcg10 !== null);

  const dsMap = new Map(UX_BENCH_V2_DATASET.map((q) => [q.id, q]));

  interface Row {
    id: string;
    query: string;
    armA_ndcg: number;
    score3k: number;
    score11k: number;
  }

  // Load previous 3,610 results for comparison
  const prevData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../scratch/situational_per_field_results.json'), 'utf8'));
  const prevMap = new Map(prevData.rows.map((r: any) => [r.id, r.perField_ndcg]));

  const rows: Row[] = [];

  for (let i = 0; i < cachedSituational.length; i++) {
    const r = cachedSituational[i];
    const qMeta = dsMap.get(r.id)!;
    const armA_ndcg = r.ndcg10 || 0;
    const score3k = prevMap.get(r.id) || 0;

    let score11k = armA_ndcg;
    let success = false;
    let attempts = 0;

    while (!success && attempts < 3) {
      attempts++;
      try {
        const [queryVector] = await ScreenFieldEmbeddingService.embedTexts([r.query]);

        // Search STRICTLY WHERE_TO_USE and WHERE_NOT_TO_USE across full index
        const fieldMatches = await ScreenFieldEmbeddingService.searchFields(queryVector, {
          fields: ['WHERE_TO_USE', 'WHERE_NOT_TO_USE'],
          limit: 20,
          minSimilarity: 0.35,
        });

        const flowScores = new Map<string, { appSlug: string; flowSlug: string; score: number }>();

        for (const f of r.firstStageCandidates || []) {
          const key = `${f.appSlug.toLowerCase()}:::${f.flowSlug.toLowerCase()}`;
          flowScores.set(key, {
            appSlug: f.appSlug,
            flowSlug: f.flowSlug,
            score: f.anchorSimilarity || 0.4,
          });
        }

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

        const ranked = Array.from(flowScores.values()).sort((a, b) => b.score - a.score);

        const targetMap = new Map<string, number>();
        for (const t of qMeta.targets) {
          targetMap.set(`${t.appSlug.toLowerCase()}:::${t.flowSlug.toLowerCase()}`, t.grade);
        }

        const rels = ranked.map((f) => {
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

        const dcg = calculateDCG(rels, 10);
        const idcg = qMeta.targets.length > 0 ? calculateIDCG(qMeta.targets, 10) : 0;
        score11k = idcg > 0 ? Math.min(1.0, dcg / idcg) : 0;
        success = true;
      } catch (err: any) {
        if (err.message?.includes('429')) {
          console.log(`  429 hit. Pausing 25s...`);
          await sleep(25000);
        } else {
          console.warn(`  Attempt ${attempts} error:`, err.message);
          await sleep(5000);
        }
      }
    }

    console.log(`[${i + 1}/${cachedSituational.length}] ${r.id}: Arm A=${armA_ndcg.toFixed(4)} | 3k Index=${score3k.toFixed(4)} | 11k Index=${score11k.toFixed(4)} (diff: ${(score11k - score3k >= 0 ? '+' : '')}${(score11k - score3k).toFixed(4)})`);

    rows.push({
      id: r.id,
      query: r.query,
      armA_ndcg,
      score3k,
      score11k,
    });

    if (i < cachedSituational.length - 1) {
      await sleep(22000);
    }
  }

  const meanArmA = rows.reduce((s, r) => s + r.armA_ndcg, 0) / rows.length;
  const mean3k = rows.reduce((s, r) => s + r.score3k, 0) / rows.length;
  const mean11k = rows.reduce((s, r) => s + r.score11k, 0) / rows.length;

  const deltas_11k_vs_ArmA = rows.map((r) => r.score11k - r.armA_ndcg);
  const [ciLow11k, ciHigh11k, pVal11k] = bootstrapPairDeltaCI(deltas_11k_vs_ArmA);

  const deltas_11k_vs_3k = rows.map((r) => r.score11k - r.score3k);
  const [ciLowDiff, ciHighDiff, pValDiff] = bootstrapPairDeltaCI(deltas_11k_vs_3k);

  console.log('\n======================================================');
  console.log('INDEX COMPARISON RESULTS (21 Situational Queries)');
  console.log('======================================================');
  console.log(`Arm A Baseline:                 ${meanArmA.toFixed(4)}`);
  console.log(`Routed (3,610 Gold Index):       ${mean3k.toFixed(4)} (Delta: +${(mean3k - meanArmA).toFixed(4)})`);
  console.log(`Routed (11,014 Full Index):      ${mean11k.toFixed(4)} (Delta: +${(mean11k - meanArmA).toFixed(4)})`);
  console.log(`  95% CI vs Arm A:              [${ciLow11k.toFixed(4)}, ${ciHigh11k.toFixed(4)}] (p=${pVal11k.toFixed(4)})`);
  console.log(`Difference (11k Full vs 3k Gold): ${(mean11k - mean3k >= 0 ? '+' : '')}${(mean11k - mean3k).toFixed(4)}`);
  console.log(`  95% CI (11k vs 3k):           [${ciLowDiff.toFixed(4)}, ${ciHighDiff.toFixed(4)}] (p=${pValDiff.toFixed(4)})`);
  console.log('======================================================');

  fs.writeFileSync(
    path.join(__dirname, '../../scratch/situational_11k_vs_3k.json'),
    JSON.stringify({ meanArmA, mean3k, mean11k, rows }, null, 2)
  );
}

evalRoutedSituationalFullIndex()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

