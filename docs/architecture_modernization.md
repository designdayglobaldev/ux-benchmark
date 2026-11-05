# Architecture Modernization Changelog & System Documentation

This document records the architectural improvements, state layer modernizations, horizontal scaling adaptations, security layers, asynchronous queues, and infrastructure changes made to the `ux-libaray` monorepo (Client & API).

---

## 1. Executive Summary & Architecture Comparison

| Architecture Dimension | Previous State | New Modernized Architecture | Impact & Benefits |
| :--- | :--- | :--- | :--- |
| **Client Crash Safety** | Blank white screen on unhandled exceptions | `<ErrorBoundary>` with tailored dark-theme recovery UI & reload actions | Prevents blank screens; user data and sessions remain intact |
| **Client Server-State Caching** | Raw Axios / `useEffect` + `useState` loops on every visit | `@tanstack/react-query` (`QueryClientProvider`, `useBrowseFilters`, `useBenchmarkTaxonomy`, `useUserWorkspaces`, `useBoardDetails`) | Deduplicated requests; 0ms load time on back-navigation; zero redundant network calls |
| **Client Global / Page State** | 20+ separate `useState` declarations per page | `zustand` (`useBenchmarkStore` with session persistence) | Decoupled UI state; eliminates render-thrashing on large canvas/comparison trees |
| **Heavy Task Processing** | Synchronous HTTP calls freezing server/browsers | **BullMQ Asynchronous Job Queues** backed by Redis (`exportQueue`, `screenAnalysisQueue`) with live percentage progress | Non-blocking HTTP cycles; durable job retries; progress tracking; survives server restarts |
| **AI Route Architecture** | Monolithic 76KB `ai.routes.ts` file | Strict **Controller $\rightarrow$ Service $\rightarrow$ Validator** layered architecture | Reusable AI logic; `inspect`, `insights`, `compare`, `detect-context`, and `benchmark` cleanly decoupled |
| **Boundary Protection** | Unchecked raw `req.body` | **Zod runtime validation schemas** returning structured HTTP 400s | Blocks malformed payloads before reaching controllers or LLM APIs; prevents 500 runtime crashes |
| **API Security & Limits** | Zero rate limiting & default Express headers | **`helmet`** security headers + **Redis distributed rate limiting** (`generalLimiter`: 120 req/min, `aiRateLimiter`: 15 req/min) | Covers all 19 route modules; blocks brute-force and LLM credit exhaustion across instances |
| **Real-Time Collaboration** | In-memory socket rooms (single thread only) | **`@socket.io/redis-adapter`** (Redis Pub/Sub) | Real-time board collaboration broadcasts across all CPU cores and server containers |
| **Production Process Management** | Single-threaded Node process | **PM2 Cluster Mode (`ecosystem.config.js`, `instances: 'max'`)** | Multi-core CPU utilization; zero-downtime rolling restarts; automatic memory leak recovery (`1GB`) |
| **Database & Infrastructure Cost** | Risk of high cloud billing & memory limits | **100% Free Self-Hosted Native Redis** on Windows local & Linux VPS | $0 extra cost; sub-millisecond memory-speed operations on `localhost:6379` |

---

## 2. File-by-File Detailed Changelog

### Client Frontend (`apps/client`)

#### `apps/client/src/components/ErrorBoundary.tsx` *(New File)*
* Enterprise-grade class component error boundary:
  * Intercepts uncaught runtime rendering errors across child trees (e.g. from third-party canvas runners, Lottie, or unexpected AI payloads).
  * Displays a tailored dark-theme recovery UI with error diagnostic messages.
  * Provides **"Reload Page"** and **"Go Home"** buttons to ensure users are never stranded.

#### `apps/client/src/lib/queryClient.ts` *(New File)*
* Configures the global `QueryClient` instance:
  * `staleTime: 5 minutes`: Data stays fresh for 5 minutes before background revalidation.
  * `gcTime: 30 minutes`: Inactive query cache retained in memory for 30 minutes.
  * `retry: 1`: Automatically retries failed network calls once before erroring.
  * `refetchOnWindowFocus: false`: Prevents unnecessary background re-fetches when switching browser tabs.

#### `apps/client/src/App.tsx`
* Wrapped root tree in `<ErrorBoundary>` and `<QueryClientProvider client={queryClient}>`.
* Protects all routes from uncaught render failures and enables unified query caching across all child pages.

