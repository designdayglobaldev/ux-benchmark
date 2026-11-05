import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

export function useBenchmarkTaxonomy() {
  return useQuery({
    queryKey: ['benchmark-taxonomy'],
    queryFn: async () => {
      const [catsRes, flowsRes, subcatsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/flows'),
        api.get('/subcategories'),
      ]);

      const catsData = Array.isArray(catsRes.data) ? catsRes.data : catsRes.data?.data || [];
      const flowsData = Array.isArray(flowsRes.data) ? flowsRes.data : flowsRes.data?.data || [];
      const subcatsData = Array.isArray(subcatsRes.data) ? subcatsRes.data : subcatsRes.data?.data || [];

      return {
        categories: catsData.map((c: any) => ({ id: c.id, title: c.title || c.name })),
        flows: flowsData.map((f: any) => ({ id: f.id, title: f.name || f.title })),
        subcategories: subcatsData as any[],
      };
    },
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    gcTime: 1000 * 60 * 60,    // 1 hour memory
  });
}
