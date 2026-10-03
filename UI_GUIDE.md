# 00 — Current UI Audit: What's Actually Wrong (Screen by Screen)

This is based on the actual product screenshots, not just general "looks like a template" commentary. The uploaded design document you got was reasonably good at the design-system level, but it described the problems too generically — this audit names the exact thing wrong on each real screen, because you can't fix what you haven't precisely named. Colors and gradients are the *last* thing to fix, not the first — the real problems below are structural: information hierarchy, redundant data, broken empty states, inconsistent components, and a couple of things that look like outright bugs, not style choices.

---

## Global / Every Screen

- **Strict Scope Rule**: No new module, page, or nav entry gets built unless named in plan docs or explicitly approved by the user. Adhere strictly to the zero-loss rule without inventing unauthorized modules.
- **The logo is a low-resolution raster cartoon graphic** crammed above the nav with a long Sinhala tagline wrapped around it in a tiny font — it reads as a personal blog logo, not a platform mark. This needs a real, simple, vector wordmark before anything else about "enterprise" styling matters.
- **The sidebar user badge shows the raw email address** (`nallaperumadanidu@gmail.com`) as the primary identity label, with "Tap for account options" underneath in a tiny gray font that's easy to miss. No display name, no avatar photo, no role badge.
- **The admin sidebar mixes two different kinds of things in one list**: navigation destinations (*Home, Classes, Quizzes, Performance*) sit in the same visual list as an accordion of one-off admin actions (*Create class, Create recording, Create quiz, Enroll students, Papers Download*) under a "Quick Action" toggle. These are different mental categories — "where do I go" vs. "what do I do right now" — and mixing them forces the teacher to scan the whole sidebar every time.
- **Every button in the product is the same purple-to-blue gradient pill**, regardless of whether it's a primary action (Join Class), a destructive one (delete quiz — currently just a plain red trash icon, no confirmation visible), or a low-priority one (Browse Classes, Practice First). Enterprise UIs use exactly one strong primary style and reserve it for the one action per screen that matters most — everything else is a plain outline or ghost button.
- **There's a stray decorative gradient bar running along the very top edge of at least one page** (visible on the Class Detail screen) that appears to serve no purpose — no label, no content, just a thin pink-to-purple stripe. This reads as an unfinished/leftover element, not a design choice.

## Home Page

- **The hero photo treatment looks pasted-in, not designed**: two overlapping headshots of the same person at different crops, each with a soft drop shadow, floating over a stock-photo skyline background. There's no consistent art direction tying the photography to the rest of the brand.
- **The value-prop copy is a bulleted list of long, ragged Sinhala sentences** sitting next to short English lines ("Empowering Minds Through Modern Education") with mismatched line-height and no clear reading order — the eye doesn't know whether to read the Sinhala bullets or the English tagline first.
- **"Popular Classes" sits half-outside the hero's rounded card**, visually implying it's a separate, unrelated section, when it's actually the very next thing the user should look at.
- **Class card images are a flat gray-to-white gradient rectangle with zero course imagery** — every single class looks identical from the thumbnail alone; a parent or student scanning the catalog has no visual way to tell subjects apart besides reading text.
- **The class title is shown twice** — once as the card's bold heading, once again verbatim as the "subtitle" line directly underneath it. This is dead repeated text taking up vertical space for zero new information.
- **Subject tags ("science", "mathematics") are stuffed into small black pills** that sit awkwardly over the bottom-left corner of the placeholder image, low contrast, easy to miss.

## Class Detail Page

- **Four key stats (Duration, Batches, Format, Class Type) are each given a different pastel background color** (blue, green, purple, orange) with no shared meaning behind the color choice — it looks like four random highlighter colors rather than an intentional status or category system. A reader's eye is pulled to whichever box is brightest, not the one that's actually most important.
- **The empty recordings state is a dead end**: a lock icon and "No recordings available. Enroll or renew to access recordings." with no way to actually act from that screen (no visible "Enroll" button next to the message itself — the user has to look elsewhere on the page).
- **"Enroll for a previous month" uses a bare, unstyled text input labeled "Month"** instead of an actual month/date picker — nothing constrains what a person can type there, and it looks unfinished next to the polished stat boxes above it.
- **The right sidebar stacks four unrelated cards** (Join This Class, Enroll for a Previous Month, Class Schedule, Assignments Locked warning) with no shared visual rhythm — different border radii, different accent colors, different card weights — so it reads as four different widgets bolted together rather than one coherent "class info" panel.

