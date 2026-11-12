import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchBillingStatus, type BillingStatus } from '@/lib/billing';
import { queryClient } from '@/lib/queryClient';

export const BILLING_STATUS_QUERY_KEY = ['billing-status'] as const;

/**
 * Invalidates and immediately refetches the user's billing and credit quota status.
 * Call this after any AI generation, stream completion, or mutation that consumes credits.
 */
export function invalidateBillingStatus() {
  queryClient.invalidateQueries({ queryKey: BILLING_STATUS_QUERY_KEY });
}

export function useBillingStatus() {
  const { user } = useAuth();

  return useQuery<BillingStatus | null>({
    queryKey: [...BILLING_STATUS_QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user) return null;
      return fetchBillingStatus();
    },
    enabled: Boolean(user?.id),
    staleTime: 1000 * 10, // 10s stale time for snappy responsiveness
    refetchInterval: 15000, // Background poll every 15s so balance stays fresh
  });
}

