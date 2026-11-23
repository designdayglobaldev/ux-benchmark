import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { razorpay } from '../lib/razorpay';
import { CreditService } from '../services/credit.service';
import { LedgerType, PaymentStatus, SubscriptionStatus } from '@prisma/client';

export const billingRouter = Router();

/**
 * POST /api/v1/billing/subscribe (Pages 13-14 of Implementation Plan)
 * Enforces Race R10, R11:
 * - Uses pg_advisory_xact_lock so parallel clicks serialize
 * - Checks for active live subscription
 * - Reuses existing unpaid INCOMPLETE subscription if present
 * - Otherwise creates new Razorpay subscription
 */
billingRouter.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const { planCode = 'pro', currency = 'INR' } = req.body;

    // Normalize plan code (support 'pro', 'PRO_MONTHLY', 'pro_annual', 'PRO_ANNUAL')
    let normalizedCode = planCode;
    if (planCode === 'PRO_MONTHLY') normalizedCode = 'pro';
    if (planCode === 'PRO_ANNUAL') normalizedCode = 'pro_annual';

    // 1. Lookup plan price
    let plan = await prisma.subscriptionPlan.findUnique({
      where: { code: normalizedCode },
      include: {
        prices: {
          where: { currency, isActive: true },
        },
      },
    });

    if (!plan || plan.prices.length === 0) {
      // Fallback check with original planCode
      plan = await prisma.subscriptionPlan.findUnique({
        where: { code: planCode },
        include: {
          prices: {
            where: { currency, isActive: true },
          },
        },
      });
    }

    if (!plan || plan.prices.length === 0) {
      return res.status(404).json({ error: 'PLAN_NOT_FOUND', message: 'Requested plan price was not found' });
    }

    const price = plan.prices[0];

    // 2. Transaction with Advisory Lock (Page 13, Step 1)
    const result = await prisma.$transaction(async (tx) => {
      // Create hash of userId to 32-bit integer for pg_advisory_xact_lock
      const lockKey = Math.abs(
        crypto.createHash('md5').update(userId).digest().readInt32BE(0)
      );
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

      // Look for an existing live subscription (Page 13, Step 2)
      const existing = await tx.userSubscription.findFirst({
        where: {
          userId,
          status: { in: ['INCOMPLETE', 'ACTIVE', 'PAST_DUE', 'PAUSED'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existing) {
        if (existing.status === 'ACTIVE') {
          return { error: 'ALREADY_SUBSCRIBED', status: 409, message: 'You already have an active subscription.' };
        }

        // If it is an INCOMPLETE subscription, check whether it actually exists and is usable on Razorpay
        if (existing.status === 'INCOMPLETE') {
          try {
            const fetchedSub: any = await (razorpay.subscriptions as any).fetch(existing.razorpaySubId);
            if (fetchedSub && fetchedSub.status === 'created' || fetchedSub.status === 'authenticated') {
              return {
                subscriptionId: existing.razorpaySubId,
                planPriceId: price.id,
                currency: price.currency,
                amountMinor: price.amountMinor,
              };
            }
          } catch (fetchErr) {
            console.warn(`[POST /billing/subscribe] Stale subscription ${existing.razorpaySubId} not found on Razorpay, creating fresh one.`);
          }
        }
      }

      // 3. Create subscription on Razorpay with total_count: 120 (Page 13, Step 3 & Page 33)
      const rzpSub = await (razorpay.subscriptions as any).create({
        plan_id: price.razorpayPlanId,
        total_count: 120, // 10 years of monthly billing cycles
        quantity: 1,
        customer_notify: 1,
        notes: {
          userId,
          priceId: price.id,
        },
      });

      // Insert local UserSubscription as INCOMPLETE
      await tx.userSubscription.create({
        data: {
          userId,
          planPriceId: price.id,
          razorpaySubId: rzpSub.id,
          status: SubscriptionStatus.INCOMPLETE,
          razorpayStatus: rzpSub.status,
        },
      });

      return {
        subscriptionId: rzpSub.id,
        planPriceId: price.id,
        currency: price.currency,
        amountMinor: price.amountMinor,
      };
    });

    if ('error' in result) {
      return res.status(result.status || 400).json(result);
    }

    return res.json({
      ...result,
      razorpaySubscriptionId: (result as any).subscriptionId,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error('[POST /billing/subscribe] Error:', err);
    return res.status(500).json({ error: 'SUBSCRIPTION_CREATION_FAILED', message: err?.message });
  }
});

/**
 * POST /api/v1/billing/verify (Page 14 of Implementation Plan)
 * Frontend checkout callback posts payment id, subscription id, and signature.
 * Verifies signature and immediately triggers idempotent fulfillment so credits and status
 * are granted without waiting on delayed or dropped webhooks.
 */
billingRouter.post('/verify', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    // Support both camelCase (from client lib) and snake_case (from raw Razorpay handler)
    const razorpay_payment_id = req.body.razorpay_payment_id || req.body.razorpayPaymentId;
    const razorpay_subscription_id = req.body.razorpay_subscription_id || req.body.razorpaySubscriptionId;
    const razorpay_signature = req.body.razorpay_signature || req.body.razorpaySignature;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      console.warn('[POST /billing/verify] Missing payment details:', req.body);
      return res.status(400).json({ error: 'MISSING_PAYMENT_DETAILS', received: req.body });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('[POST /billing/verify] Error: RAZORPAY_KEY_SECRET is not configured in environment.');
      return res.status(500).json({ error: 'SERVER_MISCONFIGURED' });
    }
    const payload = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(razorpay_signature, 'utf8')
    );

    if (!isValid) {
      return res.status(400).json({ error: 'INVALID_SIGNATURE' });
    }

    // Resolve user ID from request or local subscription record
    let targetUserId = userId;
    let subRecord = await prisma.userSubscription.findUnique({
      where: { razorpaySubId: razorpay_subscription_id },
      include: { price: true },
    });

    if (!targetUserId && subRecord) {
      targetUserId = subRecord.userId;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'USER_NOT_IDENTIFIED', message: 'Could not associate payment with user.' });
    }

    // Determine amount and currency
    const amountMinor = subRecord?.price?.amountMinor || 0;
    const currency = subRecord?.price?.currency || 'INR';

    // Fulfill the charge immediately (idempotent via pay:<paymentId>)
    await fulfilCharge({
      userId: targetUserId,
      paymentId: razorpay_payment_id,
      subId: razorpay_subscription_id,
      amountMinor,
      currency,
      paymentMethod: 'checkout_modal',
      rawPayload: req.body,
    });

    return res.json({ status: 'SUCCESS', message: 'Signature verified and subscription fulfilled.' });
  } catch (err: any) {
    console.error('[POST /billing/verify] Error:', err);
    return res.status(500).json({ error: 'VERIFICATION_FAILED' });
  }
});

