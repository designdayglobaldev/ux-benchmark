export interface CognitiveRetrievalParams {
  prompt: string;
  limit?: number;
  injectRationale?: boolean; // When true (Arm A+), injects whereToUse, whereNotToUse, and highlights into rerank payload
}

export interface RetrievedFlowScreen {
  id: string;
  name: string;
  screenNo: number;
  imageUrl: string;
  uxAnalysis?: string | null;
  keyHighlights?: string | null;
  evidenceWhoWhy?: string | null;
  whereToUse?: string | null;
  whereNotToUse?: string | null;
  uiElements?: string[];
  isAnchor?: boolean;
  activationScore: number;
}

export interface RetrievedCandidateFlow {
  appId: string;
  appName: string;
  appSlug: string;
  flowId: string;
  flowName: string;
  flowSlug: string;
  description: string;
  anchorSimilarity: number;
  screens: RetrievedFlowScreen[];
}

export interface RetrievedApp {
  id: string;
  name: string;
  slug: string;
  category: string;
  similarity: number;
}

export interface CognitiveSearchResult {
  apps: RetrievedApp[];
  flows: RetrievedCandidateFlow[];
  rawAnchors: Array<{
    id: string;
    name: string;
    appName: string;
    similarity: number;
  }>;
}

