import fs from 'fs';
import path from 'path';

interface EvalResult {
  id: string;
  query: string;
  intent: string;
  split: string;
  pipelineVersion: string;
  gitCommit: string;
  embeddingModel: string;
  rerankModel: string;
  retrievedFlows: any[];
  firstStageCandidates: any[];
  dcg10: number;
  idcg10: number;
  ndcg10: number | null;
  hitAt1: boolean;
  hitAt3: boolean;
  reciprocalRank: number;
  topScore: number;
  durationMs: number;
  evaluatedAt: string;
}

function bootstrapCI(values: number[], iterations: number = 10000, alpha: number = 0.05): [number, number] {
  const n = values.length;
  const sampleMeans: number[] = new Array(iterations);
  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      const idx = Math.floor(Math.random() * n);
      sum += values[idx];
    }
    sampleMeans[i] = sum / n;
  }
  sampleMeans.sort((a, b) => a - b);
  const lowerIdx = Math.floor((alpha / 2) * iterations);
  const upperIdx = Math.floor((1 - alpha / 2) * iterations);
  return [sampleMeans[lowerIdx], sampleMeans[upperIdx]];
}

async function main() {
  const calPath = path.join(__dirname, '../../scratch/arm_a_noise_calibration.json');
  const cpPath = path.join(__dirname, '../../scratch/arm_a_dev_checkpoint.json');
  const outPath = path.join(__dirname, '../../scratch/arm_a_full_dev_baseline.json');

  const calData = JSON.parse(fs.readFileSync(calPath, 'utf8'));
  const cpData = JSON.parse(fs.readFileSync(cpPath, 'utf8'));

  const pass2Results: EvalResult[] = calData.pass2;
  const remainingResults: EvalResult[] = cpData.results;

  console.log(`Loaded ${pass2Results.length} queries from pass2 (1..10)`);
  console.log(`Loaded ${remainingResults.length} queries from checkpoint (11..90)`);

  const fullResults: EvalResult[] = [...pass2Results, ...remainingResults];
  console.log(`Combined total: ${fullResults.length} queries (UXB-001 to UXB-090)`);

  // Verify uniqueness of IDs
  const idSet = new Set(fullResults.map(r => r.id));
  if (idSet.size !== 90) {
    throw new Error(`Expected exactly 90 unique queries, got ${idSet.size}`);
  }

  const inDomain = fullResults.filter(r => r.ndcg10 !== null);
  const outOfDomain = fullResults.filter(r => r.ndcg10 === null);

  console.log(`In-domain: ${inDomain.length}, Out-of-Domain: ${outOfDomain.length}`);

  const ndcgs = inDomain.map(r => r.ndcg10 as number);
  const meanNdcg10 = ndcgs.reduce((a, b) => a + b, 0) / ndcgs.length;
  const hit1Rate = (inDomain.filter(r => r.hitAt1).length / inDomain.length) * 100;
  const hit3Rate = (inDomain.filter(r => r.hitAt3).length / inDomain.length) * 100;
  const mrr = inDomain.reduce((a, r) => a + r.reciprocalRank, 0) / inDomain.length;
  const meanLatency = fullResults.reduce((a, r) => a + r.durationMs, 0) / fullResults.length;

  const [ciLower, ciUpper] = bootstrapCI(ndcgs, 10000, 0.05);

  const byIntent: Record<string, { count: number; meanNdcg10: number; hit1: number; hit3: number }> = {};
  const intents = ['flow', 'situational', 'component', 'compare'];

  for (const intent of intents) {
    const subset = inDomain.filter(r => r.intent === intent);
    if (subset.length > 0) {
      const sNdcg = subset.map(r => r.ndcg10 as number).reduce((a, b) => a + b, 0) / subset.length;
      const sHit1 = (subset.filter(r => r.hitAt1).length / subset.length) * 100;
      const sHit3 = (subset.filter(r => r.hitAt3).length / subset.length) * 100;
      byIntent[intent] = {
        count: subset.length,
        meanNdcg10: sNdcg,
        hit1: sHit1,
        hit3: sHit3
      };
    }
  }

  const finalOutput = {
    pipelineVersion: 'v2.0.0-arm_a_baseline',
    gitCommit: '2323668a9384d4e2fb45bdd6ce06e411f0390aad',
    evaluatedAt: new Date().toISOString(),
    totalQueries: fullResults.length,
    inDomainCount: inDomain.length,
    outOfDomainCount: outOfDomain.length,
    aggregate: {
      meanNdcg10,
      bootstrap95CI: [ciLower, ciUpper],
      hitAt1Rate: hit1Rate,
      hitAt3Rate: hit3Rate,
      mrr,
      meanLatencyMs: meanLatency
    },
    byIntent,
    results: fullResults
  };

  fs.writeFileSync(outPath, JSON.stringify(finalOutput, null, 2), 'utf8');
  // Also write back to arm_a_dev_checkpoint.json as the unified standard
  fs.writeFileSync(cpPath, JSON.stringify(finalOutput, null, 2), 'utf8');

  console.log('\n======================================================');
  console.log('   UNIFIED ARM A FULL DEV SPLIT BASELINE (N=90)');
  console.log('======================================================');
  console.log(`In-Domain Queries:     ${inDomain.length}`);
  console.log(`Mean nDCG@10:          ${meanNdcg10.toFixed(4)}`);
  console.log(`95% Bootstrap CI:      [${ciLower.toFixed(4)}, ${ciUpper.toFixed(4)}]`);
  console.log(`Hit@1 Rate:            ${hit1Rate.toFixed(1)}%`);
  console.log(`Hit@3 Rate:            ${hit3Rate.toFixed(1)}%`);
  console.log(`MRR:                   ${mrr.toFixed(4)}`);
  console.log(`Mean Latency:          ${Math.round(meanLatency)}ms`);
  console.log('------------------------------------------------------');
  console.log('Intent Breakdown:');
  for (const [intent, stats] of Object.entries(byIntent)) {
    console.log(`  ${intent.padEnd(12)}: count=${stats.count}, mean_nDCG@10=${stats.meanNdcg10.toFixed(4)}, Hit@1=${stats.hit1.toFixed(1)}%, Hit@3=${stats.hit3.toFixed(1)}%`);
  }
  console.log('======================================================\n');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

