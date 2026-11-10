import { prisma } from '../../db/prisma';

export interface ActivatedGraphNode {
  screenId: string;
  activationScore: number;
  edgeType: string;
}

export class GraphWalkEngine {
  /**
   * Spreading Activation Traversal:
   * Takes seed screen IDs and expands 2 hops across ScreenEdge (FLOW_SEQUENCE + SHARED_PATTERN)
   */
  public static async walk(anchorScreenIds: string[], limit: number = 60): Promise<ActivatedGraphNode[]> {
    if (!anchorScreenIds || anchorScreenIds.length === 0) {
      return [];
    }

    try {
      const rows: any = await prisma.$queryRawUnsafe(
        `
        WITH RECURSIVE graph_walk AS (
          -- Base Case: Seed Screens (Depth 0)
          SELECT 
            se."sourceScreenId" AS "seedId",
            se."targetScreenId" AS "screenId",
            se."edgeType",
            se."weight" as "activationScore",
            1 as "depth"
          FROM "ScreenEdge" se
          WHERE se."sourceScreenId" = ANY($1::text[])

          UNION ALL

          -- 1 Hop Expansion: Follow sequential and pattern edges (Depth 1)
          SELECT 
            gw."seedId",
            next_edge."targetScreenId" AS "screenId",
            next_edge."edgeType",
            gw."activationScore" * next_edge."weight" * 0.7 as "activationScore",
            gw."depth" + 1
          FROM "ScreenEdge" next_edge
          JOIN graph_walk gw ON next_edge."sourceScreenId" = gw."screenId"
          WHERE gw."depth" < 2
        )
        SELECT 
          "screenId", 
          "activationScore", 
          "edgeType"
        FROM (
          SELECT DISTINCT ON ("screenId")
            "screenId",
            "activationScore",
            "edgeType"
          FROM graph_walk
          ORDER BY "screenId", "activationScore" DESC
        ) sub
        ORDER BY "activationScore" DESC
        LIMIT $2;
        `,
        anchorScreenIds,
        limit
      );

      return (rows || []).map((r: any) => ({
        screenId: r.screenId,
        activationScore: Number(r.activationScore) || 0.5,
        edgeType: r.edgeType,
      }));
    } catch (err) {
      console.warn('[GraphWalkEngine.walk] Error:', err);
      return [];
    }
  }
}

