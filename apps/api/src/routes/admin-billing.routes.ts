import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { CreditService } from '../services/credit.service';
import { LedgerType } from '@prisma/client';
import { ACTION_COSTS, ActionType } from '../middleware/metered';
import { razorpay } from '../lib/razorpay';

export const adminBillingRouter = Router();

// Middleware checking Admin permission
const requireAdmin = async (req: Request, res: Response, next: any) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const user = await prisma.clientUser.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN' && (req as any).user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin access required' });
  }

  next();
};

/**
 * 1. Admin Manual Credit Adjustment (Pages 20-21 of Implementation Plan)
 * POST /api/v1/admin/users/:userId/credits
 * Mandatory reason, audited in AdminAuditLog, deposited to CreditLedger.
 */
adminBillingRouter.post('/users/:userId/credits', requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.id;
    const { userId } = req.params;
    const { delta, reason } = req.body;

    if (typeof delta !== 'number' || delta === 0) {
      return res.status(400).json({ error: 'INVALID_DELTA', message: 'Delta must be a non-zero integer' });
    }
    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({ error: 'REASON_REQUIRED', message: 'A written reason is mandatory for credit edits' });
    }

    const type = delta > 0 ? LedgerType.ADMIN_MANUAL_GRANT : LedgerType.ADMIN_MANUAL_DEDUCTION;
    const idempotencyKey = `admin:${adminId}:${userId}:${Date.now()}`;

    const result = await prisma.$transaction(async (tx) => {
      // Apply through CreditService single source of truth
      const applied = await CreditService.apply(tx, {
        userId,
        delta,
        type,
        idempotencyKey,
        reason,
        adminId,
      });

      // Record audit log
      await tx.adminAuditLog.create({
        data: {
          adminId,
          targetUserId: userId,
          action: 'credits.adjust',
          reason,
          requestKey: idempotencyKey,
          after: { delta, balanceAfter: applied.balanceAfter },
        },
      });

      return applied;
    });

    res.json({ success: true, balanceAfter: result.balanceAfter });
  } catch (err: any) {
    console.error('Admin credit adjustment error:', err);
    res.status(500).json({ error: err.message || 'Failed to adjust user credits' });
  }
});

/**
 * 2. Admin User VIP Tier Override (Pages 21-22 of Implementation Plan)
 * POST /api/v1/admin/users/:userId/override-tier
 */
adminBillingRouter.post('/users/:userId/override-tier', requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.id;
    const { userId } = req.params;
    const { tierOverride, overrideUntil, reason } = req.body;

    if (!['FREE', 'PREMIUM', null].includes(tierOverride)) {
      return res.status(400).json({ error: 'INVALID_TIER' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.clientUser.update({
        where: { id: userId },
        data: {
          tierOverride,
          tierOverrideUntil: overrideUntil ? new Date(overrideUntil) : null,
          tierOverrideReason: reason || null,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          targetUserId: userId,
          action: 'tier.override',
          reason: reason || 'Admin manual tier override',
          requestKey: `tier_override:${adminId}:${userId}:${Date.now()}`,
          after: { tierOverride, overrideUntil },
        },
      });
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Admin tier override error:', err);
    res.status(500).json({ error: err.message || 'Failed to override tier' });
  }
});

/**
 * 3. Toggle App Premium Status & Preview Limit (Mobbin-style gating)
 * PATCH /api/v1/admin/apps/:id/premium
 */
adminBillingRouter.patch('/apps/:id/premium', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isPremium, previewLimit } = req.body;

    const updated = await prisma.app.update({
      where: { id },
      data: {
        isPremium: typeof isPremium === 'boolean' ? isPremium : undefined,
        previewLimit: typeof previewLimit === 'number' ? previewLimit : undefined,
      },
    });

    res.json({ success: true, app: updated });
  } catch (err: any) {
    console.error('Admin app premium toggle error:', err);
    res.status(500).json({ error: err.message || 'Failed to update app premium status' });
  }
});

