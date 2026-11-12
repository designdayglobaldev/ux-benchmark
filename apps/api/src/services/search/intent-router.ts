export type IntentType = 'flow' | 'situational' | 'component' | 'compare';

export interface IntentScores {
  flow: number;
  situational: number;
  component: number;
  compare: number;
}

export interface IntentRoutingResult {
  scores: IntentScores;
  activeRoutes: IntentType[];
  routerVersion: string;
}

/**
 * Phase 2 - Baseline Intent Router (R0 - Rule & Heuristic Engine)
 * Fast, deterministic, zero-API cost classifier.
 *
 * Design constraints addressed:
 * 1. Flow base is set to 0.25 (below THRESHOLD 0.35) so non-flow queries route away from flow,
 *    and the fallback branch runs when no routes cross threshold.
 * 2. Word endings and plurals handled (keypads, flows, guidelines, drop-offs, modals, log in, sign in).
 * 3. Ambiguous triggers tightened (e.g. "card" requires component context; "rank" removed from compare).
 * 4. Input guards for empty input and string length > 500 characters.
 */
export class IntentRouter {
  public static readonly VERSION = 'router-r0-v1.1';
  public static readonly THRESHOLD = 0.35;
  public static readonly MAX_QUERY_LENGTH = 500;

  public static classify(rawQuery: string): IntentRoutingResult {
    // Input guard: handle null, undefined, non-strings, or empty strings
    if (!rawQuery || typeof rawQuery !== 'string') {
      return {
        scores: { flow: 0.25, situational: 0.1, component: 0.1, compare: 0.1 },
        activeRoutes: ['flow'], // Fallback on empty/invalid
        routerVersion: IntentRouter.VERSION,
      };
    }

    // Input guard: trim and enforce max length
    const trimmed = rawQuery.trim();
    if (trimmed.length === 0) {
      return {
        scores: { flow: 0.25, situational: 0.1, component: 0.1, compare: 0.1 },
        activeRoutes: ['flow'],
        routerVersion: IntentRouter.VERSION,
      };
    }

    const q = trimmed.slice(0, IntentRouter.MAX_QUERY_LENGTH).toLowerCase();

    // 1. Compare Intent Patterns (Versus, competitors, comparisons, multi-app mentions)
    // Note: bare "rank" is intentionally excluded to prevent false triggers on "rank of results"
    const compareTriggers = [
      /\bvs\.?\b/,
      /\bversus\b/,
      /\bcompar(e|ed|ing|ison|ative)s?\b/,
      /\bdifference between\b/,
      /\bhow do competitors\b/,
      /\balternatives? to\b/,
      /\bbenchmark(ing|s)?\b/,
    ];
    let compareScore = 0.1;
    for (const regex of compareTriggers) {
      if (regex.test(q)) {
        compareScore += 0.45;
      }
    }

    // 2. Situational Intent Patterns (Where to use, when to avoid, trade-offs, drop-off, guidelines)
    const situationalTriggers = [
      /\bwhere to use\b/,
      /\bwhere not to use\b/,
      /\bwhen (should|to) (i|use)\b/,
      /\bwhy (should|do) (i|we|users)\b/,
      /\bhow to avoid\b/,
      /\bdrop-?offs?\b/,
      /\babandonments?\b/,
      /\bfrictions?\b/,
      /\bbest practices?\b/,
      /\bguidelines?\b/,
      /\brationales?\b/,
      /\banti-?patterns?\b/,
      /\bpros and cons\b/,
      /\btrade-?offs?\b/,
    ];
    let situationalScore = 0.1;
    for (const regex of situationalTriggers) {
      if (regex.test(q)) {
        situationalScore += 0.4;
      }
    }

    // 3. Component Intent Patterns (UI elements, micro-components, widgets, controls)
    // Note: ambiguous keywords like "card" require component context to prevent fintech "freeze my card" false triggers
    const componentTriggers = [
      /\bkeypads?\b/,
      /\bviewfinders?\b/,
      /\bbuttons?\b/,
      /\bmodals?\b/,
      /\bbottom sheets?\b/,
      /\bdrawers?\b/,
      /\bpin pads?\b/,
      /\bchips?\b/,
      /\bpills?\b/,
      /\bcarousels?\b/,
      /\bsteppers?\b/,
      /\bprogress bars?\b/,
      /\bavatars?\b/,
      /\btab bars?\b/,
      /\btoggles?\b/,
      /\bcheckbox(es)?\b/,
      /\btooltips?\b/,
      /\btoasts?\b/,
      /\bdials?\b/,
      /\bdrop-?downs?\b/,
      /\bcard (component|layout|design|ui|pattern)s?\b/,
      /\b(ui|micro|interface) components?\b/,
    ];
    let componentScore = 0.1;
    for (const regex of componentTriggers) {
      if (regex.test(q)) {
        componentScore += 0.35;
      }
    }

    // 4. Flow Intent Patterns (End-to-end journeys, processes, multistep flows)
    // Base is 0.25 (below threshold 0.35) so non-flow queries can cleanly route away
    const flowTriggers = [
      /\bflows?\b/,
      /\bjourneys?\b/,
      /\bonboarding\b/,
      /\bprocess(es)?\b/,
      /\bkyc\b/,
      /\bcheckout\b/,
      /\btransfers?\b/,
      /\bsetups?\b/,
      /\bsetting up\b/,
      /\breimbursements?\b/,
      /\bverifications?\b/,
      /\bregistrations?\b/,
      /\bsign ?ups?\b/,
      /\bsign ?in\b/,
      /\blog ?in\b/,
      /\bstep by step\b/,
      /\bend to end\b/,
      /\bwalkthroughs?\b/,
    ];
    let flowScore = 0.25;
    for (const regex of flowTriggers) {
      if (regex.test(q)) {
        flowScore += 0.3;
      }
    }

    // Normalize scores within [0.0, 1.0]
    const scores: IntentScores = {
      flow: Math.min(1.0, Math.round(flowScore * 100) / 100),
      situational: Math.min(1.0, Math.round(situationalScore * 100) / 100),
      component: Math.min(1.0, Math.round(componentScore * 100) / 100),
      compare: Math.min(1.0, Math.round(compareScore * 100) / 100),
    };

    // Activate routes exceeding threshold
    const activeRoutes: IntentType[] = [];
    if (scores.flow >= IntentRouter.THRESHOLD) activeRoutes.push('flow');
    if (scores.situational >= IntentRouter.THRESHOLD) activeRoutes.push('situational');
    if (scores.component >= IntentRouter.THRESHOLD) activeRoutes.push('component');
    if (scores.compare >= IntentRouter.THRESHOLD) activeRoutes.push('compare');

    // Default fallback: if no route passed threshold, activate 'flow'
    if (activeRoutes.length === 0) {
      activeRoutes.push('flow');
    }

    return {
      scores,
      activeRoutes,
      routerVersion: IntentRouter.VERSION,
    };
  }
}
