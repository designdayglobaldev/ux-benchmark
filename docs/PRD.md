# Product Requirements Document (PRD)

## Project Overview
The UX Benchmark Platform is an internal and public-facing dual application designed to catalog, analyze, and benchmark top-tier user experiences across the software industry. It replaces a legacy Framer-based CMS with a bespoke, scalable stack.

## Architecture
The platform is built as a monorepo containing:
1. **Client App (`apps/client`)**: The public-facing Vite/React frontend where users can browse UX teardowns.
2. **Admin Panel (`apps/admin`)**: A Vite/ShadcnUI React dashboard where content creators input apps, screens, flows, and tag UI patterns.
3. **API / Backend (`apps/api`)**: A Node.js Express server to handle database operations (PostgreSQL + Prisma) and serve data to the frontends.

## Core Features & Workflows

### 1. App Library & Directory
- **Cataloging**: Ability to add software applications (e.g., Revolut, Dropbox, Notion).
- **Categorization**: Grouping apps into distinct categories like Finance, Productivity, or Social.
- **Deep Dives**: Storing overarching analysis for an app (Visual UI summary, Experience UX summary, Color palettes).

### 2. Screen & Flow Analysis
- **Flow Teardowns**: Content creators can group screens into sequential "Flows" (e.g., "Onboarding", "Checkout", "Password Reset") to document a user's journey.
- **Screen Uploads**: Individual screenshots are uploaded, ordered, and analyzed.
- **Analysis Fields**: Each screen contains fields for:
  - UX Analysis
  - Tonality / Content Strategy
  - "Where not to use" (Actionable advice)
  - Similar App References

### 3. Taxonomy & Tagging System
- **UI Elements**: Tagging structural components present in a screen (e.g., Tab Bar, Hero Illustration, Sidebar).
- **Patterns**: Tagging behavioral UX patterns present (e.g., Progressive Disclosure, Guided Tour, Deferred Authentication).
- This tagging enables powerful search capabilities, allowing users to query "Show me all Onboarding flows that use Progressive Disclosure".

## Target Audience
- **Primary**: Product Designers, UX Researchers, and Product Managers looking for industry benchmarks and inspiration.
- **Secondary**: Developers and stakeholders looking to understand best-in-class UX patterns.

## Success Metrics
- Successful migration of all existing Framer CMS data.
- Ability to quickly search and filter screens by UI Elements and Patterns.
- Seamless creation of new Flows via the new Admin Panel.
