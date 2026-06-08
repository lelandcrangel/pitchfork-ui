# Pitchfork UI — Figma Kit Build Plan

A turnkey plan for building a Figma component library that mirrors the
`@pitchfork-ui/react` API, ready to publish to Figma Community alongside the npm
package.

**Goal:** designers can assemble screens in Figma using the same components,
variants, and tokens that engineers use in code — so design and build stay 1:1.

---

## 0. Guiding principles

- **Mirror the code, don't reinvent it.** Every Figma component variant should map
  to a real prop in the React API (`variant`, `size`, `tone`, state, etc.).
- **Tokens are the source of truth.** Build Figma Variables/Styles from the Style
  Dictionary tokens so a token change in code can be re-applied in Figma.
- **Auto Layout everywhere.** Components must resize like the CSS does (mobile-first,
  fills/hugs matching flex/grid behaviour).
- **Name to match.** Figma component + property names should read like the React
  props so the "Show code" mental model carries over.

---

## 1. Foundations — Variables & Styles (build first)

Recreate the token system as **Figma Variables** (preferred) grouped into collections.
Source of truth: `packages/tokens/src/tokens/*.json` → built to
`packages/tokens/dist/css/variables.css` and `dist/json/tokens.json`.

### 1a. Color collection (primitive)

From `color.json` → groups: `base`, `gray`, `brand`, `success`, `warning`, `danger`.

- Brand ramp is **Indigo** (`brand-600 = #4f46e5`). Build the full 50–900 ramp for
  each family.
- Create as a **"Primitives" variable collection**, one variable per step
  (e.g. `brand/600`, `gray/900`).

### 1b. Color collection (semantic) — with Light/Dark modes

From `color.semantic`: groups `background`, `text`, `border`, `action`, `status`.

- Create a **"Semantic" collection with two modes: `Light` and `Dark`.**
- Each semantic variable **aliases** a primitive (e.g.
  `semantic/action/primary` → `brand/700` in Light, `brand/600` in Dark).
- This is the single most valuable part of the kit: flipping the mode flips the
  whole design to dark, exactly like `[data-theme='dark']` does in CSS.
- Mirror the dark-mode overrides already defined in
  `packages/react/src/styles/theme.css` (the `[data-theme='dark']` block).

### 1c. Typography

From `typography.json`. Font family is **Geist** (fallback Inter).

- Create **Text Styles** for each size/weight/line-height combination used
  (display, headings, body, sm, xs, mono for `Kbd`/`CodeSnippet`).
- Embed Geist in the file; note the Google Fonts source in the cover page.

### 1d. Spacing, sizing, radius

From `size.json`.

- Spacing scale as number variables (`space/1`…`space/8`).
- Radius scale (`radius-sm`, `radius-md`, `radius-lg`, `radius-full`).
- Control heights (`sm 36`, `md 40`, `lg 48`) as variables for inputs/buttons.

### 1e. Elevation / shadow

From `shadow.json` → Figma **Effect Styles** (card, popover, overlay shadows).

### 1f. Breakpoints (documentation only)

Document the responsive breakpoints on the cover/foundations page:
`--sm 640px`, `--md 768px`, `--lg 1024px`. Mobile-first — base styles are mobile.

---

## 2. File & page structure

```
📄 Cover                      — kit name, version (track npm version), how to use
📄 Foundations               — color, typography, spacing, radius, elevation, icons
📄 Components / Forms         — Input, Textarea, Select, Combobox, MultiSelect,
                                 Checkbox, RadioButton, RadioGroup, Switch, Slider,
                                 NumberInput, DatePicker, DateRangePicker, FileUploader,
                                 RichTextEditor, Rating
📄 Components / Actions       — Button, ButtonGroup, UtilityButton, InlineCTA, Kbd
📄 Components / Display       — Badge, BadgeGroup, Tag, Avatar, AvatarGroup, Card,
                                 CreditCard, Metrics, EmptyState, Tooltip, Accordion,
                                 ContentDivider, CodeSnippet
📄 Components / Navigation    — Tabs, Breadcrumbs, Pagination, SidebarNavigation,
                                 HeaderNavigation, ProgressSteps, TreeView
📄 Components / Overlays      — Modal, SlideoutMenu, Popover, Dropdown, CommandPalette,
                                 Toast / Notification, Calendar
📄 Components / Feedback      — Alert, LoadingIndicators, ProgressIndicators, GaugeChart
📄 Components / Data viz      — LineChart, BarChart, AreaChart, PieChart, RadarChart,
                                 Heatmap, Sparkline, Table
📄 Components / Media         — VideoPlayer, Carousel
📄 Components / Layout        — PageHeader, SectionHeader, SectionFooter
📄 Patterns                   — Login, Settings, Pricing cards, Multi-step wizard,
                                 Checkout, Dashboard card, Data table
📄 Changelog                  — mirror packages/react/CHANGELOG.md
```

Group components into Figma **Sections** within each page for tidy browsing.

---

## 3. Component build order (by leverage)

Build base/atomic components first — they become nested instances in everything else.

