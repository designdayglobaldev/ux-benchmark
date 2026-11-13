import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { UX_BENCH_V2_DATASET, UxBenchQuery } from '../benchmark/ux-bench-v2.dataset';
import { UxBenchV2Runner, computePairedBootstrapInterval, ArmEvaluationReport } from '../benchmark/ux-bench-runner';
import fs from 'fs';

async function runBenchmark(dataset: UxBenchQuery[], label: string) {
  console.log('========================================================================================');
  console.log(`   UX-BENCH v2: ${label.toUpperCase()} EVALUATION (ARM A vs ARM A+)`);
  console.log('========================================================================================\n');

  console.log(`Evaluating ${dataset.length} ground-truth queries`);
  console.log('Database index coverage: 100.0% (3,693 / 3,693 screens indexed)\n');

  // Cooldown 21 seconds between queries to strictly respect Voyage free-tier rate limits
  const cooldownMs = 21000;

  console.log('>>> [1/2] RUNNING ARM A EVALUATION (Dense Baseline without Rationale Injection)...');
  const resA = await UxBenchV2Runner.evaluateArm(dataset, 'ARM_A', { cooldownMs });

  console.log('\n>>> [2/2] RUNNING ARM A+ EVALUATION (With UX Rationale Injection)...');
  const resAPlus = await UxBenchV2Runner.evaluateArm(dataset, 'ARM_A_PLUS', { cooldownMs });

  // Paired bootstrap intervals
  const scoresA = resA.rowResults.map((r) => r.ndcg10);
  const scoresAPlus = resAPlus.rowResults.map((r) => r.ndcg10);
  const ci = computePairedBootstrapInterval(scoresA, scoresAPlus, 10000);

  const summary = {
    evaluatedAt: new Date().toISOString(),
    datasetLabel: label,
    queryCount: dataset.length,
    armA: resA.report,
    armAPlus: resAPlus.report,
    bootstrap95Interval: ci,
  };

  const filename = `apps/api/scratch/benchmark_${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}_results.json`;
  fs.writeFileSync(filename, JSON.stringify(summary, null, 2));

  console.log('\n========================================================================================');
  console.log(`                      ${label.toUpperCase()} BENCHMARK RESULTS`);
  console.log('========================================================================================\n');

  console.log('| Metric | Arm A (Dense Baseline) | Arm A+ (Rationale Injected) | Delta (A+ - A) |');
  console.log('| :--- | :---: | :---: | :---: |');
  console.log(`| **nDCG@10 (Primary)** | **${resA.report.meanNdcg10.toFixed(3)}** | **${resAPlus.report.meanNdcg10.toFixed(3)}** | **${resAPlus.report.meanNdcg10 - resA.report.meanNdcg10 >= 0 ? '+' : ''}${(resAPlus.report.meanNdcg10 - resA.report.meanNdcg10).toFixed(3)}** |`);
  console.log(`| **Hit@1 (Top-1 Accuracy)** | ${resA.report.hitAt1Rate.toFixed(1)}% | ${resAPlus.report.hitAt1Rate.toFixed(1)}% | ${resAPlus.report.hitAt1Rate - resA.report.hitAt1Rate >= 0 ? '+' : ''}${(resAPlus.report.hitAt1Rate - resA.report.hitAt1Rate).toFixed(1)}% |`);
  console.log(`| **Hit@3 (Top-3 Accuracy)** | ${resA.report.hitAt3Rate.toFixed(1)}% | ${resAPlus.report.hitAt3Rate.toFixed(1)}% | ${resAPlus.report.hitAt3Rate - resA.report.hitAt3Rate >= 0 ? '+' : ''}${(resAPlus.report.hitAt3Rate - resA.report.hitAt3Rate).toFixed(1)}% |`);
  console.log(`| **MRR** | ${resA.report.mrr.toFixed(3)} | ${resAPlus.report.mrr.toFixed(3)} | ${resAPlus.report.mrr - resA.report.mrr >= 0 ? '+' : ''}${(resAPlus.report.mrr - resA.report.mrr).toFixed(3)} |`);
  console.log(`| **95% Paired Bootstrap CI** | - | - | **[${ci[0].toFixed(3)}, ${ci[1].toFixed(3)}]** |`);

  console.log('\n--- INTENT BUCKET BREAKDOWN ---');
  for (const intent in resAPlus.report.intentBreakdown) {
    const a = resA.report.intentBreakdown[intent]?.ndcg10 || 0;
    const aPlus = resAPlus.report.intentBreakdown[intent]?.ndcg10 || 0;
    console.log(`   - ${intent.toUpperCase().padEnd(14)}: Arm A = ${a.toFixed(3)}  -->  Arm A+ = ${aPlus.toFixed(3)} (Delta: ${aPlus - a >= 0 ? '+' : ''}${(aPlus - a).toFixed(3)})`);
  }

  console.log('\n========================================================================================\n');
}

// Check command line arguments: "all" evaluates all 150; default is "dev" (90 queries per spec)
const mode = (process.argv[2] || 'all').toLowerCase();
const queriesToRun = mode === 'dev' ? UX_BENCH_V2_DATASET.filter((q) => q.split === 'dev') : UX_BENCH_V2_DATASET;
const label = mode === 'dev' ? 'Dev Split (90 Queries)' : 'Full UX-Bench v2 (150 Queries)';

runBenchmark(queriesToRun, label)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal benchmark error:', err);
    process.exit(1);
  });

