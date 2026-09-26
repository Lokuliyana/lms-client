# Phase Workflow & Completion Protocol

## 1. Operating Cadence
For each phase in the roadmap:
1. **Analyze Phase Prerequisites**: Verify that all previous phases have passed their test gates.
2. **Implement Phase Scope**:
   - Define TypeScript interfaces and contracts under `src/services/contracts/`.
   - Implement mock dataset and storage methods under `src/services/mocks/`.
   - Implement custom React hooks under `src/hooks/`.
   - Build UI components and pages adhering strictly to `.agent/UI_GUIDELINES.md` under `src/components/` and `src/app/`.
3. **Execute Verification Gate**: Manually or programmatically confirm every bullet in the phase test checklist.
4. **Draft Phase Sign-Off**: Generate the Phase Completion Report and confirm with the user before starting the next phase.

---

## 2. Phase Execution Sequence

```
+---------------------------------------------------------------------------------+
|                         PHASE IMPLEMENTATION SEQUENCE                           |
+-------------------+-------------------+-------------------+---------------------+
| Phase 0:          | Phase 1:          | Phase 2:          | Phase 3:            |
| Design System &   | Dynamic Matrix &  | In-Place Visual   | Class & Batch       |
| App Shell         | Security Guards   | CMS Engine        | Management          |
+-------------------+-------------------+-------------------+---------------------+
          |
          v
+-------------------+-------------------+-------------------+---------------------+
| Phase 4:          | Phase 5:          | Phase 6:          | Phase 7:            |
| Meetings & Auto   | Assignments &     | Quiz Engine &     | Performance Radar   |
| Attendance        | Grading Pipeline  | 1v1 Arena         | & Analytics         |
+-------------------+-------------------+-------------------+---------------------+
          |
          v
+---------------------------------------------------------------------------------+
| Phase 8: Hardening, Mock/API Toggle & End-to-End Verification                   |
+---------------------------------------------------------------------------------+
```

---

### Phase 0: Soft-White Design Tokens & Next.js App Shell
- **Deliverables**:
  - Configure Tailwind with soft-white tokens, ambient shadows (`--shadow-soft`), and radius variables.
  - Install and configure shadcn/ui components customized for soft surfaces (Button, Card, Dialog, DropdownMenu, Table, Badge, Toast, Skeleton).
  - Implement environment configuration schema (`src/config/features.ts`) and Edge `middleware.ts` for module route interception.
  - Implement the app layout: soft-white canvas (`#F8FAFC`), sticky floating sidebar with rounded indicators, top bar with breadcrumb tracking, and user status profile menu.
- **Verification Gate**:
  - [ ] Set `NEXT_PUBLIC_FEATURE_QUIZZES=false`. Ensure quiz navigation links disappear and direct navigation to `/quizzes` returns a 404 rewrite.
  - [ ] The app shell matches the soft-white visual specification (diffused shadows, micro-borders, slate typography) on mobile (375px), tablet (768px), and desktop (1440px).

---

### Phase 1: Dynamic Permission Matrix & Security Guards
- **Deliverables**:
  - Data contracts: `Role`, `Permission`, `UserRoleAssignment`, `UserPermissionOverride`.
  - Implement `MockPermissionRepository` populated with default roles (Administrator, Teacher, Moderator, Student) and action codes.
  - Implement `usePermissions()` hook exposing `hasPermission(action, scopeId?)`.
  - Build `<PermissionMatrix />` component:
    - Soft-white card table with grouped module sections.
    - Checkbox selectors styled as pills with active blue-tinted micro-borders.
    - Global "Select All" batch toggle for each functional module.
  - Build `<PermissionGuard />` component to wrap restricted UI elements with fallback support.
- **Verification Gate**:
  - [ ] Revoke `classes.create` in the Matrix Grid. Verify class creation triggers instantly disappear or enter a disabled state without page reload.
  - [ ] Test scoped permissions: Grant `materials.delete` for `class-101` and deny for `class-202`. Ensure access evaluates true only when `classId: 'class-101'` is provided.

---

