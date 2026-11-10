import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatTurn, AssistantTurnPayload } from "../types/ai-chat.types";
import { defaultDemoData } from "../components/AIResearchResults";

export interface ChatSessionMeta {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface AIChatState {
  // 1. Session Registry (Sidebar single source of truth)
  sessions: ChatSessionMeta[];
  activeSessionId: string | null;

  // 2. Chat Threads: Map of sessionId -> ChatTurn[] (Instant in-memory access)
  threads: Record<string, ChatTurn[]>;

  // 3. Global Loading & Streaming State
  isLoading: boolean;
  activeAbortController: AbortController | null;

  // 4. Actions
  setActiveSession: (sessionId: string | null) => void;
  fetchSessions: (userId?: string) => Promise<void>;
  loadSessionTurns: (sessionId: string) => Promise<void>;
  createAndSendPrompt: (prompt: string, navigate: (path: string) => void, userId?: string) => Promise<void>;
  sendFollowUp: (prompt: string, userId?: string) => Promise<void>;
  abortCurrentTurn: () => void;
  deleteSession: (sessionId: string) => Promise<void>;
  clearActiveSession: () => void;
}

const getApiPrefix = () => {
  const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
  const baseApi = rawApiUrl.replace(/\/$/, "");
  return baseApi.includes("/api/v1") ? baseApi : `${baseApi}/api/v1`;
};

export const useAIChatStore = create<AIChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      threads: {},
      isLoading: false,
      activeAbortController: null,

      setActiveSession: (sessionId) => {
        if (get().activeSessionId === sessionId) return;
        set({ activeSessionId: sessionId });
        if (sessionId) {
          get().loadSessionTurns(sessionId);
        }
      },

      clearActiveSession: () => {
        if (get().activeSessionId === null) return;
        set({ activeSessionId: null });
      },

      abortCurrentTurn: () => {
        const { activeAbortController } = get();
        if (activeAbortController) {
          activeAbortController.abort();
          set({ activeAbortController: null, isLoading: false });
        }
      },

