import { VectorEngine } from './vector-engine';
import { GraphWalkEngine } from './graph-walk';
import { FlowStitcher } from './flow-stitcher';
import { IntentBalancer } from './intent-balancer';
import { RerankEngine } from './rerank-engine';
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
export { RerankEngine } from './rerank-engine';
export { FlowDocumentService } from './flow-document.service';

export class CognitiveSearchEngine {
  /**
   * Main High-Level Search Pipeline:
   * 1. Multi-Intent Balancing: splits "A or B" / "X vs Y" into balanced sub-queries.
   * 2. Dense Vector Retrieval: Voyage-multimodal-3 + HNSW pgvector.
   * 3. Graph Walk: Spreading activation across FLOW_SEQUENCE & SHARED_PATTERN edges.
   * 4. Contiguous Flow Stitching: Fills step gaps for uninterrupted user journeys.
   * 5. Cross-Encoder Re-Ranking: Voyage rerank-2 elevates candidate flows and anchors to 90%+ precision.
   */
  public static async search(params: CognitiveRetrievalParams): Promise<CognitiveSearchResult> {
    const { prompt, limit = 4, injectRationale = true } = params;
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
        // Keep top candidate flows capped to stay well under Voyage's 10k TPM limit
        const candidateFlows = await FlowStitcher.stitchFlows(seedScreens, activatedNodes, Math.min(5, perQueryLimit * 2));

        // 5. Cross-Encoder Re-Ranking (rerank-2)
        let rankedFlows = candidateFlows;
        if (candidateFlows.length > 1) {
          const flowCandidates = candidateFlows.map((f) => {
            // Arm A-anchors: Prioritize query-matched anchor screens, then fill with context steps
            // preserving natural chronological step order
            const anchors = f.screens.filter((s) => s.isAnchor);
            const nonAnchors = f.screens.filter((s) => !s.isAnchor);
            const selected = [...anchors, ...nonAnchors].slice(0, 5);
            const representativeScreens = selected.sort((a, b) => a.screenNo - b.screenNo);

            const screenSummaries = representativeScreens
              .map((s) => {
                if (!injectRationale) {
                  // Arm A: Dense baseline without rationale injection
                  return `[Step ${s.screenNo}] ${s.name}`;
                }
                // Arm A+: Full rationale injection (whereToUse, whereNotToUse, evidence, components)
                const parts = [
                  `[Step ${s.screenNo}] ${s.name}`,
                  s.uiElements && s.uiElements.length > 0 ? `Components: ${s.uiElements.slice(0, 4).join(', ')}` : null,
                  s.whereToUse ? `Where To Use: ${s.whereToUse.slice(0, 300)}` : null,
                  s.whereNotToUse ? `Where Not To Use: ${s.whereNotToUse.slice(0, 200)}` : null,
                  s.evidenceWhoWhy ? `Evidence: ${s.evidenceWhoWhy.slice(0, 200)}` : null,
                  s.keyHighlights ? `Highlights: ${s.keyHighlights.slice(0, 200)}` : null,
                ].filter(Boolean);
                return parts.join(' | ');
              })
              .join('\n');

            const document = `App: ${f.appName}\nFlow: ${f.flowName}\nDescription: ${f.description}\nScreens:\n${screenSummaries}`;
            return { id: `${f.appId}:::${f.flowId}`, document };
          });

          const rerankResults = await RerankEngine.rerank(q, flowCandidates, candidateFlows.length);
          if (rerankResults.length > 0) {
            rankedFlows = rerankResults.map((r) => {
              const flow = candidateFlows[r.index];
              return {
                ...flow,
                anchorSimilarity: Math.max(flow.anchorSimilarity, r.relevanceScore),
              };
            });
          }
        }

        for (const f of rankedFlows) {
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

