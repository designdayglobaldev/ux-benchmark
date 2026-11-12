import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { CognitiveSearchEngine } from '../services/search';
import { UX_BENCH_V2_DATASET, UxBenchQuery } from '../benchmark/ux-bench-v2.dataset';

export type BenchmarkArm = 'ARM_A' | 'ARM_A_PLUS';

export interface QueryMetricResult {
  id: string;
  query: string;
  intent: string;
  split: string;
  targetCount: number;
  dcg10: number;
  idcg10: number;
  ndcg10: number;
  hitAt1: boolean;
  hitAt3: boolean;
  reciprocalRank: number;
  topScore: number;
  predictedTopFlow: string;
  durationMs: number;
}

export interface ArmEvaluationReport {
  arm: BenchmarkArm;
  queryCount: number;
  meanNdcg10: number;
  meanNdcg3: number;
  hitAt1Rate: number;
  hitAt3Rate: number;
  mrr: number;
  meanLatencyMs: number;
  bootstrapConfidenceInterval: [number, number]; // 95% paired bootstrap interval
  intentBreakdown: Record<string, { ndcg10: number; hitAt1: number; hitAt3: number; count: number }>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculates Discounted Cumulative Gain at rank K
 * Graded relevance: 0 = Wrong, 1 = Useful, 2 = Ideal
 * DCG@K = sum_{i=1}^K (2^{rel_i} - 1) / log2(i + 1)
 */
export function calculateDCG(relevanceScores: number[], k: number = 10): number {
  let dcg = 0;
  const limit = Math.min(relevanceScores.length, k);
  for (let i = 0; i < limit; i++) {
    const rel = relevanceScores[i];
    const gain = Math.pow(2, rel) - 1;
    const discount = Math.log2(i + 2); // i=0 -> rank 1 -> log2(2) = 1
    dcg += gain / discount;
  }
  return dcg;
}

/**
 * Calculates Ideal DCG given ground truth targets
 */
export function calculateIDCG(targets: { grade: number }[], k: number = 10): number {
  const sortedGrades = targets.map((t) => t.grade).sort((a, b) => b - a);
  return calculateDCG(sortedGrades, k);
}

/**
 * Computes paired bootstrap 95% confidence interval for metric difference (Arm A+ minus Arm A)
 * Uses B=10,000 iterations per Section 8.2 of the specification
 */
export function computePairedBootstrapInterval(
  scoresA: number[],
  scoresB: number[],
  B: number = 10000
): [number, number] {
  const n = scoresA.length;
  if (n === 0 || scoresA.length !== scoresB.length) return [0, 0];

  const diffs: number[] = new Array(B);
  for (let b = 0; b < B; b++) {
    let sampleDiffSum = 0;
    for (let i = 0; i < n; i++) {
      const randIdx = Math.floor(Math.random() * n);
      sampleDiffSum += scoresB[randIdx] - scoresA[randIdx];
    }
    diffs[b] = sampleDiffSum / n;
  }

  diffs.sort((a, b) => a - b);
  const lowerIdx = Math.floor(B * 0.025);
  const upperIdx = Math.floor(B * 0.975);
  return [diffs[lowerIdx], diffs[upperIdx]];
}

export class UxBenchV2Runner {
  /**
   * Evaluates a single query against the cognitive retrieval engine for a given Arm
   */
  public static async evaluateQuery(query: UxBenchQuery, arm: BenchmarkArm): Promise<QueryMetricResult> {
    const start = Date.now();
    const isRationaleInjected = arm === 'ARM_A_PLUS';

    const searchResult = await CognitiveSearchEngine.search({
      prompt: query.query,
      limit: 10,
      injectRationale: isRationaleInjected,
    });
    const durationMs = Date.now() - start;

    const retrievedFlows = searchResult.flows || [];
    const targetMap = new Map<string, number>();
    for (const t of query.targets) {
      targetMap.set(`${t.appSlug.toLowerCase()}:::${t.flowSlug.toLowerCase()}`, t.grade);
    }

    // Determine relevance grade at each retrieved rank (1 to 10)
    const relevanceAtRank: number[] = [];
    let firstRelevantRank = 0;

    for (let i = 0; i < retrievedFlows.length; i++) {
      const f = retrievedFlows[i];
      const key = `${f.appSlug.toLowerCase()}:::${f.flowSlug.toLowerCase()}`;
      let grade = targetMap.get(key) || 0;

      // Partial fallback check on flowSlug prefix
      if (grade === 0) {
        for (const [targetKey, targetGrade] of targetMap.entries()) {
          const [tApp, tFlow] = targetKey.split(':::');
          if (f.appSlug.toLowerCase() === tApp && f.flowSlug.toLowerCase().includes(tFlow)) {
            grade = Math.max(grade, targetGrade);
          }
        }
      }

      relevanceAtRank.push(grade);
      if (grade > 0 && firstRelevantRank === 0) {
        firstRelevantRank = i + 1;
      }
    }

    // Out-of-Domain queries: clean abstention is rewarded (top score < threshold or empty target)
    let ndcg10 = 0;
    const dcg10 = calculateDCG(relevanceAtRank, 10);
    const idcg10 = query.targets.length > 0 ? calculateIDCG(query.targets, 10) : 0;

    if (query.intent === 'out_of_domain') {
      // Clean abstention check
      const topScore = retrievedFlows[0]?.anchorSimilarity || 0;
      // High score on OOD is penalized (hallucination)
      ndcg10 = topScore < 0.5 ? 1.0 : 0.0;
    } else {
      ndcg10 = idcg10 > 0 ? dcg10 / idcg10 : 0;
    }

    return {
      id: query.id,
      query: query.query,
      intent: query.intent,
      split: query.split,
      targetCount: query.targets.length,
      dcg10,
      idcg10,
      ndcg10: Math.min(1.0, ndcg10),
      hitAt1: firstRelevantRank === 1,
      hitAt3: firstRelevantRank >= 1 && firstRelevantRank <= 3,
      reciprocalRank: firstRelevantRank > 0 ? 1 / firstRelevantRank : 0,
      topScore: retrievedFlows[0]?.anchorSimilarity || 0,
      predictedTopFlow: retrievedFlows[0] ? `${retrievedFlows[0].appSlug}:${retrievedFlows[0].flowSlug}` : 'none',
      durationMs,
    };
  }

