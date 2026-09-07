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
The root cause was rendering raw, high-resolution PNGs (often 1-2 MB each) directly inside tiny 200px thumbnail grids. Although the HTTP cache prevented infinite loops on re-renders, the initial download of 100+ raw PNGs instantly exhausted bandwidth limits.

### The Solutions

#### 1. Supabase Image Transformations (WebP)
We utilized Supabase's built-in Image Transformation endpoint (`/render/image/public/`) instead of the standard storage endpoint (`/object/public/`).
By appending `?width=400&quality=80&resize=contain&format=webp` to the URLs, we forced the CDN to perform server-side resizing and convert the images to the highly-efficient WebP format.

#### 2. Reusable `OptimizedImage` Component
We upgraded the `OptimizedImage` helper component to intercept standard Supabase URLs and automatically apply the transformation parameters based on the component's rendered size.
- **Context-Aware Sizing:** Small thumbnails request `width=100`, while larger cards request `width=400` or `width=600`.
- **Original Quality Preserved:** Full-screen views and inspectors bypass the component, ensuring original pixel-perfect quality is always available.
- **Layout Safety:** We fixed a layout bug by ensuring `OptimizedImage` correctly wraps its `<img>` and `<Skeleton>` tags inside a `<div>` when a `containerClassName` is provided. This ensures that sizing and clipping (like `rounded-[20px]`) function correctly without stretching the image.

#### 3. Targeted Lazy Loading
We implemented the `loading="lazy"` attribute by default for all images below the fold, preventing the browser from requesting hundreds of images simultaneously.
A `priority` prop was added to eagerly load only the first few images visible "above the fold" using `fetchpriority="high"`.

### The Results
We measured the impact of these changes on the most image-heavy components (Dashboard, AppAllScreens, Benchmark, and Admin grids) using DevTools Network tabs:
- **Total Payload (Images):** On an 11-image page load, total image resources plummeted from **~4.8 MB** (unoptimized PNGs) to just **~82.2 KB** (WebP).
- **Average Image Size:** Dropped from **~450 KB - 1.4 MB** to **~2 KB - 15 KB** (a >98% reduction per image).
- **Number of Requests:** Initial page loads now only trigger requests for the visible fold, successfully deferring off-screen content.
- **Visual Integrity:** All layouts, aspect ratios, and rounded corners (thanks to the `className` wrapper fix) were perfectly preserved without distortion.
