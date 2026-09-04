# Authentication & Feature Locking System

## Overview
BenchmarX uses a combination of visual masking and route-level protection to implement a "Freemium" preview model. Unauthenticated users are allowed to explore a limited subset of the platform (the first 4 apps, or the first 6 flows) to understand the value of the product before being prompted to create an account. 

## 1. Visual Gating (Frontend UI)
On index pages like the **Library (Dashboard)** and the **Flows** page, all available items are fetched, but the UI artificially restricts what is fully visible and clickable.

- **Data Slicing:** The `.map()` function slices the dataset (e.g., `apps.slice(0, 8)` or `flows.slice(0, 6)`) for unauthenticated users, preventing the rendering of the entire database.
- **Blurring & Disabling:** Items beyond the "free tier" threshold (e.g., index 3 and above) receive specific CSS classes: `pointer-events-none select-none`. This prevents users from clicking them.
- **Paywall Overlay:** An absolutely positioned overlay acts as a frosted glass shield over the disabled items. It uses a `mask-image: linear-gradient` to progressively blur the bottom of the grid, accompanied by a call-to-action (CTA) button redirecting to the `/register` page.

*Files involved:* `src/Pages/Dashboard.tsx`, `src/Pages/Flows.tsx`

## 2. Route-Level Protection (AppProtectedRoute)
Visual gating alone is insufficient, as tech-savvy users could inspect the DOM or guess the URL to bypass the blurred UI (e.g., directly navigating to `/app/locked-app/screens`).

To prevent this, the `AppProtectedRoute` component acts as a strict gatekeeper for all detailed app routes (`/app/:slug`, `/app/:slug/flows`, `/app/:slug/screens`).

### How `AppProtectedRoute` Works:
1. **Fetch State:** It pulls the current authentication state via `useAuth()` and the global list of apps via `useApps()`.
2. **Whitelist Verification:** If the user is unauthenticated, the component extracts the `slug` of the first 4 apps returned by the API (representing the "free tier").
3. **Enforcement:** It compares the requested URL `:slug` against the whitelisted slugs. 
4. **Redirection:** If the requested app is **not** in the top 4, the user is immediately redirected to the `/register` page via React Router's `<Navigate>` component.
5. **Pass-through:** If the user is logged in, or if the requested app is in the free tier, the component renders its children normally.

*Files involved:* `src/components/Layout/AppProtectedRoute.tsx`, `src/App.tsx`

## 3. Modifying the Free Tier Limits
If you ever want to change how many apps or flows are available for free (e.g., increasing the free apps from 4 to 6), you must update the thresholds in three places to ensure consistency between the visual UI and the route protector:
1. **`Dashboard.tsx`**: Adjust the array slice length and the blur index threshold.
2. **`Flows.tsx`**: Adjust the array slice length and the blur index threshold.
3. **`AppProtectedRoute.tsx`**: Change `apps.slice(0, 4)` to the new desired threshold.
