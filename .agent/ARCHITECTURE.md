# Technical Architecture & Next.js Implementation Contracts

## 1. Directory Structure

```
├── .agent/                             # Antigravity operating contracts & guides
│   ├── AGENT.md                        # Master operating contract
│   ├── RULES.md                        # Coding standards & business rules
│   ├── WORKFLOW.md                     # Phase roadmap & verification gates
│   ├── ARCHITECTURE.md                 # System architecture & component rules
│   ├── REQUIREMENTS_MATRIX.md          # Traceability matrix
│   └── UI_GUIDELINES.md                # Soft-white visual card specification
├── public/                             # Public static assets & uploads
├── lib/
│   └── content-v2.json                 # Target JSON store for visual CMS edits
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── api/
│   │   │   └── admin/
│   │   │       └── content/route.ts    # JSON content persistence handler
│   │   ├── classes/
│   │   ├── attendance/
│   │   ├── assignments/
│   │   ├── quizzes/
│   │   ├── analytics/
│   │   ├── settings/
│   │   │   └── permissions/page.tsx    # Dynamic Permission Matrix UI
│   │   ├── layout.tsx                  # Root layout (soft-white background)
│   │   └── page.tsx                    # Main dashboard
│   ├── config/
│   │   ├── env.config.ts               # Zod validation schema for .env.local
│   │   └── features.ts                 # Central Feature Flag helper
│   ├── context/
│   │   ├── AuthContext.tsx             # User session & active scopes
│   │   ├── PermissionContext.tsx       # Dynamic Permission evaluation engine
│   │   └── EditModeContext.tsx         # In-place visual CMS state & handler
│   ├── components/
│   │   ├── ui/                         # shadcn/ui primitives (soft-white styled)
│   │   ├── editable/                   # EditableContent & EditableImage
│   │   ├── guards/                     # FeatureGuard & PermissionGuard
│   │   ├── matrix/                     # PermissionMatrix grid table
│   │   └── shell/                      # Soft-white Sidebar, Header, Breadcrumbs
│   ├── hooks/                          # Reusable data hooks with caching
│   │   ├── usePermissions.ts
│   │   ├── useClasses.ts
│   │   ├── useAttendance.ts
│   │   ├── useAssignments.ts
│   │   ├── useQuizzes.ts
│   │   └── useAnalytics.ts
│   └── services/
│       ├── contracts/                  # TypeScript interfaces for all domains
│       ├── mocks/                      # In-memory realistic databases with latency
│       ├── http/                       # Production REST API clients (Axios/Fetch)
│       └── repositoryFactory.ts        # Switches Mock vs HTTP via NEXT_PUBLIC_USE_MOCK
├── middleware.ts                       # Edge middleware for route protection
├── tailwind.config.ts                  # Soft-white color tokens & ambient shadows
└── tsconfig.json
```

---

## 2. Server vs Client Component Boundary Rules
1. **Server Components (`RSC`)**:
   - `app/**/layout.tsx`: Root layout, sidebar frame, and document title metadata.
   - `app/**/page.tsx` (Root level): Static page definitions and initial SEO metadata.
2. **Client Components (`"use client"`)**:
   - Everything inside `src/components/editable/*` (requires event listeners and inline editors).
   - Everything inside `src/components/matrix/*` (dynamic permission checkboxes).
   - Everything inside `src/components/guards/*` (inspects client context).
   - Interactive views: Live meeting launcher, quiz timer runner, rubric grading drawer.

---

## 3. Data Flow & Repository Factory Pattern

All custom hooks import their data adapters through `src/services/repositoryFactory.ts`. This allows switching the application between mock data and a live REST API by changing `NEXT_PUBLIC_USE_MOCK` in `.env.local`.

```
[View / Component] (Soft-white card surface)
│
▼
[Custom React Hook] (e.g., useClasses()) -> Handles in-memory cache & UI states
│
▼
[repositoryFactory.ts]
├── IF NEXT_PUBLIC_USE_MOCK=true  ──> [MockClassRepository] (Simulated latency)
└── IF NEXT_PUBLIC_USE_MOCK=false ──> [HttpClassRepository] (Axios/Fetch to REST API)
```

### Universal Hook Contract Structure
Every hook must conform to this pattern to minimize redundant network roundtrips:
```typescript
interface DataHookResult<T, TMutate="any"> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  revalidate: () => Promise<void>;
  mutate: (payload: TMutate) => Promise<void>;
}
```

---

## 4. In-Place CMS Architecture & Persistence Route

The visual customizer uses a Next.js Route Handler to persist modifications to `lib/content-v2.json`.

```
[User clicks Save on <EditableContent/>]
       │
       ▼
[EditModeContext.updateContent(key, value)]
       │
       ▼
[POST /api/admin/content]
  Payload: { key: "dashboard.hero.title", value: "New Title" }
       │
       ▼
[Route Handler (node:fs/promises)]
  1. Reads lib/content-v2.json
  2. Traverses and updates the key using dot-notation
  3. Writes back to disk via fs.writeFile()
       │
       ▼
[Response 200 OK] -> State updates immediately across all mounted components
```