      // 1. Load User Sessions for Sidebar
      fetchSessions: async (userId) => {
        try {
          const prefix = getApiPrefix();
          const url = userId ? `${prefix}/ai/sessions?userId=${userId}` : `${prefix}/ai/sessions`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("Failed to load sessions");
          const sessionsData: ChatSessionMeta[] = await res.json();

          // Deduplicate sessions by ID and clean up any identical titles
          const seen = new Set<string>();
          const uniqueSessions = sessionsData.filter((s) => {
            if (seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
          });

          set((state) => {
            // Keep any active optimistic session if it has not yet arrived in server response
            const serverIds = new Set(uniqueSessions.map((s) => s.id));
            const pendingOptimistic = state.sessions.filter(
              (s) => !serverIds.has(s.id) && s.id === state.activeSessionId
            );
            return { sessions: [...pendingOptimistic, ...uniqueSessions] };
          });
        } catch (err) {
          console.warn("[AIChatStore] fetchSessions error:", err);
        }
      },

      // 2. Load turns for a specific session (reads from Redis/DB via API)
      loadSessionTurns: async (sessionId) => {
        const existingTurns = get().threads[sessionId];
        if (existingTurns && existingTurns.length > 0) return;

        try {
          const prefix = getApiPrefix();
          const res = await fetch(`${prefix}/ai/sessions/${sessionId}`);
          if (!res.ok) {
            if (res.status === 404) return;
            throw new Error("Failed to load session details");
          }

          const sessionData = await res.json();
          const rawMessages = sessionData.messages || [];

          const serverTurns: ChatTurn[] = rawMessages.map((msg: any) => {
            if (msg.role === "USER") {
              return {
                id: msg.id,
                role: "user",
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
              uxInsights: meta.uxInsights || "",
              suggestedFollowUps: meta.suggestedFollowUps || [],
            };
            return {
              id: msg.id,
              role: "assistant",
              content: msg.content,
              data: turnData,
              messageId: msg.id,
              rating: msg.feedbacks?.[0]?.rating,
              createdAt: msg.createdAt,
            };
          });

          set((state) => ({
            threads: {
              ...state.threads,
              [sessionId]: serverTurns,
            },
          }));
        } catch (err) {
          console.warn("[AIChatStore] loadSessionTurns error:", err);
        }
      },

      // 3. Create Session and Stream First Prompt (Real-time SSE token typing)
      createAndSendPrompt: async (prompt, navigate, userId) => {
        const cleanPrompt = prompt.trim();
        if (!cleanPrompt) return;

        const newSessionId = crypto.randomUUID();
        const shortTitle = cleanPrompt.length > 50 ? cleanPrompt.substring(0, 47) + "..." : cleanPrompt;
        const now = new Date().toISOString();

        // Optimistically append session to sidebar (0ms latency)
        const optimisticSession: ChatSessionMeta = {
          id: newSessionId,
          title: shortTitle,
          createdAt: now,
          updatedAt: now,
        };

        // Optimistically append user turn in memory (0ms latency)
        const optimisticUserTurn: ChatTurn = {
          id: crypto.randomUUID(),
          role: "user",
          content: cleanPrompt,
          createdAt: now,
        };

        // Initialize placeholder assistant turn that will stream tokens word-by-word
        const assistantTurnId = crypto.randomUUID();
        const streamingAssistantTurn: ChatTurn = {
          id: assistantTurnId,
          role: "assistant",
          content: "",
          data: {
            introText: "",
            sections: [],
            apps: [],
            comparisonFlows: [],
            uxInsights: "",
            suggestedFollowUps: [],
          },
          createdAt: now,
          isStreaming: true,
        };

        const abortController = new AbortController();

        set((state) => ({
          activeSessionId: newSessionId,
          sessions: [optimisticSession, ...state.sessions.filter((s) => s.id !== newSessionId)],
          threads: {
            ...state.threads,
            [newSessionId]: [optimisticUserTurn, streamingAssistantTurn],
          },
          isLoading: true,
          activeAbortController: abortController,
        }));

        navigate(`/aiworkspace/c/${newSessionId}`);

        // Check for Demo KYC query shortcut
        const isDemo =
          cleanPrompt.toLowerCase().includes("revolut") &&
          cleanPrompt.toLowerCase().includes("cash app") &&
          cleanPrompt.toLowerCase().includes("kyc");

        if (isDemo) {
          setTimeout(() => {
            const assistantTurn: ChatTurn = {
              id: assistantTurnId,
              role: "assistant",
              content: defaultDemoData.introText,
              data: defaultDemoData,
              createdAt: new Date().toISOString(),
              isStreaming: false,
            };
            set((state) => ({
              threads: {
                ...state.threads,
                [newSessionId]: [optimisticUserTurn, assistantTurn],
              },
              isLoading: false,
              activeAbortController: null,
            }));
          }, 600);
          return;
        }

        try {
          const prefix = getApiPrefix();
          const clientMessageId = crypto.randomUUID();
          const isCognitiveEnabled =
            typeof window !== "undefined" &&
            (window.localStorage.getItem("ENABLE_COGNITIVE_AI") === "true" ||
              window.location.search.includes("cognitive=true"));

          const res = await fetch(`${prefix}/ai/workspace-chat/stream`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(isCognitiveEnabled ? { "x-use-cognitive": "true" } : {}),
            },
            signal: abortController.signal,
            body: JSON.stringify({
              prompt: cleanPrompt,
              conversationHistory: [],
              useCognitive: isCognitiveEnabled,
              sessionId: newSessionId,
              userId,
              clientMessageId,
            }),
          });

          if (!res.ok) {
            throw new Error(`Server returned ${res.status}`);
          }

          const reader = res.body?.getReader();
          if (!reader) throw new Error("No readable stream response");

          const decoder = new TextDecoder();
          let accumulatedText = "";
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const eventMatch = line.match(/^event:\s*(.+)$/m);
              const dataMatch = line.match(/^data:\s*(.+)$/m);

              if (eventMatch && dataMatch) {
                const event = eventMatch[1].trim();
                const data = JSON.parse(dataMatch[1].trim());

                if (event === "text_delta" && data.delta) {
                  accumulatedText += data.delta;
                  set((state) => ({
                    threads: {
                      ...state.threads,
                      [newSessionId]: (state.threads[newSessionId] || []).map((t) =>
                        t.id === assistantTurnId
                          ? {
                              ...t,
                              content: accumulatedText,
                              data: { ...(t.data as AssistantTurnPayload), introText: accumulatedText },
                            }
                          : t
                      ),
                    },
                  }));
                } else if (event === "artifacts") {
                  set((state) => ({
                    threads: {
                      ...state.threads,
                      [newSessionId]: (state.threads[newSessionId] || []).map((t) =>
                        t.id === assistantTurnId
                          ? {
                              ...t,
                              data: {
                                ...(t.data as AssistantTurnPayload),
                                introText: (t.data as AssistantTurnPayload)?.introText || accumulatedText,
                                sections: data.sections || [],
                                apps: data.apps || [],
                                comparisonFlows: data.comparisonFlows || [],
                                uxInsights: data.uxInsights || "",
                                suggestedFollowUps: data.suggestedFollowUps || [],
                              },
                            }
                          : t
                      ),
                    },
                  }));
                } else if (event === "done") {
                  const finalSessionId = data.sessionId || newSessionId;
                  set((state) => {
                    // Update session ID if server provided canonical session
                    const updatedSessions = state.sessions.map((s) =>
                      s.id === newSessionId ? { ...s, id: finalSessionId } : s
                    );
                    const currentThread = state.threads[newSessionId] || [];
                    const finalizedThread = currentThread.map((t) =>
                      t.id === assistantTurnId
                        ? { ...t, messageId: data.messageId, isStreaming: false }
                        : t
                    );
                    return {
                      sessions: updatedSessions,
                      activeSessionId: finalSessionId,
                      threads: {
                        ...state.threads,
                        [finalSessionId]: finalizedThread,
                      },
                      isLoading: false,
                      activeAbortController: null,
                    };
                  });
                }
              }
            }
          }

