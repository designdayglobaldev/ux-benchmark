import { prisma } from '../db/prisma';

export interface Viewer {
  user: {
    id: string;
    tier: string;
    tierOverride?: string | null;
    tierOverrideUntil?: Date | null;
  };
  sub?: {
    entitledUntil?: Date | null;
  } | null;
}

export interface AppContentTarget {
  isPremium?: boolean;
  previewLimit?: number | null;
}

/**
 * Derives user tier from database timestamps and admin overrides (Page 16 of Implementation Plan)
 * Enforces Invariant I5: tier is derived from subscription state plus admin override,
 * never set freehand or read directly from the JWT.
 */
export function deriveTier(viewer: Viewer | null, now: Date = new Date()): 'FREE' | 'PREMIUM' {
  if (!viewer?.user) return 'FREE';

  // 1. Admin VIP or Team override takes absolute precedence (Race R14)
  if (viewer.user.tierOverride) {
    if (!viewer.user.tierOverrideUntil || viewer.user.tierOverrideUntil > now) {
      return viewer.user.tierOverride as 'FREE' | 'PREMIUM';
    }
  }

  // 2. Subscription access boundary includes grace period
  if (viewer.sub?.entitledUntil && viewer.sub.entitledUntil > now) {
    return 'PREMIUM';
  }

  // Fallback to cached tier or FREE
  return viewer.user.tier === 'PREMIUM' ? 'PREMIUM' : 'FREE';
}

/**
 * Single source of truth for screen viewing permission (Pages 19-20 of Implementation Plan)
 * Enforces Invariant I6: Locked screen content NEVER reaches a non-PRO user.
 * 
 * Used by:
 * - /apps/:slug detail endpoint
 * - /browse and /dashboard cards
 * - Similar screen embeddings
 * - AI RAG context loaders
 */
export function canViewScreen(
  viewer: Viewer | null,
  app: AppContentTarget,
  screenIndex: number,
  now: Date = new Date()
): boolean {
  // Free apps are fully visible to everyone
  if (!app.isPremium) return true;

  // Subscribed users have full access
  if (deriveTier(viewer, now) === 'PREMIUM') return true;

  // Free users can only view up to previewLimit (default 4 screens)
  // Nullish coalescing ?? ensures an admin value of 0 means 0
  const limit = app.previewLimit ?? 4;
  return screenIndex < limit;
}

/**
 * Redacts screen data for unauthorized viewers.
 * Returns a heavily blurred/locked derivative and redacts sensitive UX analysis,
 * ensuring high-value content never leaks over the wire (Page 19).
 */
export function redactScreenForViewer(screen: any, isViewable: boolean) {
  if (isViewable) {
    return { ...screen, isLocked: false };
  }

  return {
    id: screen.id,
    name: screen.name,
    screenNo: screen.screenNo,
    slug: screen.slug,
    isLocked: true,
    // Keep structural app and flow info so flow layouts and attribution render correctly
    appId: screen.appId,
    app: screen.app,
    flow: screen.flow ? { id: screen.flow.id, name: screen.flow.name } : undefined,
    flowId: screen.flowId,
    // Provide locked placeholder or low-res derivative
    imageUrl: screen.imageUrl,
    // Sensitive proprietary data is strictly stripped:
    uxAnalysis: null,
    keyHighlights: null,
    evidenceWhoWhy: null,
    whereToUse: null,
    whereNotToUse: null,
    similarApps: [],
  };
}

