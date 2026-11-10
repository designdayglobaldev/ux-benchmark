import { Request, Response } from 'express';
import { AiChatService } from '../services/ai-chat.service';
import { prisma } from '../db/prisma';

export class AiChatController {
  /**
   * GET /api/v1/ai/sessions - List user sessions for sidebar
   */
  public static async listSessions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req.query.userId as string);
      
      const sessions = await AiChatService.getUserSessions(userId);
      return res.json(sessions);
    } catch (err: any) {
      console.error('[AiChatController.listSessions] Error:', err);
      return res.status(500).json({ message: err.message || 'Internal server error' });
    }
  }

  /**
   * GET /api/v1/ai/sessions/:id - Get session conversation with context window
   */
  public static async getSession(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const context = await AiChatService.getSessionContext(id);
      return res.json(context);
    } catch (err: any) {
      console.error('[AiChatController.getSession] Error:', err);
      return res.status(500).json({ message: err.message || 'Internal server error' });
    }
  }

  /**
   * DELETE /api/v1/ai/sessions/:id - Delete research session & its turns
   */
  public static async deleteSession(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.aiChatMessage.deleteMany({ where: { sessionId: id } });
      await prisma.aiChatSession.deleteMany({ where: { id } });
      return res.json({ message: 'Session deleted successfully' });
    } catch (err: any) {
      console.error('[AiChatController.deleteSession] Error:', err);
      return res.status(500).json({ message: err.message || 'Failed to delete session' });
    }
  }

  /**
   * POST /api/v1/ai/sessions - Create new research session
   */
  public static async createSession(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      const { title } = req.body;
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const session = await AiChatService.getOrCreateSession(userId, undefined, title);
      return res.status(201).json(session);
    } catch (err: any) {
      console.error('[AiChatController.createSession] Error:', err);
      return res.status(500).json({ message: err.message || 'Internal server error' });
    }
  }

  /**
   * POST /api/v1/ai/feedback - Record 👍 / 👎 rating & user corrections for training
   */
  public static async submitFeedback(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      const { messageId, rating, feedbackReason, correctionText } = req.body;

      if (!messageId || typeof rating !== 'number') {
        return res.status(400).json({ message: 'messageId and rating (1 or -1) are required' });
      }

      const feedback = await AiChatService.recordFeedback({
        messageId,
        userId,
        rating,
        feedbackReason,
        correctionText,
      });

      return res.json({ success: true, feedback });
    } catch (err: any) {
      console.error('[AiChatController.submitFeedback] Error:', err);
      return res.status(500).json({ message: err.message || 'Internal server error' });
    }
  }

  /**
   * GET /api/v1/ai/training/export - Export dataset as JSONL for model fine-tuning
   */
  public static async exportDataset(req: Request, res: Response) {
    try {
      const dataset = await AiChatService.exportTrainingDataset();
      
      const jsonl = dataset.map((d) => JSON.stringify(d)).join('\n');
      res.setHeader('Content-Type', 'application/x-jsonlines');
      res.setHeader('Content-Disposition', 'attachment; filename="ux_ai_training_dataset.jsonl"');
      return res.send(jsonl);
    } catch (err: any) {
      console.error('[AiChatController.exportDataset] Error:', err);
      return res.status(500).json({ message: err.message || 'Internal server error' });
    }
  }

  /**
   * GET /api/v1/ai/admin/chats - Admin inspector for all user chats
   */
  public static async adminListChats(req: Request, res: Response) {
    try {
      const chats = await prisma.aiChatSession.findMany({
        take: 50,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, name: true, tier: true },
          },
          messages: {
            take: 20,
            orderBy: { createdAt: 'asc' },
            include: {
              feedbacks: true,
            },
          },
        },
      });

      return res.json(chats);
    } catch (err: any) {
      console.error('[AiChatController.adminListChats] Error:', err);
      return res.status(500).json({ message: err.message || 'Internal server error' });
    }
  }
}

