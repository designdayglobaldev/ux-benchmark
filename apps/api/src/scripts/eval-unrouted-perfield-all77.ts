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

async function evalUnrouted() {
  console.log('======================================================');
  console.log('EVALUATING UNROUTED FUSION (PER-FIELD APPLIED TO ALL 77 DEV QUERIES)');
  console.log('Testing regression invariants on flow, compare, component, situational');
  console.log('Using 22s rate limit spacing for Voyage AI free tier (3 RPM)');
  console.log('======================================================\n');

  const baselinePath = path.join(__dirname, '../../scratch/arm_a_full_dev_baseline.json');
  const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const cachedDev = baselineData.results.filter((r: any) => r.ndcg10 !== null);

  const dsMap = new Map(UX_BENCH_V2_DATASET.map((q) => [q.id, q]));
  console.log(`Evaluating all ${cachedDev.length} in-domain queries without router gating...\n`);

  interface EvalRow {
    id: string;
    intent: string;
    query: string;
    armA_ndcg: number;
    unrouted_ndcg: number;
    delta: number;
  }

  const rows: EvalRow[] = [];

  for (let i = 0; i < cachedDev.length; i++) {
    const r = cachedDev[i];
    const qMeta = dsMap.get(r.id)!;
    
    // Compute current Arm A on current labels
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

    const armA_ndcg = calcNdcg(r.retrievedFlows || []);

    let newScore = armA_ndcg;
    let success = false;
    let attempts = 0;

    while (!success && attempts < 3) {
      attempts++;
      try {
        // 1. Embed query (Voyage multimodal embedding)
        const [queryVector] = await ScreenFieldEmbeddingService.embedTexts([r.query]);

        // 2. Search situational fields across full library index (now 11,014 vectors)
        const fieldMatches = await ScreenFieldEmbeddingService.searchFields(queryVector, {
          fields: ['WHERE_TO_USE', 'WHERE_NOT_TO_USE'],
          limit: 20,
          minSimilarity: 0.35,
        });

        // 3. Score candidate flows (Dense baseline + per-field matches fused)
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
        newScore = calcNdcg(ranked);
        success = true;
      } catch (err: any) {
        if (err.message?.includes('429')) {
          console.log(`  Rate limit hit on query ${r.id}. Waiting 25s...`);
          await sleep(25000);
        } else {
          console.warn(`  Attempt ${attempts} error:`, err.message);
          await sleep(5000);
        }
      }
    }

    const delta = newScore - armA_ndcg;
    const sign = delta >= 0 ? '+' : '';
    console.log(`[${i + 1}/${cachedDev.length}] ${r.id} (${r.intent}): Arm A=${armA_ndcg.toFixed(4)} | Unrouted Fused=${newScore.toFixed(4)} (${sign}${delta.toFixed(4)})`);

    rows.push({
      id: r.id,
      intent: r.intent,
      query: r.query,
      armA_ndcg,
      unrouted_ndcg: newScore,
      delta,
    });

    if (i < cachedDev.length - 1) {
      await sleep(22000);
    }
  }

  // Summary by intent and overall
  console.log('\n======================================================');
  console.log('UNROUTED FUSION EVALUATION FINISHED');
  console.log('======================================================');
  
  const overallArmA = rows.reduce((s, r) => s + r.armA_ndcg, 0) / rows.length;
  const overallUnrouted = rows.reduce((s, r) => s + r.unrouted_ndcg, 0) / rows.length;
  const [ciLow, ciHigh, pVal] = bootstrapPairDeltaCI(rows.map(r => r.delta));

  console.log(`OVERALL (n=${rows.length}):`);
  console.log(`  Arm A Rescored:      ${overallArmA.toFixed(4)}`);
  console.log(`  Unrouted Per-Field:  ${overallUnrouted.toFixed(4)}`);
  console.log(`  Paired Delta:        ${(overallUnrouted - overallArmA >= 0 ? '+' : '')}${(overallUnrouted - overallArmA).toFixed(4)}`);
  console.log(`  95% Bootstrap CI:    [${ciLow.toFixed(4)}, ${ciHigh.toFixed(4)}] (p=${pVal.toFixed(4)})\n`);

  for (const intent of ['flow', 'situational', 'component', 'compare']) {
    const subset = rows.filter(r => r.intent === intent);
    const mA = subset.reduce((s, r) => s + r.armA_ndcg, 0) / subset.length;
    const mU = subset.reduce((s, r) => s + r.unrouted_ndcg, 0) / subset.length;
    const [l, h, p] = bootstrapPairDeltaCI(subset.map(r => r.delta));
    console.log(`  ${intent.toUpperCase()} (n=${subset.length}): Arm A=${mA.toFixed(4)} | Unrouted=${mU.toFixed(4)} | Delta=${(mU - mA >= 0 ? '+' : '')}${(mU - mA).toFixed(4)} [CI: ${l.toFixed(4)}, ${h.toFixed(4)}] (p=${p.toFixed(4)})`);
  }

  fs.writeFileSync(
    path.join(__dirname, '../../scratch/unrouted_perfield_77_results.json'),
    JSON.stringify({ overallArmA, overallUnrouted, rows }, null, 2)
  );
}

evalUnrouted()
  .catch((err) => {
    console.error('Fatal unrouted evaluation error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

