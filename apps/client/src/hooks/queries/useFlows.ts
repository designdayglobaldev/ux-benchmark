import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

export interface FlowScreen {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  isLocked?: boolean;
  screenNo?: number;
  appId: string;
  app?: {
    id?: string;
    name: string;
    slug: string;
    appLogo?: string;
    isPremium?: boolean;
    previewLimit?: number;
    category?: {
      title: string;
      slug: string;
    };
  };
}

export interface Flow {
  id: string;
  name: string;
  slug: string;
  description?: string;
  screens: FlowScreen[];
}

/**
 * Hook to retrieve all flows with screens.
 * Uses 15-minute stale-time caching for instant page transitions.
 */
export function useFlows(appId?: string) {
  return useQuery<Flow[]>({
    queryKey: ['flows', { appId }],
    queryFn: async () => {
      const res = await api.get<Flow[]>('/flows', {
        params: appId ? { appId } : undefined,
      });
      // Filter out flows with no screens
      return (res.data || []).filter(
        (flow) => flow.screens && flow.screens.length > 0
      );
    },
    staleTime: 1000 * 60 * 15,
  });
}

/**
 * Hook to retrieve a single flow by slug or ID with fallback logic.
 */
export function useFlowDetail(slugOrId?: string, appId?: string) {
  return useQuery<Flow>({
    queryKey: ['flow', slugOrId, { appId }],
    queryFn: async () => {
      if (!slugOrId) throw new Error('Flow slug or ID is required');
      const res = await api.get<Flow>(`/flows/${slugOrId}`, {
        params: appId ? { appId } : undefined,
      });
      return res.data;
    },
    enabled: Boolean(slugOrId),
    staleTime: 1000 * 60 * 15,
  });
}

