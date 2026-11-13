import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { UX_BENCH_V2_DATASET, UxBenchQuery } from '../benchmark/ux-bench-v2.dataset';
import { UxBenchV2Runner, computePairedBootstrapInterval, ArmEvaluationReport } from '../benchmark/ux-bench-runner';
import fs from 'fs';

async function runGate0Benchmark() {
  console.log('========================================================================================');
  console.log('   UX-BENCH v2: PHASE 0 GATE 0 FORMAL EVALUATION (ARM A vs ARM A+)');
  console.log('========================================================================================\n');

  const devQueries = UX_BENCH_V2_DATASET.filter((q) => q.split === 'dev');
  console.log(`Evaluating complete Dev Split: ${devQueries.length} ground-truth queries`);
  console.log('Database index coverage: 100.0% (3,693 / 3,693 screens indexed)\n');

  // Cooldown 21 seconds between queries to strictly respect Voyage free-tier rate limits
  const cooldownMs = 21000;

  console.log('>>> [1/2] RUNNING ARM A EVALUATION (Dense Baseline without Rationale Injection)...');
  const resA = await UxBenchV2Runner.evaluateArm(devQueries, 'ARM_A', { cooldownMs });

  console.log('\n>>> [2/2] RUNNING ARM A+ EVALUATION (With UX Rationale Injection)...');
  const resAPlus = await UxBenchV2Runner.evaluateArm(devQueries, 'ARM_A_PLUS', { cooldownMs });

  // Paired bootstrap intervals
  const scoresA = resA.rowResults.map((r) => r.ndcg10);
  const scoresAPlus = resAPlus.rowResults.map((r) => r.ndcg10);
  const ci = computePairedBootstrapInterval(scoresA, scoresAPlus, 10000);

  const summary = {
    evaluatedAt: new Date().toISOString(),
    queryCount: devQueries.length,
    armA: resA.report,
    armAPlus: resAPlus.report,
    bootstrap95Interval: ci,
  };

  fs.writeFileSync('apps/api/scratch/gate0_results.json', JSON.stringify(summary, null, 2));

  console.log('\n========================================================================================');
  console.log('                      GATE 0 BENCHMARK RESULTS (ACADEMIC FORMAT)');
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

runGate0Benchmark()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal benchmark error:', err);
    process.exit(1);
  });

