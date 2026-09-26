# Visual Design System: Soft-White Minimal Card Architecture

## 1. Design Philosophy: "Clean Paper & Soft Surfaces"
The interface mimics high-end tactile stationery and editorial web applications (e.g., Linear, Notion, Raycast). Avoid harsh black borders, high-contrast dark lines, saturated gradients, or complex glassmorphism. Use multi-layered soft-white surfaces, warm zinc/slate neutrals, delicate micro-borders, and diffused, pillowy shadows.

---

## 2. Color Palette & Surface Hierarchy

```
[ Viewport Background: #F8FAFC (slate-50) / #FBFBFD (warm snow) ]
│
▼
[ Layer 1: Base Card (#FFFFFF) with 1px border (#F1F5F9) & shadow-soft ]
│
▼
[ Layer 2: Inset Card / Inner Field (#F8FAFC) with border (#E2E8F0) ]
│
▼
[ Layer 3: Interactive Hover / Active States (#F1F5F9 -> #FFFFFF + shadow-md) ]
```

### Color Tokens (Tailwind HSL Mapping)
* **Canvas / Body Background**: `hsl(210, 40%, 98%)` (`#F8FAFC`) — A calm, soft-white canvas that ensures white cards stand out.
* **Surface Card (Level 1)**: `hsl(0, 0%, 100%)` (`#FFFFFF`) — Pure white with subtle micro-borders and soft ambient elevation.
* **Sub-Surface / Wells (Level 2)**: `hsl(210, 20%, 97%)` (`#F8FAFC`) — Recessed areas, table headers, code blocks, and input fills.
* **Muted Element Borders**: `hsl(214, 32%, 91%)` (`#E2E8F0`) — Primary card and separator boundary.
* **Hairline Inner Borders**: `hsl(210, 40%, 96.1%)` (`#F1F5F9`) — Internal structural dividers.
* **Text - Primary Heading**: `hsl(222, 47%, 11%)` (`#0F172A`) — Deep ink slate for high legibility without raw `#000000` harshness.
* **Text - Body / Secondary**: `hsl(215, 16%, 47%)` (`#64748B`) — Neutral slate for descriptions and labels.
* **Text - Tertiary / Placeholder**: `hsl(215, 20%, 65%)` (`#94A3B8`) — De-emphasized metadata, timestamps, and search hints.

### Accent & Semantic Status Palette
* **Primary Brand Accent**: `hsl(221, 83%, 53%)` (`#2563EB`) — Modern Royal Blue.
  * Soft Tint Surface: `hsl(214, 100%, 97%)` (`#EFF6FF`)
  * Subtle Tint Border: `hsl(217, 91%, 91%)` (`#DBEAFE`)
* **Success / Present**: `hsl(158, 64%, 52%)` (`#10B981`)
  * Soft Background: `hsl(152, 76%, 97%)` (`#ECFDF5`)
  * Border: `hsl(149, 80%, 90%)` (`#D1FAE5`)
* **Warning / Late / Needs Attention**: `hsl(38, 92%, 50%)` (`#F59E0B`)
  * Soft Background: `hsl(48, 100%, 96%)` (`#FFFBEB`)
  * Border: `hsl(48, 96%, 89%)` (`#FEF3C7`)
* **Destructive / Absent / Danger**: `hsl(0, 84%, 60%)` (`#EF4444`)
  * Soft Background: `hsl(0, 100%, 97%)` (`#FEF2F2`)
  * Border: `hsl(0, 93%, 94%)` (`#FEE2E2`)

---

## 3. Shadows, Elevations & Radii

Avoid harsh, high-opacity CSS drop shadows. Use diffused, multi-stop ambient lighting:

```css
/* Tailwind Custom Configuration Extensions */
--shadow-soft-xs: 0 1px 2px 0 rgba(15, 23, 42, 0.03);
--shadow-soft:    0 2px 4px -1px rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.03);
--shadow-soft-md: 0 4px 6px -1px rgba(15, 23, 42, 0.04), 0 10px 24px -3px rgba(15, 23, 42, 0.05);
--shadow-soft-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.04), 0 20px 32px -4px rgba(15, 23, 42, 0.06);
--shadow-glow:    0 0 0 1px rgba(37, 99, 235, 0.1), 0 4px 14px 0 rgba(37, 99, 235, 0.12);
```

### Corner Radii

* **Large Containers / Panels / Modals**: `rounded-2xl` (`16px` to `20px`).
* **Standard Cards / Tables / Sheets**: `rounded-xl` (`12px` to `14px`).
* **Interactive Controls (Inputs, Buttons, Badges)**: `rounded-lg` (`8px` to `10px`).
* **Status Tags / User Avatars / Pills**: `rounded-full` (`9999px`).

---

## 4. Reusable Soft Card Component Patterns

### Pattern A: Standard Content Card (`<Card />`)

```tsx
<div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-[0_2px_4px_-1px_rgba(15,23,42,0.04),0_4px_12px_-2px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_6px_-1px_rgba(15,23,42,0.04),0_10px_24px_-3px_rgba(15,23,42,0.05)] hover:border-slate-300/80 transition-all duration-200 ease-out">
  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
    <h3 className="text-base font-semibold text-slate-800 tracking-tight">{title}</h3>
    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">{badge}</span>
  </div>
  <div>{children}</div>
</div>
```

### Pattern B: Inset Metric Card / Well

```tsx
<div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
  <span className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">{metric}</span>
  <span className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">{delta}</span>
</div>
```

### Pattern C: Soft-White Table Pattern

* Table wrappers must be styled with `bg-white border border-slate-200/80 rounded-2xl shadow-soft overflow-hidden`.
* Header columns (`<th>`) must use `bg-slate-50/75 text-slate-600 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 border-b border-slate-100`.
* Rows (`<tr>`) must alternate gently using `hover:bg-slate-50/60 transition-colors duration-150 border-b border-slate-100/80 last:border-none`.

---

## 5. Visual State Guidelines: Loading, Empty & Error

Every card or list component must implement the four states using soft-surface treatments:

```
+-----------------------------------------------------------------------------------+
| LOADING STATE                                                                     |
| • Background: bg-white border border-slate-100 rounded-2xl p-6                    |
| • Elements: Skeleton pulses (bg-slate-100 animate-pulse rounded-lg)               |
+-----------------------------------------------------------------------------------+
| EMPTY STATE                                                                       |
| • Background: bg-white border border-dashed border-slate-200 rounded-2xl p-12    |
| • Elements: Centered slate-100 circle with slate-400 icon, soft gray title,       |
|   and a primary action button                                                     |
+-----------------------------------------------------------------------------------+
| ERROR STATE                                                                       |
| • Background: bg-rose-50/50 border border-rose-100 rounded-2xl p-6                |
| • Elements: Soft red warning banner with human-readable guidance and retry button|
+-----------------------------------------------------------------------------------+
```

---

## 6. Dynamic In-Place CMS Styling (`<EditableContent/>` & `<EditableImage/>`)

* **Idle Hover Indicator**: Dashed micro-border `border border-dashed border-blue-400/80 bg-blue-50/30 rounded-lg p-1 transition-all`.
* **Pencil Badge**: Micro-pill positioned at `-top-2.5 -right-2.5` with `bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-soft-xs flex items-center gap-1`.
* **Inline Editor**: Clean input with `bg-white border border-blue-500 ring-2 ring-blue-50 rounded-lg text-slate-900 text-sm px-2.5 py-1.5 focus:outline-none`.