### Tier 1 — Atoms (build + perfect these first)

- **Icon** — bring in the icon set (FA regular subset + custom SVGs: chevrons,
  plus, minus, magnifying-glass, triangle-exclamation; see `Icon.tsx` `customIcons`).
  Build as a single component with an icon-swap property.
- **Button** — variant: `primary | secondary | ghost`; size: `sm | md | lg`;
  state: `default | hover | focus | disabled`; boolean `fullWidth`; optional
  leading/trailing icon slots.
- **Badge** — variant: `neutral | brand | success | warning`.
- **Tag**, **Kbd**, **Avatar** (with status dot), **Switch**, **Checkbox**,
  **RadioButton**.

### Tier 2 — Form controls (use the FieldWrapper pattern)

Build a shared **Field** wrapper component (label + description + error slot,
matching `.pf-field`), then compose:

- **Input**, **Textarea**, **Select**, **Combobox**, **MultiSelect**,
  **NumberInput** (with ± steppers), **Slider**, **Rating**.
- States to cover: `default | focus | filled | invalid | disabled`.

### Tier 3 — Composite & containers

- **Card** (+ Header/Content/Footer slots), **Accordion**, **Alert**,
  **Tabs** (`underline | pills`, `sm | md`), **AvatarGroup**, **BadgeGroup**,
  **ButtonGroup**, **Breadcrumbs**, **Pagination**, **ProgressSteps**.

### Tier 4 — Overlays (document open state as frames)

- **Modal**, **SlideoutMenu**, **Popover**, **Dropdown**, **CommandPalette**,
  **Toast/Notification**, **DatePicker/DateRangePicker/Calendar**.
- Overlays can't truly "float" in Figma — represent each as a frame showing the
  open state, plus an annotation describing trigger + dismiss behaviour.

### Tier 5 — Data viz & media

- Charts (**Line/Bar/Area/Pie/Radar/Heatmap/Sparkline/GaugeChart**), **Table**,
  **VideoPlayer**, **Carousel**. These are mostly static illustrative components —
  build representative examples rather than full theming machinery.

---

## 4. Variant property conventions

Match Figma component-property names to React props exactly:

| React prop      | Figma property                                             | Example values                          |
| --------------- | ---------------------------------------------------------- | --------------------------------------- |
| `variant`       | `Variant`                                                  | `primary`, `secondary`, `ghost`         |
| `size`          | `Size`                                                     | `sm`, `md`, `lg`                        |
| `tone` / status | `Tone`                                                     | `info`, `success`, `warning`, `danger`  |
| (interaction)   | `State`                                                    | `default`, `hover`, `focus`, `disabled` |
| `fullWidth`     | `Full width` (boolean)                                     | on / off                                |
| icon slots      | `Leading icon` / `Trailing icon` (boolean + instance swap) | —                                       |

Use **boolean + instance-swap** properties for optional icons/slots so designers
toggle them like props.

---

## 5. Patterns page

Recreate the Storybook `Patterns/` compositions as ready-to-drop frames, each at
mobile (375px) and desktop (≥768px) widths to show the responsive behaviour:

- Login form, Settings page (tabs + form), Pricing cards (3-tier, recommended
  highlighted), Multi-step wizard (modal + ProgressSteps), Checkout form (live
  CreditCard preview), Dashboard card, Data table.

These double as marketing screenshots for the Community listing.

---

## 6. Publishing checklist (Figma Community)

- [ ] Cover art (1920×960) — show a few hero components + the brand indigo.
- [ ] Title: "Pitchfork UI — React + Figma design system".
- [ ] Description links to: npm package, Storybook (lelandrangel.com/pitchfork-ui),
      GitHub repo.
- [ ] Tag the file version to match the npm version at publish time (currently 0.8.0).
- [ ] Enable Light/Dark mode demo on the cover page.
- [ ] Verify all Text/Color/Effect styles are published (not local-only).
- [ ] Restrict editing; provide a "Duplicate to edit" note.

---

## 7. Maintenance / keeping it in sync

- When tokens change in `packages/tokens`, re-derive the Figma Variables (the
  values live in `dist/css/variables.css`).
- When a component gains a variant in code, add the matching Figma property.
- Bump the Figma file version alongside each npm minor/major release; mirror the
  changelog entry on the Changelog page.
- **Optional automation:** explore the Figma REST API / a Style-Dictionary Figma
  Variables export to script the token sync rather than hand-editing.

---

## Reference — source of truth in this repo

- Components: `packages/react/src/components/*` (one folder each, 65 total)
- Public API surface: `packages/react/src/index.ts`
- Tokens (primitives + semantic + dark mode): `packages/tokens/src/tokens/*.json`
  and the `[data-theme='dark']` block in `packages/react/src/styles/theme.css`
- Icons: `packages/react/src/components/Icon/Icon.tsx` (`customIcons` + FA regular)
- Live reference: Storybook at `lelandrangel.com/pitchfork-ui`
- Patterns to recreate: `apps/docs/src/patterns/*.stories.tsx`