## Quiz Catalog & Challenge Modal

- **"Your Challenges" stat cards (Pending Invites, Opponent Invites, Win Rate) sit directly above the quiz list** with no visual separation explaining why they're grouped together, and "Win Rate: 0%" for a new user reads as a failure state rather than "not started yet."
- **Every quiz card shows admin-only actions (Edit / Delete) directly beneath the student-facing "Take Quiz" button**, on what appears to be the same card component regardless of who's viewing it — a teacher and a student looking at the same catalog should not see the same card shape.
- **The "Challenge a friend" modal is a centered overlay that covers the whole page**, and one of its two panels — "Top performers" — is stuck permanently on a "Loading..." label. That's not just a layout issue, that's very likely a broken or missing API call and needs to be logged as a functional bug, not just redesigned.
- **"Practice first" and "Play solo" are given equal visual weight** (same size, similar button styling) even though they lead to meaningfully different outcomes (practice vs. a real ranked attempt) — nothing tells the student which one is the "default" expected action.

## Taking a Quiz

- **The actual question — the thing the student is there to read — occupies a narrow column in the center of the screen with large empty margins on both sides**, even on what's clearly a normal laptop-width viewport.
- **Answer options are plain hollow rounded rectangles containing only `(1)`, `(2)`, `(3)`, `(4)`** with no answer text inside the option itself — meaning the student has to keep looking up at a separate embedded image/table to know what each numbered option even refers to, then look back down to click. That's an unnecessary extra visual round-trip on every single question.
- **The bottom question-number palette (1 through 10) already exists**, but every number is rendered in the same plain white/gray style except the current one — there's no visual difference between a question the student has already answered and one they haven't touched yet, so the palette isn't actually doing its job as a progress map.

## Admin: Class Applications / Enrollment

- **Each class is rendered as a full repeated card containing its own mini student table inside it**, rather than one unified, filterable table — so scanning "who is enrolled where" means scrolling past a lot of repeated card chrome (icons, titles, headers) between each small handful of rows.
- **The student's email address is shown twice in the same row** — once under "Student" (where a name should be) and again under "Contact Info" — because there's no captured full name for most of these accounts, so email is standing in as the person's identity everywhere.
- **There are no inline quick actions on a student row** (no revoke access, no view-attendance shortcut, no view-payment-status) — every action requires navigating elsewhere.

## Admin: Quiz Builder

- **Fields are a plain top-to-bottom stack of full-width inputs** with no visual grouping beyond section headers — Question Type, Question Text, Image upload, and (further down, cut off) Explanation, all look like a single long form rather than a structured question-editing tool.
- **There is no live preview of how the question will actually look to a student** while it's being built, and no visible way to reorder questions by drag-and-drop — a teacher has to publish and then go look at the student view separately to check their own work.

## Performance Dashboard (the one screen that's already close to good)

- This screen is worth calling out as **the one piece of the product that's already reasonably close to an enterprise standard**: dense filter row, tabbed sections, clear stat cards, a real trend chart with a working tooltip. The main issues here are more minor — the two chart line colors (blue and purple) sit close enough to the brand's own gradient that they're slightly harder to tell apart at a glance than a more deliberately chosen categorical palette would be, and the four stat cards each use a different colored icon background with the same "different color per card, no shared meaning" issue seen on the Class Detail page.

---

# 01 — Design System Foundation

The design-system tokens in the plan you were given (Inter/Plus Jakarta Sans + Noto Sans Sinhala, 4px/8px grid, indigo primary, border-driven elevation) are genuinely solid choices for an enterprise SaaS look and are kept here. This file tightens them into concrete, enforceable rules so "enterprise" doesn't quietly drift back into "gradient pill everything" once implementation starts.

## Typography

