# Screen Upload, AI Queue & Incomplete Screen Recovery Documentation

This document explains the architecture, file locations, API routes, safeguards, deduplication, and recovery mechanisms for importing screens from Mobbin and processing UX analysis with Claude AI.

---

## 1. Quick File & Route Reference (For Future Developers)

### Backend Files (`apps/api/`)
| File | Role & Key Responsibilities |
| :--- | :--- |
| `src/controllers/mobbin.controller.ts` | Handles Mobbin MCP search/import, duplicate flow checks (HTTP 409), image downloading, watermark crop (8% width), Supabase upload, and initial background Claude AI queue. |
| `src/controllers/screen.controller.ts` | CRUD for screens + `getUnprocessedScreens`, `analyzeScreen`, and `batchAnalyzeScreens` methods. Excludes in-memory active jobs from query results. |
| `src/routes/screen.routes.ts` | Exposes `/api/v1/screens/unprocessed`, `/:id/analyze`, and `/batch-analyze` endpoints. |
| `src/routes/mobbin.routes.ts` | Exposes `/api/v1/mobbin/search` endpoint. |
| `src/services/analysis-queue.service.ts` | Shared in-memory `Set` tracker (`activeProcessingScreens`) preventing in-progress jobs from being shown as cut off. |

### Admin Frontend Files (`apps/admin/`)
| File | Role & Key Responsibilities |
| :--- | :--- |
| `src/features/screens/components/import-mobbin-modal.tsx` | UI modal to import screens from Mobbin. Includes `isSubmittingRef` lock to prevent double-clicks and toast guidance pointing to the Logs page. |
| `src/features/logs/index.tsx` | "Incomplete Screens" UI page. Lists screens missing AI data with pagination, individual "Analyze", and "Re-analyze Page" batch buttons. |
| `src/routes/_authenticated/logs/index.tsx` | TanStack route definition for `/logs`. |
| `src/components/layout/data/sidebar-data.ts` | Sidebar navigation definition; contains **Logs** dropdown right before **Help Center**. |

### Client Frontend Files (`apps/client/`)
| File | Role & Key Responsibilities |
| :--- | :--- |
| `src/components/Middle.tsx` | Main screen viewer component. Includes the cached image fix (`key` prop and `img.complete` verification) so back-arrow navigation never gets stuck on skeletons. |

---

## 2. API Endpoints Reference

### Screen Import & Analysis Endpoints
```http
POST /api/v1/mobbin/search
```
* **Payload:** `{ query: string, platform: string, searchType: "flow" | "screen", limit: number, appId: string, flowId: string }`
* **Responses:**
  * `200 OK`: `{ message: "Import successful", count: number, screens: Screen[] }`
  * `402 Payment Required`: Claude AI key has expired or has insufficient credits.
  * `409 Conflict`: Flow already exists with screens uploaded, or all screens have already been imported into this flow.

```http
GET /api/v1/screens/unprocessed?page=1&limit=20
```
* **Query Params:** `page` (number, default: 1), `limit` (number, default: 20)
* **Response:**
  ```json
  {
    "data": [ /* Screen objects */ ],
    "meta": {
      "total": 35,
      "page": 1,
      "limit": 20,
      "totalPages": 2
    }
  }
  ```
* **Note:** Automatically excludes any screen currently active in the background queue.

```http
POST /api/v1/screens/:id/analyze
```
* **Params:** `id` (Screen UUID)
* **Response:**
  * `200 OK`: `{ message: "Screen analyzed successfully", screen: Screen }`
  * `402 Payment Required`: Claude AI credits expired.

```http
POST /api/v1/screens/batch-analyze
```
* **Payload:** `{ screenIds: string[] }`
* **Response:**
  * `200 OK`: `{ message: "Batch analysis completed", results: [...], successfulCount: number, failedCount: number }`
  * **Short-circuit:** If Claude runs out of credits during the batch, stops immediately and returns the status of processed screens.

---

## 3. Two-Phase Pipeline Architecture

Importing flows and screens uses a **Two-Phase Architecture** to guarantee fast user response times and avoid HTTP timeout errors while running deep AI analysis:

```
[Admin UI: Import Modal]
         │
         ▼
[Phase 1: Fast & Synchronous (~2-4 seconds)]
  ├── 1. Validations & Duplicate Check (Reject with 409 if flow exists)
  ├── 2. Download Images (with automatic retry)
  ├── 3. Crop Watermarks (8% width proportional crop via Sharp)
  ├── 4. Upload to Supabase Storage
  └── 5. Create Screen Records in Database (DRAFT status)
         │
         ├─────────────────────────────────────────► Returns 200 OK to UI immediately!
         ▼
[Phase 2: Asynchronous Background Processing]
  ├── Registered in In-Memory Queue (analysis-queue.service.ts)
  ├── Hidden from Logs while in progress
  ├── Sequential Claude AI analysis calls
  ├── Schema-validated tagging (UI Elements + UX Patterns)
  ├── Update screen with deep UX analysis
  └── Auto Short-Circuit on Credit Depletion (Halts remaining queue)
```

---

## 4. Duplicate Prevention Safeguards

### A. Frontend Synchronous Button Lock
* **File:** `apps/admin/src/features/screens/components/import-mobbin-modal.tsx`
* Uses a `useRef` lock (`isSubmittingRef.current = true`) directly inside the click handler to block any rapid accidental double-clicks before React can trigger its next render cycle.

### B. Flow-Level Duplicate Rejection (HTTP 409)
* **File:** `apps/api/src/controllers/mobbin.controller.ts`
* If an admin selects a flow that already has screens and submits a `flow` import:
  * The server rejects the request immediately with an **HTTP 409 Conflict**:
    > *"This flow already has X screens uploaded! Cannot upload the same flow twice. Please select or create a different flow."*

