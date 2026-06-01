# Pitchfork UI — Audit Findings

Items found during codebase review. See `todoList.md` for component parity tracking.

---

## Bugs

- [x] **Alert: `role="alert"` on all variants** — `info` and `success` should use `role="status"` (polite); only `warning` and `danger` warrant `role="alert"` (assertive). Static alerts aren't affected but dynamically injected ones will interrupt screen readers unnecessarily. [`Alert.tsx:40`](packages/react/src/components/Alert/Alert.tsx)
- [x] **Alert: wrong icon for `warning` variant** — was mapped to `circle-question` (same as `info`). Fixed by adding `triangle-exclamation` custom SVG to `Icon` and updating the variant map. [`Alert.tsx:10`](packages/react/src/components/Alert/Alert.tsx)
- [x] **`IconName` type not defined** — used across the codebase but never declared, causing TS errors in `Icon.tsx`, `Alert.tsx`, `InlineCTA.tsx`, `Metrics.tsx`, `Notification.tsx`. Added `export type IconName = string`. [`Icon.tsx`](packages/react/src/components/Icon/Icon.tsx)
- [x] **`Icon` span ref type mismatch** — spreading `FontAwesomeIconProps` (which carries `Ref<SVGSVGElement>`) onto a `<span>` caused a TS error. Fixed by dropping `ref` before the spread and casting to `HTMLAttributes<HTMLSpanElement>`. [`Icon.tsx`](packages/react/src/components/Icon/Icon.tsx)

---

## Missing Features

- [x] **Button: no loading/pending state** — no `loading` prop or spinner affordance. Common enough that consumers will want it. [`Button.tsx`](packages/react/src/components/Button/Button.tsx)
- [x] **Form fields: no `required` visual indicator** — `Input`, `Select`, `Textarea`, `MultiSelect`, `RadioGroup` etc. forward `required` natively but have no asterisk or `aria-required` wiring at the field-wrapper level. [`Input.tsx`](packages/react/src/components/Input/Input.tsx), [`Select.tsx`](packages/react/src/components/Select/Select.tsx)
- [x] **`EmptyState` component** — removed empty placeholder directory.
- [x] **`LineBarCharts` component** — implemented `LineChart` and `BarChart` as pure SVG components with no external deps.
- [x] **CLAUDE.md** — no AI-assistant context file exists. Needs project overview, CSS variable naming convention, token inheritance chain, and component checklist.

---

## Consistency / Quality

- [x] **`DatePicker` doesn't use the `Input` component internally** — `todoList.md` explicitly notes it should, but it just reuses `pf-field` CSS classes directly. If `Input` changes, DatePicker won't track. [`DatePicker.tsx`](packages/react/src/components/DatePicker/DatePicker.tsx)
- [x] **`Icon` returns `null` silently for unknown names** — no dev-mode warning. A `console.warn` gated on `import.meta.env.DEV` would surface typos faster. [`Icon.tsx:197`](packages/react/src/components/Icon/Icon.tsx)
- [x] **`forwardRef` missing on display components** — `Alert`, `Badge`, `Card`, `Tag`, `Notification`, `Breadcrumbs`, `ContentDivider` don't forward refs. Refs are useful for measuring layout and animation even on non-interactive components. Lower priority than form/interactive components. (32 components total are missing it)

---

## Test Coverage

Current coverage: **21 / 54 components** (Button, Tooltip, Select, MultiSelect, Modal, DatePicker, Slider, Checkbox, RadioGroup, Alert, Input, Textarea, Switch, RadioButton, Dropdown, Tabs, SlideoutMenu, Pagination, Table, FileUploader, Calendar). `CONTRIBUTING.md` requires at least one a11y-focused test per component.

Priority order for adding tests:

