import fs from 'fs';
import path from 'path';
import { ScreenFieldEmbeddingService } from '../services/search/screen-field-embedding.service';
import { UX_BENCH_V2_DATASET } from '../benchmark/ux-bench-v2.dataset';
import { calculateDCG, calculateIDCG } from '../benchmark/ux-bench-runner';
import { prisma } from '../db/prisma';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function bootstrap(deltas: number[], iters = 10000): [number, number, number] {
  const n = deltas.length;
  const means: number[] = new Array(iters);
  for (let i = 0; i < iters; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += deltas[Math.floor(Math.random() * n)];
    }
    means[i] = sum / n;
  }
  means.sort((a, b) => a - b);
  const lower = Math.floor(0.025 * iters);
  const upper = Math.floor(0.975 * iters);
  const pVal = means.filter((m) => m <= 0).length / iters;
  return [means[lower], means[upper], pVal];
}

async function evalFusionVariants() {
  console.log('================================================================');
  console.log('EVALUATING FUSION VARIANTS ACROSS ALL 77 DEV QUERIES (FULL 11k INDEX)');
  console.log('Comparing against Gate 1 Target: Arm A0 (0.4410)');
  console.log('================================================================\n');

  const baselinePath = path.join(__dirname, '../../../../docs/arm_a_full_dev_baseline.json');
  const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const devQueries = baselineData.results.filter((r: any) => r.ndcg10 !== null);

  const dsMap = new Map(UX_BENCH_V2_DATASET.map((q) => [q.id, q]));

  interface QueryScoreRow {
    id: string;
    intent: string;
    armA0: number;
    armA: number;
    v1_rerankOnly: number; // Re-order dense candidates only, 0 added flows
    v2_top3FieldHits: number; // Allow at most top 3 field hits to add flows
    v3_lowWeight: number; // Weighted fusion with w = 0.20
    v4_currentUnrouted: number; // w = 0.50 (current unrouted 0.4410)
  }

  const rows: QueryScoreRow[] = [];

  for (let i = 0; i < devQueries.length; i++) {
    const r = devQueries[i];
    const qMeta = dsMap.get(r.id)!;

    const targetMap = new Map<string, number>();
    for (const t of qMeta.targets) {
      targetMap.set(`${t.appSlug.toLowerCase()}:::${t.flowSlug.toLowerCase()}`, t.grade);
    }

    const calcNdcg = (orderedCandidates: any[]) => {
      const rels: number[] = [];
      for (let cIdx = 0; cIdx < orderedCandidates.length; cIdx++) {
        const f = orderedCandidates[cIdx];
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
        rels.push(g);
      }
      const dcg = calculateDCG(rels, 10);
      const idcg = qMeta.targets.length > 0 ? calculateIDCG(qMeta.targets, 10) : 0;
      return idcg > 0 ? Math.min(1.0, dcg / idcg) : 0;
    };

    // Dense stage (Arm A0)
    const sortedDense = [...(r.firstStageCandidates || [])].sort((a: any, b: any) => b.anchorSimilarity - a.anchorSimilarity);
    const armA0_ndcg = calcNdcg(sortedDense);
    const armA_ndcg = calcNdcg(r.retrievedFlows || []);

    let v1_rerankOnly = armA0_ndcg;
    let v2_top3FieldHits = armA0_ndcg;
    let v3_lowWeight = armA0_ndcg;
    let v4_currentUnrouted = armA0_ndcg;

    let success = false;
    let attempts = 0;

    while (!success && attempts < 3) {
      attempts++;
      try {
        const [queryVector] = await ScreenFieldEmbeddingService.embedTexts([r.query]);

        const fieldMatches = await ScreenFieldEmbeddingService.searchFields(queryVector, {
          fields: ['WHERE_TO_USE', 'WHERE_NOT_TO_USE'],
          limit: 20,
          minSimilarity: 0.35,
        });

        // Resolve screen metadata
        const resolvedMatches: { appSlug: string; flowSlug: string; similarity: number }[] = [];
        for (const fm of fieldMatches) {
          if (!fm.screen?.flowId) continue;
          const s = await prisma.screen.findUnique({
            where: { id: fm.screenId },
            include: { app: true, flow: true },
          });
          if (s?.app?.slug && s?.flow?.slug) {
            resolvedMatches.push({
              appSlug: s.app.slug,
              flowSlug: s.flow.slug,
              similarity: fm.similarity,
            });
          }
        }

        // ==========================================
        // VARIANT 1: Rerank-Only (Zero Candidate Addition)
        // Strictly boost only candidate flows already in firstStageCandidates
        // ==========================================
        const v1Scores = new Map<string, { appSlug: string; flowSlug: string; score: number }>();
        for (const f of r.firstStageCandidates || []) {
          const key = `${f.appSlug.toLowerCase()}:::${f.flowSlug.toLowerCase()}`;
          v1Scores.set(key, { appSlug: f.appSlug, flowSlug: f.flowSlug, score: f.anchorSimilarity || 0.4 });
        }
        for (const rm of resolvedMatches) {
          const key = `${rm.appSlug.toLowerCase()}:::${rm.flowSlug.toLowerCase()}`;
          const existing = v1Scores.get(key);
          if (existing) {
            // Apply boost ONLY to existing candidates
            v1Scores.set(key, { ...existing, score: existing.score + rm.similarity * 0.3 });
          }
        }
        const v1Ranked = Array.from(v1Scores.values()).sort((a, b) => b.score - a.score);
        v1_rerankOnly = calcNdcg(v1Ranked);

        // ==========================================
        // VARIANT 2: Top-3 Field Hits Capped
        // At most 3 distinct new flows from field search allowed into pool
        // ==========================================
        const v2Scores = new Map<string, { appSlug: string; flowSlug: string; score: number }>();
        for (const f of r.firstStageCandidates || []) {
          const key = `${f.appSlug.toLowerCase()}:::${f.flowSlug.toLowerCase()}`;
          v2Scores.set(key, { appSlug: f.appSlug, flowSlug: f.flowSlug, score: f.anchorSimilarity || 0.4 });
        }
        let addedNewCount = 0;
        for (const rm of resolvedMatches) {
          const key = `${rm.appSlug.toLowerCase()}:::${rm.flowSlug.toLowerCase()}`;
          const existing = v2Scores.get(key);
          if (existing) {
            v2Scores.set(key, { ...existing, score: existing.score + rm.similarity * 0.3 });
          } else if (addedNewCount < 3) {
            v2Scores.set(key, { appSlug: rm.appSlug, flowSlug: rm.flowSlug, score: 0.4 + rm.similarity * 0.3 });
            addedNewCount++;
          }
        }
        const v2Ranked = Array.from(v2Scores.values()).sort((a, b) => b.score - a.score);
        v2_top3FieldHits = calcNdcg(v2Ranked);

        // ==========================================
        // VARIANT 3: Low-Weight Fusion (w = 0.20)
        // All field matches allowed, but weighted gently (0.20 instead of 0.50)
        // ==========================================
        const v3Scores = new Map<string, { appSlug: string; flowSlug: string; score: number }>();
        for (const f of r.firstStageCandidates || []) {
          const key = `${f.appSlug.toLowerCase()}:::${f.flowSlug.toLowerCase()}`;
          v3Scores.set(key, { appSlug: f.appSlug, flowSlug: f.flowSlug, score: f.anchorSimilarity || 0.4 });
        }
        for (const rm of resolvedMatches) {
          const key = `${rm.appSlug.toLowerCase()}:::${rm.flowSlug.toLowerCase()}`;
          const existing = v3Scores.get(key);
          const score = (existing?.score || 0.4) + rm.similarity * 0.20;
          v3Scores.set(key, { appSlug: rm.appSlug, flowSlug: rm.flowSlug, score });
        }
        const v3Ranked = Array.from(v3Scores.values()).sort((a, b) => b.score - a.score);
        v3_lowWeight = calcNdcg(v3Ranked);

        // ==========================================
        // VARIANT 4: Current Unrouted (w = 0.50)
        // ==========================================
        const v4Scores = new Map<string, { appSlug: string; flowSlug: string; score: number }>();
        for (const f of r.firstStageCandidates || []) {
          const key = `${f.appSlug.toLowerCase()}:::${f.flowSlug.toLowerCase()}`;
          v4Scores.set(key, { appSlug: f.appSlug, flowSlug: f.flowSlug, score: f.anchorSimilarity || 0.4 });
        }
        for (const rm of resolvedMatches) {
          const key = `${rm.appSlug.toLowerCase()}:::${rm.flowSlug.toLowerCase()}`;
          const existing = v4Scores.get(key);
          const score = (existing?.score || 0.4) + rm.similarity * 0.50;
          v4Scores.set(key, { appSlug: rm.appSlug, flowSlug: rm.flowSlug, score });
        }
        const v4Ranked = Array.from(v4Scores.values()).sort((a, b) => b.score - a.score);
        v4_currentUnrouted = calcNdcg(v4Ranked);

        success = true;
      } catch (err: any) {
        if (err.message?.includes('429')) {
          console.log(`  429 rate limit hit. Waiting 25s...`);
          await sleep(25000);
        } else {
          console.warn(`  Attempt ${attempts} error:`, err.message);
          await sleep(5000);
        }
      }
    }

    console.log(`[${i + 1}/${devQueries.length}] ${r.id} (${r.intent}): A0=${armA0_ndcg.toFixed(3)} | V1(RerankOnly)=${v1_rerankOnly.toFixed(3)} | V2(Top3)=${v2_top3FieldHits.toFixed(3)} | V3(w=0.2)=${v3_lowWeight.toFixed(3)} | V4(w=0.5)=${v4_currentUnrouted.toFixed(3)}`);

    rows.push({
      id: r.id,
      intent: r.intent,
      armA0: armA0_ndcg,
      armA: armA_ndcg,
      v1_rerankOnly,
      v2_top3FieldHits,
      v3_lowWeight,
      v4_currentUnrouted,
    });

    if (i < devQueries.length - 1) {
      await sleep(22000);
    }
  }

  // Summary and bootstrap calculation
  console.log('\n================================================================');
  console.log('SUMMARY SCOREBOARD OF OFFLINE FUSION VARIANTS (vs Arm A0 = 0.4410)');
  console.log('================================================================');

  const meanA0 = rows.reduce((s, r) => s + r.armA0, 0) / rows.length;
  const meanA = rows.reduce((s, r) => s + r.armA, 0) / rows.length;
  const meanV1 = rows.reduce((s, r) => s + r.v1_rerankOnly, 0) / rows.length;
  const meanV2 = rows.reduce((s, r) => s + r.v2_top3FieldHits, 0) / rows.length;
  const meanV3 = rows.reduce((s, r) => s + r.v3_lowWeight, 0) / rows.length;
  const meanV4 = rows.reduce((s, r) => s + r.v4_currentUnrouted, 0) / rows.length;

  const [ciLowV1, ciHighV1, pV1] = bootstrap(rows.map((r) => r.v1_rerankOnly - r.armA0));
  const [ciLowV2, ciHighV2, pV2] = bootstrap(rows.map((r) => r.v2_top3FieldHits - r.armA0));
  const [ciLowV3, ciHighV3, pV3] = bootstrap(rows.map((r) => r.v3_lowWeight - r.armA0));
  const [ciLowV4, ciHighV4, pV4] = bootstrap(rows.map((r) => r.v4_currentUnrouted - r.armA0));

  console.log(`Baseline Arm A0 (Dense Only):                     ${meanA0.toFixed(4)}`);
  console.log(`Variant 1 (Rerank-Only / Zero Addition):           ${meanV1.toFixed(4)} (Delta: ${(meanV1 - meanA0 >= 0 ? '+' : '')}${(meanV1 - meanA0).toFixed(4)}, CI: [${ciLowV1.toFixed(4)}, ${ciHighV1.toFixed(4)}], p=${pV1.toFixed(4)})`);
  console.log(`Variant 2 (Capped Top-3 New Candidate Injections):  ${meanV2.toFixed(4)} (Delta: ${(meanV2 - meanA0 >= 0 ? '+' : '')}${(meanV2 - meanA0).toFixed(4)}, CI: [${ciLowV2.toFixed(4)}, ${ciHighV2.toFixed(4)}], p=${pV2.toFixed(4)})`);
  console.log(`Variant 3 (Low-Weight w=0.20 Fusion):              ${meanV3.toFixed(4)} (Delta: ${(meanV3 - meanA0 >= 0 ? '+' : '')}${(meanV3 - meanA0).toFixed(4)}, CI: [${ciLowV3.toFixed(4)}, ${ciHighV3.toFixed(4)}], p=${pV3.toFixed(4)})`);
  console.log(`Variant 4 (Current Unrouted w=0.50):               ${meanV4.toFixed(4)} (Delta: ${(meanV4 - meanA0 >= 0 ? '+' : '')}${(meanV4 - meanA0).toFixed(4)}, CI: [${ciLowV4.toFixed(4)}, ${ciHighV4.toFixed(4)}], p=${pV4.toFixed(4)})`);

  console.log('\n--- Breakdown by Intent for Variant 1 (Rerank-Only) vs Arm A0 ---');
  for (const intent of ['flow', 'compare', 'component', 'situational']) {
    const subset = rows.filter((r) => r.intent === intent);
    const mA0 = subset.reduce((s, r) => s + r.armA0, 0) / subset.length;
    const mV1 = subset.reduce((s, r) => s + r.v1_rerankOnly, 0) / subset.length;
    const [l, h, p] = bootstrap(subset.map((r) => r.v1_rerankOnly - r.armA0));
    console.log(`  ${intent.toUpperCase()} (n=${subset.length}): A0=${mA0.toFixed(4)} | V1=${mV1.toFixed(4)} | Delta=${(mV1 - mA0 >= 0 ? '+' : '')}${(mV1 - mA0).toFixed(4)} [CI: ${l.toFixed(4)}, ${h.toFixed(4)}] (p=${p.toFixed(4)})`);
  }

  fs.writeFileSync(
    path.join(__dirname, '../../scratch/fusion_variants_scoreboard.json'),
    JSON.stringify({ meanA0, meanV1, meanV2, meanV3, meanV4, rows }, null, 2)
  );
}

evalFusionVariants()
  .catch((err) => {
    console.error('Fatal error in evalFusionVariants:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

