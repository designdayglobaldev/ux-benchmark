export class IntentBalancer {
  /**
   * Detects multi-intent prompts (e.g. "X or Y", "Compare A and B", "X vs Y")
   * and splits them into distinct sub-queries for balanced retrieval.
   */
  public static splitPromptIntents(prompt: string): string[] {
    const trimmed = prompt.trim();

    // Check for " or " (e.g. "destructive action confirmation or account recovery")
    if (/\b(?:or)\b/i.test(trimmed)) {
      const parts = trimmed.split(/\b(?:or)\b/i).map((p) => p.trim()).filter((p) => p.length > 5);
      if (parts.length >= 2) return parts.slice(0, 2);
    }

    // Check for "compare ... and ..." / "... vs ..."
    if (/\b(?:vs\.?|versus)\b/i.test(trimmed)) {
      const parts = trimmed.split(/\b(?:vs\.?|versus)\b/i).map((p) => p.trim()).filter((p) => p.length > 3);
      if (parts.length >= 2) return parts.slice(0, 2);
    }

    return [trimmed];
  }
}

