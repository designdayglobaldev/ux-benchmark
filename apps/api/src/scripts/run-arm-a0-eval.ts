import fs from 'fs';
import path from 'path';
import { UX_BENCH_V2_DATASET } from '../benchmark/ux-bench-v2.dataset';
import { calculateDCG, calculateIDCG } from '../benchmark/ux-bench-runner';
import { CachedQueryResult } from '../benchmark/arm-a-evaluator';

function bootstrapCI(values: number[], iterations: number = 10000, alpha: number = 0.05): [number, number] {
  const n = values.length;
  const sampleMeans: number[] = new Array(iterations);
  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      const idx = Math.floor(Math.random() * n);
      sum += values[idx];
    }
    sampleMeans[i] = sum / n;
  }
  sampleMeans.sort((a, b) => a - b);
  const lowerIdx = Math.floor((alpha / 2) * iterations);
  const upperIdx = Math.floor((1 - alpha / 2) * iterations);
  return [sampleMeans[lowerIdx], sampleMeans[upperIdx]];
}

function bootstrapPairDeltaCI(deltas: number[], iterations: number = 10000, alpha: number = 0.05): [number, number] {
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
  return [means[lower], means[upper]];
}

async function main() {
  const baselinePath = path.join(__dirname, '../../scratch/arm_a_full_dev_baseline.json');
  const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const allResults: CachedQueryResult[] = baselineData.results;

  const dsMap = new Map(UX_BENCH_V2_DATASET.map((q) => [q.id, q]));

  interface ArmA0Row {
    id: string;
    intent: string;
    query: string;
    armA_ndcg10: number;
    armA0_ndcg10: number;
    delta: number;
    armA_hit1: boolean;
    armA0_hit1: boolean;
    armA_hit3: boolean;
    armA0_hit3: boolean;
    armA_reciprocalRank: number;
    armA0_reciprocalRank: number;
  }

  const inDomainRows: ArmA0Row[] = [];

  for (const r of allResults) {
    if (r.ndcg10 === null) {
      // Skip out-of-domain
      continue;
    }

    const queryMeta = dsMap.get(r.id);
    if (!queryMeta) continue;

    const candidates = r.firstStageCandidates || [];

    // Dense stage ranking: order strictly by raw vector anchorSimilarity descending
    const sortedByDense = [...candidates].sort((a, b) => b.anchorSimilarity - a.anchorSimilarity);

    const targetMap = new Map<string, number>();
    for (const t of queryMeta.targets) {
      targetMap.set(`${t.appSlug.toLowerCase()}:::${t.flowSlug.toLowerCase()}`, t.grade);
    }

    const relevanceAtRank: number[] = [];
    let firstRelevantRank = 0;

    for (let i = 0; i < sortedByDense.length; i++) {
      const f = sortedByDense[i];
      const key = `${f.appSlug.toLowerCase()}:::${f.flowSlug.toLowerCase()}`;
      let grade = targetMap.get(key) || 0;
      if (grade === 0) {
        for (const [targetKey, targetGrade] of targetMap.entries()) {
          const [tApp, tFlow] = targetKey.split(':::');
          if (f.appSlug.toLowerCase() === tApp && f.flowSlug.toLowerCase().includes(tFlow)) {
            grade = Math.max(grade, targetGrade);
          }
        }
      }
      relevanceAtRank.push(grade);
      if (grade > 0 && firstRelevantRank === 0) {
        firstRelevantRank = i + 1;
      }
    }

    const dcg10 = calculateDCG(relevanceAtRank, 10);
    const idcg10 = queryMeta.targets.length > 0 ? calculateIDCG(queryMeta.targets, 10) : 0;
    const armA0_ndcg10 = idcg10 > 0 ? Math.min(1.0, dcg10 / idcg10) : 0;

    const armA_ndcg10 = r.ndcg10 || 0;
    const delta = armA_ndcg10 - armA0_ndcg10; // Reranker gain (Arm A minus Arm A0)

    inDomainRows.push({
      id: r.id,
      intent: r.intent,
      query: r.query,
      armA_ndcg10,
      armA0_ndcg10,
      delta,
      armA_hit1: r.hitAt1,
      armA0_hit1: relevanceAtRank[0] > 0,
      armA_hit3: r.hitAt3,
      armA0_hit3: relevanceAtRank.slice(0, 3).some((g) => g > 0),
      armA_reciprocalRank: r.reciprocalRank,
      armA0_reciprocalRank: firstRelevantRank > 0 ? 1 / firstRelevantRank : 0,
    });
  }

  // Calculate aggregates
  const n = inDomainRows.length;
  const meanArmA = inDomainRows.reduce((a, b) => a + b.armA_ndcg10, 0) / n;
  const meanArmA0 = inDomainRows.reduce((a, b) => a + b.armA0_ndcg10, 0) / n;
  const meanRerankGain = meanArmA - meanArmA0;

  const armA0_ndcgs = inDomainRows.map((r) => r.armA0_ndcg10);
  const [ciLowerA0, ciUpperA0] = bootstrapCI(armA0_ndcgs, 10000, 0.05);

  const deltas = inDomainRows.map((r) => r.delta);
  const [ciLowerDelta, ciUpperDelta] = bootstrapPairDeltaCI(deltas, 10000, 0.05);

  const armA_hit1 = (inDomainRows.filter((r) => r.armA_hit1).length / n) * 100;
  const armA0_hit1 = (inDomainRows.filter((r) => r.armA0_hit1).length / n) * 100;

  const armA_hit3 = (inDomainRows.filter((r) => r.armA_hit3).length / n) * 100;
  const armA0_hit3 = (inDomainRows.filter((r) => r.armA0_hit3).length / n) * 100;

  const armA_mrr = inDomainRows.reduce((a, b) => a + b.armA_reciprocalRank, 0) / n;
  const armA0_mrr = inDomainRows.reduce((a, b) => a + b.armA0_reciprocalRank, 0) / n;

  // Breakdown by intent
  const byIntent: Record<string, { count: number; armA: number; armA0: number; delta: number }> = {};
  for (const intent of ['flow', 'situational', 'component', 'compare']) {
    const subset = inDomainRows.filter((r) => r.intent === intent);
    const subA = subset.reduce((a, b) => a + b.armA_ndcg10, 0) / subset.length;
    const subA0 = subset.reduce((a, b) => a + b.armA0_ndcg10, 0) / subset.length;
    byIntent[intent] = {
      count: subset.length,
      armA: subA,
      armA0: subA0,
      delta: subA - subA0,
    };
  }

  const outData = {
    evaluatedAt: new Date().toISOString(),
    inDomainCount: n,
    armA0: {
      name: 'Arm A0 (Dense Only, No Reranker)',
      meanNdcg10: meanArmA0,
      bootstrap95CI: [ciLowerA0, ciUpperA0],
      hitAt1Rate: armA0_hit1,
      hitAt3Rate: armA0_hit3,
      mrr: armA0_mrr,
    },
    armA: {
      name: 'Arm A (Dense + Cross-Encoder Reranker)',
      meanNdcg10: meanArmA,
      hitAt1Rate: armA_hit1,
      hitAt3Rate: armA_hit3,
      mrr: armA_mrr,
    },
    rerankValueAdded: {
      meanDeltaNdcg10: meanRerankGain,
      bootstrap95CI: [ciLowerDelta, ciUpperDelta],
      hit1DeltaPoints: armA_hit1 - armA0_hit1,
      hit3DeltaPoints: armA_hit3 - armA0_hit3,
    },
    byIntent,
    rows: inDomainRows,
  };

  const outPath = path.join(__dirname, '../../scratch/arm_a0_evaluation.json');
  fs.writeFileSync(outPath, JSON.stringify(outData, null, 2), 'utf8');

  console.log('\n========================================================================');
  console.log('   ARM A0 (DENSE-ONLY, NO RERANK) VS. ARM A BASELINE (N=77 IN-DOMAIN)');
  console.log('========================================================================');
  console.log(`Arm A0 Mean nDCG@10:      ${meanArmA0.toFixed(4)} (95% CI: [${ciLowerA0.toFixed(4)}, ${ciUpperA0.toFixed(4)}])`);
  console.log(`Arm A  Mean nDCG@10:      ${meanArmA.toFixed(4)}`);
  console.log(`Reranker Gain (A - A0):   +${meanRerankGain.toFixed(4)} (95% CI: [${ciLowerDelta.toFixed(4)}, ${ciUpperDelta.toFixed(4)}])`);
  console.log('------------------------------------------------------------------------');
  console.log(`Hit@1 Rate:               Arm A0 = ${armA0_hit1.toFixed(1)}%  ->  Arm A = ${armA_hit1.toFixed(1)}% (+${(armA_hit1 - armA0_hit1).toFixed(1)}%)`);
  console.log(`Hit@3 Rate:               Arm A0 = ${armA0_hit3.toFixed(1)}%  ->  Arm A = ${armA_hit3.toFixed(1)}% (+${(armA_hit3 - armA0_hit3).toFixed(1)}%)`);
  console.log(`MRR:                      Arm A0 = ${armA0_mrr.toFixed(4)}  ->  Arm A = ${armA_mrr.toFixed(4)} (+${(armA_mrr - armA0_mrr).toFixed(4)})`);
  console.log('------------------------------------------------------------------------');
  console.log('Intent Breakdown (Reranker Gain):');
  for (const [intent, stats] of Object.entries(byIntent)) {
    const deltaStr = (stats.delta >= 0 ? '+' : '') + stats.delta.toFixed(4);
    console.log(`  ${intent.padEnd(12)} (N=${stats.count}): Arm A0=${stats.armA0.toFixed(4)} -> Arm A=${stats.armA.toFixed(4)} (Δ ${deltaStr})`);
  }
  console.log('========================================================================\n');
}

main().catch(console.error);
