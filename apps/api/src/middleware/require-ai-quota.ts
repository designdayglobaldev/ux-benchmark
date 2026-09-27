import { Request, Response, NextFunction } from 'express';
import { checkCanUseAi, incrementAiUsage } from '../services/ai-usage.service';

export const requireAiQuota = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Assuming the authentication middleware sets req.user or similar.
    // We will extract userId from headers or body for this placeholder if req.user isn't available.
    // Adjust this to match your actual auth implementation!
    const userId = (req as any).user?.id || req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User ID required for AI quota check' });
    }

    const canUse = await checkCanUseAi(userId);

    if (!canUse) {
      return res.status(429).json({ 
        message: 'AI Quota Exceeded. Please upgrade your plan for more prompts.',
        code: 'QUOTA_EXCEEDED'
      });
    }

    // Attach a method to increment usage once the request is successful
    // Alternatively, you can just call incrementAiUsage in the controller
    // For middleware, we can hook into res.on('finish') if it succeeded
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Increment usage in the background
        incrementAiUsage(userId).catch(err => {
          console.error('Failed to increment AI usage:', err);
        });
      }
    });

    next();
  } catch (error) {
    console.error('Error checking AI quota:', error);
    res.status(500).json({ message: 'Internal server error during quota check' });
  }
};
