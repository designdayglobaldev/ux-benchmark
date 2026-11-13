import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { UX_BENCH_V2_DATASET } from '../benchmark/ux-bench-v2.dataset';
import { evaluateQueryArmAWithCache, CachedQueryResult } from '../benchmark/arm-a-evaluator';
import fs from 'fs';

async function runNoiseCheck() {
  console.log('========================================================================================');
  console.log('   UX-BENCH: CALIBRATING ARM A RUN-TO-RUN VARIANCE (QUERIES 1 TO 10, PASS 2)');
  console.log('========================================================================================\n');

  const first10 = UX_BENCH_V2_DATASET.slice(0, 10);
  const cooldownMs = 21000;
  const pass2Results: CachedQueryResult[] = [];

  for (let i = 0; i < first10.length; i++) {
    const q = first10[i];
    process.stdout.write(`[${i + 1}/10] [PASS 2] ${q.id}: "${q.query.slice(0, 42)}"... `);
    try {
      const res = await evaluateQueryArmAWithCache(q);
      pass2Results.push(res);
      console.log(`Top: ${res.retrievedFlows[0]?.appSlug}:${res.retrievedFlows[0]?.flowSlug} | nDCG: ${res.ndcg10?.toFixed(3)} | ${res.durationMs}ms`);
    } catch (e: any) {
      console.log(`ERROR: ${e.message}`);
    }

    if (i < first10.length - 1) {
      await new Promise((r) => setTimeout(r, cooldownMs));
    }
  }

  // Load Pass 1 from previous pilot run
  let pass1Rows: any[] = [];
  const p1Path = 'apps/api/scratch/first_10_results.json';
  if (fs.existsSync(p1Path)) {
    const raw = JSON.parse(fs.readFileSync(p1Path, 'utf8'));
    pass1Rows = raw.rowComparison ? raw.rowComparison.map((r: any) => r.armA) : [];
  }

  console.log('\n========================================================================================');
  console.log('                  ARM A RUN-TO-RUN VARIANCE TABLE (PASS 1 vs PASS 2)');
  console.log('========================================================================================\n');

  console.log('| ID | Pass 1 Top-1 | Pass 1 nDCG | Pass 2 Top-1 | Pass 2 nDCG | Top-1 Identical? | Absolute Delta |');
  console.log('| :--- | :--- | :---: | :--- | :---: | :---: | :---: |');

  let rankIdenticalCount = 0;
  let absNdcgDeltaSum = 0;

  first10.forEach((q, idx) => {
    const p1 = pass1Rows[idx] || { predicted: 'N/A', ndcg10: 0 };
    const p2 = pass2Results[idx];
    const p2Top = p2.retrievedFlows[0] ? `${p2.retrievedFlows[0].appSlug}:${p2.retrievedFlows[0].flowSlug}` : 'none';
    const isSameTop1 = p1.predicted.toLowerCase() === p2Top.toLowerCase();
    const ndcgDiff = Math.abs((p2.ndcg10 || 0) - (p1.ndcg10 || 0));

    if (isSameTop1) rankIdenticalCount++;
    absNdcgDeltaSum += ndcgDiff;

    console.log(`| **${q.id}** | ${p1.predicted} | ${p1.ndcg10.toFixed(2)} | ${p2Top} | ${p2.ndcg10?.toFixed(2)} | ${isSameTop1 ? '✅ YES' : '⚠️ SWAPPED'} | ${ndcgDiff.toFixed(3)} |`);
  });

  const meanAbsVariance = absNdcgDeltaSum / 10;
  console.log('\n========================================================================================');
  console.log('                                NOISE ANALYSIS CONCLUSION');
  console.log('========================================================================================\n');
  console.log(`- Top-1 Flow Agreement: ${(rankIdenticalCount / 10) * 100}%`);
  console.log(`- Mean Absolute nDCG Variance per Query: ${meanAbsVariance.toFixed(4)}`);
  console.log(`- Noise Floor Threshold: Differences < ${meanAbsVariance.toFixed(3)} nDCG cannot be distinguished from model jitter.`);
  console.log('========================================================================================\n');

  fs.writeFileSync('apps/api/scratch/arm_a_noise_calibration.json', JSON.stringify({ pass1: pass1Rows, pass2: pass2Results, meanAbsVariance }, null, 2));
}

runNoiseCheck()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal noise check error:', e);
    process.exit(1);
  });

