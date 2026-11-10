import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { AiChatService } from '../services/ai-chat.service';
import { RedisLockService } from '../services/redis-lock.service';
import { prisma } from '../db/prisma';
import { redis } from '../lib/redis';

export class AIController {
  public static async inspect(req: Request, res: Response) {
    try {
      const { prompt, region, imageBase64 } = req.body;
      const response = await AIService.inspectScreen({ prompt, region, imageBase64 });
      return res.json({ response });
    } catch (error: any) {
      console.error('[AIController.inspect] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred during AI inspection' });
    }
  }

  public static async insights(req: Request, res: Response) {
    try {
      const { imageBase64, screenId, appName } = req.body;
      const data = await AIService.generateInsights({ imageBase64, screenId, appName });
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.insights] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while generating insights' });
    }
  }

  public static async compare(req: Request, res: Response) {
    try {
      const { originalImageBase64, userImageBase64 } = req.body;
      const data = await AIService.compareScreens({ originalImageBase64, userImageBase64 });
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.compare] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while generating comparison' });
    }
  }

  public static async detectContext(req: Request, res: Response) {
    try {
      const { imageBase64 } = req.body;
      const data = await AIService.detectContext({ imageBase64 });
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.detectContext] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while detecting context' });
    }
  }

  public static async benchmark(req: Request, res: Response) {
    try {
      const { imageBase64, categoryId, subcategoryId, flowId, screenType } = req.body;
      const data = await AIService.benchmarkScreen({ imageBase64, categoryId, subcategoryId, flowId, screenType });
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

  public static async benchmarkChat(req: Request, res: Response) {
    try {
      const { message, chatHistory, benchmarkData } = req.body;
      const data = await AIService.chatBenchmark({ message, chatHistory, benchmarkData });
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.benchmarkChat] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while chatting' });
    }
  }

  public static async improveDesign(req: Request, res: Response) {
    try {
      const { imageBase64, benchmarkResult } = req.body;
      const data = await AIService.improveDesign({ imageBase64, benchmarkResult });
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

  public static async generateDesignAgent(req: Request, res: Response) {
    try {
      const { prompt, category, flow, device } = req.body;
      const data = await AIService.generateDesignAgentScreen({ prompt, category, flow, device });
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.generateDesignAgent] Error:', error);
      return res.status(500).json({ error: error?.message || 'Failed to generate design screen' });
    }
  }

  public static async workspaceChat(req: Request, res: Response) {
    try {
      const { prompt, conversationHistory, useCognitive, sessionId, userId, clientMessageId } = req.body;
      const headerFlag = req.headers['x-use-cognitive'] === 'true';
      const shouldRunCognitive = useCognitive === true || headerFlag;

      // 1. Resolve user and session
      const resolvedUserId = (req as any).user?.id || userId;
      let activeSessionId = sessionId;

      // 2. Request Idempotency Check: if client sent clientMessageId, check if already processed
      if (clientMessageId && redis) {
        const cachedResponse = await redis.get(`idempotency:msg:${clientMessageId}`);
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
              metadata: fullPayloadMetadata,
              completionTokens: AiChatService.estimateTokens(assistantReplyText),
            });

            const finalPayload = {
              ...data,
              sessionId: activeSessionId,
              messageId: assistantMsg.id,
            };

            // Cache response under clientMessageId for idempotency (10 min TTL)
            if (clientMessageId && redis) {
              await redis.set(`idempotency:msg:${clientMessageId}`, JSON.stringify(finalPayload), 'EX', 600);
            }

            return finalPayload;
          } catch (dbErr) {
            console.warn('[AIController.workspaceChat] Session persistence warning:', dbErr);
          }
        }

        if (clientMessageId && redis) {
          await redis.set(`idempotency:msg:${clientMessageId}`, JSON.stringify(data), 'EX', 600);
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
  public static async workspaceChatStream(req: Request, res: Response) {
    try {
      const { prompt, conversationHistory, useCognitive, sessionId, userId, clientMessageId } = req.body;
      const headerFlag = req.headers['x-use-cognitive'] === 'true';
      const shouldRunCognitive = useCognitive === true || headerFlag;

      // Setup Server-Sent Events headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      // Resolve user and session
      const resolvedUserId = (req as any).user?.id || userId;
      let activeSessionId = sessionId;

      if (resolvedUserId && prompt) {
        const sessionTitle = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;
        const session = await AiChatService.getOrCreateSession(resolvedUserId, activeSessionId, sessionTitle);
        activeSessionId = session.id;
      }

      sendEvent('session_init', { sessionId: activeSessionId });

      // Execute AI research chat with Claude
      const data = await AIService.chatWorkspace({
        prompt,
        conversationHistory,
        useCognitive: shouldRunCognitive
      });

      // Stream text intro in progressive token words (TTFT < 400ms)
      const fullIntroText = data?.data?.introText || '';
      const words = fullIntroText.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
        sendEvent('text_delta', { delta: chunk });
        await new Promise((r) => setTimeout(r, 25)); // Smooth reading pace
      }

      // Stream complete structured artifacts
      const payloadMetadata = {
        sections: data?.data?.sections || [],
        apps: data?.data?.apps || [],
        suggestedFollowUps: data?.data?.suggestedFollowUps || [],
        comparisonFlows: data?.data?.comparisonFlows || [],
        uxInsights: data?.data?.uxInsights || '',
      };
      sendEvent('artifacts', payloadMetadata);

      // Persist to PostgreSQL & Redis
      let messageId: string = crypto.randomUUID();
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
              promptTokens: AiChatService.estimateTokens(prompt),
            });
          }

          const assistantMsg = await AiChatService.appendMessage(activeSessionId, resolvedUserId, {
            role: 'ASSISTANT',
            content: fullIntroText,
            metadata: payloadMetadata,
            completionTokens: AiChatService.estimateTokens(fullIntroText),
          });
          messageId = assistantMsg.id;
        } catch (dbErr) {
          console.warn('[AIController.workspaceChatStream] DB persist warning:', dbErr);
        }
      }

      sendEvent('done', { messageId, sessionId: activeSessionId });
      res.end();
    } catch (error: any) {
      console.error('[AIController.workspaceChatStream] Error:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ error: error?.message || 'Streaming failed' })}\n\n`);
      res.end();
    }
  }
}
