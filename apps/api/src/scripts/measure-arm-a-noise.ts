import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { UX_BENCH_V2_DATASET } from '../benchmark/ux-bench-v2.dataset';
import { UxBenchV2Runner } from '../benchmark/ux-bench-runner';
import fs from 'fs';

async function measureRunToRunNoise() {
  console.log('========================================================================================');
  console.log('   UX-BENCH: MEASURING RUN-TO-RUN VARIANCE ON ARM A (FIRST 10 QUERIES)');
  console.log('========================================================================================\n');

  const first10 = UX_BENCH_V2_DATASET.slice(0, 10);
  const cooldownMs = 21000;

  // Run Arm A Second Pass
  const resPass2 = await UxBenchV2Runner.evaluateArm(first10, 'ARM_A', { cooldownMs });

  // Load Pass 1 from scratch
  let pass1Rows: any[] = [];
  const p1Path = 'apps/api/scratch/first_10_results.json';
  if (fs.existsSync(p1Path)) {
    const raw = JSON.parse(fs.readFileSync(p1Path, 'utf8'));
    pass1Rows = raw.rowComparison.map((r: any) => r.armA);
  }

  console.log('\n========================================================================================');
  console.log('                  ARM A RUN-TO-RUN VARIANCE TABLE (PASS 1 vs PASS 2)');
  console.log('========================================================================================\n');

  console.log('| ID | Pass 1 Top-1 | Pass 1 nDCG | Pass 2 Top-1 | Pass 2 nDCG | Top-1 Identical? | nDCG Delta |');
  console.log('| :--- | :--- | :---: | :--- | :---: | :---: | :---: |');

  let rankIdenticalCount = 0;
  let absNdcgDeltaSum = 0;

  first10.forEach((q, idx) => {
    const p1 = pass1Rows[idx] || { predicted: 'N/A', ndcg10: 0 };
    const p2 = resPass2.rowResults[idx];
    const isSameTop1 = p1.predicted.toLowerCase() === p2.predictedTopFlow.toLowerCase();
    const ndcgDiff = p2.ndcg10 - p1.ndcg10;
    if (isSameTop1) rankIdenticalCount++;
    absNdcgDeltaSum += Math.abs(ndcgDiff);

    console.log(`| **${q.id}** | ${p1.predicted} | ${p1.ndcg10.toFixed(2)} | ${p2.predictedTopFlow} | ${p2.ndcg10.toFixed(2)} | ${isSameTop1 ? '✅ YES' : '⚠️ SWAPPED'} | ${(ndcgDiff >= 0 ? '+' : '')}${ndcgDiff.toFixed(3)} |`);
  });

  const meanNdcgP1 = pass1Rows.reduce((acc, r) => acc + r.ndcg10, 0) / (pass1Rows.length || 1);
  const meanNdcgP2 = resPass2.report.meanNdcg10;

  console.log('\n========================================================================================');
  console.log('                             NOISE ANALYSIS SUMMARY');
  console.log('========================================================================================\n');
  console.log(`- Pass 1 Mean nDCG@10: ${meanNdcgP1.toFixed(3)}`);
  console.log(`- Pass 2 Mean nDCG@10: ${meanNdcgP2.toFixed(3)}`);
  console.log(`- Top-1 Agreement Rate: ${(rankIdenticalCount / 10 * 100).toFixed(1)}%`);
  console.log(`- Mean Absolute nDCG Variance per Query: ${(absNdcgDeltaSum / 10).toFixed(4)}`);
  console.log('========================================================================================\n');

  const noiseReport = {
    pass1: pass1Rows,
    pass2: resPass2.rowResults,
    top1AgreementRate: rankIdenticalCount / 10,
    meanAbsNdcgDelta: absNdcgDeltaSum / 10,
    evaluatedAt: new Date().toISOString()
  };
  fs.writeFileSync('apps/api/scratch/arm_a_noise_report.json', JSON.stringify(noiseReport, null, 2));
}

measureRunToRunNoise()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Noise test error:', e);
    process.exit(1);
  });

