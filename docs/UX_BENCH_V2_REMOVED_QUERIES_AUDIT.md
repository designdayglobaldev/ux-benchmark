# Official Benchmark Inventory Audit: Removed & Modified Dev Queries

**Audit Reference:** Section 16.17 / Gate 1 Invariant Integrity  
**Date:** November 23, 2026  
**Auditors & Verifiers:** 
- **Design Reviewer:** UI/UX Design Lead (Manual Screen-by-Screen Inspection in Zibo UX Browser, recorded in `docs/UX_BENCH_V2_DESIGNER_FEEDBACK.csv`)
- **System Engineer:** Database Integrity Audit (Direct PostgreSQL Screen & Flow inspection via Prisma)

---

## 1. Audit Policy & Ground-Truth Invariant

Queries are **only dropped or trimmed** if:
1. **Unanswerable / Pattern Absent:** The requested component, interaction pattern, or anti-pattern does not physically exist in the library screens. Retaining unanswerable queries in a benchmark creates "phantom targets" that artificially penalize retrieval algorithms with $0.0000$ scores for failing to find non-existent controls.
2. **False Secondary Targets (Trimmed):** When a query listed multiple gold targets, but human inspection confirmed that Target A cleanly answers the query while Target B does not (e.g. `UXB-001` Revolut KYC kept, Coinbase dropped).

**Dual Reporting Rule:** All benchmarks must be reported on **both** the full $n=77$ dev set and the $n=56$ verified dev set side-by-side to guarantee zero post-hoc manipulation.

---

## 2. Inventory of Removed Dev Queries ($n=21$)

The following 21 dev queries were verified as unanswerable by library screens:

| Query ID | Intent | Query Text | Verification Method | Verifier Verdict & Specific Finding |
| :--- | :---: | :--- | :--- | :--- |
| **`UXB-017`** | flow | *Cinema movie ticket seat selection and theater booking* | Screen Inspection | MUBI GO screens cover weekly curated voucher redemption, not interactive seat selection / venue booking. |
| **`UXB-021`** | flow | *Card contactless payment NFC Apple Pay provisioning* | Screen Inspection | Apple Wallet screens in library cover pass tracking & receipts, not active NFC provisioning. |
| **`UXB-039`** | situational | *Where to avoid using swipe-to-confirm in non-destructive flows* | Screen Inspection | Neither Cash App nor CRED transfer flows contain a swipe-to-confirm interaction gesture. |
| **`UXB-040`** | situational | *When to display full-page interstitial versus inline permission priming* | Screen Inspection | Permission priming modal patterns are absent from Revolut/Shazam screens. |
| **`UXB-043`** | situational | *When to require two-step confirmation for destructive workspace entity deletion* | Screen Inspection | Neither Linear nor Airtable flows contain a two-step deletion confirmation modal. |
| **`UXB-044`** | situational | *Managing user anxiety during multi-minute asynchronous banking verification* | Screen Inspection | Multi-minute async progress states do not exist in Revolut/Brex screens. |
| **`UXB-047`** | situational | *When to enforce biometric re-authentication for sensitive wallet actions* | Screen Inspection | Coinbase/Apple Wallet screens only show an "Enable Biometrics" settings toggle, not active re-auth friction. |
| **`UXB-053`** | situational | *Preserving user input context during unexpected session expiration* | Screen Inspection | Session timeout recovery overlay absent from screens. |
| **`UXB-055`** | situational | *When to prompt users for app store rating without disrupting critical tasks* | Screen Inspection | **Explicit Bug:** Dave/Brilliant/Cleo screens do not contain app store rating dialogues. |
| **`UXB-056`** | situational | *Where not to use push notification priming during cold app launch* | Screen Inspection | Push priming modals on cold launch absent from screens. |
| **`UXB-071`** | component | *Segmented Control toggle for monthly versus annual billing* | Screen Inspection | Brilliant subscription screen shows plans, but does not contain a segmented control toggle. |
| **`UXB-074`** | component | *Progress Indicator multi-step stepper header for identity verification* | Screen Inspection | Revolut and Oportun KYC screens do not contain a top stepper header. |
| **`UXB-075`** | component | *Interactive Slider for loan repayment term duration calculation* | Screen Inspection | Neither Oportun nor Dave contains an interactive loan duration slider. |
| **`UXB-077`** | component | *Floating Action Button FAB for quick issue logging* | Screen Inspection | Linear uses modal bottom sheets and keyboard shortcuts, not a floating action button. |
| **`UXB-079`** | component | *Toast notification snackbar for successful file upload confirmation* | Screen Inspection | Upload confirmation toast snackbars absent from screens. |
| **`UXB-082`** | component | *Accordion expandable disclosure panel for legal terms FAQ* | Screen Inspection | Vertically collapsible FAQ accordions absent from screens. |
| **`UXB-083`** | component | *Carousel full-width hero banner with pagination dots* | Screen Inspection | Screens contain onboarding pagination dots, not hero banner carousels. |
| **`UXB-084`** | component | *Date Picker calendar modal for receipt expense date selection* | Screen Inspection | Calendar date picker modals absent from screens (Brex uses plain text input). |
| **`UXB-085`** | component | *Switch toggle control for biometric Face ID authentication enablement* | Screen Inspection | Face ID toggle switches absent from assigned screens. |
| **`UXB-116`** | compare | *Differences in biometric login between Apple Wallet and Google Pay* | Screen Inspection | Neither flow contains biometric login screens. |
| **`UXB-117`** | compare | *Contrast Lemon8 lifestyle feed creation with Figma canvas asset sharing* | Screen Inspection | Marked incomparable by human designers; design paradigms do not contrast directly. |