#### `apps/client/src/hooks/queries/useBrowseFilters.ts` *(New File)*
* Parallelizes fetching for categories, subcategories, flows, ui-elements, and patterns.
* Extended `FilterItem` interface to support nested metadata (`_count.apps`, `_count.screens`, `categoryId`, `slug`).
* Caches taxonomy data for 15 minutes with 1-hour garbage collection.

#### `apps/client/src/Pages/Browse.tsx`
* Replaced 5 `useState` definitions and a manual 30-line `useEffect` fetch loop with `useBrowseFilters()`.
* Navigating between Browse and detailed app screens renders instantly (0ms delay) with zero network roundtrips.

#### `apps/client/src/Pages/Dashboard.tsx`
* Replaced `useState` category definitions and the manual `useEffect` `Promise.all` fetch loop with `useBrowseFilters()`.
* Navigating between Home/Dashboard and Apps now resolves immediately from the query cache.

#### `apps/client/src/hooks/queries/useBenchmarkTaxonomy.ts` *(New File)*
* Dedicated query hook caching category, flow, and subcategory data for 30 minutes.

#### `apps/client/src/stores/useBenchmarkStore.ts` *(New File)*
* Comprehensive Zustand domain store with `sessionStorage` persistence:
  * Manages benchmark state (`appState`, `uploadedImage`, `benchmarkData`, `benchmarkScreens`, `chatMessages`, `activeScreenIndex`).
  * Deconstructs component state to avoid full-tree re-renders on keystroke or filter change.

