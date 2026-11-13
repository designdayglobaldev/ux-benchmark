import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { CognitiveSearchEngine } from '../services/search';
import { UX_BENCH_V2_DATASET, UxBenchQuery } from '../benchmark/ux-bench-v2.dataset';
import { calculateDCG, calculateIDCG } from '../benchmark/ux-bench-runner';
import fs from 'fs';

export const PIPELINE_VERSION = 'v2.0.0-arm_a_baseline';
export const GIT_COMMIT = '2323668a9384d4e2fb45bdd6ce06e411f0390aad';
export const EMBEDDING_MODEL = 'voyage-multimodal-3';
export const RERANK_MODEL = 'rerank-2';

export interface CachedCandidateScreen {
  id: string;
  name: string;
  screenNo: number;
  whereToUse?: string | null;
  whereNotToUse?: string | null;
  evidenceWhoWhy?: string | null;
  keyHighlights?: string | null;
  uiElements?: string[];
}

export interface CachedCandidateFlow {
  appId: string;
  appName: string;
  appSlug: string;
  flowId: string;
  flowName: string;
  flowSlug: string;
  description: string;
  anchorSimilarity: number;
  screens: CachedCandidateScreen[];
}

export interface CachedQueryResult {
  id: string;
  query: string;
  intent: string;
  split: string;
  pipelineVersion: string;
  gitCommit: string;
  embeddingModel: string;
  rerankModel: string;
  retrievedFlows: {
    appSlug: string;
    flowSlug: string;
    score: number;
    rank: number;
    grade: number;
  }[];
  // First-stage candidate cache: reusable for A+, B, Var S without re-running vector/graph retrieval
  firstStageCandidates: CachedCandidateFlow[];
  dcg10: number;
  idcg10: number;
  ndcg10: number | null; // null for out-of-domain queries
  hitAt1: boolean;
  hitAt3: boolean;
  reciprocalRank: number;
  topScore: number;
  durationMs: number;
  evaluatedAt: string;
}

/**
 * Evaluates a query with Arm A (step and screen name only in reranker payload)
 * and preserves first-stage candidates for caching.
 */
export async function evaluateQueryArmAWithCache(query: UxBenchQuery): Promise<CachedQueryResult> {
  const start = Date.now();

  const searchResult = await CognitiveSearchEngine.search({
    prompt: query.query,
    limit: 10,
    injectRationale: false, // Strict Arm A baseline
  });
  const durationMs = Date.now() - start;

  const retrievedFlows = searchResult.flows || [];
  const targetMap = new Map<string, number>();
  for (const t of query.targets) {
    targetMap.set(`${t.appSlug.toLowerCase()}:::${t.flowSlug.toLowerCase()}`, t.grade);
  }

  const scoredFlows: { appSlug: string; flowSlug: string; score: number; rank: number; grade: number }[] = [];
  const relevanceAtRank: number[] = [];
  let firstRelevantRank = 0;

  for (let i = 0; i < retrievedFlows.length; i++) {
    const f = retrievedFlows[i];
    const key = `${f.appSlug.toLowerCase()}:::${f.flowSlug.toLowerCase()}`;
    let grade = targetMap.get(key) || 0;

    if (grade === 0) {
      for (const [targetKey, targetGrade] of targetMap.entries()) {
        const [tApp, tFlow] = targetKey.split(':::');
        if (f.appSlug.toLowerCase() === tApp && f.flowSlug.toLowerCase().includes(tFlow)) {
          grade = Math.max(grade, targetGrade);
        }
      }
    }

    scoredFlows.push({
      appSlug: f.appSlug,
      flowSlug: f.flowSlug,
      score: f.anchorSimilarity,
      rank: i + 1,
      grade,
    });
    relevanceAtRank.push(grade);
    if (grade > 0 && firstRelevantRank === 0) {
      firstRelevantRank = i + 1;
    }
  }

  const dcg10 = calculateDCG(relevanceAtRank, 10);
  const idcg10 = query.targets.length > 0 ? calculateIDCG(query.targets, 10) : 0;

  // Strict Rule: Out-of-Domain queries are EXCLUDED from nDCG (scored separately for calibration)
  const isOod = query.intent === 'out_of_domain';
  const ndcg10 = isOod ? null : idcg10 > 0 ? Math.min(1.0, dcg10 / idcg10) : 0;

  const cachedCandidates: CachedCandidateFlow[] = retrievedFlows.map((f) => ({
    appId: f.appId,
    appName: f.appName,
    appSlug: f.appSlug,
    flowId: f.flowId,
    flowName: f.flowName,
    flowSlug: f.flowSlug,
    description: f.description,
    anchorSimilarity: f.anchorSimilarity,
    screens: f.screens.map((s) => ({
      id: s.id,
      name: s.name,
      screenNo: s.screenNo,
      whereToUse: s.whereToUse,
      whereNotToUse: s.whereNotToUse,
      evidenceWhoWhy: s.evidenceWhoWhy,
      keyHighlights: s.keyHighlights,
      uiElements: s.uiElements,
    })),
  }));

  return {
    id: query.id,
    query: query.query,
    intent: query.intent,
    split: query.split,
    pipelineVersion: PIPELINE_VERSION,
    gitCommit: GIT_COMMIT,
    embeddingModel: EMBEDDING_MODEL,
    rerankModel: RERANK_MODEL,
    retrievedFlows: scoredFlows,
    firstStageCandidates: cachedCandidates,
    dcg10,
    idcg10,
    ndcg10,
    hitAt1: firstRelevantRank === 1,
    hitAt3: firstRelevantRank >= 1 && firstRelevantRank <= 3,
    reciprocalRank: firstRelevantRank > 0 ? 1 / firstRelevantRank : 0,
    topScore: retrievedFlows[0]?.anchorSimilarity || 0,
    durationMs,
    evaluatedAt: new Date().toISOString(),
  };
}

