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

Current coverage: **2 / 54 components** (Button, Tooltip). `CONTRIBUTING.md` requires at least one a11y-focused test per component.

Priority order for adding tests:

- [x] `Select` — custom keyboard navigation, listbox ARIA (26 tests)
- [x] `MultiSelect` — same as Select, plus chip removal (27 tests)
- [x] `Modal` — focus trap, Escape key, scroll lock (20 tests)
- [ ] `DatePicker` — calendar navigation, value selection
- [ ] `Slider` — arrow key step, min/max clamping
- [ ] `Checkbox` / `RadioGroup` — group association, indeterminate state
- [ ] `Alert` — role announcement, dismiss callback
- [ ] `Tooltip` — delay timing, viewport clipping (partially done)
- [ ] Remaining 46 components
