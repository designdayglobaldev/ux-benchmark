import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import { invalidateBillingStatus } from './useBillingStatus';

export interface InsightData {
  title: string;
  description: string;
  x: number;
  y: number;
  category?: 'Heuristic' | 'Microcopy' | 'Hierarchy' | 'Conversion' | 'Friction' | string;
}

export function useScreenInsights(
  screenId?: string,
  appName?: string,
  imageBase64?: string | null,
  enabled: boolean = false
) {
  return useQuery({
    queryKey: ['screen-insights', screenId, appName],
    queryFn: async (): Promise<InsightData[]> => {
      if (!imageBase64) return [];
      const res = await api.post('/ai/insights', {
        imageBase64,
        screenId,
        appName
      });
      // Invalidate billing so token counter updates after generating hotspots
      invalidateBillingStatus();
      return Array.isArray(res.data?.insights) ? res.data.insights : [];
    },
    enabled: enabled && !!imageBase64 && !!screenId,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 1
  });
}

