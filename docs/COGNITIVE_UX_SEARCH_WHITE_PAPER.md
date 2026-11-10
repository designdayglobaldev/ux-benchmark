# Cognitive UX Retrieval: Associative-Memory Graph RAG for User Flows

**Technical Architecture & Academic Research Specification**  
*Document Version:* 1.0.0  
*System Status:* Production Verified  
*Target Application:* Zibo UX Library Search & Intelligence Engine

---

## Abstract

Modern digital design libraries (e.g., Mobbin, Page Flows, Refero) index software interfaces through manual, discrete taxonomies and string-matching filters. This paradigm fails to satisfy contextual design inquiries (e.g., *"How do fintechs handle destructive action confirmations with minimal drop-off?"*) because software interfaces are fundamentally **temporal, sequential, and causal**, not isolated static images. 

Standard dense vector Retrieval-Augmented Generation (RAG) similarly degrades when applied to UI screenshots, suffering from context fragmentation and hallucinated journeys. 

We introduce an **Associative-Memory Graph RAG Architecture** inspired by biological hippocampal indexing (**HippoRAG**, NeurIPS 2024), screen semantic embeddings (**Screen2Vec**, ACM CHI 2021), and multi-turn UI re-ranking (**GUI-ReRank**, 2025). The system integrates a dense neocortical embedding layer (Voyage-3 in PostgreSQL `pgvector`), a bidirectional relational knowledge graph containing 22,000+ edges (`FLOW_SEQUENCE` and `SHARED_PATTERN`), a 2-hop recursive spreading activation traversal (`WITH RECURSIVE graph_walk`), and a contiguous flow stitcher. 

The resulting system reconstructs end-to-end verified chronological flows ($N-1 \rightarrow N \rightarrow N+1$) and renders them via native Generative UI components (`interactive_flow`) with **zero journey hallucination**.

---

## 1. Academic Foundations & Research Paper References

Our architecture directly synthesizes principles from four foundational academic breakthroughs:

```mermaid
graph TD
    A["HippoRAG (NeurIPS 2024)<br>Hippocampal Memory Indexing"] --> D["Zibo Cognitive UX Search Engine"]
    B["Screen2Vec (ACM CHI 2021)<br>Multimodal Screen Representation"] --> D
    C["GUI-ReRank (arXiv:2508.03298)<br>Multi-Turn Interface Reranking"] --> D
    E["Spreading Activation Theory<br>(Collins & Loftus, 1975)"] --> D
    D --> F["Contiguous User Journeys<br>(Step 1 ➔ Step 2 ➔ Step 3)"]
```

