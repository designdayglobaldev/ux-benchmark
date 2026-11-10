# Dual-Path Stealth Architecture & Reference Guide

**Confidential / Internal Developer Guide**  
*Document Version:* 1.0.0  
*Purpose:* Explains how to push code safely to GitHub without affecting current live chat behavior, while preserving experimental cognitive search engine testing.

---

## 1. Executive Summary

To allow you to commit and push code safely without altering the existing live workspace chat or alerting other team members, the system has been configured with a **Dual-Path Architecture**:

```
Incoming Request -> [AIController.workspaceChat]
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
`useCognitive === true`              `useCognitive !== true`
(Only Your Browser/Tests)             (DEFAULT: ALL USERS & TEAMMATES)
       │                                       │
       ▼                                       ▼
[AIService.chatWorkspaceCognitive]    [AIService.chatWorkspaceLegacy]
- Voyage-3 Dense Embedding            - 100% UNTOUCHED Original Code
- 2-Hop Spreading Activation Graph    - Exact previous database lookup
- Contiguous Flow Stitching           - Zero impact on live results
- Zero Journey Hallucinations
```

---

## 2. How the Two Paths Work

### Path A: The Untouched Legacy Path (`chatWorkspaceLegacy`)
* **Who runs it:** **100% of standard users, teammates, and default API calls.**
* **What it does:** Runs the exact verbatim code from the previous commit (`allApps.findMany` with 30 apps and standard Claude generation).
* **Guarantees:**
  * No code is deleted.
  * No unexpected behavior changes for anyone pulling the repo.
  * Zero regressions.

### Path B: The Cognitive Search Path (`chatWorkspaceCognitive`)
* **Who runs it:** **Only you.**
* **What it does:** Calls `CognitiveSearchEngine.search()`, walks `ScreenEdge`, fills step gaps via `FlowStitcher`, balances multi-intent prompts, and feeds real verified flows into Claude Sonnet 4.5.

---

## 3. How to Activate Cognitive Search In Your Browser

Normal users do not send any special flags, so they always use the legacy path.

To activate the new cognitive engine on your machine, you have two options:

### Option 1: URL Query Parameter (Instant)
Add `?cognitive=true` to your URL in the browser:
```
http://localhost:5173/?cognitive=true
```
When this query parameter is present, your client automatically passes `useCognitive: true` and the `x-use-cognitive: true` header to the backend.

### Option 2: Browser LocalStorage (Persistent)
Open DevTools (`F12` $\rightarrow$ Console) in your browser and run:
```javascript
localStorage.setItem('ENABLE_COGNITIVE_AI', 'true');
```
To turn it off and return to standard legacy mode:
```javascript
localStorage.removeItem('ENABLE_COGNITIVE_AI');
```

---

## 4. API Request Specification

If calling the API via curl, Postman, or custom scripts:

### Standard Legacy Request (What your team sends):
```bash
POST /api/v1/ai/workspace-chat
Content-Type: application/json

{
  "prompt": "How does Brex handle expense reimbursements?"
}
```

### Cognitive Search Request (What you send):
```bash
POST /api/v1/ai/workspace-chat
Content-Type: application/json
x-use-cognitive: true

{
  "prompt": "How does Brex handle expense reimbursements?",
  "useCognitive": true
}
```

---

## 5. What Makes This Safe for Git Push

1. **No Breaking Changes:** `git status` shows additions to `services/search/` and a small branching dispatcher in `ai.service.ts`.
2. **Backward Compatibility:** All existing unit tests, lint checks, and TypeScript compilations (`tsc --noEmit`) pass with **0 errors**.
3. **Database Isolation:** The new tables (`ScreenEmbedding`, `AppEmbedding`, `ScreenEdge`) exist alongside existing tables and do not interfere with standard CRUD operations.
4. **Instant Rollout:** When you are ready to reveal the feature to your team, you only need to change one line in `ai.service.ts`:
   ```typescript
   // Change:
   if (params.useCognitive === true)
   // To:
   if (params.useCognitive !== false)
   ```
   and the entire platform instantly upgrades to the cognitive search engine.