- **Latin/numerals**: Inter or Plus Jakarta Sans, variable weight 400–700.
- **Sinhala**: Noto Sans Sinhala, line-height fixed at 1.6× the paired font-size everywhere it appears next to Latin text, to stop glyph clipping and the ragged mismatched-line-height problem seen on the current home page.
- **Type scale**: a fixed scale (e.g. 12/14/16/20/24/32px) used consistently — the current product mixes ad-hoc sizes (compare the oversized "Question 1" heading to the small stat-card labels next to it).
- **Never repeat the same string as both a heading and the line directly under it** (the class-card title/subtitle duplication) — if there's no distinct subtitle content, don't render a subtitle line.

## Color

- **Surfaces**: `#F8FAFC` app background, `#FFFFFF` panels.
- **Primary**: one deep indigo/violet (`#4F46E5` / hover `#4338CA`) — this replaces the purple-to-blue gradient everywhere. Gradients are dropped entirely from buttons and card chrome; reserve any gradient, if used at all, for a single hero/marketing moment, not for every interactive element in the product.
- **Status tokens** (and only these get colored backgrounds): Emerald = active/passed/present, Amber = pending/review/late, Rose = overdue/failed/absent, Slate = draft/inactive. This directly replaces the "four different pastel colors with no shared meaning" pattern seen on the Class Detail stat boxes and the Performance stat-card icons — every colored surface in the product must map to one of these four states, nothing is colored just for visual variety.
- **Neutral stat/metadata cards** (Duration, Batches, Format, Class Type and similar) get **one single neutral surface style** (white card, thin border, one icon color — slate or the primary indigo) rather than a different pastel per box.

## Elevation & Borders

- Replace soft spread box-shadows with `border: 1px solid` neutral-200 (neutral-800 in dark mode) plus a minimal `box-shadow: 0 1px 2px rgba(0,0,0,0.05)` only where a surface needs to visually lift off the page (modals, dropdowns) — not on every card.
- Drop the "card inside a card inside a padded sidebar frame" nesting — one level of card surface per section, not two or three layers of rounded rectangles.

## Buttons — strict hierarchy (this is the fix for "every button looks the same")

1. **Primary** (solid indigo, one per screen/section): the single most important action — Join Class, Save Attendance, Publish Quiz.
2. **Secondary** (outline, neutral border): supporting actions — Browse Classes, Practice First, Edit.
3. **Ghost/text** (no border, no fill): low-emphasis actions — Cancel, view-more links.
4. **Destructive** (outline or filled rose, always paired with a confirmation step): Delete Quiz, Revoke Access — never a bare icon-only trash button with no confirm step, which is what currently exists on the quiz list.

No button anywhere uses a gradient fill going forward.

## Iconography

