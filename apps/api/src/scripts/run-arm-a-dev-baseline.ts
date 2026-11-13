import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { UX_BENCH_V2_DATASET } from '../benchmark/ux-bench-v2.dataset';
import { evaluateQueryArmAWithCache, CachedQueryResult, PIPELINE_VERSION, GIT_COMMIT } from '../benchmark/arm-a-evaluator';
import fs from 'fs';

async function runArmABackground() {
  console.log('========================================================================================');
  console.log('   UX-BENCH v2: BACKGROUND BASELINE EVALUATION FOR ARM A (DEV SPLIT: QUERIES 11 TO 90)');
  console.log('========================================================================================\n');

  console.log(`Pipeline Version: ${PIPELINE_VERSION}`);
  console.log(`Git Commit:       ${GIT_COMMIT}`);
  console.log(`Embedding Model:  voyage-multimodal-3`);
  console.log(`Reranker Model:   rerank-2`);

  // Target queries 11 through 90 (the remaining Dev split)
  const devRemaining = UX_BENCH_V2_DATASET.filter((q) => q.split === 'dev').slice(10);
  console.log(`Remaining Dev Queries to process: ${devRemaining.length} (UXB-011 to UXB-090)\n`);

  const checkpointFile = 'apps/api/scratch/arm_a_dev_checkpoint.json';
  let checkpoint: {
    pipelineVersion: string;
    gitCommit: string;
    results: CachedQueryResult[];
  } = {
    pipelineVersion: PIPELINE_VERSION,
    gitCommit: GIT_COMMIT,
    results: [],
  };

  // Safe Resume: Check version match before resuming
  if (fs.existsSync(checkpointFile)) {
    try {
      const raw = JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
      if (raw.pipelineVersion === PIPELINE_VERSION && raw.gitCommit === GIT_COMMIT) {
        checkpoint = raw;
        console.log(`✅ Verified checkpoint: Resuming from ${checkpoint.results.length} previously saved queries.`);
      } else {
        console.warn(`⚠️ Version mismatch in checkpoint (${raw.pipelineVersion} vs ${PIPELINE_VERSION}). Starting fresh.`);
      }
    } catch (e) {
      console.warn('Could not read existing checkpoint. Starting fresh.');
    }
  }

  const completedIds = new Set(checkpoint.results.map((r) => r.id));
  const queriesToRun = devRemaining.filter((q) => !completedIds.has(q.id));
  const cooldownMs = 21000;

  for (let i = 0; i < queriesToRun.length; i++) {
    const q = queriesToRun[i];
    const totalDone = checkpoint.results.length + 1;
    process.stdout.write(`[${totalDone}/80] [${q.intent.toUpperCase()}] ${q.id}: "${q.query.slice(0, 38)}"... `);

    try {
      const res = await evaluateQueryArmAWithCache(q);
      checkpoint.results.push(res);

      // Write atomically after each query
      fs.writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2));

      const isOod = q.intent === 'out_of_domain';
      const statusIcon = isOod
        ? `🛡️ OOD (Top Score: ${res.topScore.toFixed(3)})`
        : res.hitAt1
        ? `🌟 Hit@1 (nDCG: ${res.ndcg10?.toFixed(3)})`
        : res.hitAt3
        ? `✅ Hit@3 (nDCG: ${res.ndcg10?.toFixed(3)})`
        : `❌ Miss (nDCG: ${res.ndcg10?.toFixed(3)})`;

      console.log(`${statusIcon} | Latency: ${res.durationMs}ms`);
    } catch (err: any) {
      console.log(`❌ ERROR on ${q.id}: ${err.message}`);
    }

    if (i < queriesToRun.length - 1) {
      await new Promise((r) => setTimeout(r, cooldownMs));
    }
  }

  console.log('\n========================================================================================');
  console.log('                 ARM A DEV BASELINE COMPLETE (ALL 90 DEV QUERIES)');
  console.log('========================================================================================\n');

  // Compute final Dev baseline metrics excluding OOD queries
  const inDomainResults = checkpoint.results.filter((r) => r.intent !== 'out_of_domain');
  const oodResults = checkpoint.results.filter((r) => r.intent === 'out_of_domain');

  const meanNdcg10 = inDomainResults.reduce((acc, r) => acc + (r.ndcg10 || 0), 0) / inDomainResults.length;
  const hitAt1Rate = (inDomainResults.filter((r) => r.hitAt1).length / inDomainResults.length) * 100;
  const hitAt3Rate = (inDomainResults.filter((r) => r.hitAt3).length / inDomainResults.length) * 100;

  console.log(`In-Domain Dev Queries: ${inDomainResults.length}`);
  console.log(`Mean nDCG@10 (In-Domain): ${meanNdcg10.toFixed(3)}`);
  console.log(`Hit@1 Rate: ${hitAt1Rate.toFixed(1)}%`);
  console.log(`Hit@3 Rate: ${hitAt3Rate.toFixed(1)}%`);
  console.log(`Out-of-Domain Count: ${oodResults.length} (Saved for isotonic calibration in Phase 2)`);
  console.log('========================================================================================\n');
}

runArmABackground()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal Arm A baseline error:', e);
    process.exit(1);
  });

