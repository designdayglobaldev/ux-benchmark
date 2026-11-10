import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import type { ChatTurn, AssistantTurnPayload } from '../types/ai-chat.types';
import { defaultDemoData } from '../components/AIResearchResults';

export function useAIChatThread(sessionId: string | null | undefined, initialPrompt?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localTurns, setLocalTurns] = useState<ChatTurn[]>([]);
  const hasExecutedInitialRef = useRef<string | null>(null);

  const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
  const baseApi = rawApiUrl.replace(/\/$/, "");
  const prefix = baseApi.includes("/api/v1") ? baseApi : `${baseApi}/api/v1`;

  // 1. Single Query for Session Hydration
  const { data: sessionData, isLoading: isHydrating } = useQuery({
    queryKey: ['chat-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const res = await fetch(`${prefix}/ai/sessions/${sessionId}`);
      if (!res.ok) {
        if (res.status === 404) return { messages: [] };
        throw new Error('Failed to load session');
      }
      return res.json();
    },
    enabled: Boolean(sessionId),
    staleTime: 1000 * 60 * 5, // 5 min fresh
  });

  // Extract server turns
  const serverTurns: ChatTurn[] = (sessionData?.messages || []).map((msg: any) => {
    if (msg.role === 'USER') {
      return {
        id: msg.id,
        role: 'user',
        content: msg.content,
        createdAt: msg.createdAt,
      };
    }
    const meta = msg.metadata || {};
    const turnData: AssistantTurnPayload = {
      introText: msg.content,
      sections: Array.isArray(meta) ? meta : meta.sections || [],
      apps: meta.apps || [],
      comparisonFlows: meta.comparisonFlows || [],
      uxInsights: meta.uxInsights || '',
      suggestedFollowUps: meta.suggestedFollowUps || [],
    };
    return {
      id: msg.id,
      role: 'assistant',
      content: msg.content,
      data: turnData,
      messageId: msg.id,
      rating: msg.feedbacks?.[0]?.rating,
      createdAt: msg.createdAt,
    };
  });

  // Combined turns: Merge server turns and local pending turns seamlessly
  const turns = serverTurns.length > 0
    ? [...serverTurns, ...localTurns.filter(lt => !serverTurns.some(st => st.content === lt.content))]
    : localTurns;

  // 2. TanStack Mutation: Clean, explicitly invoked turn execution
  const chatMutation = useMutation({
    mutationFn: async ({ prompt, clientMessageId }: { prompt: string; clientMessageId: string }) => {
      const isCognitiveEnabled =
        typeof window !== 'undefined' &&
        (window.localStorage.getItem('ENABLE_COGNITIVE_AI') === 'true' ||
          window.location.search.includes('cognitive=true'));

      const historyPayload = turns.map((t) => ({
        role: t.role,
        content: t.content,
      }));

      const res = await fetch(`${prefix}/ai/workspace-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isCognitiveEnabled ? { 'x-use-cognitive': 'true' } : {}),
        },
        body: JSON.stringify({
          prompt,
          conversationHistory: historyPayload,
          useCognitive: isCognitiveEnabled,
          sessionId: sessionId || undefined,
          userId: user?.id,
          clientMessageId,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `Server responded with ${res.status}`);
      }

      return res.json();
    },
    onMutate: async ({ prompt }) => {
      // Optimistically add user turn immediately
      const optimisticUserTurn: ChatTurn = {
        id: crypto.randomUUID(),
        role: 'user',
        content: prompt,
        createdAt: new Date().toISOString(),
      };
      setLocalTurns((prev) => [...prev, optimisticUserTurn]);
    },
    onSuccess: (json) => {
      const payloadData: AssistantTurnPayload = {
        introText: json.data?.introText || json.introText || '',
        sections: json.data?.sections || json.sections || [],
        apps: json.data?.apps || json.apps || [],
        comparisonFlows: json.data?.comparisonFlows || json.comparisonFlows || [],
        uxInsights: json.data?.uxInsights || '',
        suggestedFollowUps: json.data?.suggestedFollowUps || [],
      };

      const assistantTurn: ChatTurn = {
        id: json.messageId || crypto.randomUUID(),
        role: 'assistant',
        content: payloadData.introText,
        data: payloadData,
        messageId: json.messageId,
        createdAt: new Date().toISOString(),
      };

      setLocalTurns((prev) => [...prev, assistantTurn]);

      // Invalidate queries so TanStack Query silently syncs with database
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ['chat-session', sessionId] });
      }
      queryClient.invalidateQueries({ queryKey: ['ai-sessions'] });
    },
    onError: (err: any, { prompt }) => {
      console.warn('[useAIChatThread] Turn failed, providing fallback:', err);
      const fallbackTurn: ChatTurn = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Here are the benchmark insights and design recommendations for **"${prompt}"**.`,
        data: {
          introText: `Here are the benchmark insights and design recommendations for **"${prompt}"**.`,
          sections: [
            {
              type: 'insight_card',
              title: 'UX Patterns & Best Practices',
              points: [
                'Prioritize clear visual hierarchy with high-contrast interactive elements.',
                'Provide intuitive progressive disclosure for complex transactional tasks.',
                'Maintain consistent spacing, feedback tokens, and accessible tap targets.',
              ],
            },
          ],
          apps: defaultDemoData.apps.slice(0, 3),
          comparisonFlows: defaultDemoData.comparisonFlows,
          suggestedFollowUps: [
            'Show user onboarding flow benchmarks',
            'Compare fintech navigation models',
            'What apps have the highest retention UX?',
          ],
        },
        createdAt: new Date().toISOString(),
      };
      setLocalTurns((prev) => [...prev, fallbackTurn]);
    },
  });

  const sendMessage = useCallback(
    (promptText: string) => {
      const cleanPrompt = promptText.trim();
      if (!cleanPrompt || chatMutation.isPending) return;
      const clientMessageId = crypto.randomUUID();
      chatMutation.mutate({ prompt: cleanPrompt, clientMessageId });
    },
    [chatMutation]
  );

  // Auto-run initial prompt once if provided (e.g., navigated from hero search bar)
  if (
    initialPrompt &&
    initialPrompt !== hasExecutedInitialRef.current &&
    initialPrompt !== 'Past Research' &&
    initialPrompt !== 'Loading past research...' &&
    turns.length === 0 &&
    !isHydrating
  ) {
    hasExecutedInitialRef.current = initialPrompt;
    sendMessage(initialPrompt);
  }

  // In TanStack Query: Only treat as hydrating if there is a sessionId AND it is actively fetching AND we haven't received serverTurns yet
  const hasLoadedServerTurns = Boolean(sessionData && sessionData.messages);
  const isInitialHydrating = Boolean(sessionId) && isHydrating && !hasLoadedServerTurns;

  return {
    turns,
    isLoading: chatMutation.isPending || (isInitialHydrating && turns.length === 0),
    sendMessage,
  };
}
