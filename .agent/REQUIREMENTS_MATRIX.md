# Requirements & Traceability Matrix

| Requirement ID | Module / Area | Feature Description | Enforcing Permission | Feature Flag Gate | Primary Components |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-001** | Architecture | Client Feature Flag Isolation | None (System) | Standard `.env.local` | `middleware.ts`, `<FeatureGuard />` |
| **REQ-002** | Security | Dynamic Permission Matrix Grid | `roles.manage` | None (Core) | `<PermissionMatrix />`, `usePermissions` |
| **REQ-003** | Security | Scoped Action Guarding | Dynamic | None (Core) | `<PermissionGuard />` |
| **REQ-004** | CMS Engine | In-Place Text Editing | `cms.edit` | None (Core) | `<EditableContent />`, `EditModeContext` |
| **REQ-005** | CMS Engine | In-Place Image Cropping & Upload | `cms.edit` | None (Core) | `<EditableImage />`, `react-easy-crop` |
| **REQ-006** | CMS Engine | JSON Content File Persistence | `cms.edit` | None (Core) | `/api/admin/content/route.ts` |
| **REQ-007** | Classes | Multi-Batch Course Scheduling | `classes.read` | None (Core) | `useClasses`, `<ClassCard />`, `<BatchList />` |
| **REQ-008** | Classes | Course & Batch Creation Modal | `classes.create` | None (Core) | `<CreateClassDialog />` |
| **REQ-009** | Classes | Student Enrollment Management | `classes.enroll_manage`| None (Core) | `<EnrollmentQueue />`, `<ApplicationModal />`|
| **REQ-010** | Meetings | Zoom Meeting Launcher Card | `meetings.join` | `FEATURE_VIRTUAL_MEETINGS` | `<MeetingLauncher />`, `<ZoomEmbed />` |
| **REQ-011** | Attendance | Interactive Attendance Roster | `attendance.mark` | `FEATURE_ATTENDANCE` | `<AttendanceGrid />`, `useAttendance` |
| **REQ-012** | Attendance | Automated Webhook Duration Sync | `attendance.sync` | `FEATURE_ATTENDANCE` | `<ZoomWebhookSimulator />` |
| **REQ-013** | Materials | File Resource Sharing | `materials.read` | `FEATURE_MATERIALS` | `<MaterialViewer />`, `<UploadDialog />` |
| **REQ-014** | Assignments | Student Homework Submissions | `assignments.submit`| `FEATURE_ASSIGNMENTS` | `<SubmissionDropzone />`, `useAssignments`|
| **REQ-015** | Assignments | Multi-Criteria Rubric Grading | `assignments.grade` | `FEATURE_ASSIGNMENTS` | `<RubricGradingDrawer />` |
| **REQ-016** | Quizzes | Single-Player Timed Exam Engine | `quizzes.take` | `FEATURE_QUIZZES` | `<QuizRunner />`, `<TimerProgress />` |
| **REQ-017** | Quizzes | Powerup Strategy (50/50, +20s) | `quizzes.take` | `FEATURE_QUIZZES` | `<PowerupBar />` |
| **REQ-018** | Gamification | Async 1v1 Arena & ELO Rating | `arena.play` | `FEATURE_GAMIFIED_ARENA` | `<ChallengeArena />`, `<EloLeaderboard />` |
| **REQ-019** | Analytics | Multi-Axis Performance Radar | `analytics.view` | `FEATURE_STUDENT_ANALYTICS`| `<PerformanceRadar />`, `useAnalytics` |
| **REQ-020** | Analytics | Early Warning Intervention Flag | `analytics.view` | `FEATURE_STUDENT_ANALYTICS`| `<AtRiskAlertTable />` |
| **REQ-021** | Data Layer | Mock vs HTTP Repository Toggle | None (System) | `NEXT_PUBLIC_USE_MOCK` | `repositoryFactory.ts` |
| **REQ-022** | Deployment | Customized JSON Content Export | `cms.export` | None (Core) | `<ExportConfigButton />` |
