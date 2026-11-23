# Designer Task Briefing & Instructions

**Date:** November 23, 2026  
**Project:** Cognitive UX Retrieval Benchmark (UX-Bench v2)  
**Fast-Track Steps:** Step 4 & Step 5 (Section 17 of Retrieval Specification)

---

## 🎯 Overview for Design Team
We are finalizing **Gate 1** of our new cognitive UX search engine. Before running our single evaluation on the held-out test dataset, we need human designer ground-truth verification.

We have generated **3 clear, ready-to-fill CSV files**:
1. [`docs/STEP4_TEST_SPLIT_SIGNOFF.csv`](file:///c:/projects/ux-libaray/docs/STEP4_TEST_SPLIT_SIGNOFF.csv)
2. [`docs/STEP5_SPOT_CHECK_GRADER_1.csv`](file:///c:/projects/ux-libaray/docs/STEP5_SPOT_CHECK_GRADER_1.csv)
3. [`docs/STEP5_SPOT_CHECK_GRADER_2.csv`](file:///c:/projects/ux-libaray/docs/STEP5_SPOT_CHECK_GRADER_2.csv)

Below are the exact message tasks and instructions for **Designer 1** and **Designer 2**.

---

## 👤 Designer 1: Primary Reviewer & Grader

### Task A: Step 4 – Test Split Target Verification (~2 hours)
* **File to Open:** [`docs/STEP4_TEST_SPLIT_SIGNOFF.csv`](file:///c:/projects/ux-libaray/docs/STEP4_TEST_SPLIT_SIGNOFF.csv)
* **Goal:** Verify that the 60 test queries have authentic, physically existing screens in our library before any algorithm is tested on them.
* **How to do it:**
  1. Open the CSV in Excel, Google Sheets, or VS Code.
  2. For each query, look at the **`Gold Targets`** column (e.g., `brex:requesting-new-spend-limit`, `spotify:wrapped`).
  3. Browse the app in the Zibo library to ensure those screens exist and relate to the query.
  4. Fill in the **`Signoff Status`** column with one of:
     - `Confirmed` (The screens exist and answer the query).
     - `Missing` (The flow or screens literally do not exist in the app).
     - `Mismatch` (The flow exists, but the specific requested control/anti-pattern is absent).
  5. Add any optional notes in the `Notes` column.

---

### Task B: Step 5 – Blind Situational Spot-Check (~2 hours)
* **File to Open:** [`docs/STEP5_SPOT_CHECK_GRADER_1.csv`](file:///c:/projects/ux-libaray/docs/STEP5_SPOT_CHECK_GRADER_1.csv)
* **Goal:** Blindly grade 65 candidate journeys across the 10 situational queries where our retrieval models differ most.
* **Important:** All model identities have been stripped. You will only see the query and candidate journey.
* **How to Grade (Column `Grade (0, 1, or 2)`):**
  - **`2` (Highly Relevant / Direct Guidance):** The journey directly demonstrates the design situation, trade-off, or rationale in context.
  - **`1` (Partially Relevant / Acceptable Analog):** The journey addresses a related or adjacent situational pattern, but requires minor designer translation.
  - **`0` (Irrelevant / Off-Target):** The journey does not address the situational constraint.
* **"No Relevant Flow In Library" Column:**
  - If you inspect all candidates for a query and realize that **no screens in the entire library** answer that specific situation (e.g. app store rating prompt bug), enter `YES` in this column. Otherwise leave blank or `NO`.

---

## 👤 Designer 2: Independent Spot-Check Reviewer (~1 hour)

### Task: Step 5 – Inter-Rater Reliability Check
* **File to Open:** [`docs/STEP5_SPOT_CHECK_GRADER_2.csv`](file:///c:/projects/ux-libaray/docs/STEP5_SPOT_CHECK_GRADER_2.csv)
* **Goal:** Grade a random 1/3 sample (**22 candidate pairs**) completely independently of Designer 1.
* **Why this matters:** We compare Designer 1's grades against Designer 2's grades on these 22 pairs to compute **Cohen's Kappa ($\kappa$)**. This scientifically proves that the UX grading standards are objective and reproducible across different designers.
* **How to do it:**
  1. Open the CSV.
  2. Follow the exact same 0, 1, 2 grading criteria as Designer 1 above.
  3. Fill in the **`Grade (0, 1, or 2)`** column and `No Relevant Flow` column.
  4. **Do not discuss or share ratings with Designer 1** until both CSVs are submitted.

---

## 📋 Rubric Reference
For detailed examples and special rules (handling negative polarity / "where not to use" queries), refer to:  
[`docs/SITUATIONAL_BLIND_EVALUATION_RUBRIC.md`](file:///c:/projects/ux-libaray/docs/SITUATIONAL_BLIND_EVALUATION_RUBRIC.md).
