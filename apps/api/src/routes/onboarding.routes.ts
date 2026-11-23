import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// GET /api/v1/onboarding/options
// Public endpoint for client: returns active roles and challenges ordered by sortOrder
router.get('/options', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as 'ROLE' | 'CHALLENGE' | undefined;

    const whereClause: any = { isActive: true };
    if (type) {
      whereClause.type = type;
    }

    const options = await prisma.onboardingOption.findMany({
      where: whereClause,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const roles = options.filter((o) => o.type === 'ROLE');
    const challenges = options.filter((o) => o.type === 'CHALLENGE');

    res.json({
      success: true,
      data: {
        roles,
        challenges,
        all: options,
      },
    });
  } catch (error: any) {
    console.error('[Onboarding] Error fetching options:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding options' });
  }
});

// GET /api/v1/onboarding/check-username?username=xyz
// Checks if a username is available
router.get('/check-username', async (req: Request, res: Response) => {
  try {
    const rawUsername = (req.query.username as string || '').trim().toLowerCase();
    if (!rawUsername || rawUsername.length < 2) {
      return res.status(400).json({ available: false, error: 'Username must be at least 2 characters' });
    }

    const existing = await prisma.userOnboardingProfile.findUnique({
      where: { username: rawUsername },
      select: { id: true, userId: true },
    });

    // If current authenticated user already owns this username, it's considered available for them
    const authUserId = (req as any).user?.id;
    const isAvailable = !existing || (authUserId && existing.userId === authUserId);

    res.json({
      success: true,
      available: Boolean(isAvailable),
      username: rawUsername,
    });
  } catch (error: any) {
    console.error('[Onboarding] Error checking username:', error);
    res.status(500).json({ error: 'Failed to check username availability' });
  }
});

// GET /api/v1/onboarding/status
// Authenticated check to see if user has completed onboarding
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const profile = await prisma.userOnboardingProfile.findUnique({
      where: { userId },
    });

    res.json({
      success: true,
      data: {
        isOnboarded: Boolean(profile?.isOnboarded),
        profile: profile || null,
      },
    });
  } catch (error: any) {
    console.error('[Onboarding] Error checking status:', error);
    res.status(500).json({ error: 'Failed to check onboarding status' });
  }
});

// POST /api/v1/onboarding/submit
// Saves or updates the user's onboarding profile
router.post('/submit', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const email = (req as any).user.email;
    const { username, avatarUrl, role, biggestChallenge, isSkipped } = req.body;

    const cleanUsername = (username || '').trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 2) {
      return res.status(400).json({ error: 'A valid username of at least 2 characters is required' });
    }

    // Ensure ClientUser exists
    await prisma.clientUser.upsert({
      where: { id: userId },
      update: { email: email || undefined },
      create: {
        id: userId,
        email: email || `${cleanUsername}@user.zibo.design`,
      },
    });

    // Check username conflict
    const usernameOwner = await prisma.userOnboardingProfile.findUnique({
      where: { username: cleanUsername },
    });

    if (usernameOwner && usernameOwner.userId !== userId) {
      return res.status(409).json({ error: 'This username is already taken. Please choose another.' });
    }

    // Upsert UserOnboardingProfile
    const profile = await prisma.userOnboardingProfile.upsert({
      where: { userId },
      update: {
        username: cleanUsername,
        avatarUrl: avatarUrl || undefined,
        role: role || undefined,
        biggestChallenge: biggestChallenge || undefined,
        isOnboarded: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        username: cleanUsername,
        avatarUrl: avatarUrl || '/Avatars/1.svg',
        role: role || null,
        biggestChallenge: biggestChallenge || null,
        isOnboarded: true,
        completedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: profile,
    });
  } catch (error: any) {
    console.error('[Onboarding] Error saving profile:', error);
    res.status(500).json({ error: 'Failed to submit onboarding profile' });
  }
});

export default router;
