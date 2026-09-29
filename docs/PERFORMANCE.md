# Performance & Egress Optimization

This document outlines key performance bottlenecks and the solutions implemented to resolve them, serving as a guideline to prevent similar issues in the future.

## Supabase Egress Spike (September 2026)

### The Problem
The application experienced a massive 39 GB Supabase bandwidth egress spike despite having only a few active users. 
Analysis of the Supabase dashboard confirmed that **95%+ of the egress** was coming from the **Shared Pooler (Database egress)**, whereas Storage (images) only accounted for ~4%.

The root cause was a combination of two factors:
1. **Unoptimized Prisma Queries:** API controllers (specifically `/apps` and `/apps/:id`) were using Prisma's `include` to fetch full relations. Because the `App` and `Screen` models contain extremely large rich-text fields (e.g., UX analysis, deep dives, accessibility texts), this resulted in multi-megabyte JSON payloads being transferred for every simple list view.
2. **Aggressive React Query Refetching:** The frontend (both Client and Admin) was using React Query with default settings (`staleTime: 0` and `refetchOnWindowFocus: true`). Every time a user switched tabs (e.g., to copy data or check a reference) and switched back to the app, React Query silently re-fetched the massive multi-megabyte JSON payloads in the background.

### The Solution

#### 1. Strict Prisma `select` Queries
To prevent large text blobs from being sent over the wire when they aren't needed, we replaced `include` with `select` in the heavily trafficked endpoints.

- **`getAllApps`:** Now explicitly selects only the fields required to render the app grid (e.g., `id`, `name`, `slug`, `appThumbnail`, `tags`), completely omitting the deep-dive text fields.
- **`getAppById` (Similar Apps):** The sub-query that fetches 3 similar apps at the bottom of the details page was optimized to only pull their thumbnails and basic info, dropping their nested screens and UX analysis.

*Rule of Thumb for Future Development:* 
**Never use `include` on the `App` or `Screen` models for list views.** Always use `select` to specify exactly which fields the frontend interface requires.