- One icon set only (Lucide, matching what's already partially in use) at consistent stroke width and size per context (16px inline, 20px card headers). No mixing of emoji-style icons (the 🎓/📄 circular badges currently used on some headers) with line icons in the same view.

## Branding tokens (ties into the NexvoLearn white-label work)

- `primaryColor` / `accentColor` from `TenantSettings` map to CSS variables that drive the Primary button color and any brand-accent usage — never a hardcoded hex in a component.
- A real vector logo (SVG) is a required asset field in the branding config, not an inline raster image dropped into the sidebar markup.

---

# 02 — Screen-by-Screen Redesign Blueprint

This builds on the shell/navigation structure from the plan you were given (clean 56px topbar with tenant switcher + Cmd+K search; sidebar split into **Student Portal** vs. **Management Studio**, permission-gated per the RBAC work already planned) and fixes the specific gaps found in `00_UI_AUDIT.md` against the real screens.

```
+-----------------------------------------------------------------------------------------------+
| TOPBAR: [NexvoLearn logo] | Class Switcher | Cmd+K Search | [Bell] [Theme] [Avatar+Name]        |
+-------------------+---------------------------------------------------------------------------+
| SIDEBAR            | MAIN VIEWPORT                                                             |
| STUDENT PORTAL      |  Breadcrumbs                                                             |
| - Dashboard         |  [Primary Workspace]              [Info / Action Dock]                  |
| - My Classes        |                                                                           |
| - Quizzes           |                                                                           |
| - Attendance        |                                                                           |
| - Grades            |                                                                           |
| MANAGEMENT STUDIO*  |                                                                           |
| - Roster            |                                                                           |
| - Curriculum Builder|                                                                           |
| - Attendance        |                                                                           |
| - Gradebook         |                                                                           |
| - Branding Settings |                                                                           |
+-------------------+---------------------------------------------------------------------------+
* renders only for roles with the relevant permission (02_PERMISSIONS_MATRIX.md from the backend plan)
```

Sidebar quick-actions (Create Class, Create Quiz, etc.) move **out** of the nav list entirely and become a single "+ New" button at the top of the sidebar that opens a small menu — navigation and one-off actions are no longer the same visual list.

## Home & Class Discovery

- **Hero**: split Bento layout — left side is real typography (platform credibility line, batch announcements, verified student count) in one consistent reading order, no competing Sinhala-bullet-list-vs-English-tagline pattern; right side is a single "Next Upcoming Session" live widget (countdown, join button, materials checklist), not a floating photo collage. If instructor photography is wanted, it gets one consistently cropped, consistently lit headshot — not two overlapping crops with mismatched shadows.
- **Class cards**: real course banner imagery (or a generated, subject-coded placeholder pattern — not a flat gray gradient) with the category badge top-left. **Title appears once.** Metadata row uses small line icons for schedule/batch-size/format instead of a wall of text. Footer: price/entitlement status left, single primary CTA right (Join Live / Resume / Enroll — exactly one, chosen based on the viewer's actual relationship to the class).

## Class Detail Hub

- **70/30 split**: left pane is a tabbed workspace (Live & Stream, Recordings, Assignments & Notes, Quizzes) where the Recordings tab, when empty, shows the lock state **plus an inline "Enroll to unlock" primary button right there** — not a dead-end message with the actual action located elsewhere on the page.
- **Stat strip fix**: Duration/Batches/Format/Class Type become one unified row of small neutral cards (single background style, single icon color per `01_DESIGN_SYSTEM.md`) — not four different pastel boxes competing for attention.
- **Right dock**: one coherent "Class Info" card (not four stacked unrelated widgets) containing enrollment status/CTA, a real **month picker** (not a bare text input) for "enroll a previous month," the class schedule with countdown, and instructor contact — same border radius, same spacing rhythm throughout.
- Remove the stray top-edge gradient stripe entirely unless someone can identify an actual intended purpose for it (e.g. a loading-progress bar that's stuck in a permanent "in progress" state, which would itself be a bug to fix).

## Quiz Catalog & Pre-Flight

- Student and teacher **see different card components**, not the same card with extra buttons appended for staff. Teacher/admin cards get an overflow (`···`) menu for Edit/Delete; student cards show only what a student needs (subject, questions, time, difficulty, Take Quiz).
- "Your Challenges" stat row gets a clear section label and, for a first-time user, "Win Rate —" (an em dash / "Not started") instead of "0%," which currently reads as a failing grade rather than an empty state.
- **Pre-flight becomes a right-side sliding drawer**, not a full-page centered modal: top = quiz specs/rubric/time limit, middle = the student's own previous-attempt breakdown, bottom = two clearly differentiated CTAs — one solid primary ("Start Real Attempt") and one outline secondary ("Practice Mode") — not two same-weight buttons.
- **Fix the "Top performers" infinite loading state as a functional bug**, not a style pass — trace and repair the underlying data fetch before restyling this panel.

## Quiz-Taking — Focus Arena

- Hide the app sidebar/topbar during an active attempt; replace with a minimal top bar: question counter, countdown timer with a warning state near time-up, and a "Finish & Submit" action.
- **Split layout**: question figure/table/image pinned in a sticky left pane with zoom; **answer options rendered as full interactive cards containing the actual option text/content**, not bare numbered circles — this removes the look-up-look-down problem entirely, and adds keyboard shortcuts (`1`–`4` / `A`–`D`).
- **Upgrade the existing bottom question palette** (it's already there, it just isn't doing its job) so each number chip reflects real state: gray = unvisited, indigo/blue = answered, amber = flagged for review — rather than every chip looking the same except the current one.

## Management Studio — Roster, Gradebook, Attendance

- Replace the repeated-card-per-class-containing-a-mini-table pattern with **one real data table** (TanStack Table) with a class filter dropdown, search, sortable columns, and pagination — this is the single biggest fix for the Enrollment screen's current scrolling/scanning problem.
- **Require a captured full name at registration/application** and display that as the primary identity everywhere a person appears in a list (roster rows, attendance grid, gradebook) — email becomes secondary contact info shown in its own column, never doubling as the name.
- Add inline row actions (revoke access, view attendance, view payment status) via a row-level overflow menu instead of requiring navigation to a separate screen for every action.
- **Attendance**: roster-driven grid (auto-populated from the corrected enrollment source of truth from the backend plan) with single-click status toggles and a "Mark All Present" convenience action.
- **Gradebook / Exam Results**: inline-editable spreadsheet-style cells with Tab/Enter navigation, live-calculated class average/high/low as the teacher types, CSV/PDF export.

## Quiz/Question Builder

- Split-pane layout: left = the existing form fields, grouped into visually distinct sections (Details / Question / Options / Media) rather than one long stack; right = a **live preview pane** rendering exactly what the student-facing card and question-taking view will look like, updating as the teacher types.
- Add drag-and-drop reordering for the question list.

## Branding / Customization Admin Screen

- One screen (`/admin/settings/branding`) covering every `TenantSettings` field from the backend plan: platform name, instructor name, slogan, contact info, all asset uploads (logo — SVG required, favicon, hero banner, login illustration, avatar default), and the two theme color tokens with live-preview swatches next to each picker.

---

# 04 — Execution Roadmap

| Step | Scope | Key Deliverables | Verifies |
|---|---|---|---|
| **1. Shared Component Kit & Shell** | Global | `<Button>`, `<StatCard>`, `<DataTable>`, `<EmptyState>` built once; topbar + permission-gated Student Portal / Management Studio sidebar split replaces the mixed nav+actions list; real SVG logo in place; design tokens (`01_DESIGN_SYSTEM.md`) wired as CSS variables driven by `TenantSettings`. | No more gradient-pill-everything; no more nav/action mixing; branding pulled from config, not hardcoded. |
| **2. Assessment Focus Arena** | Quiz-taking | Rebuild `/quizzes/[id]/take` into the split sticky-question / full-text-option-card layout with keyboard shortcuts; upgrade the existing bottom palette to reflect answered/flagged/unvisited state; fix the "Top performers" broken fetch. | Options show real text, not bare numbers; palette communicates real progress; challenge modal no longer stuck loading. |
| **3. Class Hub & Discovery** | Learning Hub | Home Bento hero (single consistent photo treatment, one clear reading order); class cards with real imagery and a single title; Class Detail 70/30 split with unified stat strip, inline empty-state CTA, and a real month picker. | No duplicated titles; no four-mismatched-pastel-box stat strip; no dead-end empty states. |
| **4. Management Studio & Data Tables** | Teacher Admin | `<DataTable>` applied to Enrollment/Roster (replacing the repeated-card pattern), Attendance grid, and Gradebook; full-name capture added and used as primary identity in every list; row-level quick actions added. | Roster is one scannable table, not N repeated cards; names, not raw emails, are the primary label. |
| **5. Quiz/Question Builder** | Teacher Admin | Split-pane builder with grouped sections and a live student-facing preview; drag-and-drop question reordering. | Teacher can see what students will see without publishing first. |
| **6. Branding Admin Screen** | Platform Config | `/admin/settings/branding` finished/wired to every `TenantSettings` field with live color/asset preview (ties directly into the backend Phase 3 branding work). | Changing platform name/instructor/logo/colors updates the whole product with no code change. |
| **7. Motion & Polish** | Cross-cutting | Skeleton loading states (replacing raw "Loading..." text), smooth drawer/modal transitions, mobile-responsive pass. | No more bare "Loading..." labels anywhere; drawers/modals feel intentional, not abrupt. |

Each step follows the verification checklist in `03_AGENT_EXECUTION_RULES.md` §5 before moving to the next — no step is considered finished on visual appearance alone.
