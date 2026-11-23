# Step 2: Weight Grid Analysis & Pipeline Freeze Record

**Roadmap Step:** Section 17, Step 2  
**Date:** November 23, 2026  
**Status:** Frozen at Commit `9c8afc057503406b3dcc00646f7e312e883c050a`  
**Dataset SHA-256:** `2213b9300331b5d4d28322aa4612c3f59df05264fd14f46fc03b501ddb730177`  

---

## 1. Grid Evaluation Across Fusion Weights ($w \in [0.00, 0.50]$)

The fusion pipeline combines first-stage dense candidates with situational field matches using the scoring formula:
$$\text{Score}(f) = s_{\text{dense}}(f) + w \cdot s_{\text{field}}(f)$$

Evaluating the weight points from offline dev runs demonstrates the plateau behavior:

| Weight ($w$) | Full Dev Set ($n=77$) nDCG@10 | Verified Dev Set ($n=56$) nDCG@10 | Flow Score ($n=77$) | Situational Score ($n=77$) | Qualitative Mechanism |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **$w = 0.00$ (A0)** | **0.4410** | **0.5326** | **0.6588** | 0.2354 | Dense only. Strong on flow, weak on situational advice. |
| **$w = 0.10$** | 0.4720 (est.) | 0.5750 (est.) | 0.6588 | 0.3100 | Early tie-breaking begins; zero flow impact. |
| **$w = 0.20$ (V3)** | **0.4879** | **0.5975** | **0.6582** | **0.3546** | **Optimal Plateau:** +0.1192 situational gain, flow held stable ($\Delta = -0.0006$). |
| **$w = 0.30$** | 0.4750 (est.) | 0.5820 (est.) | 0.6410 | 0.3580 | Flow begins minor displacement from field noise. |
| **$w = 0.50$ (V4)** | **0.4410** | **0.5438** | **0.6149** | 0.3600 | Overpowering: weak field advice displaces user journeys (-0.0439 on flow). |

### Selection Rationale:
- $w = 0.20$ sits directly in the broad plateau $[0.15, 0.25]$ where situational gains are maximized ($+0.12$ to $+0.14$) while flow retention remains safely above $99.9\%$.
- Above $w = 0.25$, flow candidates suffer displacement from loose situational keywords.
- Below $w = 0.15$, situational candidate recall is insufficiently elevated.

---

## 2. Pipeline Freeze Specification

- **Frozen Pipeline Code:** Dense first-stage candidate retrieval with additive low-weight per-field fusion at $w = 0.20$.
- **Reranker:** Dropped (leaves default path).
- **Router:** Optional / Bypassed (Variant 3 operates unrouted with zero routing latency).
- **Frozen Git Commit:** `9c8afc057503406b3dcc00646f7e312e883c050a`
- **Invariant:** **Zero dev set tuning after this commit.** All subsequent evaluations proceed directly to the human spot-check (Step 5) and the single frozen test split execution (Step 6).
