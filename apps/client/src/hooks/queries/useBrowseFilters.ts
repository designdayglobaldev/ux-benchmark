import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

export interface FilterItem {
  id: string;
  name?: string;
  title?: string;
  slug?: string;
  categoryId?: string;
  _count?: { apps?: number; screens?: number };
  [key: string]: any;
}

export interface BrowseFiltersData {
  categories: FilterItem[];
  subcategories: FilterItem[];
  flows: FilterItem[];
  uiElements: FilterItem[];
  patterns: FilterItem[];
}

export function useBrowseFilters() {
  const query = useQuery<BrowseFiltersData>({
    queryKey: ['browse-filters'],
    queryFn: async () => {
      const [catRes, subcatRes, flowsRes, uiRes, patRes] = await Promise.all([
        api.get('/categories'),
        api.get('/subcategories'),
        api.get('/flows'),
        api.get('/ui-elements'),
        api.get('/patterns'),
      ]);

      return {
        categories: catRes.data || [],
        subcategories: subcatRes.data || [],
        flows: flowsRes.data || [],
        uiElements: uiRes.data || [],
        patterns: patRes.data || [],
      };
    },
    staleTime: 1000 * 60 * 15, // Keep fresh for 15 minutes
    gcTime: 1000 * 60 * 60,   // Retain in memory cache for 1 hour
  });

  return {
    categories: query.data?.categories || [],
    subcategories: query.data?.subcategories || [],
    flows: query.data?.flows || [],
    uiElements: query.data?.uiElements || [],
    patterns: query.data?.patterns || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
