import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { RerankEngine } from '../services/search/rerank-engine';
import { UX_BENCH_V2_DATASET } from '../benchmark/ux-bench-v2.dataset';
import { calculateDCG, calculateIDCG } from '../benchmark/ux-bench-runner';
import { CachedCandidateFlow, CachedQueryResult } from '../benchmark/arm-a-evaluator';

interface ComparisonRow {
  id: string;
  intent: string;
  query: string;
  armA_topFlow: string;
  armA_ndcg10: number;
  armAPlus_topFlow: string;
  armAPlus_ndcg10: number;
  deltaNdcg10: number;
  armA_hit1: boolean;
  armAPlus_hit1: boolean;
  armA_hit3: boolean;
  armAPlus_hit3: boolean;
  latencyMs: number;
}

function cleanHtml(str?: string | null): string {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

function buildArmAPlusDocument(f: CachedCandidateFlow): string {
  const representativeScreens = (f.screens || []).slice(0, 5);
  const screenSummaries = representativeScreens
    .map((s, idx) => {
      const parts = [
        `[Step ${idx + 1}] ${s.name || `Screen ${s.screenNo}`}`,
        s.uiElements && s.uiElements.length > 0 ? `Components: ${s.uiElements.join(', ')}` : null,
        s.whereToUse ? `Where To Use: ${cleanHtml(s.whereToUse).slice(0, 200)}` : null,
        s.whereNotToUse ? `Where Not To Use: ${cleanHtml(s.whereNotToUse).slice(0, 200)}` : null,
        s.evidenceWhoWhy ? `Evidence: ${cleanHtml(s.evidenceWhoWhy).slice(0, 200)}` : null,
        s.keyHighlights ? `Highlights: ${cleanHtml(s.keyHighlights).slice(0, 200)}` : null,
      ].filter(Boolean);
      return parts.join(' | ');
    })
    .join('\n');

  return `App: ${f.appName}\nFlow: ${f.flowName}\nDescription: ${f.description || ''}\nScreens:\n${screenSummaries}`;
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

  // Filter down to the 39 situational & component queries
  const targetResults = allResults.filter(
    (r) => r.intent === 'situational' || r.intent === 'component'
  );

  console.log(`========================================================================`);
  console.log(`   EVALUATING ARM A+ ON 39 CACHED SITUATIONAL & COMPONENT QUERIES`);
  console.log(`========================================================================`);
  console.log(`Target queries count: ${targetResults.length} (Situational: 21, Component: 18)`);
  console.log(`Using cached firstStageCandidates (0 dense vector searches required)\n`);

  const dsMap = new Map(UX_BENCH_V2_DATASET.map((q) => [q.id, q]));
  const comparisonRows: ComparisonRow[] = [];

  for (let i = 0; i < targetResults.length; i++) {
    const armAResult = targetResults[i];
    const queryMeta = dsMap.get(armAResult.id);
    if (!queryMeta) {
      console.warn(`Query metadata missing for ${armAResult.id}`);
      continue;
    }

    const start = Date.now();
    const candidateFlows = armAResult.firstStageCandidates || [];

    if (candidateFlows.length === 0) {
      console.warn(`[${i + 1}/${targetResults.length}] No cached candidates for ${armAResult.id}`);
      continue;
    }

    // Build rationale-injected documents (Arm A+)
    const rerankCandidates = candidateFlows.map((f) => ({
      id: `${f.appId}:::${f.flowId}`,
      document: buildArmAPlusDocument(f),
    }));

    // Call reranker
    const rerankResults = await RerankEngine.rerank(armAResult.query, rerankCandidates, candidateFlows.length);
    const latencyMs = Date.now() - start;

    const rankedFlows = rerankResults.map((r) => {
      const flow = candidateFlows[r.index];
      return {
        ...flow,
        anchorSimilarity: Math.max(flow.anchorSimilarity, r.relevanceScore),
      };
    });

    // Score Arm A+
    const targetMap = new Map<string, number>();
    for (const t of queryMeta.targets) {
      targetMap.set(`${t.appSlug.toLowerCase()}:::${t.flowSlug.toLowerCase()}`, t.grade);
    }

    const relevanceAtRank: number[] = [];
    let topFlowStr = 'none';

    for (let rank = 0; rank < rankedFlows.length; rank++) {
      const f = rankedFlows[rank];
      if (rank === 0) {
        topFlowStr = `${f.appSlug}:${f.flowSlug}`;
      }
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
    }

    const dcg10 = calculateDCG(relevanceAtRank, 10);
    const idcg10 = queryMeta.targets.length > 0 ? calculateIDCG(queryMeta.targets, 10) : 0;
    const armAPlus_ndcg10 = idcg10 > 0 ? Math.min(1.0, dcg10 / idcg10) : 0;

    const armA_ndcg10 = armAResult.ndcg10 || 0;
    const delta = armAPlus_ndcg10 - armA_ndcg10;
    const armAPlus_hit1 = relevanceAtRank[0] > 0;
    const armAPlus_hit3 = relevanceAtRank.slice(0, 3).some((g) => g > 0);

    const armA_topFlow = armAResult.retrievedFlows[0]
      ? `${armAResult.retrievedFlows[0].appSlug}:${armAResult.retrievedFlows[0].flowSlug}`
      : 'none';

    comparisonRows.push({
      id: armAResult.id,
      intent: armAResult.intent,
      query: armAResult.query,
      armA_topFlow,
      armA_ndcg10,
      armAPlus_topFlow: topFlowStr,
      armAPlus_ndcg10,
      deltaNdcg10: delta,
      armA_hit1: armAResult.hitAt1,
      armAPlus_hit1,
      armA_hit3: armAResult.hitAt3,
      armAPlus_hit3,
      latencyMs,
    });

    const deltaSign = delta > 0 ? `+${delta.toFixed(3)}` : delta.toFixed(3);
    const icon = delta > 0.05 ? '📈' : delta < -0.05 ? '📉' : '➖';
    console.log(
      `[${String(i + 1).padStart(2)}/39] [${armAResult.intent.toUpperCase()}] ${armAResult.id}: ` +
      `Arm A=${armA_ndcg10.toFixed(3)} | Arm A+=${armAPlus_ndcg10.toFixed(3)} (Δ ${deltaSign}) ${icon} | ${latencyMs}ms`
    );

    // Rate-limit safety: small pause between calls (rerank-2)
    await new Promise((res) => setTimeout(res, 3000));
  }

  // Aggregate stats
  const meanArmA = comparisonRows.reduce((a, b) => a + b.armA_ndcg10, 0) / comparisonRows.length;
  const meanArmAPlus = comparisonRows.reduce((a, b) => a + b.armAPlus_ndcg10, 0) / comparisonRows.length;
  const meanDelta = meanArmAPlus - meanArmA;
  const deltas = comparisonRows.map((r) => r.deltaNdcg10);
  const [ciLower, ciUpper] = bootstrapPairDeltaCI(deltas, 10000, 0.05);

  const armA_hit1Rate = (comparisonRows.filter((r) => r.armA_hit1).length / comparisonRows.length) * 100;
  const armAPlus_hit1Rate = (comparisonRows.filter((r) => r.armAPlus_hit1).length / comparisonRows.length) * 100;
  const armA_hit3Rate = (comparisonRows.filter((r) => r.armA_hit3).length / comparisonRows.length) * 100;
  const armAPlus_hit3Rate = (comparisonRows.filter((r) => r.armAPlus_hit3).length / comparisonRows.length) * 100;

  // Breakdown by intent
  const sitRows = comparisonRows.filter((r) => r.intent === 'situational');
  const compRows = comparisonRows.filter((r) => r.intent === 'component');

  const sitArmA = sitRows.reduce((a, b) => a + b.armA_ndcg10, 0) / sitRows.length;
  const sitArmAPlus = sitRows.reduce((a, b) => a + b.armAPlus_ndcg10, 0) / sitRows.length;

  const compArmA = compRows.reduce((a, b) => a + b.armA_ndcg10, 0) / compRows.length;
  const compArmAPlus = compRows.reduce((a, b) => a + b.armAPlus_ndcg10, 0) / compRows.length;

  const summary = {
    evaluatedAt: new Date().toISOString(),
    queryCount: comparisonRows.length,
    armA: {
      meanNdcg10: meanArmA,
      hit1Rate: armA_hit1Rate,
      hit3Rate: armA_hit3Rate,
    },
    armAPlus: {
      meanNdcg10: meanArmAPlus,
      hit1Rate: armAPlus_hit1Rate,
      hit3Rate: armAPlus_hit3Rate,
    },
    delta: {
      meanDeltaNdcg10: meanDelta,
      bootstrap95CI: [ciLower, ciUpper],
    },
    intentBreakdown: {
      situational: {
        count: sitRows.length,
        armA_meanNdcg: sitArmA,
        armAPlus_meanNdcg: sitArmAPlus,
        delta: sitArmAPlus - sitArmA,
      },
      component: {
        count: compRows.length,
        armA_meanNdcg: compArmA,
        armAPlus_meanNdcg: compArmAPlus,
        delta: compArmAPlus - compArmA,
      },
    },
    rows: comparisonRows,
  };

  const outPath = path.join(__dirname, '../../scratch/arm_a_plus_39_comparison.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log('\n========================================================================');
  console.log('   ARM A VS. ARM A+ RESULTS ON 39 SITUATIONAL & COMPONENT QUERIES');
  console.log('========================================================================');
  console.log(`Arm A Mean nDCG@10:       ${meanArmA.toFixed(4)}`);
  console.log(`Arm A+ Mean nDCG@10:      ${meanArmAPlus.toFixed(4)}`);
  console.log(`Paired Difference (A+ - A): ${(meanDelta >= 0 ? '+' : '') + meanDelta.toFixed(4)}`);
  console.log(`95% Bootstrap CI on Δ:    [${ciLower.toFixed(4)}, ${ciUpper.toFixed(4)}]`);
  console.log(`Arm A Hit@1 / Hit@3:      ${armA_hit1Rate.toFixed(1)}% / ${armA_hit3Rate.toFixed(1)}%`);
  console.log(`Arm A+ Hit@1 / Hit@3:     ${armAPlus_hit1Rate.toFixed(1)}% / ${armAPlus_hit3Rate.toFixed(1)}%`);
  console.log('------------------------------------------------------------------------');
  console.log(`Situational (N=21): Arm A=${sitArmA.toFixed(4)} -> Arm A+=${sitArmAPlus.toFixed(4)} (Δ ${(sitArmAPlus - sitArmA >= 0 ? '+' : '') + (sitArmAPlus - sitArmA).toFixed(4)})`);
  console.log(`Component   (N=18): Arm A=${compArmA.toFixed(4)} -> Arm A+=${compArmAPlus.toFixed(4)} (Δ ${(compArmAPlus - compArmA >= 0 ? '+' : '') + (compArmAPlus - compArmA).toFixed(4)})`);
  console.log('========================================================================\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

