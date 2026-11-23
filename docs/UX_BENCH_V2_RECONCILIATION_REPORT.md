# UX-Bench v2: Reconciled Ground-Truth Labels & Database Audit

**Date:** November 23, 2026  
**Audited Against:** Live Supabase PostgreSQL Library (3,693 screens, 510 flows) & Designer Review Feedback (`docs/UX_BENCH_V2_DESIGNER_FEEDBACK.csv`)

---

## 1. Executive Summary: What We Discovered

When analyzing the designer review feedback against the live database, two contrasting realities emerged:

1. **The "Missing" Flows DO Exist in the Database:**
   - Reviewers noted several flows were *"not there in Zibo yet"*, specifically for **Linear**, **H&M**, and **Airtable**.
   - Direct database inspection confirmed that **every single one of those flows is already in the database**:
     - `linear:creating-an-issue`: **12 screens** (complete modal with fields, teams, metadata bar)
     - `airtable:fields-tutorial`: **23 screens** (complete formula, column type, field creation)
     - `airtable:creating-a-new-record`: **7 screens** (full mobile record creation)
     - `h-and-m:adding-to-cart-bag`: **3 screens** (product size selection, added toast, cart view)
     - `h-and-m:product-filter`: **4 screens** (multi-facet category, color swatches, live counters)
   - *Root cause:* The reviewer was browsing via the frontend Zibo UI, which experienced display lag or pagination filters for certain apps. In PostgreSQL, they are 100% indexed.

2. **Genuine Component & Interaction Anti-Pattern Mismatches:**
   - The designers were **completely accurate** in noting that certain *specific components or interactions* do not exist inside those flows:
     - **No FAB in Linear:** `linear:creating-an-issue` uses a bottom sheet modal / keyboard shortcut, not a floating action button (`UXB-077`).
     - **No Swipe-to-Confirm in Cash App/CRED:** Neither transfer flow contains swipe-to-confirm (`UXB-039`).
     - **No Stepper Header in Revolut KYC:** Revolut uses simple back-and-forth cards without a step progress bar (`UXB-074`).
     - **No Calendar Date Picker in Brex:** `brex:request-reimbursement` uses a system date field without an inline calendar widget (`UXB-084`).
     - **No Rating Dialogue in Dave/Cleo:** Marked as Bug (`UXB-055`).

---

## 2. Benchmark Reconciliation Actions

Every query across the 150 benchmark items was evaluated across three dimensions:
- **DB Existence:** Does the flow exist with actual screens in PostgreSQL?
- **Pattern Match:** Does the screen content match the semantic intent of the query?
- **Designer Feedback:** Did the human reviewers confirm or reject the relevance?

| Reconciliation Category | Count | Action Taken |
| :--- | :---: | :--- |
| **VERIFIED_CLEAN** | **52** | Gold targets verified and confirmed accurate by designers. Kept intact. |
| **RESTORED (DB Confirmed)** | **5** | Flows that reviewers thought were missing in Zibo UI (`linear:creating-an-issue`, `h-and-m`, `airtable:creating-a-new-record`) were verified directly in DB and restored as valid gold targets. |
| **TRIMMED (Partially Specified)** | **33** | One target was accurate while secondary targets were invalid (e.g. `UXB-001` Revolut kept, Coinbase/Oportun dropped; `UXB-004` Cash App/Venmo kept, PayPal dropped). Trimmed to verified targets. |
| **FIXED_TARGETS** | **1** | `UXB-102` (Revolut vs Coinbase KYC): Target originally had Oportun by error. Corrected target to Revolut and Coinbase. |
| **DROPPED (Phantom / Missing Pattern)** | **37** | Targets where the component or anti-pattern is genuinely absent from the app screens (e.g. FAB, Swipe-to-Confirm, App Store rating prompts). |
| **OUT OF DOMAIN (OOD)** | **22** | Negative control queries (13 dev, 9 test). |

---

## 3. Reconciled Dev Split Breakdown ($n=77$)

After applying the reconciled ground truth, the 77 dev queries break down as follows:

| Intent Category | Original Total | Valid & Verified Queries | Dropped (Phantom Targets) | Verified Target Retention Rate |
| :--- | :---: | :---: | :---: | :---: |
| **flow** | 21 | **19** | 2 (`UXB-017` Mubi Go, `UXB-021` Apple Wallet) | **90.5%** |
| **compare** | 17 | **15** | 2 (`UXB-116` Apple Wallet vs GPay, `UXB-117` Lemon8 vs Figma) | **88.2%** |
| **situational** | 21 | **13** | 8 (`UXB-039`, `040`, `043`, `044`, `047`, `053`, `055`, `056`) | **61.9%** |
| **component** | 18 | **9** | 9 (`UXB-071`, `074`, `075`, `077`, `079`, `082`, `083`, `084`, `085`) | **50.0%** |
| **TOTAL (Dev)** | **77** | **56** | **21** | **72.7%** |

---

## 4. Key Takeaways & Impact on Retrieval Baselines

1. **Explains the Low Component Baseline:**
   - 50% of the component dev queries had **phantom targets** where the requested UI element did not actually exist on the screens. Evaluating algorithms against non-existent components artificially penalized the baseline.
2. **Explains the Situational Dilution:**
   - Queries like `UXB-047` (*"When to enforce biometric re-authentication"*) had screens that only showed an "Enable Biometrics" toggle switch in settings, not an active authentication prompt.
3. **Artifacts Generated:**
   - Complete reconciled dataset: [`docs/UX_BENCH_V2_RECONCILED.json`](file:///c:/projects/ux-libaray/docs/UX_BENCH_V2_RECONCILED.json)
   - Step-by-step audit log: `apps/api/scratch/reconciliation_changelog.json`
