import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

export interface ScreenType {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  uxAnalysis?: string;
  keyHighlights?: string;
  evidenceWhoWhy?: string;
  whereToUse?: string;
  whereNotToUse?: string;
  uiElements?: { title: string }[];
  patterns?: { title: string }[];
  flow?: {
    id: string;
    name: string;
  };
}

export interface FlowType {
  id: string;
  name: string;
  screens: ScreenType[];
}

export interface AppDetailsType {
  id: string;
  name: string;
  slug: string;
  appLogo: string;
  appThumbnail: string;
  description: string;
  tags: string[];
  platform: string[];
  screens: ScreenType[];
  palette?: any;
  visualUiTypography?: string;
  visualUiShape?: string;
  visualUiImagery?: string;
  experienceUxSolves?: string;
  experienceUxOverall?: string;
  experienceUxTone?: string;
  lookAndFeelTags?: string[];
  lookAndFeelText?: string;
  easeOfUseTags?: string[];
  easeOfUseText?: string;
  contentClarityTags?: string[];
  contentClarityText?: string;
  contentClarityQuoteTitle?: string;
  contentClarityQuoteText?: string;
  trustTags?: string[];
  trustText?: string;
  accessibilityTags?: string[];
  accessibilityText?: string;
  accessibilityUrl?: string;
  takeawayTags?: string[];
  takeawayText?: string;
  category?: {
    id: string;
    title: string;
  };
}

const fetchAppDetails = async (slug: string): Promise<AppDetailsType> => {
  const { data } = await api.get(`/apps/${slug}`);
  return data;
};

export const useAppDetails = (slug: string) => {
  return useQuery({
    queryKey: ['app', slug],
    queryFn: () => fetchAppDetails(slug),
    enabled: !!slug,
  });
};