- [x] `Select` — custom keyboard navigation, listbox ARIA (26 tests)
- [x] `MultiSelect` — same as Select, plus chip removal (27 tests)
- [x] `Modal` — focus trap, Escape key, scroll lock (20 tests)
- [x] `DatePicker` — calendar navigation, value selection (21 tests)
- [x] `Slider` — arrow key step, min/max clamping (20 tests)
- [x] `Checkbox` / `RadioGroup` — group association, indeterminate state (30 tests)
- [x] `Alert` — role announcement, dismiss callback (17 tests)
- [x] `Tooltip` — delay timing, viewport clipping (16 tests)
**Interactive — form fields**
- [x] `Input` — label association, description, error, required asterisk, disabled, aria-invalid (17 tests)
- [x] `Textarea` — same pattern as Input plus rows default (17 tests)
- [x] `Switch` — toggle state, label, disabled, onChange (13 tests)
- [x] `RadioButton` — standalone radio, label, checked, disabled (12 tests)

**Interactive — overlays & navigation**
- [x] `Dropdown` — open/close, option click, keyboard nav, disabled options (20 tests)
- [x] `Tabs` — tab switching, aria-selected, keyboard nav (ArrowLeft/Right) (19 tests)
- [x] `SlideoutMenu` — open/close, Escape key, overlay click, focus trap (20 tests)
- [x] `Pagination` — page change, prev/next, disabled at boundaries (20 tests)

**Interactive — complex content**
- [x] `Table` — column rendering, sort state, sortable click, empty state, striped/dense classes (18 tests)
- [x] `FileUploader` — file selection, maxFiles, maxFileSize validation, remove file, required (15 tests)
- [x] `Calendar` — month navigation (prev/next), date selection, disabled dates, selected state (16 tests)
- [x] `RichTextEditor` — typing, toolbar bold/italic/underline, characterMax limit, disabled
- [x] `TreeView` — expand/collapse nodes, nested structure, keyboard nav
- [x] `Carousel` — next/prev navigation, wrapping, slide count

**Display — feedback & status**
- [x] `Notification` — role per variant (status), dismiss callback, icon, action slot
- [ ] `Rating` — RatingStars fill percent, clamping, RatingBadge value display
- [ ] `LoadingIndicators` — LoadingSpinner role=status, LoadingSkeleton, LoadingDots
- [ ] `ProgressIndicators` — value/max, aria-valuenow/min/max, label
- [ ] `ProgressSteps` — active/completed/upcoming step states, step count

**Display — simple components**
- [ ] `Badge` — variant class, content renders
- [ ] `BadgeGroup` — renders multiple badges
- [ ] `Tag` — variant, dismissible, onDismiss callback
- [ ] `Card` — Card, CardHeader, CardContent, CardFooter render and accept children
- [ ] `Avatar` — image render, initials fallback, size
- [ ] `ContentDivider` — horizontal/vertical orientation, label, role=separator
- [ ] `Breadcrumbs` — link vs span per item, aria-current on last item, custom separator
- [ ] `Icon` — known names render, unknown name returns null + dev warning, custom icons
- [ ] `Metrics` — value, label, change indicator renders

**Display — content**
- [ ] `CodeSnippet` — renders code content, copy button
- [ ] `VideoPlayer` — renders video element, label association
- [ ] `CreditCard` — card number masking, card type, expiry
- [ ] `InlineCTA` — title, description, action slot renders

**Display — page structure**
- [ ] `PageHeader` — title, subtitle, breadcrumb slot, actions slot
- [ ] `SectionHeader` — title, description, action slot
- [ ] `SectionFooter` — renders children
- [ ] `HeaderNavigation` — logo, nav links, active state
- [ ] `SidebarNavigation` — links, active state, nested items

**Data visualisation**
- [ ] `PieChart` — segment rendering, legend, empty state, conic gradient
- [ ] `RadarChart` — axes, value polygon, empty/insufficient data state
- [ ] `LineBarCharts` — LineChart series rendering, BarChart grouped/stacked, empty state

**Groups & utilities**
- [ ] `ButtonGroup` — renders grouped buttons, passes className
- [ ] `UtilityButton` — variants, sizes, disabled
