import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { getAiUsage } from '../services/ai-usage.service';

export const getMyQuota = async (req: Request, res: Response) => {
  try {
    // In a real app with auth, this would come from req.user
    // For now, we will assume the client sends their user ID in a header or we hardcode a test user.
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { limit, usage } = await getAiUsage(userId);
    
    // Also fetch their tier
    const user = await prisma.clientUser.findUnique({
      where: { id: userId }
    });

    res.status(200).json({
      tier: user?.tier || 'FREE',
      limit,
      usage: usage ? usage.promptsUsed : 0
    });
  } catch (error) {
    console.error('Error fetching my quota:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