/**
 * 4. List All Subscriptions & Transactions for Admin Dashboard
 * GET /api/v1/admin/billing/overview
 */
adminBillingRouter.get('/billing/overview', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [subscriptions, transactions, ledgerStats, plans] = await Promise.all([
      prisma.userSubscription.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, name: true } }, price: true },
      }),
      prisma.paymentTransaction.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, name: true } } },
      }),
      prisma.creditLedger.aggregate({
        _sum: { amountDelta: true },
        _count: { id: true },
      }),
      prisma.subscriptionPlan.findMany({
        include: { prices: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    res.json({ subscriptions, transactions, ledgerStats, plans });
  } catch (err: any) {
    console.error('Admin billing overview error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch billing overview' });
  }
});

/**
 * 5. Get and Update Rate Card Costs in Admin
 * GET /api/v1/admin/billing/rate-card
 * PUT /api/v1/admin/billing/rate-card
 */
adminBillingRouter.get('/billing/rate-card', requireAdmin, async (_req: Request, res: Response) => {
  res.json({ rates: ACTION_COSTS });
});

adminBillingRouter.put('/billing/rate-card', requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.id;
    const { action, cost } = req.body;

    if (!ACTION_COSTS[action as ActionType] || typeof cost !== 'number' || cost <= 0) {
      return res.status(400).json({ error: 'INVALID_RATE_PARAMETERS' });
    }

    const previousCost = ACTION_COSTS[action as ActionType];
    ACTION_COSTS[action as ActionType] = cost;

    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'rate_card.update',
        reason: `Updated ${action} credit cost from ${previousCost} to ${cost}`,
        requestKey: `rate_card:${action}:${Date.now()}`,
        before: { action, cost: previousCost },
        after: { action, cost },
      },
    });

    res.json({ success: true, rates: ACTION_COSTS });
  } catch (err: any) {
    console.error('Admin rate card update error:', err);
    res.status(500).json({ error: err.message || 'Failed to update rate card' });
  }
});

/**
 * 6. Manage Plans & Prices directly from Admin
 * POST /api/v1/admin/billing/plans
 * Creates plan in DB and optionally provisions recurring AutoPay plan on Razorpay automatically!
 */
adminBillingRouter.post('/billing/plans', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { code, name, description, amountInr, monthlyCredits, interval = 'monthly' } = req.body;

    if (!code || !name || !amountInr || !monthlyCredits) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'code, name, amountInr, and monthlyCredits are required' });
    }

    const amountMinor = Math.round(Number(amountInr) * 100);

    // 1. Create recurring plan on Razorpay
    let razorpayPlanId = `manual_${Date.now()}`;
    try {
      const rzpPlan = await razorpay.plans.create({
        period: interval === 'yearly' ? 'yearly' : 'monthly',
        interval: 1,
        item: {
          name: name,
          amount: amountMinor,
          currency: 'INR',
          description: description || `${monthlyCredits} monthly AI credits and library access`,
        },
      });
      razorpayPlanId = rzpPlan.id;
    } catch (rzpErr) {
      console.warn('Could not auto-provision Razorpay plan (using fallback ID):', rzpErr);
    }

    // 2. Upsert SubscriptionPlan
    const plan = await prisma.subscriptionPlan.upsert({
      where: { code },
      update: { name, description },
      create: { code, name, description },
    });

    // 3. Create PlanPrice record
    const price = await prisma.planPrice.create({
      data: {
        planId: plan.id,
        currency: 'INR',
        amountMinor,
        razorpayPlanId,
        isActive: true,
        monthlyCredits: Number(monthlyCredits),
      },
    });

    res.json({ success: true, plan, price });
  } catch (err: any) {
    console.error('Admin create plan error:', err);
    res.status(500).json({ error: err.message || 'Failed to create plan' });
  }
});
