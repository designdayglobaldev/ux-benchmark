# Situational Retrieval: Blind Evaluation Rubric (21 Dev Queries)

**Purpose:** Provide unbiased, reproducible graded relevance ($0, 1, 2$) across candidate journeys retrieved by multiple search arms (Dense Arm A0, Anchors Rerank, and Per-Field Retrieval) alongside existing gold targets.

---

## 1. Grading Scale ($0, 1, 2$)

- **Grade 2 (Highly Relevant / Exemplar):**
  - The journey directly answers the design situation asked about.
  - The constituent screens clearly demonstrate the specific pattern, trade-off, or rationale in context.
  - *Example:* For *"When to enforce biometric re-authentication for sensitive wallet actions"*, a crypto or banking transfer/security flow that presents an explicit Face ID/Touch ID checkpoint for irreversible commitments.

- **Grade 1 (Partially Relevant / Acceptable Analog):**
  - The journey addresses a related or adjacent situational pattern, but requires minor designer translation, or only partially implements the constraint.
  - *Example:* An authentication or session lock flow that uses biometrics for app unlock rather than action-specific re-authentication.

- **Grade 0 (Irrelevant / Off-Target):**
  - The journey does not address the situational UX constraint, or is an unrelated general flow.
  - Pure topical coincidence (e.g. mentions "money" or "account" without the situational friction/governance asked about).

---

## 2. Special Rules for Specific Query Types

### A. "Avoid-Style" & Negative Polarity Queries
*(Queries like "Where not to use gamified scratch cards...", "When to avoid conversational chatbot UI...", "Where to avoid modal bottom sheets...")*
- **Polarity Rule:** A journey is **Grade 2** if:
  1. The screen metadata/rationale explicitly documents an anti-pattern or advises *against* using the control in this context; **OR**
  2. The journey cleanly demonstrates the *correct alternative pattern* recommended by design guidelines for that high-stakes situation (e.g., using a structured tabular confirmation instead of a conversational bot).
- A journey that naively commits the anti-pattern without nuance or context is **Grade 0**.

### B. Cognitive Load & Friction Checkpoints
*(Queries regarding "high cognitive load", "recovering user trust", "asynchronous loading anxiety")*
- The journey must demonstrate deliberate UX coping mechanisms (e.g. progressive disclosure, optimistic confirmation, calm state, clear retry loops), not just a standard bare error or empty screen.

---

## 3. Grader Instructions
1. Open [`docs/situational_blind_grading_pool.json`](file:///c:/projects/ux-libaray/docs/situational_blind_grading_pool.json).
2. For each pair `PAIR-001` through `PAIR-141`:
   - Inspect the candidate flow in the library (via app slug and flow slug).
   - Enter `grade`: `0`, `1`, or `2`.
   - Optionally add brief `rationaleNotes`.
3. Do **not** look at [`docs/situational_blind_provenance_key.json`](file:///c:/projects/ux-libaray/docs/situational_blind_provenance_key.json) until all ratings are locked.
