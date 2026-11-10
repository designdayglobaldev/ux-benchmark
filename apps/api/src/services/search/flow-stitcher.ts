import { prisma } from '../../db/prisma';
import type { RetrievedCandidateFlow, RetrievedFlowScreen } from './types';
import type { DenseSeedScreen } from './vector-engine';
import type { ActivatedGraphNode } from './graph-walk';

export class FlowStitcher {
  /**
   * Reconstruct and stitch full chronological flows.
   * Fills intermediate step gaps (e.g. if anchors are steps 2 and 16, stitches 2 through 16).
   */
  public static async stitchFlows(
    seeds: DenseSeedScreen[],
    activatedNodes: ActivatedGraphNode[],
    limit: number = 4
  ): Promise<RetrievedCandidateFlow[]> {
    const seedIds = new Set(seeds.map((s) => s.id));
    const allCandidateIds = new Set<string>(seeds.map((s) => s.id));
    activatedNodes.forEach((n) => allCandidateIds.add(n.screenId));

    if (allCandidateIds.size === 0) {
      return [];
    }

    // 1. Fetch initial activated screens
    const activatedScreens = await prisma.screen.findMany({
      where: {
        id: { in: Array.from(allCandidateIds) },
        imageUrl: { not: '' },
      },
      select: {
        id: true,
        name: true,
        screenNo: true,
        imageUrl: true,
        uxAnalysis: true,
        keyHighlights: true,
        appId: true,
        flowId: true,
        app: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        flow: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
      orderBy: { screenNo: 'asc' },
    });

    // 2. Identify winning (appId, flowId) pairs and their min/max screen bounds
    const flowBounds = new Map<string, { appId: string; flowId: string; minStep: number; maxStep: number; maxSimilarity: number; flowMeta: any }>();
    const seedMap = new Map(seeds.map((s) => [s.id, s]));

    for (const s of activatedScreens) {
      if (!s.appId || !s.flowId || !s.flow) continue;
      const key = `${s.appId}:::${s.flowId}`;
      const sim = seedMap.get(s.id)?.similarity || 0;
      const step = s.screenNo || 1;

      if (!flowBounds.has(key)) {
        flowBounds.set(key, {
          appId: s.appId,
          flowId: s.flowId,
          minStep: step,
          maxStep: step,
          maxSimilarity: sim,
          flowMeta: { app: s.app, flow: s.flow },
        });
      } else {
        const b = flowBounds.get(key)!;
        if (step < b.minStep) b.minStep = step;
        if (step > b.maxStep) b.maxStep = step;
        if (sim > b.maxSimilarity) b.maxSimilarity = sim;
      }
    }

    // Rank flows by their anchor similarity and pick top candidates
    const rankedFlowKeys = Array.from(flowBounds.entries())
      .sort((a, b) => b[1].maxSimilarity - a[1].maxSimilarity)
      .slice(0, limit);

    const activationScoreMap = new Map(activatedNodes.map((n) => [n.screenId, n.activationScore]));
    const finalFlows: RetrievedCandidateFlow[] = [];

    // 3. For each winning flow, perform Contiguous Stitching (fill intermediate gaps)
    for (const [key, bound] of rankedFlowKeys) {
      // Pull continuous screens within the step range (capped at 12 screens for UI responsiveness)
      const stitchedScreens = await prisma.screen.findMany({
        where: {
          appId: bound.appId,
          flowId: bound.flowId,
          imageUrl: { not: '' },
          screenNo: {
            gte: bound.minStep,
            lte: Math.min(bound.maxStep, bound.minStep + 10),
          },
        },
        select: {
          id: true,
          name: true,
          screenNo: true,
          imageUrl: true,
          uxAnalysis: true,
          keyHighlights: true,
        },
        orderBy: { screenNo: 'asc' },
        take: 10,
      });

      const formattedScreens: RetrievedFlowScreen[] = stitchedScreens.map((sc, idx) => ({
        id: sc.id,
        name: sc.name,
        screenNo: sc.screenNo || idx + 1,
        imageUrl: sc.imageUrl,
        uxAnalysis: sc.uxAnalysis,
        keyHighlights: sc.keyHighlights,
        isAnchor: seedIds.has(sc.id),
        activationScore: seedIds.has(sc.id) ? 1.0 : (activationScoreMap.get(sc.id) || 0.6),
      }));

      finalFlows.push({
        appId: bound.appId,
        appName: bound.flowMeta.app.name,
        appSlug: bound.flowMeta.app.slug,
        flowId: bound.flowId,
        flowName: bound.flowMeta.flow.name,
        flowSlug: bound.flowMeta.flow.slug,
        description: bound.flowMeta.flow.description || `Flow from ${bound.flowMeta.app.name}`,
        anchorSimilarity: bound.maxSimilarity,
        screens: formattedScreens,
      });
    }

    return finalFlows;
  }
}

