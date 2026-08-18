import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

export interface AppType {
  id: string;
  name: string;
  slug: string;
  appLogo: string;
  appThumbnail: string;
  isStaffPick: boolean;
  tags: string[];
}

const fetchApps = async (queryString: string = ''): Promise<AppType[]> => {
  const url = queryString ? `/apps?status=LIVE&${queryString}` : '/apps?status=LIVE';
  const { data } = await api.get(url);
  return data;
};

export const useApps = (queryString: string = '') => {
  return useQuery({
    queryKey: ['apps', queryString],
    queryFn: () => fetchApps(queryString),
  });
};