### C. Image URL Deduplication
* **File:** `apps/api/src/controllers/mobbin.controller.ts`
* Deduplicates the raw array returned by Mobbin by image URL.
* Queries existing screens in the database to discard already-imported URLs.
* If all screens already exist, rejects the import to protect database integrity.

---

## 5. Image Download & Processing Reliability

* **Controlled Processing:** Images are downloaded and processed sequentially with controlled throughput rather than flooding external hosts concurrently, avoiding connection drops.
* **Auto-Retry with Backoff:** If an image download fails or flickers, `downloadImageWithRetry` in `mobbin.controller.ts` automatically retries before failing.
* **Proportional Watermark Cropping:** Crops 8% of the image width from the bottom edge using Sharp (`watermarkHeight = Math.floor(width * 0.08)`) to cleanly remove Mobbin watermarks across different screen resolutions.

---

## 6. Background AI Processing & Short-Circuit Safety

* **Pre-flight Credit Check:** Pings Claude with 1 token before beginning the import to verify that the Anthropic key has active credits.
* **Hallucination Protection:** Filters IDs returned by Claude against a `Set` of valid DB IDs for `uiElements` and `patterns` before calling `prisma.screen.update()`, preventing Prisma `P2025` foreign-key crash errors.
* **Credit Exhaustion Short-Circuit:**
  * If Claude runs out of credits midway (e.g. at screen 3 out of 10):
  * Catches `402`, `429`, or quota errors and **breaks the loop immediately**.
  * Prevents wasting server resources and flooding log files.
  * The remaining screens are safely preserved in the database with their images and flow associations intact.

---

## 7. Active Queue Tracking & "Logs & Incomplete" Recovery

### A. In-Memory Queue Tracker
* **File:** `apps/api/src/services/analysis-queue.service.ts`
* Exports:
  * `activeProcessingScreens`: A `Set<string>` containing IDs of screens currently in queue.
  * `markScreensProcessing(ids)`: Marks screens as active when an import starts.
  * `unmarkScreenProcessing(id)`: Removes a screen when its analysis finishes.
  * `clearScreensProcessing(ids)`: Clears remaining screens if a queue is halted.
* Screens in this set are **excluded from the `/unprocessed` endpoint**, so actively-processing screens are never shown as cut off.

### B. Admin Navigation: Logs Dropdown
* **File:** `apps/admin/src/components/layout/data/sidebar-data.ts`
* Located directly before **Help Center** in the Admin sidebar:
  * **Logs** (Dropdown)
    * ↳ **Incomplete Screens** (`/logs`)

### C. Incomplete Screens Page & 504 Timeout Safeguard
* **File:** `apps/admin/src/features/logs/index.tsx`
* **Features:**
  * Fetches incomplete screens from `GET /api/v1/screens/unprocessed`.
  * Full numerical pagination (`Previous`, `1`, `2`, `...`, `Next`) with items-per-page summary.
  * **Individual "Analyze" Button:** Re-runs Claude analysis for a single screen with live loading spinner (`POST /api/v1/screens/:id/analyze`).
  * **Sequential Client-Side Batch Processing (504 Timeout Prevention):**
    * Processing 20 screens in a single HTTP request takes ~80–100 seconds (Claude takes ~3–5s per screen), which inevitably triggers Nginx's `504 Gateway Time-out` (60s proxy timeout).
    * Rather than calling a long-running monolithic batch endpoint, the Admin UI iterates sequentially screen-by-screen calling `/api/v1/screens/:id/analyze`.
    * Each request takes ~3–4s, staying well within any gateway proxy limits.
  * **Live Progress Counter:** The batch button dynamically renders `Analyzing 3/20...` as each screen finishes.
  * **HTML / Non-JSON Error Detection:** Checks `res.headers.get('content-type')?.includes('application/json')` before calling `res.json()`, preventing `SyntaxError: Unexpected token '<'` when servers return HTML error pages (e.g. 504 Gateway Time-out or 502 Bad Gateway).
  * **Token Exhaustion Loop Interruption:** If any request returns `402` or token exhaustion, the batch loop breaks immediately, sets `setShowTokenError(true)`, and triggers the Anthropic billing dialog.
  * **Billing Alert Modal:** Dedicated red alert modal directing admins to `console.anthropic.com/settings/billing` if credits are still expired.

---

## 8. Flow Detail & Publishing Safeguards

### "Publish All DRAFT" Auto-Disable
* **Files:**
  * `apps/admin/src/features/flows/components/flow-detail.tsx`
  * `apps/admin/src/routes/_authenticated/apps/$appId/flows/$flowId.tsx`
* **Behavior:**
  * If a flow has screens and **none** of them are in `DRAFT` status (all are already `PUBLISHED`):
    * The **"Publish All DRAFT"** button is automatically disabled (`disabled={allPublished}`, `opacity-50 cursor-not-allowed`).
    * The button label changes dynamically to **"All Screens Published"** with a `Check` icon.
  * Prevents redundant bulk update API calls and provides clear visual confirmation of publication state.

---

## 9. End-User Client Cache Fix

* **File:** `apps/client/src/components/Middle.tsx`
* **Problem:** When users click the back arrow, the browser pulls the previous image from memory cache instantaneously, skipping the `onLoad` event and leaving the screen stuck on the skeleton loader.
* **Solution:**
  1. Added a unique `key={activeScreen?.id || activeScreen?.imageUrl || 'default'}` prop to the `<img />` tag to force React to remount the image element on navigation.
  2. Added an explicit `complete` property check inside `useEffect`:
     ```typescript
     const checkImage = () => {
       if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
         setIsImageLoaded(true);
       }
     };
     ```
     This guarantees that instantaneous cache hits immediately remove the skeleton loader.