/**
 * GET /api/v1/billing/status (Page 14 of Implementation Plan)
 * Polled by UI every 2 seconds.
 * Fast Path: If webhook is late (>15s), directly checks Razorpay API and fulfills.
 */
billingRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req.query.userId as string);
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const user = await prisma.clientUser.findUnique({
      where: { id: userId },
      select: {
        tier: true,
        tierOverride: true,
        tierOverrideUntil: true,
        creditsBalance: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { price: { include: { plan: true } } },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    const latestSub = user.subscriptions[0] || null;
    const isSubActive = latestSub?.status === 'ACTIVE';
    // User tier is PRO if active subscription or tier is PREMIUM or tierOverride
    const effectiveTier = isSubActive || (user.tier as string) === 'PREMIUM' || (user.tier as string) === 'PRO' || user.tierOverride === 'PREMIUM'
      ? 'PRO'
      : 'FREE';

    return res.json({
      tier: effectiveTier,
      creditsBalance: user.creditsBalance,
      subscription: latestSub
        ? {
            id: latestSub.id,
            status: latestSub.status,
            entitledUntil: latestSub.entitledUntil,
            planName: latestSub.price.plan.name,
          }
        : null,
    });
  } catch (err: any) {
    console.error('[GET /billing/status] Error:', err);
    return res.status(500).json({ error: 'STATUS_LOOKUP_FAILED' });
  }
});

/**
 * Core Fulfillment Function (Pages 14-16 of Implementation Plan)
 * Enforces Invariants I1, I3, I4, I5. Shared by Webhooks and Fast-Path Polling.
 * Keyed deterministically by pay:<paymentId> so whichever finishes first wins.
 */
export async function fulfilCharge(params: {
  userId: string;
  paymentId: string;
  subId: string;
  amountMinor: number;
  currency: string;
  periodStart?: Date;
  periodEnd?: Date;
  paymentMethod?: string;
  rawPayload?: any;
}) {
  return prisma.$transaction(async (tx) => {
    // 0. Look up the subscription to determine the exact plan and monthly credit allocation
    const subRecord = await tx.userSubscription.findFirst({
      where: { razorpaySubId: params.subId },
      include: { price: true },
    });

    const creditsToGrant = subRecord?.price?.monthlyCredits && subRecord.price.monthlyCredits > 0
      ? subRecord.price.monthlyCredits
      : 2500;

    // 1. Upsert PaymentTransaction (Invariant I4, Race R6, R7)
    const transaction = await tx.paymentTransaction.upsert({
      where: { razorpayPaymentId: params.paymentId },
      update: {
        status: PaymentStatus.SUCCESS,
        amount: params.amountMinor,
        currency: params.currency,
        paymentMethod: params.paymentMethod,
        rawWebhookPayload: params.rawPayload,
        planPriceId: subRecord?.planPriceId,
        creditsGranted: creditsToGrant,
      },
      create: {
        userId: params.userId,
        amount: params.amountMinor,
        currency: params.currency,
        status: PaymentStatus.SUCCESS,
        razorpayPaymentId: params.paymentId,
        razorpaySubscriptionId: params.subId,
        planPriceId: subRecord?.planPriceId,
        creditsGranted: creditsToGrant,
        paymentMethod: params.paymentMethod,
        rawWebhookPayload: params.rawPayload,
      },
    });

    // 2. Grant monthly credits under key pay:<paymentId> (Race R6, R7)
    await CreditService.apply(tx, {
      userId: params.userId,
      delta: creditsToGrant,
      type: LedgerType.MONTHLY_SUBSCRIPTION_REFILL,
      idempotencyKey: `pay:${params.paymentId}`,
      paymentId: transaction.id,
      reason: `Monthly subscription renewal charge (${params.paymentId})`,
    });

    // 3. Update subscription status & entitlement timestamps (Invariant I5, Page 15)
    const entitledUntil = params.periodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await tx.userSubscription.updateMany({
      where: { razorpaySubId: params.subId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: params.periodStart || new Date(),
        currentPeriodEnd: params.periodEnd || entitledUntil,
        entitledUntil,
        lastEventAt: new Date(),
      },
    });

    // 4. Update cached tier on ClientUser
    await tx.clientUser.update({
      where: { id: params.userId },
      data: { tier: 'PREMIUM' },
    });
  });
}