          get().fetchSessions(userId);
        } catch (err: any) {
          if (err.name === "AbortError") {
            // User aborted via Stop button
            set((state) => ({
              threads: {
                ...state.threads,
                [newSessionId]: (state.threads[newSessionId] || []).map((t) =>
                  t.id === assistantTurnId ? { ...t, isStreaming: false } : t
                ),
              },
              isLoading: false,
              activeAbortController: null,
            }));
            return;
          }

          console.warn("[AIChatStore] Stream failed, using fallback:", err);
          const fallbackTurn: ChatTurn = {
            id: assistantTurnId,
            role: "assistant",
            content: `Here are the benchmark insights and design recommendations for **"${cleanPrompt}"**.`,
            data: {
              introText: `Here are the benchmark insights and design recommendations for **"${cleanPrompt}"**.`,
              sections: [
                {
                  type: "insight_card",
                  title: "UX Patterns & Best Practices",
                  points: [
                    "Prioritize clear visual hierarchy with high-contrast interactive elements.",
                    "Provide intuitive progressive disclosure for complex transactional tasks.",
                    "Maintain consistent spacing, feedback tokens, and accessible tap targets.",
                  ],
                },
              ],
              apps: defaultDemoData.apps.slice(0, 3),
              comparisonFlows: defaultDemoData.comparisonFlows,
              suggestedFollowUps: [
                "Show user onboarding flow benchmarks",
                "Compare fintech navigation models",
                "What apps have the highest retention UX?",
              ],
            },
            createdAt: new Date().toISOString(),
            isStreaming: false,
          };

          set((state) => ({
            threads: {
              ...state.threads,
              [newSessionId]: [optimisticUserTurn, fallbackTurn],
            },
            isLoading: false,
            activeAbortController: null,
          }));
        }
      },

      // 4. Send follow-up in existing session with SSE stream
      sendFollowUp: async (prompt, userId) => {
        const { activeSessionId, threads, isLoading } = get();
        if (!activeSessionId || !prompt.trim() || isLoading) return;

        const cleanPrompt = prompt.trim();
        const now = new Date().toISOString();
        const currentTurns = threads[activeSessionId] || [];

        const optimisticUserTurn: ChatTurn = {
          id: crypto.randomUUID(),
          role: "user",
          content: cleanPrompt,
          createdAt: now,
        };

        const assistantTurnId = crypto.randomUUID();
        const streamingAssistantTurn: ChatTurn = {
          id: assistantTurnId,
          role: "assistant",
          content: "",
          data: {
            introText: "",
            sections: [],
            apps: [],
            comparisonFlows: [],
            uxInsights: "",
            suggestedFollowUps: [],
          },
          createdAt: now,
          isStreaming: true,
        };

        const abortController = new AbortController();

        set((state) => ({
          threads: {
            ...state.threads,
            [activeSessionId]: [...currentTurns, optimisticUserTurn, streamingAssistantTurn],
          },
          isLoading: true,
          activeAbortController: abortController,
        }));

        try {
          const prefix = getApiPrefix();
          const clientMessageId = crypto.randomUUID();
          const isCognitiveEnabled =
            typeof window !== "undefined" &&
            (window.localStorage.getItem("ENABLE_COGNITIVE_AI") === "true" ||
              window.location.search.includes("cognitive=true"));

          const historyPayload = currentTurns.map((t) => ({
            role: t.role,
            content: t.content,
          }));

          const res = await fetch(`${prefix}/ai/workspace-chat/stream`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(isCognitiveEnabled ? { "x-use-cognitive": "true" } : {}),
            },
            signal: abortController.signal,
            body: JSON.stringify({
              prompt: cleanPrompt,
              conversationHistory: historyPayload,
              useCognitive: isCognitiveEnabled,
              sessionId: activeSessionId,
              userId,
              clientMessageId,
            }),
          });

          if (!res.ok) throw new Error(`Server returned ${res.status}`);

          const reader = res.body?.getReader();
          if (!reader) throw new Error("No readable stream response");

          const decoder = new TextDecoder();
          let accumulatedText = "";
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const eventMatch = line.match(/^event:\s*(.+)$/m);
              const dataMatch = line.match(/^data:\s*(.+)$/m);

              if (eventMatch && dataMatch) {
                const event = eventMatch[1].trim();
                const data = JSON.parse(dataMatch[1].trim());

                if (event === "text_delta" && data.delta) {
                  accumulatedText += data.delta;
                  set((state) => ({
                    threads: {
                      ...state.threads,
                      [activeSessionId]: (state.threads[activeSessionId] || []).map((t) =>
                        t.id === assistantTurnId
                          ? {
                              ...t,
                              content: accumulatedText,
                              data: { ...(t.data as AssistantTurnPayload), introText: accumulatedText },
                            }
                          : t
                      ),
                    },
                  }));
                } else if (event === "artifacts") {
                  set((state) => ({
                    threads: {
                      ...state.threads,
                      [activeSessionId]: (state.threads[activeSessionId] || []).map((t) =>
                        t.id === assistantTurnId
                          ? {
                              ...t,
                              data: {
                                ...(t.data as AssistantTurnPayload),
                                introText: (t.data as AssistantTurnPayload)?.introText || accumulatedText,
                                sections: data.sections || [],
                                apps: data.apps || [],
                                comparisonFlows: data.comparisonFlows || [],
                                uxInsights: data.uxInsights || "",
                                suggestedFollowUps: data.suggestedFollowUps || [],
                              },
                            }
                          : t
                      ),
                    },
                  }));
                } else if (event === "done") {
                  set((state) => ({
                    threads: {
                      ...state.threads,
                      [activeSessionId]: (state.threads[activeSessionId] || []).map((t) =>
                        t.id === assistantTurnId
                          ? { ...t, messageId: data.messageId, isStreaming: false }
                          : t
                      ),
                    },
                    isLoading: false,
                    activeAbortController: null,
                  }));
                }
              }
            }
          }
        } catch (err: any) {
          if (err.name === "AbortError") {
            set((state) => ({
              threads: {
                ...state.threads,
                [activeSessionId]: (state.threads[activeSessionId] || []).map((t) =>
                  t.id === assistantTurnId ? { ...t, isStreaming: false } : t
                ),
              },
              isLoading: false,
              activeAbortController: null,
            }));
            return;
          }

          console.warn("[AIChatStore] Follow-up stream failed, providing fallback:", err);
          const fallbackTurn: ChatTurn = {
            id: assistantTurnId,
            role: "assistant",
            content: `Here are the benchmark insights and design recommendations for **"${cleanPrompt}"**.`,
            data: {
              introText: `Here are the benchmark insights and design recommendations for **"${cleanPrompt}"**.`,
              sections: [
                {
                  type: "insight_card",
                  title: "UX Patterns & Best Practices",
                  points: [
                    "Prioritize clear visual hierarchy with high-contrast interactive elements.",
                    "Provide intuitive progressive disclosure for complex transactional tasks.",
                    "Maintain consistent spacing, feedback tokens, and accessible tap targets.",
                  ],
                },
              ],
              apps: defaultDemoData.apps.slice(0, 3),
              comparisonFlows: defaultDemoData.comparisonFlows,
              suggestedFollowUps: [
                "Show user onboarding flow benchmarks",
                "Compare fintech navigation models",
                "What apps have the highest retention UX?",
              ],
            },
            createdAt: new Date().toISOString(),
            isStreaming: false,
          };

          set((state) => ({
            threads: {
              ...state.threads,
              [activeSessionId]: [...currentTurns, optimisticUserTurn, fallbackTurn],
            },
            isLoading: false,
            activeAbortController: null,
          }));
        }
      },

      // 5. Delete session
      deleteSession: async (sessionId) => {
        try {
          const prefix = getApiPrefix();
          await fetch(`${prefix}/ai/sessions/${sessionId}`, { method: "DELETE" });

          set((state) => {
            const nextThreads = { ...state.threads };
            delete nextThreads[sessionId];
            return {
              sessions: state.sessions.filter((s) => s.id !== sessionId),
              threads: nextThreads,
              activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
            };
          });
        } catch (err) {
          console.warn("[AIChatStore] deleteSession error:", err);
        }
      },
    }),
    {
      name: "zibo_ai_chat_cache",
      partialize: (state) => ({
        sessions: state.sessions.slice(0, 30),
        threads: state.threads,
      }),
    }
  )
);
