import { prisma } from '../db/prisma';
import Redis from 'ioredis';
import { redis } from '../lib/redis';

export interface ChatMessagePayload {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  metadata?: any;
  promptTokens?: number;
  completionTokens?: number;
}

export class AiChatService {
  private static redis: Redis | null = redis;

  /**
   * Helper to estimate token counts (rough 4 chars per token fallback if tokenizer is unavailable)
   */
  public static estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Get or create active session (Twenty CRM Upsert Pattern)
   */
  public static async getOrCreateSession(userId: string, sessionId?: string, title?: string) {
    // Ensure user exists in ClientUser before foreign key insert
    let targetUserId = userId;
    const clientUser = await prisma.clientUser.findUnique({ where: { id: userId } });
    if (!clientUser) {
      // Find default fallback user if auth id is out of sync or test user
      const fallbackUser = await prisma.clientUser.findFirst();
      if (fallbackUser) {
        targetUserId = fallbackUser.id;
      }
    }

    if (sessionId) {
      // Upsert by primary key so concurrent requests or retries never duplicate
      return await prisma.aiChatSession.upsert({
        where: { id: sessionId },
        update: {},
        create: {
          id: sessionId,
          userId: targetUserId,
          title: title || 'New Research',
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    return await prisma.aiChatSession.create({
      data: {
        userId: targetUserId,
        title: title || 'New Research',
      },
      include: {
        messages: true,
      },
    });
  }

  /**
   * Get user chat sessions (for sidebar "Recent Researches")
   */
  public static async getUserSessions(userId?: string, limit = 20) {
    if (!userId) {
      return await prisma.aiChatSession.findMany({
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          totalTokens: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return await prisma.aiChatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        totalTokens: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Fast Context Window Retrieval (Cached in Redis, fallback to Postgres)
   */
  public static async getSessionContext(sessionId: string, maxContextTokens = 8192) {
    const fullSessionKey = `chat:session:${sessionId}:full`;

    // 1. Try Redis cache first (sub-2ms high performance hydration)
    if (this.redis) {
      try {
        const cachedFull = await this.redis.get(fullSessionKey);
        if (cachedFull) {
          return JSON.parse(cachedFull);
        }
      } catch (err) {
        console.warn('[Redis] Full session cache read warning:', err);
      }
    }

    // 2. Fallback to DB
    const session = await prisma.aiChatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) return { messages: [], summary: null };

    // Sliding window logic: preserve context summary + recent turns within token budget
    let tokenBudget = maxContextTokens;
    const reversedMessages = [...session.messages].reverse();
    const activeMessages: any[] = [];

    for (const msg of reversedMessages) {
      const estimated = msg.totalTokens || this.estimateTokens(msg.content);
      if (tokenBudget - estimated < 0 && activeMessages.length >= 4) {
        // Budget exhausted and we already have at least 4 recent turns
        break;
      }
      tokenBudget -= estimated;
      activeMessages.unshift(msg);
    }

    const result = {
      sessionId: session.id,
      title: session.title,
      summary: session.contextSummary,
      messages: session.messages, // Provide full turn history for UI
      contextMessages: activeMessages, // Provide sliding window for LLM context
      totalSavedMessages: session.messages.length,
    };

    // Cache in Redis for 1 hour (sub-2ms next time)
    if (this.redis) {
      try {
        await this.redis.set(fullSessionKey, JSON.stringify(result), 'EX', 3600);
      } catch (err) {
        console.warn('[Redis] Session cache write warning:', err);
      }
    }

    return result;
  }

  /**
   * Append message to session and update token tallies
   */
  public static async appendMessage(sessionId: string, userId: string, payload: ChatMessagePayload) {
    const promptTokens = payload.promptTokens || 0;
    const completionTokens = payload.completionTokens || 0;
    const totalTokens = promptTokens + completionTokens || this.estimateTokens(payload.content);

    const message = await prisma.aiChatMessage.create({
      data: {
        sessionId,
        role: payload.role,
        content: payload.content,
        metadata: payload.metadata || undefined,
        promptTokens,
        completionTokens,
        totalTokens,
      },
    });

    // Update session cumulative tokens and timestamp
    await prisma.aiChatSession.update({
      where: { id: sessionId },
      data: {
        totalTokens: { increment: totalTokens },
        updatedAt: new Date(),
      },
    });

    // Invalidate Redis session caches
    if (this.redis) {
      try {
        await this.redis.del(`chat:session:${sessionId}:full`);
        await this.redis.del(`chat:session:${sessionId}:context`);
        // Atomically increment monthly user token counter in Redis
        const now = new Date();
        const monthKey = `user:${userId}:tokens:${now.getFullYear()}-${now.getMonth() + 1}`;
        await this.redis.incrby(monthKey, totalTokens);
        await this.redis.expire(monthKey, 86400 * 35); // 35 days TTL
      } catch (err) {
        console.warn('[Redis] Token counter warning:', err);
      }
    }

    // Persist monthly token usage to PostgreSQL
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    await prisma.aiUsage.upsert({
      where: { userId_month_year: { userId, month, year } },
      update: {
        tokensUsed: { increment: totalTokens },
        promptsUsed: payload.role === 'USER' ? { increment: 1 } : undefined,
      },
      create: {
        userId,
        month,
        year,
        tokensUsed: totalTokens,
        promptsUsed: payload.role === 'USER' ? 1 : 0,
      },
    });

    return message;
  }

  /**
   * Record Feedback (👍 / 👎) & user corrections for model training
   */
  public static async recordFeedback(params: {
    messageId: string;
    userId: string;
    rating: number; // 1 or -1
    feedbackReason?: string;
    correctionText?: string;
  }) {
    return await prisma.aiMessageFeedback.upsert({
      where: {
        messageId_userId: {
          messageId: params.messageId,
          userId: params.userId,
        },
      },
      update: {
        rating: params.rating,
        feedbackReason: params.feedbackReason,
        correctionText: params.correctionText,
      },
      create: {
        messageId: params.messageId,
        userId: params.userId,
        rating: params.rating,
        feedbackReason: params.feedbackReason,
        correctionText: params.correctionText,
      },
    });
  }

  /**
   * Export Fine-Tuning dataset in JSONL format for OpenAI / Anthropic SFT
   */
  public static async exportTrainingDataset(filterByRating = true) {
    const sessions = await prisma.aiChatSession.findMany({
      include: {
        messages: {
          where: { isTrainingEligible: true },
          include: { feedbacks: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const dataset: any[] = [];

    for (const session of sessions) {
      if (session.messages.length < 2) continue;

      const formattedMessages = session.messages.map((m) => {
        // If a designer provided an accepted correction on downvoted output, use the corrected text
        const downvoteWithCorrection = m.feedbacks.find((f) => f.rating === -1 && f.correctionText);
        const finalContent = downvoteWithCorrection?.correctionText || m.content;

        return {
          role: m.role.toLowerCase(),
          content: finalContent,
        };
      });

      dataset.push({ messages: formattedMessages });
    }

    return dataset;
  }
}
