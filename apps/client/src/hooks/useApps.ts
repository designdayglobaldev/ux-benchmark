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

const fetchApps = async (): Promise<AppType[]> => {
  const { data } = await api.get('/apps');
  return data;
};

export const useApps = () => {
  return useQuery({
    queryKey: ['apps'],
    queryFn: fetchApps,
  });
};
