import fs from 'fs';
import path from 'path';
import { UX_BENCH_V2_DATASET } from '../benchmark/ux-bench-v2.dataset';
import { calculateDCG, calculateIDCG } from '../benchmark/ux-bench-runner';
import { RerankEngine } from '../services/search/rerank-engine';

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

async function evalArmAAnchors() {
  console.log('=== EVALUATING ARM A-ANCHORS (REUSING CACHED CANDIDATES) ===');
  const baselinePath = path.join(__dirname, '../../scratch/arm_a_full_dev_baseline.json');
  const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const results = baselineData.results;

  const dsMap = new Map(UX_BENCH_V2_DATASET.map((q) => [q.id, q]));
  const inDomain = results.filter((r: any) => r.ndcg10 !== null);
  console.log(`Evaluating ${inDomain.length} in-domain dev queries...`);

  interface Row {
    id: string;
    intent: string;
    armA_ndcg: number;
    armA0_ndcg: number;
    armA_anchors_ndcg: number;
  }

  const rows: Row[] = [];

  for (let i = 0; i < inDomain.length; i++) {
    const r = inDomain[i];
    const qMeta = dsMap.get(r.id)!;
    const candidates = r.firstStageCandidates || [];

    // Dense stage (Arm A0)
    const sortedDense = [...candidates].sort((a: any, b: any) => b.anchorSimilarity - a.anchorSimilarity);
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

    const armA0_ndcg = calcNdcg(sortedDense);
    const armA_ndcg = r.ndcg10 || 0;

    // Build Arm A-anchors payload: anchor screens prioritized, then sorted by stepNo
    const flowPayloads = candidates.map((f: any) => {
      const anchors = (f.screens || []).filter((s: any) => s.isAnchor);
      const nonAnchors = (f.screens || []).filter((s: any) => !s.isAnchor);
      const selected = [...anchors, ...nonAnchors].slice(0, 5);
      const rep = selected.sort((a: any, b: any) => a.screenNo - b.screenNo);

      const summaries = rep.map((s: any) => `[Step ${s.screenNo}] ${s.name}`).join('\n');
      return {
        id: `${f.appId}:::${f.flowId}`,
        document: `App: ${f.appName}\nFlow: ${f.flowName}\nDescription: ${f.description}\nScreens:\n${summaries}`,
      };
    });

    // Cross-encoder rerank
    const reranked = await RerankEngine.rerank(r.query, flowPayloads, candidates.length);
    let orderedAAnchors = candidates;
    if (reranked.length > 0) {
      orderedAAnchors = reranked.map((item: any) => candidates[item.index]);
    }
    const armA_anchors_ndcg = calcNdcg(orderedAAnchors);

    rows.push({
      id: r.id,
      intent: r.intent,
      armA_ndcg,
      armA0_ndcg,
      armA_anchors_ndcg,
    });

    process.stdout.write(`[${i + 1}/${inDomain.length}] ${r.id} (${r.intent}): A=${armA_ndcg.toFixed(3)} A0=${armA0_ndcg.toFixed(3)} A-anchors=${armA_anchors_ndcg.toFixed(3)}\n`);

    // Voyage cooldown between queries (21s)
    if (i < inDomain.length - 1) {
      await new Promise((res) => setTimeout(res, 21000));
    }
  }

  // Summary statistics
  const meanA = rows.reduce((s, r) => s + r.armA_ndcg, 0) / rows.length;
  const meanA0 = rows.reduce((s, r) => s + r.armA0_ndcg, 0) / rows.length;
  const meanAnchors = rows.reduce((s, r) => s + r.armA_anchors_ndcg, 0) / rows.length;

  const deltaAnchorsVsA = rows.map((r) => r.armA_anchors_ndcg - r.armA_ndcg);
  const deltaAnchorsVsA0 = rows.map((r) => r.armA_anchors_ndcg - r.armA0_ndcg);

  const ciVsA = bootstrapPairDeltaCI(deltaAnchorsVsA, 10000, 0.05);
  const ciVsA0 = bootstrapPairDeltaCI(deltaAnchorsVsA0, 10000, 0.05);

  console.log('\n=== FINAL EVALUATION RESULTS ===');
  console.log(`Arm A (slice(0, 5)):      ${meanA.toFixed(4)}`);
  console.log(`Arm A0 (dense-only):       ${meanA0.toFixed(4)}`);
  console.log(`Arm A-anchors (anchors):   ${meanAnchors.toFixed(4)}`);
  console.log(`Gain vs Arm A:             ${(meanAnchors - meanA).toFixed(4)} (95% CI: [${ciVsA[0].toFixed(4)}, ${ciVsA[1].toFixed(4)}])`);
  console.log(`Gain vs Arm A0:            ${(meanAnchors - meanA0).toFixed(4)} (95% CI: [${ciVsA0[0].toFixed(4)}, ${ciVsA0[1].toFixed(4)}])`);

  // Intent breakdown
  console.log('\n=== BREAKDOWN BY INTENT ===');
  for (const intent of ['flow', 'compare', 'component', 'situational']) {
    const sub = rows.filter((r) => r.intent === intent);
    const subA = sub.reduce((s, r) => s + r.armA_ndcg, 0) / sub.length;
    const subA0 = sub.reduce((s, r) => s + r.armA0_ndcg, 0) / sub.length;
    const subAnchors = sub.reduce((s, r) => s + r.armA_anchors_ndcg, 0) / sub.length;
    console.log(`Intent "${intent}" (N=${sub.length}): Arm A=${subA.toFixed(4)} | Arm A0=${subA0.toFixed(4)} | Arm A-anchors=${subAnchors.toFixed(4)}`);
  }

  fs.writeFileSync('scratch/arm_a_anchors_results.json', JSON.stringify({ meanA, meanA0, meanAnchors, rows }, null, 2));
}

evalArmAAnchors().catch(console.error);

