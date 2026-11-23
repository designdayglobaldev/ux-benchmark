import { COMPONENT_DICTIONARY, ComponentDefinition } from './component-dictionary';

export interface MatchedComponent {
  definition: ComponentDefinition;
  matchedAlias: string;
}

export class ComponentRetriever {
  /**
   * Matches query against canonical UI component aliases using word boundary regex.
   * Returns list of matching components sorted by weight descending.
   */
  public static extractComponents(query: string): MatchedComponent[] {
    if (!query || typeof query !== 'string') return [];
    const q = query.toLowerCase();
    const matched: MatchedComponent[] = [];
    const seenCanonicals = new Set<string>();

    for (const def of COMPONENT_DICTIONARY) {
      if (def.weight <= 0) continue; // Skip generic elements (>20% screen coverage)

      for (const alias of def.aliases) {
        // Word boundary match
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(q)) {
          if (!seenCanonicals.has(def.canonicalSlug)) {
            seenCanonicals.add(def.canonicalSlug);
            matched.push({ definition: def, matchedAlias: alias });
          }
          break;
        }
      }
    }

    return matched.sort((a, b) => b.definition.weight - a.definition.weight);
  }

  /**
   * Calculates additive boost score for a candidate flow.
   * Specification Rule: Boost, never gate.
   * If any screen in the flow contains a matched UiElement tag, the candidate gets an additive boost.
   * If a flow lacks the tag, its score is completely untouched (never filtered or penalized).
   */
  public static computeTagBoost(
    candidateScreensUiElements: string[][],
    matchedComponents: MatchedComponent[],
    boostFactor: number = 0.25
  ): { boost: number; matchedTags: string[] } {
    if (matchedComponents.length === 0 || candidateScreensUiElements.length === 0) {
      return { boost: 0, matchedTags: [] };
    }

    // Collect all unique element slugs present across the flow's constituent screens
    const flowElements = new Set<string>();
    for (const screenElements of candidateScreensUiElements) {
      for (const el of screenElements) {
        flowElements.add(el.toLowerCase());
      }
    }

    let totalBoost = 0;
    const hitTags: string[] = [];

    for (const match of matchedComponents) {
      if (flowElements.has(match.definition.canonicalSlug)) {
        totalBoost += boostFactor * match.definition.weight;
        hitTags.push(match.definition.canonicalSlug);
      }
    }

    return { boost: totalBoost, matchedTags: hitTags };
  }
}

