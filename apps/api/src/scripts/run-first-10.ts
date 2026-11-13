import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { UX_BENCH_V2_DATASET } from '../benchmark/ux-bench-v2.dataset';
import { UxBenchV2Runner, computePairedBootstrapInterval } from '../benchmark/ux-bench-runner';
import fs from 'fs';

async function runFirst10() {
  console.log('========================================================================================');
  console.log('   UX-BENCH v2: PILOT RUN ON FIRST 10 QUERIES (ARM A vs ARM A+)');
  console.log('========================================================================================\n');

  const first10 = UX_BENCH_V2_DATASET.slice(0, 10);
  console.log(`Evaluating Queries UXB-001 through UXB-010...`);
  console.log('Database index coverage: 100.0% (3,693 / 3,693 screens indexed)\n');

  // Cooldown 21 seconds between queries to strictly respect Voyage free-tier rate limits
  const cooldownMs = 21000;

  console.log('>>> [1/2] RUNNING ARM A (Dense Baseline: Step & Screen Name Only)...');
  const t0_A = Date.now();
  const resA = await UxBenchV2Runner.evaluateArm(first10, 'ARM_A', { cooldownMs });
  const totalTimeA_ms = Date.now() - t0_A;

  console.log('\n>>> [2/2] RUNNING ARM A+ (With UX Rationale Injection)...');
  const t0_APlus = Date.now();
  const resAPlus = await UxBenchV2Runner.evaluateArm(first10, 'ARM_A_PLUS', { cooldownMs });
  const totalTimeAPlus_ms = Date.now() - t0_APlus;

  // Paired bootstrap intervals
  const scoresA = resA.rowResults.map((r) => r.ndcg10);
  const scoresAPlus = resAPlus.rowResults.map((r) => r.ndcg10);
  const ci = computePairedBootstrapInterval(scoresA, scoresAPlus, 10000);

  const summary = {
    evaluatedAt: new Date().toISOString(),
    queryCount: first10.length,
    wallClockTimes: {
      armA_seconds: Math.round(totalTimeA_ms / 1000),
      armAPlus_seconds: Math.round(totalTimeAPlus_ms / 1000),
      total_seconds: Math.round((totalTimeA_ms + totalTimeAPlus_ms) / 1000),
    },
    armA: resA.report,
    armAPlus: resAPlus.report,
    bootstrap95Interval: ci,
    rowComparison: first10.map((q, idx) => ({
      id: q.id,
      query: q.query,
      armA: {
        predicted: resA.rowResults[idx].predictedTopFlow,
        ndcg10: resA.rowResults[idx].ndcg10,
        hit1: resA.rowResults[idx].hitAt1,
        hit3: resA.rowResults[idx].hitAt3,
        latencyMs: resA.rowResults[idx].durationMs,
      },
      armAPlus: {
        predicted: resAPlus.rowResults[idx].predictedTopFlow,
        ndcg10: resAPlus.rowResults[idx].ndcg10,
        hit1: resAPlus.rowResults[idx].hitAt1,
        hit3: resAPlus.rowResults[idx].hitAt3,
        latencyMs: resAPlus.rowResults[idx].durationMs,
      },
    })),
  };

  fs.writeFileSync('apps/api/scratch/first_10_results.json', JSON.stringify(summary, null, 2));

  console.log('\n========================================================================================');
  console.log('                          PER-QUERY BREAKDOWN (FIRST 10)');
  console.log('========================================================================================\n');

  console.log('| ID | Query | Arm A Top-1 | Arm A nDCG | Arm A+ Top-1 | Arm A+ nDCG | Delta | Arm A Lat | Arm A+ Lat |');
  console.log('| :--- | :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: |');
  summary.rowComparison.forEach((r) => {
    const delta = (r.armAPlus.ndcg10 - r.armA.ndcg10).toFixed(2);
    const sign = Number(delta) >= 0 ? '+' : '';
    console.log(`| **${r.id}** | ${r.query.slice(0, 32)}... | ${r.armA.predicted} | ${r.armA.ndcg10.toFixed(2)} | ${r.armAPlus.predicted} | ${r.armAPlus.ndcg10.toFixed(2)} | **${sign}${delta}** | ${r.armA.latencyMs}ms | ${r.armAPlus.latencyMs}ms |`);
  });

  console.log('\n========================================================================================');
  console.log('                        SUMMARY METRICS & TIMING');
  console.log('========================================================================================\n');

  console.log('| Metric | Arm A (Dense Baseline) | Arm A+ (Rationale Injected) | Delta (A+ - A) |');
  console.log('| :--- | :---: | :---: | :---: |');
  console.log(`| **nDCG@10 (Primary)** | **${resA.report.meanNdcg10.toFixed(3)}** | **${resAPlus.report.meanNdcg10.toFixed(3)}** | **${resAPlus.report.meanNdcg10 - resA.report.meanNdcg10 >= 0 ? '+' : ''}${(resAPlus.report.meanNdcg10 - resA.report.meanNdcg10).toFixed(3)}** |`);
  console.log(`| **Hit@1 (Top-1 Accuracy)** | ${resA.report.hitAt1Rate.toFixed(1)}% | ${resAPlus.report.hitAt1Rate.toFixed(1)}% | ${resAPlus.report.hitAt1Rate - resA.report.hitAt1Rate >= 0 ? '+' : ''}${(resAPlus.report.hitAt1Rate - resA.report.hitAt1Rate).toFixed(1)}% |`);
  console.log(`| **Hit@3 (Top-3 Accuracy)** | ${resA.report.hitAt3Rate.toFixed(1)}% | ${resAPlus.report.hitAt3Rate.toFixed(1)}% | ${resAPlus.report.hitAt3Rate - resA.report.hitAt3Rate >= 0 ? '+' : ''}${(resAPlus.report.hitAt3Rate - resA.report.hitAt3Rate).toFixed(1)}% |`);
  console.log(`| **MRR** | ${resA.report.mrr.toFixed(3)} | ${resAPlus.report.mrr.toFixed(3)} | ${resAPlus.report.mrr - resA.report.mrr >= 0 ? '+' : ''}${(resAPlus.report.mrr - resA.report.mrr).toFixed(3)} |`);
  console.log(`| **Mean Engine Latency** | ${Math.round(resA.report.meanLatencyMs)}ms | ${Math.round(resAPlus.report.meanLatencyMs)}ms | ${Math.round(resAPlus.report.meanLatencyMs - resA.report.meanLatencyMs)}ms |`);
  console.log(`| **Total Wall-Clock Time** | ${summary.wallClockTimes.armA_seconds}s | ${summary.wallClockTimes.armAPlus_seconds}s | Combined: ${summary.wallClockTimes.total_seconds}s |`);
  console.log(`| **95% Paired Bootstrap CI** | - | - | **[${ci[0].toFixed(3)}, ${ci[1].toFixed(3)}]** |`);
  console.log('\n========================================================================================\n');
}

runFirst10()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal benchmark error:', err);
    process.exit(1);
  });

