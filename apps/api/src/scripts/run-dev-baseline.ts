import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { UX_BENCH_V2_DATASET, UxBenchQuery } from '../benchmark/ux-bench-v2.dataset';
import { UxBenchV2Runner, computePairedBootstrapInterval } from '../benchmark/ux-bench-runner';

// Target only the 41 fully indexed Dev queries (zero unindexed targets)
const missingByFlow: Record<string, number> = {
  'wealthfront:::setting-up': 8,
  'cleo:::chatting-sending-messages': 7,
  'cred:::onboarding': 5,
  'wealthfront:::transferring-money': 4,
  'cred:::redeeming': 4,
  'airtable:::fields-tutorial': 4,
  'cred:::transferring-money': 4,
  'shazam:::listening-to-audio': 3,
  'arc-search:::searching-finding': 3,
  'apple-wallet:::setting-up': 2,
  'brex:::adding-a-receipt': 2,
  'brex:::requesting-new-spend-limit': 2,
  'brilliant:::completing-the-first-lesson': 2,
  'cash-app:::dashboard': 2,
  'cleo:::reviewing-rating': 2,
  'dave:::giving-feedbacks': 2,
  'figma:::adding-a-comment': 2,
  'google-pay:::redeeming': 2,
  'linear:::creating-an-issue': 2,
  'oportun:::onboarding': 2,
  'oportun:::setting-up': 2,
  'revolut:::onboarding': 2,
  'shazam:::searching-finding': 2,
  'venmo:::transferring-money': 2,
  'wealthfront:::logging-tracking': 2
};

function getFullyIndexedDevQueries(): UxBenchQuery[] {
  const devQueries = UX_BENCH_V2_DATASET.filter((q) => q.split === 'dev');
  return devQueries.filter((q) => {
    if (q.intent === 'out_of_domain') return true;
    for (const t of q.targets) {
      if (missingByFlow[`${t.appSlug}:::${t.flowSlug}`]) return false;
    }
    return true;
  });
}

async function runDevBaseline() {
  console.log('========================================================================================');
  console.log('   UX-BENCH v2: INTERIM DEV SPLIT EVALUATION (ARM A vs ARM A+)');
  console.log('========================================================================================\n');

  // We sample 20 fully indexed queries representing all 5 intent buckets (Flow, Situational, Component, Compare, OOD)
  // to avoid hitting Voyage 429 rate limits while GitHub Action is running
  const fullyIndexed = getFullyIndexedDevQueries();
  console.log(`Discovered ${fullyIndexed.length} fully indexed queries in Dev split.`);

  const balancedSubset: UxBenchQuery[] = [
    // Flow
    ...fullyIndexed.filter((q) => q.intent === 'flow').slice(0, 4),
    // Situational
    ...fullyIndexed.filter((q) => q.intent === 'situational').slice(0, 4),
    // Component
    ...fullyIndexed.filter((q) => q.intent === 'component').slice(0, 4),
    // Compare
    ...fullyIndexed.filter((q) => q.intent === 'compare').slice(0, 3),
    // Out-of-Domain
    ...fullyIndexed.filter((q) => q.intent === 'out_of_domain').slice(0, 3),
  ];

  console.log(`Executing paired evaluation on ${balancedSubset.length} balanced benchmark queries across Arm A and Arm A+...\n`);

  // Run Arm A (Dense baseline without UX rationale injection)
  console.log('>>> [1/2] EVALUATING ARM A (Dense Baseline: Step & Screen Name Only)...');
  const resA = await UxBenchV2Runner.evaluateArm(balancedSubset, 'ARM_A', { cooldownMs: 2000 });

  // Run Arm A+ (With full whereToUse, whereNotToUse, and component rationale)
  console.log('\n>>> [2/2] EVALUATING ARM A+ (With UX Rationale Injection)...');
  const resAPlus = await UxBenchV2Runner.evaluateArm(balancedSubset, 'ARM_A_PLUS', { cooldownMs: 2000 });

  // Compute paired bootstrap confidence interval for nDCG@10 delta
  const scoresA = resA.rowResults.map((r) => r.ndcg10);
  const scoresAPlus = resAPlus.rowResults.map((r) => r.ndcg10);
  const ci = computePairedBootstrapInterval(scoresA, scoresAPlus, 10000);

  console.log('\n========================================================================================');
  console.log('               PHASE 0 INTERIM ABLATION RESULTS (ARM A vs ARM A+)');
  console.log('========================================================================================\n');

  console.log('| Metric | Arm A (Dense Baseline) | Arm A+ (Rationale Injected) | Delta (A+ - A) |');
  console.log('| :--- | :---: | :---: | :---: |');
  console.log(`| **nDCG@10 (Primary)** | **${resA.report.meanNdcg10.toFixed(3)}** | **${resAPlus.report.meanNdcg10.toFixed(3)}** | **${(resAPlus.report.meanNdcg10 - resA.report.meanNdcg10 >= 0 ? '+' : '')}${(resAPlus.report.meanNdcg10 - resA.report.meanNdcg10).toFixed(3)}** |`);
  console.log(`| **Hit@1 (Top-1 Accuracy)** | ${resA.report.hitAt1Rate.toFixed(1)}% | ${resAPlus.report.hitAt1Rate.toFixed(1)}% | ${(resAPlus.report.hitAt1Rate - resA.report.hitAt1Rate >= 0 ? '+' : '')}${(resAPlus.report.hitAt1Rate - resA.report.hitAt1Rate).toFixed(1)}% |`);
  console.log(`| **Hit@3 (Top-3 Accuracy)** | ${resA.report.hitAt3Rate.toFixed(1)}% | ${resAPlus.report.hitAt3Rate.toFixed(1)}% | ${(resAPlus.report.hitAt3Rate - resA.report.hitAt3Rate >= 0 ? '+' : '')}${(resAPlus.report.hitAt3Rate - resA.report.hitAt3Rate).toFixed(1)}% |`);
  console.log(`| **MRR** | ${resA.report.mrr.toFixed(3)} | ${resAPlus.report.mrr.toFixed(3)} | ${(resAPlus.report.mrr - resA.report.mrr >= 0 ? '+' : '')}${(resAPlus.report.mrr - resA.report.mrr).toFixed(3)} |`);
  console.log(`| **Mean Latency per Query** | ${Math.round(resA.report.meanLatencyMs)}ms | ${Math.round(resAPlus.report.meanLatencyMs)}ms | ${Math.round(resAPlus.report.meanLatencyMs - resA.report.meanLatencyMs)}ms |`);
  console.log(`| **95% Paired Bootstrap CI** | - | - | **[${ci[0].toFixed(3)}, ${ci[1].toFixed(3)}]** |`);

  console.log('\n--- INTENT BUCKET BREAKDOWN ---');
  for (const intent in resAPlus.report.intentBreakdown) {
    const a = resA.report.intentBreakdown[intent]?.ndcg10 || 0;
    const aPlus = resAPlus.report.intentBreakdown[intent]?.ndcg10 || 0;
    console.log(`   - ${intent.toUpperCase().padEnd(14)}: Arm A nDCG@10 = ${a.toFixed(3)}  -->  Arm A+ nDCG@10 = ${aPlus.toFixed(3)} (Delta: ${(aPlus - a >= 0 ? '+' : '')}${(aPlus - a).toFixed(3)})`);
  }

  console.log('\n========================================================================================\n');
}

runDevBaseline()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal benchmark error:', err);
    process.exit(1);
  });

