import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';

export interface BoardItem {
  id: string;
  name: string;
  workspaceId: string;
  screens?: any[];
  _count?: { screens?: number };
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceItem {
  id: string;
  name: string;
  ownerId: string;
  boards?: BoardItem[];
  members?: any[];
  createdAt: string;
  updatedAt: string;
}

// 1. Fetch all workspaces for a user
export function useUserWorkspaces(userId?: string) {
  return useQuery<WorkspaceItem[]>({
    queryKey: ['workspaces', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await api.get(`/workspaces/user/${userId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });
}

// 2. Fetch single board with screens
export function useBoardDetails(boardId?: string) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      if (!boardId) return null;
      const res = await api.get(`/boards/${boardId}`);
      return res.data;
    },
    enabled: !!boardId,
    staleTime: 1000 * 60 * 3, // 3 minutes fresh
  });
}

// 3. Mutations for creating and deleting boards
export function useWorkspaceMutations(userId?: string) {
  const queryClient = useQueryClient();

  const createBoardMutation = useMutation({
    mutationFn: async ({ workspaceId, name }: { workspaceId: string; name: string }) => {
      const res = await api.post('/boards', { workspaceId, name });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', userId] });
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: async (boardId: string) => {
      const res = await api.delete(`/boards/${boardId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', userId] });
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      const res = await api.delete(`/workspaces/${workspaceId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', userId] });
    },
  });

  return {
    createBoard: createBoardMutation.mutateAsync,
    isCreatingBoard: createBoardMutation.isPending,
    deleteBoard: deleteBoardMutation.mutateAsync,
    isDeletingBoard: deleteBoardMutation.isPending,
    deleteWorkspace: deleteWorkspaceMutation.mutateAsync,
    isDeletingWorkspace: deleteWorkspaceMutation.isPending,
  };
}