#### 2. Relaxed React Query Caching
To stop the aggressive background refetching loops, React Query's global defaults were updated in both `apps/client/src/main.tsx` and `apps/admin/src/main.tsx`.

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Prevent refetch loop on tab switch
    },
  },
})
```

*Rule of Thumb for Future Development:*
**Avoid `refetchOnWindowFocus: true`** unless the data is highly collaborative or changes by the second. A `staleTime` of at least 5 minutes is recommended for this content-heavy application.

### AI Features Note
During the investigation, the AI endpoints (`/inspect`, `/insights`, `/compare`, etc.) were also audited. They were cleared of causing the egress because:
- They inherently use optimized `select` queries.
- They are manually triggered by explicit user actions, preventing them from falling into background refetch loops.
- Storage egress (downloading images for AI processing) remained well within expected limits (~200 MB).

## Phase 2: Deep Component Optimizations (Admin & Relationships)

### The Problem
Even after adjusting React Query settings and the primary app endpoints, egress remained unacceptably high due to secondary relationships:
1. **Admin Form Dropdowns:** Admin forms (e.g. creating a new Screen or App) required simple `id` and `name` pairs to populate `<select>` inputs. However, the components were requesting the root list endpoints (`/api/v1/apps`, `/api/v1/categories`, etc.), which downloaded the **entire relational tree** of every entity into memory.
2. **Cascading Relational Includes:** Endpoints like `getAllFlows` and `getCategoryById` were using deep `include` statements for their children (e.g. `include: { apps: { include: { screens: true } } }`). A single request to a Category would blindly download every app, every screen, and all massive AI rich-text analysis blocks for those screens.

### The Solutions

#### 1. "Lite" Mode for Dropdowns
We introduced a `?lite=true` query parameter to the major collection endpoints (`/apps`, `/flows`, `/categories`, `/subcategories`, `/ui-elements`, `/patterns`). 
- When activated, the API uses a highly restrictive `select` to return only `{ id, name }` or `{ id, title }`. 
- **Admin frontend consumers** were updated to append this parameter when populating comboboxes and selects.

#### 2. Eliminating Cascading Relational Includes
We strictly replaced `include` with precise `select` configurations on nested relations:
- `getCategoryById` now explicitly selects only lightweight metadata and thumbnails for its `apps` array, rather than fetching full app objects.
- `getAllFlows` now selects only the core metadata of its associated `screens`, omitting the heavy `uxAnalysis` and `tonalityAndContent` fields.

#### 3. Server-Side Pagination for Heavy Collections
The `getAllScreens` endpoint previously returned all database screens in one massive array. 
- It was upgraded to support server-side pagination, accepting `page`, `limit`, and `search` queries.
- The response was restructured to `{ data, meta }` with a default `limit` of 50.
- The Admin UI table was updated to handle the new paginated data structure and offload search filtering directly to the database.

### The Results
Automated browser testing confirmed that these structural changes successfully resolved the remaining egress issues:
- **Payload Reductions:** Responses for `/api/v1/apps`, `/api/v1/categories`, and `/api/v1/flows` via `lite=true` plummeted from multi-megabyte JSON trees down to **under 2 KB**.
- **Pagination Savings:** The `/api/v1/screens` endpoint now transfers a manageable ~2.5 KB per page load instead of dumping the entire table.
- **Cache Integrity:** Returning to the tab after browsing elsewhere triggers **0 duplicate requests** across all tested endpoints.

### Client Application Impact (End Users)
Because the Client application shares the same REST API and global React Query configuration as the Admin panel, the Phase 1 & 2 optimizations automatically cascaded to end users:
- **Category & Browse Pages:** When an end user browses categories on the Client, the backend now exclusively returns lightweight app thumbnails via `select` (stripping out deep screens and heavy rich text). This cuts the initial dashboard payload size by over 90%.
- **Zero-Friction Tab Switching:** End users often switch between the Client app and other resources (like their own design tools). Thanks to the `staleTime` and `refetchOnWindowFocus` updates in `apps/client/src/main.tsx`, users no longer trigger massive background re-fetches every time they refocus the browser tab. 
- **Faster Load Times:** Because the database isn't doing heavy relational joins for massive text blobs during simple grid navigation, the Time-To-First-Byte (TTFB) for end users is significantly improved.

## Phase 3: Image Egress Optimization

### The Problem
After optimizing API payloads, network analysis revealed that the application was still transferring up to **95.4 MB of data** on image-heavy pages (like the Dashboard, Browse, or Admin grids).
The root cause was rendering raw, high-resolution PNGs (often 1-2 MB each) directly inside grids.

### The Initial Attempt: Supabase Transformations
We initially utilized Supabase's built-in Image Transformation endpoint (`/render/image/public/`) to resize and convert images to WebP on the fly. 
**However, this hit a critical bottleneck:** Supabase limits free projects to only 100 origin images for transformations. Once the limit was hit, all transformations were blocked and the site crashed on local environments while trying to download the massive original files.

### The Permanent Solutions

#### 1. Client-Side Image Compression (Admin Panel)
To prevent new massive images from ever entering the database, we implemented native HTML5 `<canvas>` compression inside `apps/admin/src/lib/supabase.ts`.
- **How it works:** When an admin selects an image to upload, the browser draws the image to an invisible canvas, resizes it to a maximum width of **800px**, and exports it as a **WebP at 80% quality**.
- **Safeguard:** It checks if the new WebP file is mathematically smaller than the original upload. If it is, only the tiny WebP is sent to the Supabase bucket.

#### 2. Historical Data Migration Script
To fix the 2,300+ massive PNG files already sitting in the database, we wrote a one-time Node.js migration script (`apps/api/src/scripts/migrate-images.ts`) using the `sharp` library.
- It crawled the database for any `.png` or `.jpg` screens.
- It downloaded, compressed, and converted them to WebP (saving 80-90% file size per image).
- It re-uploaded the `.webp` files alongside the originals in the bucket, and safely updated the database URLs.

### The Results
We measured the impact of these changes on the most image-heavy components (Dashboard, AppAllScreens, Benchmark, and Admin grids) using DevTools Network tabs:
- **Total Payload (Images):** On an 11-image page load, total image resources plummeted from **~4.8 MB** (unoptimized PNGs) to just **~82.2 KB** (WebP).
- **Average Image Size:** Dropped from **~450 KB - 1.4 MB** to **~15 KB - 60 KB** (an 80-90% reduction per image).
- **Zero Cost:** By permanently squashing the source files in the bucket and compressing on the client-side, we entirely bypassed the need for paid 3rd-party Image CDNs or Supabase Image Transformation quotas.

## Phase 4: Caching Strategy (Why No Redis)

### The Decision
During our performance scaling, we evaluated whether to implement a shared server-side caching layer like **Redis** to offload database queries. We deliberately chose **NOT** to implement Redis at this scale. 

### Why We Deferred Server-Side Caching
Introducing a Redis cache adds significant architectural complexity (cache invalidation pipelines, memory management, and synchronization across the Admin and Client apps). For our current scale, we've chosen to defer a shared cache by combining browser-level caching with highly optimized database queries.

Our current approach relies on two layers:

#### 1. Client-Side Caching (React Query)
We cache data directly in the user's browser using `@tanstack/react-query`. 
*Note: This is not a replacement for server-side caching—every new visitor still hits the API and database. However, it significantly cuts down repeat requests from a single user.*
- **Global `staleTime`:** Set to 5 minutes (`5 * 60 * 1000`). If a user navigates away and returns within 5 minutes, the browser instantly loads the data from memory.
- **The Staleness Tradeoff:** Because of the 5-minute cache, a screen an admin just uploaded might take up to 5 minutes to appear for a user who already loaded the list. This tradeoff is acceptable for our current UX. *(Note: The Admin panel doesn't use React Query and fetches fresh data on every page load, so admins never see stale data themselves).*
- **Tab Focus Syncing Disabled:** We set `refetchOnWindowFocus: false` to prevent massive cascading network requests every time a user switches between browser tabs (a common workflow when comparing UI designs).

#### 2. Lean Database Queries
- By enforcing strict Prisma `select` statements and `lite=true` flags, our API responses shrunk from multi-megabyte JSON payloads to a few kilobytes. 
- A simple, indexed query of a tiny payload executes fast enough without a shared cache that we haven't needed one.

### The Intermediate Step (HTTP Caching)
If we need a shared cache before investing in Redis, our natural next step is **HTTP Caching** (e.g., `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`) on our read-only API list endpoints. Served through a CDN or edge network, this provides a shared cache with minimal infrastructure overhead and no complex invalidation pipelines. 
*Note: HTTP caching with `s-maxage` only works for public data that is the same for everyone. Endpoints that vary by user or authentication status would need to be excluded or use `private`.*

### When to Re-evaluate
We will reconsider server-side caching (Redis or Edge caching) if we observe any of the following triggers:
- **Connection Pool Exhaustion:** Database connection errors or maxed-out pool limits (ensuring Supabase's connection pooler is properly configured).
- **Latency Spikes:** p95 API latency consistently rises above 300ms (Current baseline: ~100-150ms).
- **Expensive Queries:** The database slow query log shows repeated, expensive queries that cannot be optimized with indexes.
- **Sustained High CPU:** Database CPU utilization consistently exceeds 80-90% during spikes in concurrent users.
