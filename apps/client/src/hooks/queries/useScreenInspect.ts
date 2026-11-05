import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/utils/api';
import type { Region } from '@/components/RegionSelector';

export interface UseScreenInspectOptions {
  activeScreenId?: string;
  appName?: string;
}

export function useScreenInspect() {
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState<string | null>(null);
  const [lastSubmittedRegion, setLastSubmittedRegion] = useState<Region | null>(null);

  const inspectMutation = useMutation({
    mutationFn: async ({
      prompt,
      region,
      imageBase64
    }: {
      prompt: string;
      region?: { x: number; y: number; width: number; height: number } | null;
      imageBase64: string;
    }) => {
      const res = await api.post('/ai/inspect', {
        prompt,
        region: region || undefined,
        imageBase64
      });
      return res.data?.response;
    },
    onSuccess: (data, variables) => {
      setAiResponse(data);
      setLastSubmittedPrompt(variables.prompt);
      setLastSubmittedRegion(variables.region || null);
    },
    onError: (error: any) => {
      console.error('Screen Inspect Error:', error);
      setAiResponse(`Error: ${error?.response?.data?.error || error.message || 'Something went wrong.'}`);
    }
  });

  const clearInspection = () => {
    setAiResponse(null);
    setLastSubmittedPrompt(null);
    setLastSubmittedRegion(null);
    inspectMutation.reset();
  };

  return {
    aiResponse,
    lastSubmittedPrompt,
    lastSubmittedRegion,
    isAiLoading: inspectMutation.isPending,
    inspect: inspectMutation.mutateAsync,
    clearInspection
  };
}

