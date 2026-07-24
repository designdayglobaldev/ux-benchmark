# Database Schema Planner

## Overview
This document outlines the relational database schema required to power the UX Benchmark Platform, transitioning the unstructured data from the legacy Framer CMS into a robust PostgreSQL database managed by Prisma ORM.

---

## Data Models

### 1. `Category`
Broad classifications used to organize the catalog of applications (e.g., Finance, Productivity, Social Media).
*   **id**: `String` (UUID, Primary Key)
*   **title**: `String`
*   **slug**: `String` (Unique, for SEO-friendly URLs)
*   **description**: `String?` (Optional overview of the category)
*   **status**: `Enum(LIVE, DRAFT)`
*   **createdAt**: `DateTime`
*   **updatedAt**: `DateTime`

### 2. `App`
The core products being benchmarked (e.g., Revolut, Spotify).
*   **id**: `String` (UUID, Primary Key)
*   **categoryId**: `String` (Foreign Key -> Category)
*   **name**: `String`
*   **slug**: `String` (Unique)
*   **appLogo**: `String` (URL to logo image)
*   **appThumbnail**: `String` (URL to thumbnail image)
*   **status**: `Enum(LIVE, DRAFT)`
*   **isStaffPick**: `Boolean` (Editor's choice badge)
*   **sourceUrl**: `String?` (Link to actual app)
*   **description**: `Text?` (Main summary paragraph)
*   **platform**: `String[]` (e.g., ["iOS", "Android"])
*   **tags**: `String[]` (General tags like "Finance", "Management")
*   **palette**: `Json?` (Array of hex color codes)

**Deep Dive Analysis Fields (Tags & Paragraphs)**
*   **visualUiTags**: `String[]`
*   **visualUiText**: `Text?`
*   **experienceUxTags**: `String[]`
*   **experienceUxText**: `Text?`
*   **lookAndFeelTags**: `String[]`
*   **lookAndFeelText**: `Text?`
*   **easeOfUseTags**: `String[]`
*   **easeOfUseText**: `Text?`
*   **contentClarityTags**: `String[]`
*   **contentClarityText**: `Text?`
*   **trustTags**: `String[]`
*   **trustText**: `Text?`
*   **accessibilityTags**: `String[]`
*   **accessibilityText**: `Text?`
*   **takeawayText**: `Text?`

*   **createdAt**: `DateTime`
*   **updatedAt**: `DateTime`

### 3. `Flow`
A specific user journey within an app, grouping sequential screens (e.g., "Account Creation", "Checkout").
*   **id**: `String` (UUID, Primary Key)
*   **appId**: `String` (Foreign Key -> App)
*   **name**: `String`
*   **slug**: `String` (Unique)
*   **description**: `Text?`
*   **status**: `Enum(LIVE, DRAFT)`
*   **createdAt**: `DateTime`
*   **updatedAt**: `DateTime`

### 4. `Screen`
Individual screenshots capturing a specific state of an app.
*   **id**: `String` (UUID, Primary Key)
*   **appId**: `String` (Foreign Key -> App)
*   **flowId**: `String?` (Foreign Key -> Flow. Optional, as a screen might just be standalone)
*   **name**: `String` (e.g., "Welcome Modal")
*   **slug**: `String` (Unique)
*   **screenNo**: `Integer` (For ordering screens sequentially within a Flow)
*   **imageUrl**: `String` (URL to S3/Cloud Storage)

**Screen Analysis Fields (Fixed)**
*   **uxAnalysis**: `Text?`
*   **tonalityAndContent**: `Text?`
*   **keyHighlights**: `Text?`
*   **evidenceWhoWhy**: `Text?`
*   **whereToUse**: `Text?`
*   **whereNotToUse**: `Text?`
*   **similarApps**: `String[]` (Tags for Evidence — Who & Why, e.g., ["Monzo", "Duolingo"])

*   **status**: `Enum(LIVE, DRAFT)`
*   **createdAt**: `DateTime`
*   **updatedAt**: `DateTime`

### 5. `UiElement` (Tag)
Reusable structural tags applied to screens (e.g., "Tab Bar", "Progress Bar").
*   **id**: `String` (UUID, Primary Key)
*   **title**: `String`
*   **slug**: `String` (Unique)
*   **content**: `Text?` (Definition of the element)
*   **status**: `Enum(LIVE, DRAFT)`
*   **createdAt**: `DateTime`
*   **updatedAt**: `DateTime`

### 6. `Pattern` (Tag)
Reusable behavioral UX tags applied to screens (e.g., "Progressive Disclosure", "Deferred Authentication").
*   **id**: `String` (UUID, Primary Key)
*   **title**: `String`
*   **slug**: `String` (Unique)
*   **content**: `Text?` (Definition of the pattern)
*   **status**: `Enum(LIVE, DRAFT)`
*   **createdAt**: `DateTime`
*   **updatedAt**: `DateTime`

---

## Entity Relationships

1.  **Category (1) <---> (Many) App**: One Category can have many Apps. An App belongs to one Category.
2.  **App (1) <---> (Many) Flow**: One App can have many Flows.
3.  **App (1) <---> (Many) Screen**: One App can have many standalone Screens.
4.  **Flow (1) <---> (Many) Screen**: A Flow consists of multiple ordered Screens.
5.  **Screen (Many) <---> (Many) UiElement**: A Screen can feature multiple UI Elements, and a UI Element can appear on many Screens.
6.  **Screen (Many) <---> (Many) Pattern**: A Screen can feature multiple Patterns, and a Pattern can appear on many Screens.
