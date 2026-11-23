import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

// GET /api/v1/admin/onboarding/options
// List all options (including inactive) with counts
router.get('/options', async (req: Request, res: Response) => {
  try {
    const options = await prisma.onboardingOption.findMany({
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    res.json({
      success: true,
      data: options,
    });
  } catch (error: any) {
    console.error('[Admin Onboarding] Error fetching options:', error);
    res.status(500).json({ error: 'Failed to fetch options' });
  }
});

// POST /api/v1/admin/onboarding/options
// Create a new Role or Challenge option
router.post('/options', async (req: Request, res: Response) => {
  try {
    const { type, label, description, iconName, sortOrder, isActive } = req.body;

    if (!type || !label?.trim()) {
      return res.status(400).json({ error: 'Type (ROLE or CHALLENGE) and label are required' });
    }

    const created = await prisma.onboardingOption.create({
      data: {
        type,
        label: label.trim(),
        description: description?.trim() || null,
        iconName: iconName || (type === 'ROLE' ? 'PenTool' : null),
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        isActive: typeof isActive === 'boolean' ? isActive : true,
      },
    });

    res.json({
      success: true,
      data: created,
    });
  } catch (error: any) {
    console.error('[Admin Onboarding] Error creating option:', error);
    res.status(500).json({ error: 'Failed to create option' });
  }
});

// PUT /api/v1/admin/onboarding/options/:id
// Update an existing option
router.put('/options/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { label, description, iconName, sortOrder, isActive } = req.body;

    const updated = await prisma.onboardingOption.update({
      where: { id },
      data: {
        label: label !== undefined ? label.trim() : undefined,
        description: description !== undefined ? description?.trim() : undefined,
        iconName: iconName !== undefined ? iconName : undefined,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : undefined,
        isActive: typeof isActive === 'boolean' ? isActive : undefined,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('[Admin Onboarding] Error updating option:', error);
    res.status(500).json({ error: 'Failed to update option' });
  }
});

// DELETE /api/v1/admin/onboarding/options/:id
// Delete an option
router.delete('/options/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.onboardingOption.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Option deleted successfully',
    });
  } catch (error: any) {
    console.error('[Admin Onboarding] Error deleting option:', error);
    res.status(500).json({ error: 'Failed to delete option' });
  }
});

// GET /api/v1/admin/onboarding/analytics
// Aggregated demographics of onboarded users
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.clientUser.count();
    const totalOnboarded = await prisma.userOnboardingProfile.count({
      where: { isOnboarded: true },
    });

    // Group by role
    const rolesGroup = await prisma.userOnboardingProfile.groupBy({
      by: ['role'],
      where: { isOnboarded: true, role: { not: null } },
      _count: { role: true },
    });

    // Group by challenge
    const challengesGroup = await prisma.userOnboardingProfile.groupBy({
      by: ['biggestChallenge'],
      where: { isOnboarded: true, biggestChallenge: { not: null } },
      _count: { biggestChallenge: true },
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOnboarded,
        completionRate: totalUsers > 0 ? Math.round((totalOnboarded / totalUsers) * 100) : 0,
        rolesBreakdown: rolesGroup.map((r) => ({ role: r.role, count: r._count.role })),
        challengesBreakdown: challengesGroup.map((c) => ({ challenge: c.biggestChallenge, count: c._count.biggestChallenge })),
      },
    });
  } catch (error: any) {
    console.error('[Admin Onboarding] Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