### Phase 2: In-Place Visual Customizer (CMS Engine)
- **Deliverables**:
  - Implement `EditModeContext` providing `isEditMode`, `toggleEditMode()`, and authorization check via `hasPermission('cms.edit')`.
  - Implement Route Handler `app/api/admin/content/route.ts` to read and write dot-notation keys in `lib/content-v2.json`.
  - Build `<EditableContent />` supporting dynamic HTML tags (`as` prop), raw/HTML rendering, and inline editing controls (Save/Cancel).
  - Build `<EditableImage />` with `react-easy-crop` integration in a soft-white modal to handle zoom, pan, aspect ratio enforcement, and base64/upload persistence.
- **Verification Gate**:
  - [ ] Log in as a user with `cms.edit` permission; verify the "Edit Mode" toggle appears in the top bar. Log in as a student; verify it is absent.
  - [ ] Turn on Edit Mode. Edit a headline and crop an image. Save changes and reload the browser; confirm modifications persist from `lib/content-v2.json`.

---

### Phase 3: Class & Batch Management Module
- **Deliverables**:
  - Entity models: `Class`, `Batch`, `ClassEnrollment`, `ClassApplication`.
  - Implement `IClassRepository`, `MockClassRepository`, and the `useClasses()` hook with cache-deduplication.
  - Build Class Catalog and Detail Views using soft-white cards showing batch schedules (Theory, Revision, Seminar), capacities, and pricing tags.
  - Build Class & Batch creation/edit modals guarded by `classes.create` and `classes.update`.
  - Build Student Enrollment Workflow: application modal, pending approval queue, and moderator Approve/Reject controls.
- **Verification Gate**:
  - [ ] Create a class with two batches (e.g., Sunday Morning Theory, Thursday Evening Revision).
  - [ ] Submit a student enrollment application.
  - [ ] As a moderator, approve the application. Confirm the student moves to active status and batch counts increment.

---

### Phase 4: Virtual Meetings & Automated Attendance Engine
- **Deliverables**:
  - Entity models: `ClassMeeting`, `AttendanceSession`, `AttendanceRecord` (`PRESENT`, `ABSENT`, `LATE`).
  - Implement `IAttendanceRepository`, `MockAttendanceRepository`, and `useAttendance()` hook.
  - Build Live Meeting Launcher displaying status badges, countdowns, and permission-guarded Join/Start buttons.
  - Build Attendance Workspace:
    - Interactive student grid supporting one-click manual status overrides (`P`, `A`, `L`) with soft pill tags.
    - Webhook Simulation Tool: Parses participant emails and elapsed minutes, automatically marking students `PRESENT` if duration exceeds the 50% threshold.
- **Verification Gate**:
  - [ ] Trigger the simulated Zoom webhook payload. Verify attendees with sufficient minutes are automatically marked `PRESENT`, while others are marked `LATE` or `ABSENT`.
  - [ ] Manually change an `ABSENT` student to `PRESENT` on the grid. Verify batch attendance statistics recalculate instantly.

---

### Phase 5: Assignments & Rubric Evaluation Pipeline
- **Deliverables**:
  - Entity models: `Assignment`, `AssignmentSubmission`, and `RubricCriterion`.
  - Implement `IAssignmentRepository`, `MockAssignmentRepository`, and `useAssignments()` hook.
  - Build Student Homework Portal: soft-well drop zones for files, URL submission inputs, and deadline status badges.
  - Build Evaluator Workspace:
    - Submissions queue with status filters (`SUBMITTED`, `EVALUATED`, `LATE`).
    - Split-screen grading drawer: submission preview, rubric scoring inputs (e.g., Content /50, Working /30, Clarity /20), feedback editor, and "Publish Grade" trigger.
- **Verification Gate**:
  - [ ] Submit an assignment past the due date. Confirm the submission displays an amber/red `LATE` pill.
  - [ ] Score each rubric criterion and publish the grade. Verify the student view displays the calculated score and evaluator feedback.

---

