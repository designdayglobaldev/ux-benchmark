import { Worker, type Job } from 'bullmq';
import { Queue } from 'bullmq';
import { createRedisClient } from '../lib/redis';
import { prisma } from '../db/prisma';
import { CreditService } from '../services/credit.service';
import { razorpay } from '../lib/razorpay';
import { fulfilCharge } from '../routes/billing.routes';

export const BILLING_CRON_QUEUE = 'billing-cron-jobs';

export const billingCronQueue = new Queue(BILLING_CRON_QUEUE, {
  connection: createRedisClient(),
});

/**
 * 1. Sweep Stale In-Flight Reservations (Pages 12, 18 of Implementation Plan)
 * Runs every 60 seconds:
 * Finds any CreditReservation with status = 'RESERVED' and expiresAt < NOW().
 * Releases each one back to the user via CreditService.release() with a SYSTEM_REFUND row.
 * Heals Race R4, R5, and node crashes mid-request.
 */
export async function sweepStaleReservations(): Promise<number> {
  const now = new Date();
  const stale = await prisma.creditReservation.findMany({
    where: {
      status: 'RESERVED',
      expiresAt: { lt: now },
    },
    take: 50,
  });

  let sweptCount = 0;
  for (const res of stale) {
    try {
      const released = await CreditService.release({
        reservationId: res.id,
        userId: res.userId,
        reason: 'Sweeper: Request timed out past expiresAt without settlement',
      });
      if (released) sweptCount++;
    } catch (err) {
      console.error(`[Sweeper] Failed to release stale reservation ${res.id}:`, err);
    }
  }

  return sweptCount;
}

/**
 * 2. Razorpay Subscription Reconciler (Pages 18, 26 of Implementation Plan)
 * Runs every 10 minutes:
 * Finds subscriptions in INCOMPLETE or PAST_DUE state created > 5 mins ago.
 * Queries Razorpay API directly for ground-truth payments.
 * If charged on Razorpay but webhook missed, invokes fulfilCharge() idempotently.
 * Heals dropped webhooks, ISP blips, and RBI AutoPay late confirmations.
 */
export async function reconcileSubscriptions(): Promise<number> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const unconfirmed = await prisma.userSubscription.findMany({
    where: {
      status: { in: ['INCOMPLETE', 'PAST_DUE'] },
      createdAt: { lt: fiveMinutesAgo },
    },
    include: { price: true },
    take: 20,
  });

  let reconciledCount = 0;
  for (const sub of unconfirmed) {
    try {
      // Fetch latest subscription facts from Razorpay API
      const rzpSub: any = await razorpay.subscriptions.fetch(sub.razorpaySubId);
      if (!rzpSub) continue;

      if (rzpSub.status === 'active' || rzpSub.status === 'completed') {
        // Update local subscription to ACTIVE
        await prisma.userSubscription.update({
          where: { id: sub.id },
          data: {
            status: 'ACTIVE',
            razorpayStatus: rzpSub.status,
            currentPeriodStart: rzpSub.current_start ? new Date(rzpSub.current_start * 1000) : undefined,
            currentPeriodEnd: rzpSub.current_end ? new Date(rzpSub.current_end * 1000) : undefined,
            entitledUntil: rzpSub.current_end ? new Date((rzpSub.current_end + 86400) * 1000) : undefined,
          },
        });

        // Grant monthly credits refill under deterministic key
        await CreditService.apply(null as any, {
          userId: sub.userId,
          delta: 1000,
          type: 'MONTHLY_SUBSCRIPTION_REFILL' as any,
          idempotencyKey: `reconcile:sub:${sub.razorpaySubId}:${rzpSub.current_start || 'init'}`,
          reason: 'Reconciler verified active Razorpay AutoPay subscription',
        });

        reconciledCount++;
      }
    } catch (err) {
      console.warn(`[Reconciler] Error inspecting subscription ${sub.razorpaySubId}:`, err);
    }
  }

  return reconciledCount;
}

/**
 * 3. Daily Double-Entry Balance Verifier (Invariant I1, I8)
 * Compares ClientUser.creditsBalance === SUM(CreditLedger.amountDelta).
 * Alerts or logs if drift detected.
 */
export async function verifyBalanceIntegrity(): Promise<{ totalUsers: number; driftedUsers: number }> {
  const users = await prisma.clientUser.findMany({
    select: { id: true, creditsBalance: true },
  });

  let driftedUsers = 0;
  for (const u of users) {
    const aggregate = await prisma.creditLedger.aggregate({
      where: { userId: u.id },
      _sum: { amountDelta: true },
    });

    const sumDelta = aggregate._sum.amountDelta || 0;
    if (u.creditsBalance !== sumDelta) {
      driftedUsers++;
      console.error(
        `🚨 [INVARIANT VIOLATION I1] Drift detected for user ${u.id}! DB Balance: ${u.creditsBalance}, Ledger Sum: ${sumDelta}`
      );
    }
  }

  return { totalUsers: users.length, driftedUsers };
}

// 4. BullMQ Worker for Billing Cron Jobs
export const billingCronWorker = new Worker(
  BILLING_CRON_QUEUE,
  async (job: Job) => {
    switch (job.name) {
      case 'sweep-stale-reservations': {
        const swept = await sweepStaleReservations();
        return { swept };
      }
      case 'reconcile-subscriptions': {
        const reconciled = await reconcileSubscriptions();
        return { reconciled };
      }
      case 'verify-balance-integrity': {
        const result = await verifyBalanceIntegrity();
        return result;
      }
      default:
        throw new Error(`Unknown billing cron job: ${job.name}`);
    }
  },
  {
    connection: createRedisClient(),
    concurrency: 1,
  }
);

/**
 * Schedules recurring jobs using BullMQ v6 upsertJobScheduler API
 */
export async function initBillingSchedulers() {
  try {
    // 1. Stale In-flight Sweeper (Every 60 seconds)
    await billingCronQueue.upsertJobScheduler(
      'schedule-sweeper-60s',
      { every: 60_000 },
      {
        name: 'sweep-stale-reservations',
        data: {},
      }
    );

    // 2. Razorpay Subscription Reconciler (Every 10 minutes)
    await billingCronQueue.upsertJobScheduler(
      'schedule-reconciler-10m',
      { every: 600_000 },
      {
        name: 'reconcile-subscriptions',
        data: {},
      }
    );

    // 3. Balance Integrity Verifier (Daily at midnight: cron '0 0 * * *')
    await billingCronQueue.upsertJobScheduler(
      'schedule-verifier-daily',
      { pattern: '0 0 * * *' },
      {
        name: 'verify-balance-integrity',
        data: {},
      }
    );

    console.log('✅ [BullMQ] Billing schedulers initialized (Sweeper 60s, Reconciler 10m, Verifier Daily)');
  } catch (err) {
    console.warn('[BullMQ] Warning initializing billing schedulers:', err);
  }
}
