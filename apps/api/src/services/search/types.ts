export interface CognitiveRetrievalParams {
  prompt: string;
  limit?: number;
}

export interface RetrievedFlowScreen {
  id: string;
  name: string;
  screenNo: number;
  imageUrl: string;
  uxAnalysis?: string | null;
  keyHighlights?: string | null;
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

