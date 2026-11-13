import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { UX_BENCH_V2_DATASET } from '../benchmark/ux-bench-v2.dataset';
import { UxBenchV2Runner, QueryMetricResult } from '../benchmark/ux-bench-runner';
import fs from 'fs';

async function runArmABackground() {
  console.log('========================================================================================');
  console.log('       UX-BENCH v2: UNATTENDED ARM A BACKGROUND BASELINE RUN (QUERIES 11 TO 90)');
  console.log('========================================================================================\n');

  // Load queries 11 through 90 (the remaining Dev split)
  const devRemaining = UX_BENCH_V2_DATASET.filter((q) => q.split === 'dev').slice(10);
  console.log(`Executing Arm A on ${devRemaining.length} remaining Dev queries (UXB-011 through UXB-090)...`);

  const checkpointFile = 'apps/api/scratch/arm_a_dev_remaining_checkpoint.json';
  let completedResults: QueryMetricResult[] = [];

  if (fs.existsSync(checkpointFile)) {
    try {
      completedResults = JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
      console.log(`Resuming from existing checkpoint: ${completedResults.length} queries already completed.`);
    } catch (e) {
      completedResults = [];
    }
  }

  const completedIds = new Set(completedResults.map((r) => r.id));
  const queriesToRun = devRemaining.filter((q) => !completedIds.has(q.id));

  const cooldownMs = 21000;

  for (let i = 0; i < queriesToRun.length; i++) {
    const q = queriesToRun[i];
    process.stdout.write(`[${completedResults.length + 1}/${devRemaining.length}] [${q.intent.toUpperCase()}] ${q.id}: "${q.query.slice(0, 40)}"... `);

    try {
      const res = await UxBenchV2Runner.evaluateQuery(q, 'ARM_A');
      completedResults.push(res);
      fs.writeFileSync(checkpointFile, JSON.stringify(completedResults, null, 2));

      const icon = res.hitAt1 ? '🌟 Hit@1' : res.hitAt3 ? '✅ Hit@3' : res.intent === 'out_of_domain' && res.ndcg10 === 1 ? '🛡️ Clean Abstain' : '❌ Miss';
      console.log(`${icon} | nDCG@10: ${res.ndcg10.toFixed(3)} | Latency: ${res.durationMs}ms`);
    } catch (err: any) {
      console.log(`❌ ERROR: ${err.message}`);
    }

    if (i < queriesToRun.length - 1) {
      await new Promise((r) => setTimeout(r, cooldownMs));
    }
  }

  // Load first 10 results to combine into full 90 Dev results
  let first10Rows: any[] = [];
  const p1Path = 'apps/api/scratch/first_10_results.json';
  if (fs.existsSync(p1Path)) {
    const raw = JSON.parse(fs.readFileSync(p1Path, 'utf8'));
    first10Rows = raw.armA ? raw.armA : [];
  }

  const all90Results = {
    evaluatedAt: new Date().toISOString(),
    totalQueries: completedResults.length + 10,
    devRemainingResults: completedResults,
  };
  fs.writeFileSync('apps/api/scratch/arm_a_full_dev_results.json', JSON.stringify(all90Results, null, 2));

  console.log('\n========================================================================================');
  console.log('             ARM A FULL DEV BASELINE RUN COMPLETE (90 QUERIES)');
  console.log('========================================================================================\n');
}

runArmABackground()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal Arm A baseline error:', e);
    process.exit(1);
  });