### Phase 6: Modular Quiz Engine & Lightweight 1v1 Arena
- **Deliverables**:
  - Entity models: `Quiz`, `QuizQuestion`, `QuizSubmission`, `ChallengeMatch`, `UserQuizStats`.
  - Implement `IQuizRepository`, `MockQuizRepository`, and `useQuizzes()` hook.
  - Build Single-Player Quiz Interface: timer countdown, question progress tracking, instant option selection, and score breakdown.
  - Build Powerup Strategy Engine:
    - `fifty_fifty`: Hides two incorrect options.
    - `extra_time`: Adds +20 seconds to the timer.
  - Build Lightweight 1v1 Challenge Arena:
    - Asynchronous match queue: Student A takes the quiz and posts a challenge to Student B.
    - Post-match comparison card calculating ELO rating updates ($\Delta ELO$).
- **Verification Gate**:
  - [ ] Start a quiz and activate `fifty_fifty`. Confirm two incorrect options are hidden from view.
  - [ ] Complete a 1v1 challenge match between two users. Verify the winner's ELO increases and the loser's ELO decreases according to the rating formula.

---

### Phase 7: Student Performance Radar & Analytics
- **Deliverables**:
  - Entity models for aggregated performance metrics: attendance rates, assignment completion, quiz averages, and ELO rankings.
  - Implement `IAnalyticsRepository` and `useAnalytics()` hook.
  - Build Performance Radar Chart visualizing multi-axis competencies (Consistency, Accuracy, Speed, Homework) using clean SVG curves.
  - Build Early Intervention Table highlighting students who fall below configurable safety thresholds (e.g., $<60\%$ attendance or missing homework).
- **Verification Gate**:
  - [ ] Add a mock student with low attendance and missing assignments. Verify their profile is flagged with an **At-Risk Warning** badge.
  - [ ] Verify that completing an assignment or quiz immediately updates the performance radar chart.

---

### Phase 8: Hardening, Repository Switch & Integration Review
- **Deliverables**:
  - Verify client adaptability by toggling `.env.local` feature flags and confirming interface stability.
  - Implement `src/services/repositoryFactory.ts` to switch between `MockRepository` and `HttpRepository` based on `NEXT_PUBLIC_USE_MOCK`.
  - Implement JSON Content Exporter to download all customized text and image mappings into a standalone `content-config.json`.
  - Execute full accessibility, responsiveness, and TypeScript checks across the entire codebase.
- **Verification Gate**:
  - [ ] Application compiles cleanly (`tsc --noEmit` and `npm run build`) with zero errors.
  - [ ] Setting `NEXT_PUBLIC_USE_MOCK=false` redirects data hook requests to the target API endpoints.

---

## 3. Definition of Done Checklist
A phase is complete only when all of the following requirements are met:
- [ ] UI strictly conforms to the soft-white, micro-border, and diffused shadow guidelines in `.agent/UI_GUIDELINES.md`.
- [ ] Every requirement is mapped to `.agent/REQUIREMENTS_MATRIX.md`.
- [ ] No hardcoded role strings exist (`role === 'teacher'`); all access is governed by dynamic permission codes.
- [ ] UI components interact exclusively with custom React hooks.
- [ ] Loading, Empty, and Error states are implemented for all data-driven views.
- [ ] Phase Verification Gate checklist has been tested and passed.
- [ ] Phase Completion Sign-Off report is generated.

---

## 4. Phase Completion Sign-Off Template

```markdown
### Phase Completion Sign-Off
- **Phase Completed**: [e.g., Phase 3 - Class & Batch Management]
- **Delivered Capabilities**: [List of built views, drawers, modals, and hooks]
- **Files Added/Updated**: [Relative paths to newly created or modified files]
- **Permissions Implemented**: [List of permission action strings registered]
- **State Validation Summary**: [Confirmation of loading, error, and empty states]
- **Test Gate Verification**: [Itemized confirmation of Phase Verification Checklist]
- **Open Questions / Assumptions**: [Any structural assumptions made during execution]
- **Next Phase Prerequisite**: [Dependencies verified before beginning subsequent phase]
```
