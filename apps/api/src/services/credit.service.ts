import { Prisma, LedgerType, ReservationStatus } from '@prisma/client';
import { prisma } from '../db/prisma';

export class InsufficientCreditsError extends Error {
  constructor(userId: string, required?: number, available?: number) {
    super(`User ${userId} has insufficient credits${required ? ` (required: ${required}, available: ${available})` : ''}`);
    this.name = 'InsufficientCreditsError';
  }
}

export interface ApplyInput {
  userId: string;
  delta: number; // positive for grants/refunds, negative for debits
  type: LedgerType;
  idempotencyKey: string;
  reservationId?: string;
  paymentId?: string;
  reason?: string;
  adminId?: string;
}

export interface ApplyResult {
  applied: boolean;
  balanceAfter: number;
}

export interface ReserveInput {
  userId: string;
  requestKey: string;
  actionType: string;
  cost: number;
  payloadHash: string;
  timeoutMs?: number;
}

export type ReserveResult =
  | { kind: 'reserved'; reservationId: string; balanceAfter: number }
  | { kind: 'insufficient_credits'; currentBalance: number; required: number }
  | { kind: 'in_progress'; reservationId: string }
  | { kind: 'settled'; reservationId: string }
  | { kind: 'released_needs_new_key'; reservationId: string }
  | { kind: 'key_reused_with_different_payload' };

export interface SettleInput {
  reservationId: string;
  userId: string;
  sessionId?: string;
  clientMessageId: string;
  actionType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  costUsd?: number | Prisma.Decimal;
}

export interface ReleaseInput {
  reservationId: string;
  userId: string;
  reason: string;
}

/**
 * CreditService - The Single Source of Truth for Balance Changes (Invariant I1, I2, I3)
 * Every balance change in the system MUST pass through apply().
 */
export class CreditService {
  /**
   * Atomically applies a credit delta inside a transaction.
   * Enforces:
   * 1. Deterministic idempotency: duplicate keys return prior result with applied: false.
   * 2. Atomic conditional update: balance cannot drop below zero.
   * 3. Synchronous ledger insertion: balanceAfter is exact.
   */
  public static async apply(
    tx: Prisma.TransactionClient,
    i: ApplyInput
  ): Promise<ApplyResult> {
    // 1. Fast replay check (Invariant I3, Race R6, R7, R17)
    const prior = await tx.creditLedger.findUnique({
      where: { idempotencyKey: i.idempotencyKey },
    });
    if (prior) {
      return { applied: false, balanceAfter: prior.balanceAfter };
    }

    // 2. One conditional UPDATE. No read-modify-write in Node memory (Invariant I2, Race R1, R13)
    const rows = await tx.$queryRaw<{ creditsBalance: number }[]>`
      UPDATE "ClientUser"
      SET "creditsBalance" = "creditsBalance" + ${i.delta}, "updatedAt" = now()
      WHERE id = ${i.userId} AND "creditsBalance" + ${i.delta} >= 0
      RETURNING "creditsBalance"
    `;

    if (rows.length === 0) {
      // Find current balance for informative error
      const currentUser = await tx.clientUser.findUnique({
        where: { id: i.userId },
        select: { creditsBalance: true },
      });
      throw new InsufficientCreditsError(i.userId, Math.abs(i.delta), currentUser?.creditsBalance ?? 0);
    }

    const newBalance = rows[0].creditsBalance;

    // 3. Ledger row, balanceAfter taken from the same UPDATE.
    // Unique constraint violation rolls back the whole transaction automatically.
    await tx.creditLedger.create({
      data: {
        userId: i.userId,
        amountDelta: i.delta,
        balanceAfter: newBalance,
        type: i.type,
        idempotencyKey: i.idempotencyKey,
        reservationId: i.reservationId,
        paymentId: i.paymentId,
        reason: i.reason,
        adminId: i.adminId,
      },
    });

    return { applied: true, balanceAfter: newBalance };
  }

