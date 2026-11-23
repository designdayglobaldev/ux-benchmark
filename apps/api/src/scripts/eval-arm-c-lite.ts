import fs from 'fs';
import path from 'path';
import { UX_BENCH_V2_DATASET } from '../benchmark/ux-bench-v2.dataset';
import { calculateDCG, calculateIDCG } from '../benchmark/ux-bench-runner';
import { ComponentRetriever } from '../services/search/component-retriever';

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

async function evalArmCLite() {
  console.log('======================================================');
  console.log('EVALUATING ARM C-LITE (COMPONENT TAG BOOST ON DEV SET)');
  console.log('======================================================\n');

  const baselinePath = path.join(__dirname, '../../scratch/arm_a_full_dev_baseline.json');
  const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const cachedResults = baselineData.results.filter((r: any) => r.ndcg10 !== null);

  const dsMap = new Map(UX_BENCH_V2_DATASET.map((q) => [q.id, q]));

  interface EvalRow {
    id: string;
    intent: string;
    query: string;
    matchedComponents: string[];
    armA_ndcg: number;
    armA_anchors_ndcg: number;
    armCLite_ndcg: number;
    deltaCLiteVsAnchors: number;
  }

  const rows: EvalRow[] = [];

  // Also load the evaluated arm_a_anchors scores
  const anchorsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../scratch/arm_a_anchors_results.json'), 'utf8'));
  const anchorsMap = new Map(anchorsData.rows.map((r: any) => [r.id, r]));

  for (let i = 0; i < cachedResults.length; i++) {
    const r = cachedResults[i];
    const qMeta = dsMap.get(r.id)!;
    const candidates = r.firstStageCandidates || [];
    const ancRow = anchorsMap.get(r.id);
    const armA_anchors_ndcg = ancRow ? ancRow.armA_anchors_ndcg : r.ndcg10;

    // 1. Check if component intent applies (or if query has matched components)
    // Note: Specification states Arm C-lite is applied to component queries
    const matchedComponents = ComponentRetriever.extractComponents(r.query);
    const matchedTitles = matchedComponents.map((m) => `${m.definition.title} (${m.matchedAlias})`);

    // Target mapping
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

    let armCLite_ndcg = armA_anchors_ndcg;

    if (r.intent === 'component' && matchedComponents.length > 0) {
      // Re-score candidates using non-exclusionary tag boost
      const scoredCandidates = candidates.map((cand: any) => {
        // Collect UI elements across all constituent screens
        const screenUiElements: string[][] = (cand.screens || []).map((s: any) => {
          return (s.uiElements || []).map((elName: string) => {
            // Slugify element name: e.g. "Segmented Control" -> "segmented-control"
            return elName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          });
        });

        const { boost } = ComponentRetriever.computeTagBoost(screenUiElements, matchedComponents, 0.25);
        return {
          ...cand,
          finalScore: (cand.anchorSimilarity || 0.4) + boost,
          tagBoost: boost,
        };
      });

      // Rank by final score
      const reordered = [...scoredCandidates].sort((a, b) => b.finalScore - a.finalScore);
      armCLite_ndcg = calcNdcg(reordered);
    }

    rows.push({
      id: r.id,
      intent: r.intent,
      query: r.query,
      matchedComponents: matchedTitles,
      armA_ndcg: r.ndcg10 || 0,
      armA_anchors_ndcg,
      armCLite_ndcg,
      deltaCLiteVsAnchors: armCLite_ndcg - armA_anchors_ndcg,
    });
  }

  // Summary by intent
  console.log('=== SUMMARY BY INTENT (ARM C-LITE vs ARM A-ANCHORS) ===\n');
  const compRows = rows.filter((r) => r.intent === 'component');
  const meanCompAnchors = compRows.reduce((s, r) => s + r.armA_anchors_ndcg, 0) / compRows.length;
  const meanCompCLite = compRows.reduce((s, r) => s + r.armCLite_ndcg, 0) / compRows.length;
  const compDeltas = compRows.map((r) => r.deltaCLiteVsAnchors);
  const [ciLowComp, ciHighComp, pValComp] = bootstrapPairDeltaCI(compDeltas);

  console.log(`COMPONENT INTENT (n=${compRows.length}):`);
  console.log(`  Arm A Baseline:          ${(compRows.reduce((s, r) => s + r.armA_ndcg, 0) / compRows.length).toFixed(4)}`);
  console.log(`  Arm A-anchors:           ${meanCompAnchors.toFixed(4)}`);
  console.log(`  Arm C-lite:              ${meanCompCLite.toFixed(4)}`);
  console.log(`  Delta (C-lite vs Anchors): ${(meanCompCLite - meanCompAnchors >= 0 ? '+' : '')}${(meanCompCLite - meanCompAnchors).toFixed(4)}`);
  console.log(`  95% Bootstrap CI:        [${ciLowComp.toFixed(4)}, ${ciHighComp.toFixed(4)}]`);
  console.log(`  Empirical p-value:       ${pValComp.toFixed(4)}\n`);

  console.log('--- Checking that other intents did not move (Regression Invariant Check) ---');
  for (const intent of ['flow', 'situational', 'compare']) {
    const subset = rows.filter((r) => r.intent === intent);
    const mAnchors = subset.reduce((s, r) => s + r.armA_anchors_ndcg, 0) / subset.length;
    const mCLite = subset.reduce((s, r) => s + r.armCLite_ndcg, 0) / subset.length;
    console.log(`  ${intent.toUpperCase()} (n=${subset.length}): Anchors=${mAnchors.toFixed(4)} | C-lite=${mCLite.toFixed(4)} | Diff=${(mCLite - mAnchors).toFixed(4)}`);
  }

  console.log('\n--- Query-level breakdown on the 18 component queries ---');
  for (const cr of compRows) {
    const sign = cr.deltaCLiteVsAnchors >= 0 ? '+' : '';
    console.log(`  [${cr.id}] Anchors: ${cr.armA_anchors_ndcg.toFixed(4)} -> C-lite: ${cr.armCLite_ndcg.toFixed(4)} (${sign}${cr.deltaCLiteVsAnchors.toFixed(4)})`);
    console.log(`    Query: "${cr.query.slice(0, 50)}..."`);
    console.log(`    Matched: [${cr.matchedComponents.join(', ')}]`);
  }

  // Save results
  fs.writeFileSync(
    path.join(__dirname, '../../scratch/arm_c_lite_results.json'),
    JSON.stringify({ compRows, meanCompAnchors, meanCompCLite, meanDelta: meanCompCLite - meanCompAnchors, ciLowComp, ciHighComp, pValComp }, null, 2)
  );
}

evalArmCLite().catch((err) => {
  console.error('Fatal error in evalArmCLite:', err);
  process.exit(1);
});

