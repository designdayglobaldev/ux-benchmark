import { VectorEngine } from './vector-engine';
import { GraphWalkEngine } from './graph-walk';
import { FlowStitcher } from './flow-stitcher';
import { IntentBalancer } from './intent-balancer';
import type {
  CognitiveRetrievalParams,
  CognitiveSearchResult,
  RetrievedCandidateFlow,
  RetrievedApp,
} from './types';

export * from './types';
export { VectorEngine } from './vector-engine';
export { GraphWalkEngine } from './graph-walk';
export { FlowStitcher } from './flow-stitcher';
export { IntentBalancer } from './intent-balancer';

export class CognitiveSearchEngine {
  /**
   * Main High-Level Search Pipeline:
   * 1. Multi-Intent Balancing: splits "A or B" / "X vs Y" into balanced sub-queries.
   * 2. Dense Vector Retrieval: Voyage-3 + HNSW pgvector.
   * 3. Graph Walk: Spreading activation across FLOW_SEQUENCE & SHARED_PATTERN edges.
   * 4. Contiguous Flow Stitching: Fills step gaps for uninterrupted user journeys.
   */
  public static async search(params: CognitiveRetrievalParams): Promise<CognitiveSearchResult> {
    const { prompt, limit = 4 } = params;
    const subQueries = IntentBalancer.splitPromptIntents(prompt);

    const aggregatedFlows: RetrievedCandidateFlow[] = [];
    const aggregatedApps: RetrievedApp[] = [];
    const rawAnchors: any[] = [];
    const seenFlowKeys = new Set<string>();
    const seenAppIds = new Set<string>();

    const perQueryLimit = subQueries.length > 1 ? Math.max(2, Math.floor(limit / subQueries.length)) : limit;

    for (const q of subQueries) {
      try {
        // 1. Embed query
        const vector = await VectorEngine.embedQuery(q);
        const vectorJson = JSON.stringify(vector);

        // 2. Dense vector searches (App & Screen levels in parallel)
        const [apps, seedScreens] = await Promise.all([
          VectorEngine.searchApps(vectorJson, 6),
          VectorEngine.searchAnchorScreens(vectorJson, 14),
        ]);

        seedScreens.forEach((s) => rawAnchors.push(s));

        // 3. Spreading activation graph walk
        const anchorIds = seedScreens.map((s) => s.id);
        const activatedNodes = await GraphWalkEngine.walk(anchorIds, 50);

        // 4. Contiguous flow stitching (reconstruct complete flows)
        const candidateFlows = await FlowStitcher.stitchFlows(seedScreens, activatedNodes, perQueryLimit);

        for (const f of candidateFlows) {
          const key = `${f.appId}:::${f.flowId}`;
          if (!seenFlowKeys.has(key)) {
            seenFlowKeys.add(key);
            aggregatedFlows.push(f);
          }
        }

        for (const a of apps) {
          if (!seenAppIds.has(a.id)) {
            seenAppIds.add(a.id);
            aggregatedApps.push(a);
          }
        }
      } catch (err) {
        console.warn(`[CognitiveSearchEngine] Subquery failed for "${q}":`, err);
      }
    }

    return {
      apps: aggregatedApps.slice(0, 10),
      flows: aggregatedFlows.slice(0, limit),
      rawAnchors: rawAnchors.slice(0, 8),
    };
  }
}