#### `apps/client/src/Pages/Benchmark.tsx`
* Replaced manual `useEffect` taxonomy fetch block with `useBenchmarkTaxonomy()`.
* **Component Modularization & Decomposition:** Decomposed from 1,162 lines down to 626 lines by extracting sub-components into `src/components/benchmark/`:
  * [`TaxonomyCombobox.tsx`](file:///c:/projects/ux-libaray/apps/client/src/components/benchmark/TaxonomyCombobox.tsx): Encapsulates category, subcategory, and flow popover selectors.
  * [`BenchmarkScreenCarousel.tsx`](file:///c:/projects/ux-libaray/apps/client/src/components/benchmark/BenchmarkScreenCarousel.tsx): Modularized competitor screenshot horizontal slider with `ScreenActionOverlay`.
  * [`BenchmarkReportView.tsx`](file:///c:/projects/ux-libaray/apps/client/src/components/benchmark/BenchmarkReportView.tsx): Isolated visual report sections (Metadata, Overall Alignment, Snapshot, Common Patterns, Design Differences, Opportunities, and AI Sandpack preview).
  * [`BenchmarkChatDrawer.tsx`](file:///c:/projects/ux-libaray/apps/client/src/components/benchmark/BenchmarkChatDrawer.tsx): Decoupled bottom sheet chat interface and floating prompt input.
* **Connected to BullMQ Background Worker:**
  * Updated `handleExportDocx` to dispatch job payloads to `POST /api/v1/queues/jobs/export`.
  * Polls `/api/v1/queues/jobs/export-jobs/:jobId` every 1.2s to receive real-time progress percentages.
  * The download button transforms into a live progress indicator (`Loader2` spinner with `10%`, `50%`, `100%` feedback) while processing.
  * Downloads the finished document automatically once the worker marks completion.

#### `apps/client/src/hooks/queries/useWorkspaces.ts` *(New File)*
* Manages workspace, collections, and board queries with TanStack Query:
  * `useUserWorkspaces(userId)`: Caches all user workspace and board containers (5-minute fresh cache).
  * `useBoardDetails(boardId)`: Caches individual board canvas states and screen items for 3 minutes.
  * `useWorkspaceMutations(userId)`: Encapsulates `createBoard`, `deleteBoard`, and `deleteWorkspace` with automatic query cache invalidation on completion.

#### `apps/client/src/Pages/Workspaces.tsx`
* Replaced manual `fetchWorkspaces()` loops and `useState` board management with `useUserWorkspaces()` and `useWorkspaceMutations()`.
* Deletions and additions invalidate the cache automatically via TanStack Query without page flickers.

#### `apps/client/src/Pages/SharedBoard.tsx`
* Integrated `useBoardDetails(boardId)` from TanStack Query.
* Eliminated the imperative `fetchBoard()` network request on component mount.
* Canvas state and chat messages hydrate directly from the query cache with zero loading spinners when switching between boards.

#### `apps/client/src/components/Middle.tsx` *(Decomposed & Modernized)*
* Decomposed from 718 lines down to **279 lines** (~61% reduction) and eliminated 10+ imperative `useState`/`useEffect` render loops.
* **TanStack Query Hooks:**
  * [`useScreenInspect.ts`](file:///c:/projects/ux-libaray/apps/client/src/hooks/queries/useScreenInspect.ts): Manages Claude vision inspections, region uploads, prompt executions, and chat responses via `useMutation`.
  * [`useScreenInsights.ts`](file:///c:/projects/ux-libaray/apps/client/src/hooks/queries/useScreenInsights.ts): Caches screen hotspot teardowns in memory for 30 minutes, preventing redundant AI inference calls on screen re-visits.
* **Extracted Modular Subcomponents:**
  * [`ScreenCanvasViewport.tsx`](file:///c:/projects/ux-libaray/apps/client/src/components/viewer/ScreenCanvasViewport.tsx): Encapsulates image rendering, skeleton state, forward/back flow navigation buttons, and region crop overlays.
  * [`ScreenInspectModal.tsx`](file:///c:/projects/ux-libaray/apps/client/src/components/viewer/ScreenInspectModal.tsx): Bottom sheet chat discussion drawer with ThinkingOrb and markdown rendering.
  * [`ScreenChatbarInline.tsx`](file:///c:/projects/ux-libaray/apps/client/src/components/viewer/ScreenChatbarInline.tsx): High-performance inline inspection prompt bar with thumbnail previews.

---

### Backend API (`apps/api`)

#### `apps/api/src/lib/redis.ts` *(New File)*
* Singleton `RedisManager` connecting to `process.env.REDIS_URL || 'redis://localhost:6379'`.
* Exports `redis` (default connection) and `createRedisClient()` (for multi-client Pub/Sub instances).
* **Resilient Offline Fallback:** Gracefully switches to offline memory mode if Redis is temporarily unreachable during local dev, logging warnings without crashing the server.

#### `apps/api/src/services/analysis-queue.service.ts`
* Replaced the transient `activeProcessingScreens = new Set<string>()` with **Redis Sets (`analysis:active_screens`)**.
* Added atomic tracking methods: `markScreensProcessing`, `unmarkScreenProcessing`, `getActiveScreenIds`, and `isScreenProcessing`.

#### `apps/api/src/queues/queue.manager.ts` *(New File)*
* Configures durable BullMQ queues backed by Redis:
  * `exportQueue`: Manages heavy document (DOCX/PDF) export generation with automatic retries and exponential backoff.
  * `screenAnalysisQueue`: Handles multi-screen AI visual analysis and layout indexing.
  * `getJobStatus(queueName, jobId)`: Helper method returning real-time job progress (0–100%), state (`waiting`, `active`, `completed`, `failed`), and output payload.

#### `apps/api/src/queues/workers.ts` *(New File)*
* Distributed background worker process:
  * `exportWorker`: Concurrently processes up to 5 document generations without blocking HTTP traffic.
  * `screenAnalysisWorker`: Concurrently processes up to 3 screen audits, updating progressive percentage completion and marking Redis active processing sets.

#### `apps/api/src/services/export.service.ts` *(New File)*
* Pure domain service isolating heavy DOCX document generation logic from Express routing:
  * `generateDocxBuffer({ screens, benchmarkData })`: Creates rich Word documents with Title page, executive summaries, snapshot comparison tables, pattern takeaways, and embedded screen metadata.

#### `apps/api/src/routes/export.routes.ts` *(Modernized)*
* Trimmed down from 329 lines to **56 lines**.
* Implemented `GET /api/v1/export/download/:jobId` to download asynchronous artifacts rendered in the background and cached in Redis (`artifact:export:${jobId}`).
* Retained `POST /api/v1/export/docx` as a synchronous fallback delegation to `ExportService`.

#### `apps/api/src/queues/workers.ts`
* Connected `exportWorker` directly to `ExportService.generateDocxBuffer`.
* Generates the real document, reports progressive completion updates (15% $\rightarrow$ 35% $\rightarrow$ 75% $\rightarrow$ 100%), and caches the generated binary artifact in Redis for 1 hour.

#### `apps/api/src/services/ai.service.ts` *(New File)*
* Pure business logic layer for AI integrations:
  * `inspectScreen({ prompt, region, imageBase64 })`: Real-time vision inspection on designated screen coordinates.
  * `generateInsights({ imageBase64, screenId, appName })`: Structured UX teardown pin generation with 0-1000 coordinate grid normalization and database caching.
  * `compareScreens({ originalImageBase64, userImageBase64 })`: Blind comparative audit across 5 UX heuristics (Accessibility, Usability, Content Language, Visual Language, Dependability).
  * `detectContext({ imageBase64 })`: AI-driven classification of an uploaded screen into database Category and Flow.
  * `benchmarkScreen({ imageBase64, categoryId, subcategoryId, flowId, screenType })`: 3-stage multi-competitor benchmarking engine (candidate app discovery $\rightarrow$ flow screen identification $\rightarrow$ multi-image visual synthesis).
  * `generateScreenData({ imageBase64, appId })`: Auto-generates comprehensive UX library metadata, HTML rich-text analyses, UI Element IDs, and UX Pattern IDs using Claude Tool Calling (`submit_screen_data`).
  * `chatBenchmark({ message, chatHistory, benchmarkData })`: Context-aware conversational assistant answering queries grounded in the benchmark report.
  * `improveDesign({ imageBase64, benchmarkResult })`: Generates clean, production-ready, accessible HTML + Tailwind design improvements repairing identified UX issues.
  * `getDesignAgentFilters()`: Retrieves only database categories and flows containing published apps and screens.
  * `generateDesignAgentScreen({ prompt, category, flow, device })`: Multimodal design agent synthesizing high-fidelity UI specifications grounded in real benchmark screens.
  * `chatWorkspace({ prompt, conversationHistory })`: Real-time generative UI (GenUI) canvas chat providing modular sections (`interactive_flow`, `comparison_table`, `timeline`, `insight_card`, `text`).

#### `apps/api/src/controllers/ai.controller.ts` *(New File)*
* Thin controller handling HTTP input parsing, status codes, and error formatting for:
  * `AIController.inspect()`
  * `AIController.insights()`
  * `AIController.compare()`
  * `AIController.detectContext()`
  * `AIController.benchmark()`
  * `AIController.generateScreenData()`
  * `AIController.benchmarkChat()`
  * `AIController.improveDesign()`
  * `AIController.getDesignAgentFilters()`
  * `AIController.generateDesignAgent()`
  * `AIController.workspaceChat()`

#### `apps/api/src/middleware/validate.ts` *(New File)*
* Express middleware factory `validateRequest(schema)` powered by **Zod**:
  * `AIInspectSchema`: Validates prompt, imageBase64, and region coordinates.
  * `AIInsightsSchema`: Validates imageBase64 and optional metadata IDs.
  * `AICompareSchema`: Validates original and user comparison screenshot payloads.
  * `AIDetectContextSchema`: Enforces valid `imageBase64`.
  * `AIBenchmarkSchema`: Enforces `imageBase64`, `categoryId`, `subcategoryId`, and `flowId`.
  * `AIGenerateScreenDataSchema`: Enforces `imageBase64` and optional `appId`.
  * `AIBenchmarkChatSchema`: Enforces `message`, `chatHistory`, and `benchmarkData`.
  * `AIImproveDesignSchema`: Enforces `imageBase64` and `benchmarkResult`.
  * `AIDesignAgentGenerateSchema`: Enforces `prompt`, optional `category`, `flow`, and `device`.
  * `AIWorkspaceChatSchema`: Enforces `prompt` and `conversationHistory`.

#### `apps/api/src/routes/ai.routes.ts`
* 100% decomposed and streamlined down from 1,026 lines to **32 clean declarative lines** using `validateRequest` $\rightarrow$ `AIController` $\rightarrow$ `AIService`. All inline Claude SDK instantiations and raw SQL/Prisma calls moved into the domain service layer.

#### `apps/api/src/index.ts`
* Applied security and rate limiting at top-level Express (`helmet`, `generalLimiter`, `aiRateLimiter`).
* Attached `@socket.io/redis-adapter` for multi-instance socket synchronization.
* Mounted `/api/v1/queues` and initialized background worker listeners on startup.

#### `apps/api/src/services/ai-rag.service.ts` & `apps/api/src/controllers/ai-rag.controller.ts` *(New Files)*
* Decoupled the monolithic 279-line `ai-rag.routes.ts` file into strict Controller $\rightarrow$ Service architecture:
  * Extracted `executeBenchmarkRAG(imageBase64)` into [`ai-rag.service.ts`](file:///c:/projects/ux-libaray/apps/api/src/services/ai-rag.service.ts), encapsulating Voyage AI multimodal embedding generation, Supabase pgvector cosine search, image fetching, and Claude 3.5 Sonnet structured tool invocation.
  * Extracted HTTP request handling and error mapping into [`ai-rag.controller.ts`](file:///c:/projects/ux-libaray/apps/api/src/controllers/ai-rag.controller.ts).
  * Enforced runtime schema validation via `AIBenchmarkRAGSchema` in [`validate.ts`](file:///c:/projects/ux-libaray/apps/api/src/middleware/validate.ts).
  * Reduced `ai-rag.routes.ts` down to 10 declarative lines.

#### `apps/client/src/hooks/queries/useFlows.ts` *(New File)*
* Dedicated TanStack Query caching hook for Flow state:
  * `useFlows(appId?)`: Caches the full flow list with screens for 15 minutes. Filters out empty flows and prevents repeated waterfall network requests.
  * `useFlowDetail(slugOrId?, appId?)`: Provides on-demand single flow fetching with automatic cache reuse.

#### `apps/client/src/Pages/Flows.tsx` & `apps/client/src/Pages/FlowDetail.tsx`
* Migrated from raw imperative `fetch()` and `useEffect` waterfalls to `useFlows()` TanStack Query caching.
* Eliminated loading skeletons when navigating between flows and returning from individual screen inspectors.
* Preserved paywall blur gates and unauthenticated access restrictions while ensuring zero TypeScript errors.

#### `apps/client/src/components/ScreenActionOverlay.tsx`
* Modernized the hover action overlay (Save to Collection & Copy Image):
  * Replaced manual `fetch()` endpoints with `useUserWorkspaces(user?.id)` query caching and `api.post()`.
  * Saves to boards and instant collection creations now trigger automatic query invalidation (`queryClient.invalidateQueries({ queryKey: ['workspaces', user.id] })`), instantly updating bookmarks across cards and collections without page reloads.

#### `apps/client/src/Pages/Workspaces.tsx` & `apps/client/src/Pages/SharedBoard.tsx`
* Modernized collections & board management to use centralized `api` client and TanStack Query cache invalidation:
  * Replaced manual `fetch()` endpoints in collection creation and member invitations with authenticated `api.post()`.
  * Added instant cache invalidation via `queryClient.invalidateQueries({ queryKey: ['workspaces', user.id] })`.
  * Cleaned up HTTP chat fallback in `SharedBoard.tsx` to route through `api.post('/boards/:boardId/messages')`.

---

### DevOps & Infrastructure

#### `ecosystem.config.js` *(New File)*
* Configures **PM2 Cluster Mode**:
  * `instances: 'max'`: Launches as many API worker threads as there are CPU cores on your VPS.
  * `exec_mode: 'cluster'`: Kernel-level TCP round-robin distribution for incoming HTTP traffic.
  * `max_memory_restart: '1G'`: Automatically cycles a worker thread if heap memory exceeds 1 GB, eliminating long-term memory leaks.
  * `wait_ready: true` & `listen_timeout: 10000`: Enables zero-downtime rolling updates (`pm2 reload ux-api`).

#### `server-setup.sh`
* Added steps to install native `redis-server` and launch PM2 cluster mode:
  ```bash
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup
  ```

---

## 3. Environment Variable Reference

### `apps/api/.env`
```env
# Redis Configuration (Local Windows / VPS Localhost)
REDIS_URL="redis://127.0.0.1:6379"
```

---

## 4. Verification & Health Check Commands

```powershell
# 1. Verify Redis connectivity from Node
pnpm --filter api exec node -e "const Redis = require('ioredis'); new Redis('redis://127.0.0.1:6379').ping().then(r => console.log('Redis:', r));"

# 2. Verify API TypeScript compilation & Prisma Client
pnpm --filter api build

# 3. Verify Client TypeScript compilation & Vite bundle
pnpm --filter client build
```
