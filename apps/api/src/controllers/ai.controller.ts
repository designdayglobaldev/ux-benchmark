import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { AiChatService } from '../services/ai-chat.service';
import { RedisLockService } from '../services/redis-lock.service';
import { prisma } from '../db/prisma';
import { redis } from '../lib/redis';
import { MeteredContext } from '../middleware/metered';
import { CreditService } from '../services/credit.service';

export class AIController {
  public static async inspect(req: Request, res: Response, ctx?: MeteredContext) {
    try {
      const { prompt, region, imageBase64 } = req.body;
      const response = await AIService.inspectScreen({ prompt, region, imageBase64 });
      if (ctx) {
        ctx.state.outputStarted = true;
        await CreditService.settle({
          reservationId: ctx.reservationId,
          userId: ctx.userId,
          clientMessageId: ctx.requestKey,
          actionType: ctx.action,
          model: 'claude-3-5-sonnet-20241022',
          inputTokens: 1000,
          outputTokens: 500,
        });
      }
      return res.json({ response });
    } catch (error: any) {
      console.error('[AIController.inspect] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred during AI inspection' });
    }
  }

  public static async insights(req: Request, res: Response, ctx?: MeteredContext) {
    try {
      const { imageBase64, screenId, appName } = req.body;
      const data = await AIService.generateInsights({ imageBase64, screenId, appName });
      if (ctx) {
        ctx.state.outputStarted = true;
        await CreditService.settle({
          reservationId: ctx.reservationId,
          userId: ctx.userId,
          clientMessageId: ctx.requestKey,
          actionType: ctx.action,
          model: 'claude-3-5-sonnet-20241022',
          inputTokens: 1200,
          outputTokens: 600,
        });
      }
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.insights] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while generating insights' });
    }
  }

  public static async compare(req: Request, res: Response, ctx?: MeteredContext) {
    try {
      const { originalImageBase64, userImageBase64 } = req.body;
      const data = await AIService.compareScreens({ originalImageBase64, userImageBase64 });
      if (ctx) {
        ctx.state.outputStarted = true;
        await CreditService.settle({
          reservationId: ctx.reservationId,
          userId: ctx.userId,
          clientMessageId: ctx.requestKey,
          actionType: ctx.action,
          model: 'claude-3-5-sonnet-20241022',
          inputTokens: 1500,
          outputTokens: 800,
        });
      }
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.compare] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while generating comparison' });
    }
  }

  public static async detectContext(req: Request, res: Response, ctx?: MeteredContext) {
    try {
      const { imageBase64 } = req.body;
      const data = await AIService.detectContext({ imageBase64 });
      if (ctx) {
        ctx.state.outputStarted = true;
        await CreditService.settle({
          reservationId: ctx.reservationId,
          userId: ctx.userId,
          clientMessageId: ctx.requestKey,
          actionType: ctx.action,
          model: 'claude-3-5-sonnet-20241022',
          inputTokens: 800,
          outputTokens: 400,
        });
      }
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.detectContext] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while detecting context' });
    }
  }

  public static async benchmark(req: Request, res: Response, ctx?: MeteredContext) {
    try {
      const { imageBase64, categoryId, subcategoryId, flowId, screenType } = req.body;
      const data = await AIService.benchmarkScreen({ imageBase64, categoryId, subcategoryId, flowId, screenType });
      if (ctx) {
        ctx.state.outputStarted = true;
        await CreditService.settle({
          reservationId: ctx.reservationId,
          userId: ctx.userId,
          clientMessageId: ctx.requestKey,
          actionType: ctx.action,
          model: 'claude-3-5-sonnet-20241022',
          inputTokens: 2500,
          outputTokens: 1200,
        });
      }
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.benchmark] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while generating benchmark' });
    }
  }

  public static async generateScreenData(req: Request, res: Response) {
    try {
      const { imageBase64, appId } = req.body;
      const data = await AIService.generateScreenData({ imageBase64, appId });
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.generateScreenData] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while generating screen data' });
    }
  }

  public static async benchmarkChat(req: Request, res: Response, ctx?: MeteredContext) {
    try {
      const { message, chatHistory, benchmarkData } = req.body;
      const data = await AIService.chatBenchmark({ message, chatHistory, benchmarkData });
      if (ctx) {
        ctx.state.outputStarted = true;
        await CreditService.settle({
          reservationId: ctx.reservationId,
          userId: ctx.userId,
          clientMessageId: ctx.requestKey,
          actionType: ctx.action,
          model: 'claude-3-5-sonnet-20241022',
          inputTokens: 1500,
          outputTokens: 600,
        });
      }
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.benchmarkChat] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while chatting' });
    }
  }

  public static async improveDesign(req: Request, res: Response, ctx?: MeteredContext) {
    try {
      const { imageBase64, benchmarkResult } = req.body;
      const data = await AIService.improveDesign({ imageBase64, benchmarkResult });
      if (ctx) {
        ctx.state.outputStarted = true;
        await CreditService.settle({
          reservationId: ctx.reservationId,
          userId: ctx.userId,
          clientMessageId: ctx.requestKey,
          actionType: ctx.action,
          model: 'claude-3-5-sonnet-20241022',
          inputTokens: 2200,
          outputTokens: 1100,
        });
      }
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.improveDesign] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred during AI design improvement' });
    }
  }

  public static async getDesignAgentFilters(_req: Request, res: Response) {
    try {
      const data = await AIService.getDesignAgentFilters();
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.getDesignAgentFilters] Error:', error);
      return res.status(500).json({ error: error?.message || 'Failed to fetch categories and flows' });
    }
  }

  public static async generateDesignAgent(req: Request, res: Response, ctx?: MeteredContext) {
    try {
      const { prompt, category, flow, device } = req.body;
      const data = await AIService.generateDesignAgentScreen({ prompt, category, flow, device });
      if (ctx) {
        ctx.state.outputStarted = true;
        await CreditService.settle({
          reservationId: ctx.reservationId,
          userId: ctx.userId,
          clientMessageId: ctx.requestKey,
          actionType: ctx.action,
          model: 'claude-3-5-sonnet-20241022',
          inputTokens: 3000,
          outputTokens: 1500,
        });
      }
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.generateDesignAgent] Error:', error);
      return res.status(500).json({ error: error?.message || 'Failed to generate design screen' });
    }
  }

  public static async workspaceChat(req: Request, res: Response, ctx?: MeteredContext) {
    try {
      const { prompt, conversationHistory, useCognitive, sessionId, userId, clientMessageId } = req.body;
      const headerFlag = req.headers['x-use-cognitive'] === 'true';
      const shouldRunCognitive = useCognitive === true || headerFlag;

      // 1. Resolve user and session
      const resolvedUserId = ctx?.userId || (req as any).user?.id || userId;
      let activeSessionId = sessionId;

      // 2. Request Idempotency Check: if client sent clientMessageId, check if already processed
      const effectiveMessageId = ctx?.requestKey || clientMessageId;
      if (effectiveMessageId && redis) {
        const cachedResponse = await redis.get(`idempotency:msg:${effectiveMessageId}`);
        if (cachedResponse) {
          try {
            return res.json(JSON.parse(cachedResponse));
          } catch {
            // continue if corrupt
          }
        }
      }

      if (resolvedUserId && prompt) {
        const sessionTitle = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;
        const session = await AiChatService.getOrCreateSession(resolvedUserId, activeSessionId, sessionTitle);
        activeSessionId = session.id;
      }

      const executeTurn = async () => {
        // Execute AI research chat with Claude
        const data = await AIService.chatWorkspace({
          prompt,
          conversationHistory,
          useCognitive: shouldRunCognitive
        });

        if (ctx) {
          ctx.state.outputStarted = true;
          await CreditService.settle({
            reservationId: ctx.reservationId,
            userId: ctx.userId,
            sessionId: activeSessionId,
            clientMessageId: effectiveMessageId,
            actionType: ctx.action,
            model: 'claude-3-5-sonnet-20241022',
            inputTokens: 1800,
            outputTokens: 900,
          });
        }

        // If session exists, persist user message and assistant message with token tracking
        if (activeSessionId && resolvedUserId) {
          try {
            // Check if user turn is already recorded (prevents duplicate turn on re-try)
            const existingUserMsg = await prisma.aiChatMessage.findFirst({
              where: {
                sessionId: activeSessionId,
                role: 'USER',
                content: prompt,
              }
            });

            if (!existingUserMsg) {
              await AiChatService.appendMessage(activeSessionId, resolvedUserId, {
                role: 'USER',
                content: prompt,
                clientMessageId: effectiveMessageId,
                promptTokens: AiChatService.estimateTokens(prompt),
              });
            }

            // Record Assistant turn
            const assistantReplyText = data?.data?.introText || JSON.stringify(data?.data || {});
            const fullPayloadMetadata = {
              sections: data?.data?.sections || [],
              apps: data?.data?.apps || [],
              suggestedFollowUps: data?.data?.suggestedFollowUps || [],
              comparisonFlows: data?.data?.comparisonFlows || [],
              uxInsights: data?.data?.uxInsights || '',
            };
            const assistantMsg = await AiChatService.appendMessage(activeSessionId, resolvedUserId, {
              role: 'ASSISTANT',
              content: assistantReplyText,
              clientMessageId: effectiveMessageId ? `${effectiveMessageId}:reply` : undefined,
              metadata: fullPayloadMetadata,
              completionTokens: AiChatService.estimateTokens(assistantReplyText),
            });

            const finalPayload = {
              ...data,
              sessionId: activeSessionId,
              messageId: assistantMsg.id,
            };

            // Cache response under clientMessageId for idempotency (10 min TTL)
            if (effectiveMessageId && redis) {
              await redis.set(`idempotency:msg:${effectiveMessageId}`, JSON.stringify(finalPayload), 'EX', 600);
            }

            return finalPayload;
          } catch (dbErr) {
            console.warn('[AIController.workspaceChat] Session persistence warning:', dbErr);
          }
        }

        if (effectiveMessageId && redis) {
          await redis.set(`idempotency:msg:${effectiveMessageId}`, JSON.stringify(data), 'EX', 600);
        }
        return data;
      };

      // Strictly enforce Redis Mutex Lock on activeSessionId to prevent race conditions & duplicate turns
      let directResponse;
      if (activeSessionId) {
        try {
          directResponse = await RedisLockService.withLock(
            `lock:chat:session:${activeSessionId}`,
            executeTurn,
            {
              ttlMs: 60000,          // 60s lock safety limit
              retryIntervalMs: 250,  // Poll every 250ms
              maxRetries: 240,       // Wait up to 60s for in-flight turn to complete
            }
          );
        } catch (lockErr: any) {
          console.warn(`[AIController.workspaceChat] Concurrency locked on session ${activeSessionId}:`, lockErr.message);
          return res.status(429).json({
            error: "Another AI response is currently generating for this chat session. Please wait for it to complete.",
            code: "CONCURRENT_CHAT_SESSION_LOCKED",
          });
        }
      } else {
        directResponse = await executeTurn();
      }

      return res.json(directResponse);
    } catch (error: any) {
      console.error('[AIController.workspaceChat] Error:', error);
      return res.status(500).json({ error: error?.message || 'Failed to process AI research chat' });
    }
  }

  /**
   * Real-Time SSE Token & Artifact Streaming (ChatGPT / Claude.ai standard)
   * POST /api/v1/ai/workspace-chat/stream
   */
  public static async workspaceChatStream(req: Request, res: Response, ctx?: MeteredContext) {
    try {
      const { prompt, conversationHistory, useCognitive, sessionId, userId, clientMessageId } = req.body;
      const headerFlag = req.headers['x-use-cognitive'] === 'true';
      const shouldRunCognitive = useCognitive === true || headerFlag;
      const effectiveMessageId = ctx?.requestKey || clientMessageId;

      // Setup Server-Sent Events headers (with X-Accel-Buffering: no for Nginx)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      // Resolve user and session
      const resolvedUserId = ctx?.userId || (req as any).user?.id || userId;
      let activeSessionId = sessionId;

      if (resolvedUserId && prompt) {
        const sessionTitle = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;
        const session = await AiChatService.getOrCreateSession(resolvedUserId, activeSessionId, sessionTitle);
        activeSessionId = session.id;
      }

      sendEvent('session_init', { sessionId: activeSessionId });

      // Record actual start time to compute genuine thought duration
      const startTimeMs = Date.now();
      const cleanPromptPreview = prompt.length > 36 ? prompt.substring(0, 33) + '...' : prompt;

      // Step 1: Searching screens & embeddings
      sendEvent('thought_step', {
        id: 'step-search',
        title: `Searching screens and benchmark embeddings for "${cleanPromptPreview}"`,
        status: 'running',
      });

      // Launch Claude execution concurrently with intermediate progressive step progression
      const chatWorkspacePromise = AIService.chatWorkspace({
        prompt,
        conversationHistory,
        useCognitive: shouldRunCognitive
      });

      // After 2.5s, progress from search to friction & architecture evaluation
      const step2Timer = setTimeout(() => {
        try {
          sendEvent('thought_step', {
            id: 'step-search',
            title: `Retrieved relevant screen and flow benchmarks for "${cleanPromptPreview}"`,
            status: 'completed',
          });
          sendEvent('thought_step', {
            id: 'step-eval',
            title: 'Analyzing interaction friction, drop-offs & conversion architectures',
            status: 'running',
          });
        } catch { }
      }, 2500);

      // After 6s, progress to synthesis if still calculating
      const step3Timer = setTimeout(() => {
        try {
          sendEvent('thought_step', {
            id: 'step-eval',
            title: 'Analyzed interaction friction, drop-offs & conversion architectures',
            status: 'completed',
          });
          sendEvent('thought_step', {
            id: 'step-synth',
            title: 'Synthesizing UX best practices and comparative screen flows',
            status: 'running',
          });
        } catch { }
      }, 6000);

      const data = await chatWorkspacePromise;
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);

      // Compute elapsed calculation time
      const thoughtDurationSeconds = Math.max(1, Math.round((Date.now() - startTimeMs) / 1000));

      // Collect real matched app domain badges
      const appBadges = (data?.data?.apps || [])
        .map((a: any) => a.name)
        .filter(Boolean);

      const dynamicThoughtSteps = [
        {
          id: 'step-search',
          title: `Queried screen and flow benchmarks for "${cleanPromptPreview}"`,
          status: 'completed',
          badges: appBadges.length > 0 ? appBadges : undefined,
        },
        {
          id: 'step-eval',
          title: 'Analyzed interaction friction, drop-offs & conversion architectures',
          status: 'completed',
        },
        {
          id: 'step-synth',
          title: 'Synthesized UX best practices and comparative screen flows',
          status: 'completed',
        },
      ];

      sendEvent('thought_complete', {
        steps: dynamicThoughtSteps,
        durationSeconds: thoughtDurationSeconds,
      });

      // Stream text intro in progressive token words (TTFT < 400ms)
      const fullIntroText = data?.data?.introText || '';
      const words = fullIntroText.split(' ');

      // Mark output started on first token delivery (Page 10 Refund Boundary)
      if (ctx) {
        ctx.state.outputStarted = true;
      }

      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
        sendEvent('text_delta', { delta: chunk });
        await new Promise((r) => setTimeout(r, 25)); // Smooth reading pace
      }

      // Stream complete structured artifacts IMMEDIATELY so the client receives them seamlessly
      const payloadMetadata = {
        sections: data?.data?.sections || [],
        apps: data?.data?.apps || [],
        suggestedFollowUps: data?.data?.suggestedFollowUps || [],
        comparisonFlows: data?.data?.comparisonFlows || [],
        uxInsights: data?.data?.uxInsights || '',
        thoughtSteps: dynamicThoughtSteps,
        thoughtDurationSeconds,
      };
      sendEvent('artifacts', payloadMetadata);

      // Settle reservation in parallel non-blocking background promise
      if (ctx) {
        CreditService.settle({
          reservationId: ctx.reservationId,
          userId: ctx.userId,
          sessionId: activeSessionId,
          clientMessageId: effectiveMessageId,
          actionType: ctx.action,
          model: 'claude-3-5-sonnet-20241022',
          inputTokens: 1800,
          outputTokens: 900,
        }).catch((err) => console.warn('[CreditService.settle] Non-blocking warning:', err));
      }

      // Persist to PostgreSQL in background without blocking SSE stream completion
      let messageId: string = crypto.randomUUID();
      const persistPromise = (async () => {
        if (activeSessionId && resolvedUserId) {
          try {
            const existingUserMsg = await prisma.aiChatMessage.findFirst({
              where: {
                sessionId: activeSessionId,
                role: 'USER',
                content: prompt,
              }
            });

            if (!existingUserMsg) {
              await AiChatService.appendMessage(activeSessionId, resolvedUserId, {
                role: 'USER',
                content: prompt,
                clientMessageId: effectiveMessageId,
                promptTokens: AiChatService.estimateTokens(prompt),
              });
            }

            const assistantMsg = await AiChatService.appendMessage(activeSessionId, resolvedUserId, {
              role: 'ASSISTANT',
              content: fullIntroText,
              clientMessageId: effectiveMessageId ? `${effectiveMessageId}:reply` : undefined,
              metadata: payloadMetadata,
              completionTokens: AiChatService.estimateTokens(fullIntroText),
            });
            messageId = assistantMsg.id;
          } catch (dbErr) {
            console.warn('[AIController.workspaceChatStream] DB persist warning:', dbErr);
          }
        }
      })();

      // Send done event immediately so UI finishes streaming instantly without a pause
      sendEvent('done', { messageId, sessionId: activeSessionId });
      res.end();

      // Await persist to guarantee completion before worker thread terminates
      await persistPromise;
    } catch (error: any) {
      console.error('[AIController.workspaceChatStream] Error:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ error: error?.message || 'Streaming failed' })}\n\n`);
      res.end();
    }
  }
}
