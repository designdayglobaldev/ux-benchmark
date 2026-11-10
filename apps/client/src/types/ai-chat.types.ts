import type { GenUISection } from "../components/genui/GenUIRenderer";

export interface AIResearchApp {
  id: string;
  name: string;
  slug?: string;
  category: string;
  reason?: string;
  appLogo?: string | null;
  appThumbnail?: string | null;
}

export interface FlowStep {
  stepNumber: number;
  title: string;
  description: string;
  uxTactic?: string;
  screenImageUrl?: string | null;
  screenName?: string | null;
  screenId?: string | null;
}

export interface ComparisonFlow {
  appName: string;
  badge?: string;
  slug?: string;
  appLogo?: string | null;
  appThumbnail?: string | null;
  steps: FlowStep[];
  totalScreens?: number;
}

export interface AssistantTurnPayload {
  introText: string;
  sections: GenUISection[];
  apps: AIResearchApp[];
  comparisonFlows: ComparisonFlow[];
  uxInsights?: string;
  suggestedFollowUps: string[];
}

export interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  data?: AssistantTurnPayload;
  messageId?: string;
  rating?: number | null;
  createdAt?: string;
  isStreaming?: boolean;
}

