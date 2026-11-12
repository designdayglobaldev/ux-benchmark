export interface FusionArm<T> {
  arm: string;
  weight?: number;
  candidates: Array<{ id: string; item: T }>;
}

export interface FusionResult<T> {
  id: string;
  item: T;
  rrfScore: number;
  sources: Array<{ arm: string; rank: number }>;
}

/**
 * Reciprocal Rank Fusion (RRF) Engine
 * Implements Cormack, Clarke & Buettcher (SIGIR 2009) with support for router confidence weighting (Arm E).
 *
 * Formula:
 *   RRF(d) = Σ [ w_m / (k + rank_m(d)) ]
 * where k = 60 (standard IR smoothing constant)
 * and w_m is the router's intent confidence for that retrieval arm.
 *
 * Invariants maintained:
 * 1. Monotonicity: Within any arm, higher rank gives strictly higher contribution.
 * 2. Per-arm Deduplication: If candidate id appears multiple times in one arm,
 *    only its best (first) rank contributes to prevent inflating long entities.
 * 3. Deterministic Tie-Breaking: When scores are identical, sorted lexicographically by id.
 * 4. Invariant under arm permutation: Summation is commutative.
 * 5. Input Validation: Throws on k <= 0, negative weight, or non-finite weight.
 */
export class FusionEngine {
  public static readonly DEFAULT_K = 60;

  /**
   * Fuses multiple ranked candidate lists into a single deduplicated, re-scored list.
   *
   * @param arms Array of candidate arms, each with name, items, and assigned weight w_m
   * @param k Smoothing constant (default: 60, must be > 0)
   */
  public static fuse<T>(
    arms: Array<FusionArm<T>>,
    k: number = FusionEngine.DEFAULT_K
  ): Array<FusionResult<T>> {
    if (typeof k !== 'number' || !Number.isFinite(k) || k <= 0) {
      throw new Error(`[FusionEngine] Invalid smoothing constant k: ${k}. k must be a positive finite number.`);
    }

    const fusedMap = new Map<
      string,
      {
        item: T;
        rrfScore: number;
        sources: Array<{ arm: string; rank: number }>;
      }
    >();

    for (const arm of arms) {
      const weight = typeof arm.weight === 'number' ? arm.weight : 1.0;
      if (!Number.isFinite(weight) || weight < 0) {
        throw new Error(
          `[FusionEngine] Invalid arm weight: ${weight} for arm "${arm.arm}". Weight must be a non-negative finite number.`
        );
      }

      // Per-arm deduplication set: candidate ID must only contribute once per arm (at its best rank)
      const seenInArm = new Set<string>();

      arm.candidates.forEach((candidate, index) => {
        if (!candidate || typeof candidate.id !== 'string') return;

        if (seenInArm.has(candidate.id)) {
          // Skip subsequent occurrences in the same arm to prevent artificial score inflation
          return;
        }
        seenInArm.add(candidate.id);

        const rank = index + 1; // 1-indexed rank
        const contribution = weight / (k + rank);

        const existing = fusedMap.get(candidate.id);
        if (!existing) {
          fusedMap.set(candidate.id, {
            item: candidate.item,
            rrfScore: contribution,
            sources: [{ arm: arm.arm, rank }],
          });
        } else {
          existing.rrfScore += contribution;
          existing.sources.push({ arm: arm.arm, rank });
        }
      });
    }

    // Sort descending by combined RRF score with deterministic tie-breaking on id
    return Array.from(fusedMap.entries())
      .map(([id, val]) => ({
        id,
        item: val.item,
        rrfScore: val.rrfScore,
        sources: val.sources,
      }))
      .sort((a, b) => {
        const diff = b.rrfScore - a.rrfScore;
        // Float precision epsilon check: if scores match within 1e-12, break ties by string ID
        if (Math.abs(diff) > 1e-12) {
          return diff;
        }
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });
  }
}