  /**
   * Helper to execute apply inside its own isolated transaction if one isn't provided.
   */
  public static async applyIsolated(i: ApplyInput): Promise<ApplyResult> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      return this.apply(tx, i);
    });
  }

  /**
   * Reserve credits before calling Claude (Pages 8-10 of Implementation Plan)
   * Guard against races R1, R2, R3.
   */
  public static async reserve(i: ReserveInput): Promise<ReserveResult> {
    const expiresAt = new Date(Date.now() + (i.timeoutMs || 120_000) + 30_000); // hard timeout + 30s safety margin

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Look for existing reservation with this key (Page 10 matrix)
      const existing = await tx.creditReservation.findUnique({
        where: {
          userId_requestKey: {
            userId: i.userId,
            requestKey: i.requestKey,
          },
        },
      });

      if (existing) {
        if (existing.payloadHash !== i.payloadHash) {
          const res: ReserveResult = { kind: 'key_reused_with_different_payload' };
          return res;
        }
        if (existing.status === ReservationStatus.RESERVED) {
          const res: ReserveResult = { kind: 'in_progress', reservationId: existing.id };
          return res;
        }
        if (existing.status === ReservationStatus.SETTLED) {
          const res: ReserveResult = { kind: 'settled', reservationId: existing.id };
          return res;
        }
        const res: ReserveResult = { kind: 'released_needs_new_key', reservationId: existing.id };
        return res;
      }

      // 2. Debit credits atomically first (Invariant I2: balance >= cost)
      let balanceAfter = 0;
      try {
        const applyResult = await this.apply(tx, {
          userId: i.userId,
          delta: -i.cost,
          type: LedgerType.AI_QUERY_DEBIT,
          idempotencyKey: `debit:${i.userId}:${i.requestKey}`,
          reason: `Reserved ${i.cost} credits for ${i.actionType}`,
        });
        balanceAfter = applyResult.balanceAfter;
      } catch (err: any) {
        if (err instanceof InsufficientCreditsError) {
          const user = await tx.clientUser.findUnique({
            where: { id: i.userId },
            select: { creditsBalance: true },
          });
          const res: ReserveResult = {
            kind: 'insufficient_credits',
            currentBalance: user?.creditsBalance || 0,
            required: i.cost,
          };
          return res;
        }
        throw err;
      }

      // 3. Create the reservation in RESERVED state
      const reservation = await tx.creditReservation.create({
        data: {
          userId: i.userId,
          requestKey: i.requestKey,
          actionType: i.actionType,
          payloadHash: i.payloadHash,
          cost: i.cost,
          status: ReservationStatus.RESERVED,
          expiresAt,
        },
      });

      const res: ReserveResult = {
        kind: 'reserved',
        reservationId: reservation.id,
        balanceAfter,
      };
      return res;
    });
  }

  /**
   * Settle a reservation upon successful AI generation (Pages 9-10 of Implementation Plan)
   * Guard against race R4: Settle, release, and sweeper race on one reservation.
   */
  public static async settle(i: SettleInput): Promise<boolean> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Guarded update: exactly one status transition from RESERVED wins
      const rows = await tx.$queryRaw<{ id: string }[]>`
        UPDATE "CreditReservation"
        SET status = 'SETTLED', "settledAt" = now()
        WHERE id = ${i.reservationId} AND status = 'RESERVED'
        RETURNING id
      `;

      if (rows.length === 0) {
        // Zero rows means it was already released or swept
        return false;
      }

      // 2. Write exact telemetry to AiRequestLog (Invariant I7: Decimal cost, no float drift)
      const costUsdVal = i.costUsd !== undefined ? i.costUsd.toString() : (i.inputTokens * 0.000003 + i.outputTokens * 0.000015).toFixed(6);
      await tx.aiRequestLog.create({
        data: {
          userId: i.userId,
          sessionId: i.sessionId,
          clientMessageId: i.clientMessageId,
          actionType: i.actionType,
          model: i.model,
          inputTokens: i.inputTokens,
          outputTokens: i.outputTokens,
          cacheCreationTokens: i.cacheCreationTokens || 0,
          cacheReadTokens: i.cacheReadTokens || 0,
          costUsd: new Prisma.Decimal(costUsdVal),
          creditsDeducted: 10,
        },
      });

      return true;
    });
  }

  /**
   * Release and refund a reservation on abort or upstream error (Pages 9-10 of Implementation Plan)
   * Guard against races R4, R5: At most one refund, never double-refund.
   */
  public static async release(i: ReleaseInput): Promise<boolean> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Guarded update: exactly one status transition from RESERVED wins
      const rows = await tx.$queryRaw<{ id: string; cost: number }[]>`
        UPDATE "CreditReservation"
        SET status = 'RELEASED', "releaseReason" = ${i.reason}
        WHERE id = ${i.reservationId} AND status = 'RESERVED'
        RETURNING id, cost
      `;

      if (rows.length === 0) {
        // Zero rows means it was already settled or released
        return false;
      }

      const costToRefund = rows[0].cost;

      // 2. Refund credits atomically back to the user
      await this.apply(tx, {
        userId: i.userId,
        delta: costToRefund,
        type: LedgerType.SYSTEM_REFUND,
        idempotencyKey: `refund:${i.reservationId}`,
        reservationId: i.reservationId,
        reason: `Refund for reservation ${i.reservationId}: ${i.reason}`,
      });

      return true;
    });
  }

  /**
   * Ensures the one-time 50 free credits welcome grant is deposited into CreditLedger.
   * Enforces Invariant I1: welcome grant is a ledger row, not an untracked default. (Race R17)
   */
  public static async ensureWelcomeGrant(userId: string): Promise<void> {
    const welcomeKey = `welcome:${userId}`;
    try {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const user = await tx.clientUser.findUnique({
          where: { id: userId },
          select: { welcomeGrantedAt: true },
        });

        if (!user || user.welcomeGrantedAt) return;

        // Apply 50 credits atomically
        await this.apply(tx, {
          userId,
          delta: 50,
          type: LedgerType.FREE_WELCOME_GRANT,
          idempotencyKey: welcomeKey,
          reason: 'Initial onboarding welcome credit allocation',
        });

        // Mark user as welcome-granted
        await tx.clientUser.update({
          where: { id: userId },
          data: { welcomeGrantedAt: new Date() },
        });
      });
    } catch (err) {
      // Unique constraint violation or already granted means it was already handled concurrently
      console.warn(`[CreditService.ensureWelcomeGrant] Handled: ${welcomeKey}`);
    }
  }
}



