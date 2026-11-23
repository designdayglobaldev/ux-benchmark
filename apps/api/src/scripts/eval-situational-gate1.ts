import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { CognitiveSearchEngine } from '../services/search';
import { UX_BENCH_V2_DATASET } from '../benchmark/ux-bench-v2.dataset';
import { calculateDCG, calculateIDCG } from '../benchmark/ux-bench-runner';
import { prisma } from '../db/prisma';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function evalSituational() {
  console.log('======================================================');
  console.log('EVALUATING GATE 1 (SITUATIONAL ScreenFieldEmbedding ROUTE)');
  console.log('Target: 21 In-Domain Situational Queries');
  console.log('======================================================\n');

  const dataset = UX_BENCH_V2_DATASET.filter((q) => q.split === 'dev' && q.intent === 'situational');
  console.log(`Found ${dataset.length} situational queries to evaluate.\n`);

  // Load previous baseline results for comparison
  const previousResultsPath = path.join(__dirname, '../../scratch/arm_a_anchors_results.json');
  let prevRowsMap = new Map<string, any>();
  if (fs.existsSync(previousResultsPath)) {
    const prevData = JSON.parse(fs.readFileSync(previousResultsPath, 'utf8'));
    prevData.rows.forEach((r: any) => prevRowsMap.set(r.id, r));
  }

  const results: any[] = [];

  for (let i = 0; i < dataset.length; i++) {
    const q = dataset[i];
    const prev = prevRowsMap.get(q.id) || {};
    const oldScore = prev.armA_anchors_ndcg ?? prev.armA_ndcg ?? 0;

    console.log(`[${i + 1}/${dataset.length}] Evaluating ${q.id}: "${q.query.slice(0, 50)}..."`);
    const searchRes = await CognitiveSearchEngine.search({
      prompt: q.query,
      limit: 10,
    });

    const targetMap = new Map<string, number>();
    for (const t of q.targets) {
      targetMap.set(`${t.appSlug.toLowerCase()}:::${t.flowSlug.toLowerCase()}`, t.grade);
    }

    const retrievedRel: number[] = [];
    for (const f of searchRes.flows) {
      const key = `${f.appSlug.toLowerCase()}:::${f.flowSlug.toLowerCase()}`;
      retrievedRel.push(targetMap.get(key) || 0);
    }

    const idealRel = q.targets.map((t) => t.grade).sort((a, b) => b - a);
    const dcg = calculateDCG(retrievedRel);
    const idcg = calculateIDCG(idealRel);
    const ndcg = idcg > 0 ? dcg / idcg : 0;

    const diff = ndcg - oldScore;
    const diffSign = diff >= 0 ? '+' : '';
    console.log(`  -> Old nDCG: ${oldScore.toFixed(4)} | New nDCG: ${ndcg.toFixed(4)} (${diffSign}${diff.toFixed(4)})`);
    console.log(`  -> Top 3: ${searchRes.flows.slice(0, 3).map((f) => `${f.appSlug}:${f.flowSlug}`).join(', ')}`);

    results.push({
      id: q.id,
      query: q.query,
      oldNdcg: oldScore,
      newNdcg: ndcg,
      diff,
      topMatches: searchRes.flows.slice(0, 3).map((f) => `${f.appSlug}:${f.flowSlug}`),
    });

    // 1-second pause between queries
    await sleep(1000);
  }

  const meanOld = results.reduce((s, r) => s + r.oldNdcg, 0) / results.length;
  const meanNew = results.reduce((s, r) => s + r.newNdcg, 0) / results.length;
  const netDiff = meanNew - meanOld;

  console.log('\n======================================================');
  console.log('SITUATIONAL RETRIEVAL EVALUATION SUMMARY');
  console.log('======================================================');
  console.log(`Mean Baseline nDCG: ${meanOld.toFixed(4)}`);
  console.log(`Mean New nDCG:      ${meanNew.toFixed(4)}`);
  console.log(`Net Delta:          ${netDiff >= 0 ? '+' : ''}${netDiff.toFixed(4)}`);
  console.log('======================================================');

  fs.writeFileSync(
    path.join(__dirname, '../../scratch/situational_gate1_results.json'),
    JSON.stringify({ meanOld, meanNew, netDiff, results }, null, 2)
  );
}

evalSituational()
  .catch((err) => {
    console.error('Fatal evaluation error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

