import { Request, Response, NextFunction } from 'express';
import { CreditService, ReserveResult } from '../services/credit.service';
import crypto from 'crypto';

export type ActionType =
  | 'WORKSPACE_CHAT'
  | 'BENCHMARK'
  | 'BENCHMARK_CHAT'
  | 'SCREEN_INSPECT'
  | 'SCREEN_INSIGHTS'
  | 'SCREEN_COMPARE'
  | 'DETECT_CONTEXT'
  | 'IMPROVE_DESIGN'
  | 'DESIGN_AGENT';

// Standard action cost rate card (Pages 1, 11 of Implementation Plan)
export const ACTION_COSTS: Record<ActionType, number> = {
  WORKSPACE_CHAT: 10,
  BENCHMARK: 10,
  BENCHMARK_CHAT: 5,
  SCREEN_INSPECT: 5,
  SCREEN_INSIGHTS: 5,
  SCREEN_COMPARE: 8,
  DETECT_CONTEXT: 5,
  IMPROVE_DESIGN: 12,
  DESIGN_AGENT: 15,
};

export const ACTION_TIMEOUTS_MS: Record<ActionType, number> = {
  WORKSPACE_CHAT: 120_000,
  BENCHMARK: 90_000,
  BENCHMARK_CHAT: 60_000,
  SCREEN_INSPECT: 45_000,
  SCREEN_INSIGHTS: 45_000,
  SCREEN_COMPARE: 60_000,
  DETECT_CONTEXT: 30_000,
  IMPROVE_DESIGN: 90_000,
  DESIGN_AGENT: 120_000,
};

export interface MeteredContext {
  userId: string;
  requestKey: string;
  action: ActionType;
  cost: number;
  reservationId: string;
  signal: AbortSignal;
  state: {
    outputStarted: boolean;
  };
}

/**
 * Creates a SHA-256 hash of the action and request body to guard against
 * payload reuse attacks with the same idempotency key (Page 10, Race R2)
 */
export function hashPayload(action: string, payload: any): string {
  const normalized = JSON.stringify({ action, payload: payload || {} });
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Metered Handler Wrapper (Pages 11-13 of Implementation Plan)
 * Enforces Invariants I2, I3, and I7.
 * All 9 AI endpoints are executed through this wrapper.
 */
export function metered(
  action: ActionType,
  handler: (req: Request, res: Response, ctx: MeteredContext) => Promise<any>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 1. Authenticate via verified JWT only (Fixes security vulnerability from Page 11)
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    // 2. Validate Idempotency-Key
    let requestKey = req.header('Idempotency-Key') || req.body.clientMessageId;
    if (!requestKey) {
      // Auto-assign random UUID if not provided by client to maintain idempotency tracking
      requestKey = crypto.randomUUID();
    }

    const cost = ACTION_COSTS[action] || 10;
    const timeoutMs = ACTION_TIMEOUTS_MS[action] || 90_000;
    const payloadHash = hashPayload(action, req.body);

    // 3. Ensure one-time welcome grant exists in CreditLedger (Invariant I1, Race R17)
    await CreditService.ensureWelcomeGrant(userId);

    // 4. Reserve credits atomically before calling Claude (Page 12)
    const r: ReserveResult = await CreditService.reserve({
      userId,
      requestKey,
      actionType: action,
      cost,
      payloadHash,
      timeoutMs,
    });

    if (r.kind === 'insufficient_credits') {
      return res.status(402).json({
        error: 'QUOTA_EXHAUSTED',
        message: 'Credit quota exhausted. Upgrade your plan to unlock more access.',
        creditsRemaining: r.currentBalance,
        requiredCredits: r.required,
      });
    }

    if (r.kind === 'key_reused_with_different_payload') {
      return res.status(422).json({
        error: 'KEY_REUSED_WITH_DIFFERENT_PAYLOAD',
        message: 'The Idempotency-Key was previously used with a different request payload.',
      });
    }

    if (r.kind === 'in_progress') {
      return res.status(409).json({
        error: 'REQUEST_IN_PROGRESS',
        message: 'A request with this key is already running. Please wait for it to complete.',
        reservationId: r.reservationId,
      });
    }

    if (r.kind === 'released_needs_new_key') {
      return res.status(409).json({
        error: 'REQUEST_FAILED_REFUNDED',
        message: 'A prior attempt with this key failed and was refunded. Please retry with a new key.',
      });
    }

    if (r.kind === 'settled') {
      return res.status(200).json({
        message: 'Request already processed.',
        reservationId: r.reservationId,
      });
    }

    const reservationId = r.reservationId;

    // 5. Setup AbortController & Upstream Timeout (Page 12)
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      ctrl.abort('TIMEOUT');
    }, timeoutMs);

    const state = { outputStarted: false };

    // Connection drop watcher: abort upstream Claude if client leaves
    res.on('close', () => {
      if (!res.writableEnded) {
        ctrl.abort('CLIENT_ABORT');
      }
    });

    const ctx: MeteredContext = {
      userId,
      requestKey,
      action,
      cost,
      reservationId,
      signal: ctrl.signal,
      state,
    };

    try {
      // Execute the actual AI handler
      await handler(req, res, ctx);
    } catch (err: any) {
      // Classify outcome according to Page 10 Refund Table
      clearTimeout(timer);

      // If output tokens had NOT started when client aborted or error occurred -> Refund in full!
      if (!state.outputStarted) {
        await CreditService.release({
          reservationId,
          userId,
          reason: err?.message || 'Error occurred before first output token',
        });
      } else {
        // Output started: Work was generated and delivered -> Settled, no refund (Closes abort-farming loophole)
        console.warn(`[metered:${action}] Error after output started; reservation settled without refund.`);
      }

      if (!res.headersSent) {
        return res.status(500).json({
          error: 'AI_GENERATION_FAILED',
          message: 'An error occurred while generating the AI response.',
        });
      }
    } finally {
      clearTimeout(timer);
    }
  };
}