  /**
   * Executes a full benchmark arm evaluation
   */
  public static async evaluateArm(
    dataset: UxBenchQuery[],
    arm: BenchmarkArm,
    options: { cooldownMs?: number } = {}
  ): Promise<{ report: ArmEvaluationReport; rowResults: QueryMetricResult[] }> {
    const cooldownMs = options.cooldownMs ?? 0;
    const rowResults: QueryMetricResult[] = [];
    console.log(`\n========================================================================================`);
    console.log(`  BENCHMARK SUITE: RUNNING ${arm} OVER ${dataset.length} UX-BENCH QUERIES`);
    console.log(`========================================================================================\n`);

    for (let i = 0; i < dataset.length; i++) {
      const q = dataset[i];
      process.stdout.write(`[${i + 1}/${dataset.length}] [${q.intent.toUpperCase()}] ${q.id}: "${q.query.slice(0, 48)}"... `);
      try {
        const res = await this.evaluateQuery(q, arm);
        rowResults.push(res);
        const icon = res.hitAt1 ? '🌟 Hit@1' : res.hitAt3 ? '✅ Hit@3' : res.intent === 'out_of_domain' && res.ndcg10 === 1 ? '🛡️ Clean Abstain' : '❌ Miss';
        console.log(`${icon} | nDCG@10: ${res.ndcg10.toFixed(3)} | Latency: ${res.durationMs}ms`);
      } catch (err: any) {
        console.log(`❌ ERROR: ${err.message}`);
      }

      if (cooldownMs > 0 && i < dataset.length - 1) {
        await sleep(cooldownMs);
      }
    }

    // Compute aggregate metrics
    const n = rowResults.length;
    const meanNdcg10 = rowResults.reduce((acc, r) => acc + r.ndcg10, 0) / n;
    const hitAt1Rate = (rowResults.filter((r) => r.hitAt1).length / n) * 100;
    const hitAt3Rate = (rowResults.filter((r) => r.hitAt3).length / n) * 100;
    const mrr = rowResults.reduce((acc, r) => acc + r.reciprocalRank, 0) / n;
    const meanLatencyMs = rowResults.reduce((acc, r) => acc + r.durationMs, 0) / n;

    // Intent breakdown
    const intentBreakdown: Record<string, { ndcg10: number; hitAt1: number; hitAt3: number; count: number }> = {};
    for (const r of rowResults) {
      if (!intentBreakdown[r.intent]) {
        intentBreakdown[r.intent] = { ndcg10: 0, hitAt1: 0, hitAt3: 0, count: 0 };
      }
      const entry = intentBreakdown[r.intent];
      entry.count++;
      entry.ndcg10 += r.ndcg10;
      if (r.hitAt1) entry.hitAt1++;
      if (r.hitAt3) entry.hitAt3++;
    }
    for (const k in intentBreakdown) {
      const e = intentBreakdown[k];
      e.ndcg10 = e.ndcg10 / e.count;
      e.hitAt1 = (e.hitAt1 / e.count) * 100;
      e.hitAt3 = (e.hitAt3 / e.count) * 100;
    }

    const report: ArmEvaluationReport = {
      arm,
      queryCount: n,
      meanNdcg10,
      meanNdcg3: 0,
      hitAt1Rate,
      hitAt3Rate,
      mrr,
      meanLatencyMs,
      bootstrapConfidenceInterval: [0, 0],
      intentBreakdown,
    };

    return { report, rowResults };
  }
}

