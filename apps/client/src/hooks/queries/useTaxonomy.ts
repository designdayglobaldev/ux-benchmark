import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

export interface Category {
  id: string;
  title: string;
  slug: string;
  subcategories?: { id: string; title: string; slug: string }[];
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
    staleTime: 1000 * 60 * 15, // Categories rarely change, keep fresh 15 mins
  });
}

export function useApps(categoryId?: string, subcategoryId?: string) {
  return useQuery({
    queryKey: ['apps', { categoryId, subcategoryId }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (categoryId) params.categoryId = categoryId;
      if (subcategoryId) params.subcategoryId = subcategoryId;
      const res = await api.get('/apps', { params });
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

