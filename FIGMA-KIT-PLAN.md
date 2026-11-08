# Pitchfork UI — Figma Kit Build Plan

A turnkey plan for building a Figma component library that mirrors the
`@pitchfork-ui/react` API, ready to publish to Figma Community alongside the npm
package.

**Goal:** designers can assemble screens in Figma using the same components,
variants, and tokens that engineers use in code — so design and build stay 1:1.

**This plan predates the elements.** It is written against
`@pitchfork-ui/react`, which is in retirement. The components to mirror are the
**108 custom elements** in `packages/elements`; `elements.json` is the API to
build from, and the component lists in sections 3 and 5 below need rereading
against it. The token work in section 1 is unaffected, because both layers read
the same tokens.

---

## Status

### Step 1 is done and shipped: both colour modes live on the token

`color.semantic.*` used to hold only its light value, with the dark value
hand-written in `theme.css` — two files, nothing relating them. A Figma
variable with a Light and a Dark mode needs both values from one place, so that
had to be fixed before any export could be written.

Each semantic colour now carries its dark value under
`$extensions['pitchfork.dark']`, and `style-dictionary.config.mjs` generates
`dist/css/dark-semantic.css` from it. Merged in #162, live on
lelandrangel.com/pitchfork-ui. `npm run check:token-modes` refuses a semantic
colour with only one mode.

**It also found a real defect**, which is the argument for doing this before
anything else: `color.semantic.border.disabled` had no dark value at all,
because `--pf-control-border-disabled` named the `gray-200` _primitive_. A
primitive cannot move between modes, so a disabled control border sat at
14.48:1 on the dark background while its enabled counterpart moved to 3.75:1 —
the disabled control read as the _more prominent_ of the two. WCAG exempts
disabled controls, so no contrast check could see it.

### What the tokens actually are, measured

Re-measure before relying on these; they are current as of November 2026.

|                                 | count   | notes                                                          |
| ------------------------------- | ------- | -------------------------------------------------------------- |
| colour tokens                   | **85**  | 52 primitive, 33 semantic — the 33 are the ones with two modes |
| `size.json`                     | 26      | 25 in `rem`, 1 in `px`                                         |
| `typography.json`               | 16      |                                                                |
| `motion.json`                   | 6       | no Figma equivalent; documentation only                        |
| `shadow.json`                   | 4       | single CSS strings — see below                                 |
| **total tokens**                | **137** | across all five files                                          |
| `--pf-*` aliases in `theme.css` | **581** | the component layer; **not** Figma variables                   |

The `--pf-*` layer is deliberately **out of scope for Figma**. It is 581
component-specific aliases whose whole job is to let a consumer retheme without
touching tokens; a Figma variable per alias would be 581 variables nobody
picks from a dropdown. Bind Figma components to the **semantic** collection, as
section 1b says.

### Five things in the CSS that have no Figma equivalent

Each needs a decision in the export, not a transform:

1. **`color-mix()` — 13 uses in `theme.css`.** Figma variables hold a colour,
   not an expression. Either resolve each to a literal at export time (losing
   the relationship) or leave those aliases out.
2. **`var(--x, fallback)` — 6 uses.** A Figma variable has no fallback. The
   fallback has to be resolved or the alias dropped.
3. **Shadows are single strings.** `shadow.sm` is
   `"0 1px 2px rgb(15 23 42 / 0.08)"`; Figma effects need offset, blur, spread
   and colour as separate fields, so the export has to parse them. All four are
   simple `x y blur colour` with no spread, which makes the parse tractable —
   but it is a parse, not a mapping.
4. **The sans stack is 8 families.** Figma takes one font per text style, so
   pick the head of the stack and record the fallbacks in the style's
   description.
5. **25 of 26 sizes are `rem`.** Figma is pixels. A `×16` transform is right
   only while the root stays at 16px; state that assumption in the export
   rather than burying it.

### Figma plan gating — researched, verify before relying

Figma moves these; check against current pricing before building a workflow on
one. Researched November 2026, against a **Professional** seat:

|                                            | requires                               | available to you  |
| ------------------------------------------ | -------------------------------------- | ----------------- |
| Multiple modes per collection (Light/Dark) | paid tier; **free is 1 mode**          | **yes**           |
| Code Connect                               | Professional+, with a Full or Dev seat | **yes**           |
| **Variables REST API _writes_**            | **Enterprise**                         | **no**            |
| Tokens Studio Themes workflow              | Tokens Studio Pro                      | separate purchase |

The consequence shapes everything downstream: **the token sync cannot be
scripted push-button on a Professional seat.** Section 7's "optional
automation" note is not available as written. The realistic options are a
plugin that reads a JSON file (Tokens Studio, or a small purpose-built one), or
a hand-application pass against a generated checklist. Decide this before
building 20 components, because it determines whether variables are named to
be matched by a script or by a person.

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
- Both modes are on the token: each `color.semantic.*` carries its light value
  as `$value` and its dark value under `$extensions['pitchfork.dark']`, so one
  token is one Figma variable with two modes and nothing has to be read out of
  a stylesheet. The `[data-theme='dark']` block in
  `packages/tokens/dist/css/dark-semantic.css` is generated from those
  extensions; `packages/tokens/src/theme.css` keeps only `color-scheme` and the
  `--pf-*` component overrides, which are not tokens and have no Figma
  equivalent.

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
- **The REST API route is closed on a Professional seat.** This line used to
  say "explore the Figma REST API to script the token sync"; variable _writes_
  are an Enterprise feature, so that is not available (see **Status** above).
  What is: a Style Dictionary platform emitting a Figma-shaped JSON, applied by
  a plugin that reads it — Tokens Studio, or a small purpose-built one. Reads
  through the API work on lower tiers, so a **drift check** is feasible even
  where the write is not: export the file's variables, diff against
  `dist/json/tokens.json`, and fail when they disagree. That is worth more than
  it sounds, because the failure mode here is silent divergence rather than a
  broken build.

---

## Reference — source of truth in this repo

- **Components: `packages/elements/src/components/*` — 108 elements**, and
  `elements.json` (built by `build-elements-metadata.mjs`) is the machine-readable
  API: every prop, its type, its enum members, events, slots and parts. Build
  the variant properties from that rather than from a reading of the source.
- `packages/react/src/components/*` (65) is the **retiring** layer; use it only
  to check what an element deliberately does differently.
- Tokens (primitives + semantic + dark mode): `packages/tokens/src/tokens/*.json`
  — one file, both modes, the dark value under `$extensions['pitchfork.dark']`
- Icons: `packages/react/src/components/Icon/Icon.tsx` (`customIcons` + FA regular)
- Live reference: Storybook at `lelandrangel.com/pitchfork-ui`
- Patterns to recreate: `apps/docs/src/patterns/*.stories.tsx`
