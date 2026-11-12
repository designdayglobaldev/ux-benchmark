const getVoyageApiKey = () => process.env.VOYAGE_API_KEY || '';

export interface RerankCandidate {
  id: string;
  document: string;
}

export interface RerankResult {
  index: number;
  relevanceScore: number;
  rawScore: number;
}

/**
 * Strips HTML formatting tags while preserving semantic spacing and text tokens
 */
function cleanHtml(str?: string | null): string {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Calibrates cross-encoder logit scores into a standardized 0-100% confidence curve.
 * In Voyage rerank-2:
 *  - >0.65 indicates an exceptionally strong match across complex UI flows.
 *  - 0.40 - 0.65 represents moderate contextual relevance.
 *  - <0.30 indicates low semantic alignment.
 * This calibration maps top matches (e.g. 0.65+) gracefully into the 90%+ confidence bracket.
 */
function calibrateConfidence(rawScore: number): number {
  if (rawScore <= 0.05) return Math.max(0, rawScore);
  
  // Sigmoid / piecewise calibration centered around 0.50
  if (rawScore >= 0.70) {
    // Top tier: 0.70 -> 0.93+, scaling asymptotically to 0.99
    const ratio = (rawScore - 0.70) / 0.30;
    return Math.min(0.99, 0.93 + ratio * 0.06);
  } else if (rawScore >= 0.50) {
    // Upper tier: 0.50 -> 0.82 up to 0.93
    const ratio = (rawScore - 0.50) / 0.20;
    return 0.82 + ratio * 0.11;
  } else if (rawScore >= 0.35) {
    // Moderate tier: 0.35 -> 0.65 up to 0.82
    const ratio = (rawScore - 0.35) / 0.15;
    return 0.65 + ratio * 0.17;
  } else {
    // Low tier
    return rawScore * 1.5;
  }
}

export class RerankEngine {
  /**
   * Re-rank candidate documents against a query using Voyage AI's rerank-2 model
   * Returns candidates sorted by calibrated cross-encoder relevance score (0.0 to 1.0)
   */
  public static async rerank(
    query: string,
    candidates: RerankCandidate[],
    topK?: number
  ): Promise<RerankResult[]> {
    const apiKey = getVoyageApiKey();
    if (!apiKey) {
      console.warn('[RerankEngine] VOYAGE_API_KEY not configured, skipping rerank');
      return candidates.map((_, i) => ({ index: i, relevanceScore: 0.5, rawScore: 0.5 }));
    }

    if (!candidates || candidates.length === 0) {
      return [];
    }

    // Clean HTML to maximize token signal density for the cross-encoder
    const documents = candidates.map((c) => cleanHtml(c.document).slice(0, 4000));

    try {
      const res = await fetch('https://api.voyageai.com/v1/rerank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'rerank-2',
          query: cleanHtml(query),
          documents,
          top_k: topK || candidates.length,
          return_documents: false,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn('[RerankEngine] Voyage rerank error, falling back to original order:', errText);
        // Fallback should not inflate confidence to 1.0; preserve original first-stage relative order
        return candidates.map((_, i) => ({ index: i, relevanceScore: Math.max(0.3, 0.7 - i * 0.1), rawScore: 0.5 }));
      }

      const data = await res.json();
      return (data.data || []).map((item: any) => {
        const rawScore = Number(item.relevance_score) || 0;
        return {
          index: item.index,
          relevanceScore: calibrateConfidence(rawScore),
          rawScore,
        };
      });
    } catch (err) {
      console.warn('[RerankEngine] Failed to connect to Voyage rerank:', err);
      return candidates.map((_, i) => ({ index: i, relevanceScore: Math.max(0.3, 0.7 - i * 0.1), rawScore: 0.5 }));
    }
  }
}