---

## 3. Dual-Report: Full Dev Set ($n=77$) vs. Verified Dev Set ($n=56$)

All numbers below are rescored strictly from the **single authoritative scoreboard** (`apps/api/scratch/fusion_variants_scoreboard.json`):

| Pipeline Variant | Full Dev Set ($n=77$) Mean nDCG@10 | Verified Dev Set ($n=56$) Mean nDCG@10 | Delta on $n=77$ (vs A0) | Delta on $n=56$ (vs A0) | 95% Bootstrap CI on $n=56$ | Empirical $p$-value ($n=56$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Arm A0 (Dense Only Baseline)** | **0.4410** | **0.5326** | — | — | — | — |
| **Variant 1 (Rerank-Only / Zero Injections)** | **0.4542** | **0.5514** | +0.0132 | +0.0188 | `[-0.0221, +0.0595]` | $p = 0.1827$ |
| **Variant 2 (Capped Top-3 Field Hits)** | **0.4673** | **0.5710** | +0.0263 | +0.0384 | `[-0.0122, +0.0896]` | $p = 0.0763$ |
| **Variant 3 (Low-Weight $w=0.20$ Fusion)** | **0.4879** | **0.5975** | **+0.0469** | **+0.0648** | **`[+0.0153, +0.1126]`** | **$p = 0.0052$** |
| **Variant 4 (Full Unrouted $w=0.50$ Fusion)** | **0.4410** | **0.5438** | -0.0000 | +0.0112 | `[-0.0540, +0.0757]` | $p = 0.3619$ |

### Intent Breakdown on Single Saved Scoreboard:

| Intent Category | $n$ (Full) | $n$ (Verified) | A0 ($n=77$) | V3 ($n=77$) | Delta ($n=77$) | A0 ($n=56$) | V3 ($n=56$) | Delta ($n=56$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **flow** | 21 | 19 | 0.6588 | 0.6582 | -0.0006 | 0.6660 | 0.6857 | **+0.0197** |
| **situational** | 21 | 13 | 0.2354 | 0.3546 | **+0.1192** | 0.3731 | 0.5162 | **+0.1431** |
| **component** | 18 | 9 | 0.2722 | 0.2736 | +0.0014 | 0.3298 | 0.3573 | **+0.0275** |
| **compare** | 17 | 15 | 0.6045 | 0.6713 | **+0.0668** | 0.6237 | 0.7004 | **+0.0766** |
| **OVERALL** | **77** | **56** | **0.4410** | **0.4879** | **+0.0469** | **0.5326** | **0.5975** | **+0.0648** |