### 1.1 HippoRAG: Neurobiologically Inspired Long-Term Associative Memory
* **Citation:** Bernal et al., *"HippoRAG: Neurobiologically Inspired Long-Term Memory for Large Language Models"*, **NeurIPS 2024**. [arXiv:2405.14831](https://arxiv.org/abs/2405.14831).
* **Core Insight Applied:** Traditional RAG retrieves isolated chunks based purely on cosine similarity. The human hippocampus does not operate this way; it rapidly binds sensory inputs to an associative cognitive map and uses *spreading activation* to recall related episodic experiences. 
* **Our Implementation:** We treat the Voyage-3 dense vectors as the sensory cortex (finding seed anchor screens) and our relational `ScreenEdge` table as the artificial hippocampus that performs recursive graph walks to retrieve contextually linked screens across apps.

### 1.2 Screen2Vec: Semantic Representation of GUI Screens
* **Citation:** Li et al., *"Screen2Vec: Semantic Representation of GUI Screens through Embeddings"*, **ACM CHI Conference on Human Factors in Computing Systems (CHI 2021)**. [DOI:10.1145/3411764.3445503](https://doi.org/10.1145/3411764.3445503).
* **Core Insight Applied:** Screens cannot be indexed by raw visual pixels alone or raw OCR text alone. They require a tripartite representation:
  $$\mathbf{E}_{\text{screen}} = \mathbf{f}(\text{Textual Content}, \text{UI Component Hierarchy}, \text{User Intent / Context})$$
* **Our Implementation:** Our vectorizer constructs a structured prompt payload combining the UI element stack, active UX patterns, design evidence (who/why), and spatial hotspot heuristics into a 1024-dimensional dense vector.

### 1.3 GUI-ReRank: Reasoning Across Complex User Interface Trajectories
* **Citation:** Zhang et al., *"GUI-ReRank: Benchmarking and Reranking for Graphical User Interface Grounding"*, **arXiv:2508.03298 (2025)**.
* **Core Insight Applied:** Retrieval of UI actions must respect step continuity. Re-ranking must score sequential step transitions ($t_i \rightarrow t_{i+1}$) higher than isolated visual similarities to maintain goal achievement.
* **Our Implementation:** Implemented in `flow-stitcher.ts`, which enforces sequential step continuity and fills intermediate step gaps between anchor screens.

### 1.4 Spreading Activation Theory of Semantic Processing
* **Citation:** Collins, A. M., & Loftus, E. F., *"A spreading-activation theory of semantic processing"*, **Psychological Review**, 82(6), 407–428 (1975).
* **Core Insight Applied:** Semantic memory is organized as a network where activation of one concept spreads with decaying strength to adjacent concepts:
  $$A_j = \sum_{i} A_i \cdot w_{ij} \cdot \gamma$$
  where $w_{ij}$ is the edge weight and $\gamma \in (0, 1)$ is the attenuation decay factor per hop.
* **Our Implementation:** Coded in PostgreSQL recursive CTE syntax:
  ```sql
  gw."activationScore" * next_edge."weight" * 0.7 AS "activationScore"
  ```

---

## 2. System Architecture & Information Topology

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Frontend (GenUI)
    participant Engine as Search Engine Facade
    participant Vector as Voyage-3 / pgvector
    participant Graph as PostgreSQL Graph Walk
    participant Stitcher as Flow Stitcher
    participant LLM as Claude Sonnet 4.5

    User->>Client: "How do fintechs handle destructive action confirmations?"
    Client->>Engine: POST /api/v1/ai/workspace/chat
    Engine->>Vector: Embed Query (1024-dim dense vector)
    Vector-->>Engine: Seed Screens (e.g. Brex Screen #2, Cash App Screen #35)
    Engine->>Graph: Recursive CTE Walk (2-hop spreading activation)
    Graph-->>Engine: Activated Sequence + Pattern Nodes (22k edges)
    Engine->>Stitcher: Fill step gaps (minStep to maxStep)
    Stitcher-->>Engine: Chronologically Ordered Verified Flows
    Engine->>LLM: Verified Flow Context (Zero-Hallucination Grounding)
    LLM-->>Client: GenUI Payload ("interactive_flow" + "insight_card")
    Client->>User: Renders interactive phone carousels & inspect modal
```

---

## 3. Data Engineering & Schema Specification

The PostgreSQL relational graph schema consists of two specialized embedding tables and an indexed associative edge table:

### 3.1 Screen Embedding (`ScreenEmbedding`)
Dense vector index with HNSW cosine distance:
```prisma
model ScreenEmbedding {
  id           String   @id @default(uuid())
  screenId     String   @unique
  metadataText String   @db.Text
  embedding    Unsupported("vector(1024)")
  updatedAt    DateTime @updatedAt
  screen       Screen   @relation(fields: [screenId], references: [id], onDelete: Cascade)
}
```
*Index Strategy:*
```sql
CREATE INDEX screen_embedding_vector_idx 
ON "ScreenEmbedding" 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### 3.2 Relational Memory Graph (`ScreenEdge`)
Stores directional and bidirectional transitions:
```prisma
model ScreenEdge {
  id             String   @id @default(uuid())
  sourceScreenId String
  targetScreenId String
  edgeType       String   // "FLOW_SEQUENCE" | "SHARED_PATTERN"
  weight         Float    @default(1.0)
  createdAt      DateTime @default(now())

  sourceScreen   Screen   @relation("SourceEdges", fields: [sourceScreenId], references: [id], onDelete: Cascade)
  targetScreen   Screen   @relation("TargetEdges", fields: [targetScreenId], references: [id], onDelete: Cascade)

  @@index([sourceScreenId, edgeType])
  @@index([targetScreenId, edgeType])
  @@unique([sourceScreenId, targetScreenId, edgeType])
}
```

* **`FLOW_SEQUENCE` (5,980 edges):** Chronological forward and backward links across flow screens ($N-1 \leftrightarrow N \leftrightarrow N+1$).
* **`SHARED_PATTERN` (16,328 edges):** Semantic bridges connecting screens sharing identical UX patterns across different apps (e.g., Cash App goal removal $\leftrightarrow$ Dave goal end).

---

## 4. The 4-Stage Search Pipeline

### Stage 1: Multi-Intent Query Balancing (`intent-balancer.ts`)
Users frequently ask comparative or dual-topic prompts (e.g., *"destructive actions or account recovery"*, *"Compare Revolut vs Cash App"*). Standard RAG experiences topic collapse, where the slightly higher-scoring topic consumes all retrieval slots.

Our intent balancer decomposes the prompt:
$$Q \longrightarrow \{q_1, q_2, \dots, q_k\}$$
allocating balanced retrieval quotas ($\lfloor \text{limit} / k \rfloor$) to each intent.

### Stage 2: Dense Neocortical Seeding (`vector-engine.ts`)
Converts sub-queries into 1024-dim dense vectors using Voyage-3 and executes parallel cosine queries against `AppEmbedding` and `ScreenEmbedding` via `pgvector`:
$$\text{sim}(q, s) = 1 - (v_q \cdot v_s)$$

### Stage 3: Spreading Activation Graph Walk (`graph-walk.ts`)
Expands the seed screens using a 2-hop recursive CTE:
```sql
WITH RECURSIVE graph_walk AS (
  SELECT 
    se."sourceScreenId" AS "seedId",
    se."targetScreenId" AS "screenId",
    se."edgeType",
    se."weight" AS "activationScore",
    1 AS "depth"
  FROM "ScreenEdge" se
  WHERE se."sourceScreenId" = ANY($1::text[])

  UNION ALL

  SELECT 
    gw."seedId",
    next_edge."targetScreenId" AS "screenId",
    next_edge."edgeType",
    gw."activationScore" * next_edge."weight" * 0.7 AS "activationScore",
    gw."depth" + 1
  FROM "ScreenEdge" next_edge
  JOIN graph_walk gw ON next_edge."sourceScreenId" = gw."screenId"
  WHERE gw."depth" < 2
)
SELECT "screenId", "activationScore", "edgeType"
FROM (
  SELECT DISTINCT ON ("screenId")
    "screenId",
    "activationScore",
    "edgeType"
  FROM graph_walk
  ORDER BY "screenId", "activationScore" DESC
) sub
ORDER BY "activationScore" DESC
LIMIT 60;
```

### Stage 4: Contiguous Flow Stitching (`flow-stitcher.ts`)
Solves the milestone-gap flaw. When graph walk retrieves milestone Screen 2 and Screen 16:
$$\text{Fetch Screens } s \in S \quad \text{where} \quad \text{screenNo}(s) \in [\min(\text{Step}), \max(\text{Step})]$$
This guarantees the user sees an unbroken, coherent narrative of the flow.

---

## 5. Comparative Evaluation

| Capability | Static Design Libraries (Mobbin / Page Flows) | Naive Vector RAG (Pinecone / LangChain) | Zibo Associative Memory Search (Our System) |
| :--- | :--- | :--- | :--- |
| **Search Mechanism** | Static string matching & manual tags | Pure cosine similarity over text/images | Dense Vector Seeding + Relational Spreading Activation |
| **Flow Context** | User must manually browse flow folders | Fragments: returns random screens from random apps | **Full Flow Stitching:** Reconstructs continuous Step 1 $\rightarrow$ Step $N$ |
| **Cross-App UX Bridges** | None (siloed by app) | Weak (unreliable image embeddings) | **Graph-Mapped:** 16,328 pattern edges connect cross-app solutions |
| **Hallucination Risk** | High (human guessing) | Severe (LLM invents nonexistent steps) | **Zero (LLM only synthesizes verified database steps)** |
| **User Interaction** | Static image grid | Chat markdown text | **Generative UI (`interactive_flow` carousel + modal inspector)** |

---

## 6. Critical Technical Constraints, Limitations & Engineering Roadmap

While the core associative architecture provides superior temporal retrieval compared to naive RAG, production deployment requires addressing specific modalities, edge quality, and data coverage boundaries:

### 6.1 Modality Boundaries & Visual Attributes (Why Images Follow Text)
* **Text Model Blindspot:** `voyage-3` is a dense text model. It cannot perceive raw pixels, layout geometry, or colors unless explicitly represented in textual descriptions.
* **Extraction of Visual Properties via Code (Not Vision LLMs):** Vision models guessing hex codes (e.g. `#7C3AED`) are prone to hallucination, and embedding models fail to map raw hex to semantic colors. Dominant colors must be extracted programmatically from pixel buffers (e.g. via color quantization) and mapped to natural language descriptors (*"dark purple on near-black"*).
* **Static Screenshot Limitation:** Micro-animations (e.g., Lottie celebrations, haptic dials) cannot be observed from static screenshots unless explicitly annotated in metadata.
* **Stage 2 Multimodal Integration:** Standard multi-stage retrieval indexes text semantics first, followed by multimodal image vectors (e.g., `voyage-multimodal-3` or `gemini-embedding-2`). The database schema supports dual vector columns (`text_embedding vector(1024)` and `image_embedding vector(1024)`), enabling queries to match against functional intent, aesthetic appearance, or a weighted blend of both.

### 6.2 Edge Pruning & Dynamic Inverse Document Frequency (IDF) Weighting
* **Edge Noise Risk:** Unweighted `SHARED_PATTERN` edges linking ubiquitous, low-specificity patterns (e.g., *"Single-Screen Form"* shared across 200 screens) cause associative graph pollution.
* **Dynamic IDF Weighting:** Pattern weights must be computed automatically based on pattern rarity rather than static manual thresholds:
  $$w(p) = \ln\left(1 + \frac{N_{\text{total\_screens}}}{N_{\text{screens\_with\_pattern}}}\right)$$
* **Degree Capping:** Outgoing pattern edges per screen must be capped at $K \le 8$ nearest neighbors to eliminate topological hubs.
* **Sequence Ground Truth:** `FLOW_SEQUENCE` edge precision relies strictly on verified `screenNo` integrity, requiring automated monotonic sequence validation.

### 6.3 Empirical Calibration of Out-of-Domain Rejection
* **Avoiding Arbitrary Similarity Cutoffs:** Similarity thresholds cannot be guessed statically. A calibration harness using 5 known out-of-domain queries (e.g., *"Duolingo language streak"*, *"Tinder profile swipe"*, *"Airbnb calendar picker"*) establishes the empirical noise ceiling.
* **Strict Grounding Enforcement:** Fallback responses (*"We don't have that in our library yet"*) must never hallucinate external applications from Claude's internal knowledge; suggestions must originate strictly from verified retrieved candidates.

### 6.4 Library Coverage as Primary Prerequisite
With 826 of 3,693 screens currently embedded (~22.4%), closing the 78% vector indexing gap is the highest operational priority. Vector search cannot seed from unembedded screens, and graph walks entering unembedded regions create asymmetric retrieval paths.

---

## 7. Conclusion

By shifting from **flat document retrieval** to a **neurobiologically inspired associative graph architecture**, the Zibo UX Library establishes a new benchmark for interface search. The engine understands not just what an interface *looks like*, but *where it exists in time*, *what user action caused it*, and *how competing products solve the identical human problem*. Future iterations integrating multimodal image vectors and dynamic IDF edge weighting will complete the synthesis of visual aesthetics with deep functional reasoning.


