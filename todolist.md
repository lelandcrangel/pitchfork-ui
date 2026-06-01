# Pitchfork UI — Improvement Backlog

Findings from post-audit review. Ordered by priority within each section.

---

## High Impact

### Bundle size

- [x] **Icon: switch from full-pack to individual FA imports** — `import { far }` bundles ~1,000 icons regardless of usage. Replace with per-icon imports (`import { faCircleCheck } from '@fortawesome/free-regular-svg-icons'`) for each icon referenced in the `regularIcons` map. Expected to cut icon payload by 90%+. [`Icon.tsx`](packages/react/src/components/Icon/Icon.tsx)

### Accessibility — motion

- [x] **Button.css** — add `prefers-reduced-motion` guard for 4-property transition (120ms) [`Button.css`](packages/react/src/components/Button/Button.css)
- [x] **Switch.css** — guard `background-color` + `transform` transitions (120ms) [`Switch.css`](packages/react/src/components/Switch/Switch.css)
- [x] **Carousel.css** — guard slide `transform` + indicator transitions [`Carousel.css`](packages/react/src/components/Carousel/Carousel.css)
- [x] **Select.css** — guard chevron rotate (140ms) [`Select.css`](packages/react/src/components/Select/Select.css)
- [x] **MultiSelect.css** — guard chevron rotate (140ms) [`MultiSelect.css`](packages/react/src/components/MultiSelect/MultiSelect.css)
- [x] **Dropdown.css** — guard menu open/close transform [`Dropdown.css`](packages/react/src/components/Dropdown/Dropdown.css)
- [x] **Input.css** — guard focus transition [`Input.css`](packages/react/src/components/Input/Input.css)
- [x] **Tabs.css** — guard color transition (160ms) [`Tabs.css`](packages/react/src/components/Tabs/Tabs.css)
- [x] **ProgressIndicators.css** — guard `width` (bar) and `stroke-dashoffset` (circle) transitions [`ProgressIndicators.css`](packages/react/src/components/ProgressIndicators/ProgressIndicators.css)
- [x] **Pagination.css** — guard `box-shadow` transition (140ms) [`Pagination.css`](packages/react/src/components/Pagination/Pagination.css)
- [x] **ButtonGroup.css** — guard multi-property transition [`ButtonGroup.css`](packages/react/src/components/ButtonGroup/ButtonGroup.css)
- [x] **UtilityButton.css** — guard multi-property transition [`UtilityButton.css`](packages/react/src/components/UtilityButton/UtilityButton.css)
- [x] **LineBarChart.css** — guard hover opacity transitions (80ms) [`LineBarChart.css`](packages/react/src/components/LineBarCharts/LineBarChart.css)

---

## Medium Impact

### `forwardRef` — interactive / layout components

These are the cases where consumers are likely to need a ref for focus management, measurement, or animation. Add `forwardRef` and update `.displayName`.

- [x] **Modal** — consumers need to focus the dialog or measure it [`Modal.tsx`](packages/react/src/components/Modal/Modal.tsx)
- [x] **Tabs** — scroll-into-view, imperative focus [`Tabs.tsx`](packages/react/src/components/Tabs/Tabs.tsx)
- [x] **DatePicker** — programmatic focus on the trigger [`DatePicker.tsx`](packages/react/src/components/DatePicker/DatePicker.tsx)
- [ ] **Tooltip** — measure trigger for external positioning overrides [`Tooltip.tsx`](packages/react/src/components/Tooltip/Tooltip.tsx)
- [ ] **Carousel** — measure slide dimensions [`Carousel.tsx`](packages/react/src/components/Carousel/Carousel.tsx)
- [ ] **Pagination** — layout measurement [`Pagination.tsx`](packages/react/src/components/Pagination/Pagination.tsx)
- [ ] **FileUploader** — focus the drop zone [`FileUploader.tsx`](packages/react/src/components/FileUploader/FileUploader.tsx)
- [ ] **Calendar** — embedded use needs ref [`Calendar.tsx`](packages/react/src/components/Calendar/Calendar.tsx)

### `forwardRef` — display components (lower urgency)

Less likely to need refs but consistent with the rest of the library.

- [ ] **CodeSnippet** [`CodeSnippet.tsx`](packages/react/src/components/CodeSnippet/CodeSnippet.tsx)
- [ ] **HeaderNavigation** [`HeaderNavigation.tsx`](packages/react/src/components/HeaderNavigation/HeaderNavigation.tsx)
- [ ] **InlineCTA** [`InlineCTA.tsx`](packages/react/src/components/InlineCTA/InlineCTA.tsx)
- [ ] **LoadingSpinner / LoadingDots / LoadingSkeleton** [`LoadingIndicators.tsx`](packages/react/src/components/LoadingIndicators/LoadingIndicators.tsx)
- [ ] **MetricCard / MetricGrid** [`Metrics.tsx`](packages/react/src/components/Metrics/Metrics.tsx)
- [ ] **PageHeader** [`PageHeader.tsx`](packages/react/src/components/PageHeader/PageHeader.tsx)
- [ ] **ProgressBar / ProgressCircle** [`ProgressIndicators.tsx`](packages/react/src/components/ProgressIndicators/ProgressIndicators.tsx)
- [ ] **ProgressSteps** [`ProgressSteps.tsx`](packages/react/src/components/ProgressSteps/ProgressSteps.tsx)
- [ ] **RatingStars / RatingBadge** [`Rating.tsx`](packages/react/src/components/Rating/Rating.tsx)
- [ ] **SectionHeader** [`SectionHeader.tsx`](packages/react/src/components/SectionHeader/SectionHeader.tsx)
- [ ] **SectionFooter** [`SectionFooter.tsx`](packages/react/src/components/SectionFooter/SectionFooter.tsx)
- [ ] **SidebarNavigation** [`SidebarNavigation.tsx`](packages/react/src/components/SidebarNavigation/SidebarNavigation.tsx)
- [ ] **PieChart** [`PieChart.tsx`](packages/react/src/components/PieChart/PieChart.tsx)
- [ ] **RadarChart** [`RadarChart.tsx`](packages/react/src/components/RadarChart/RadarChart.tsx)
- [ ] **LineChart / BarChart** [`LineBarChart.tsx`](packages/react/src/components/LineBarCharts/LineBarChart.tsx)

### Missing `.displayName`

Named function exports don't get stable display names in minified builds. Affects React DevTools and error stack traces.

- [ ] **Calendar** [`Calendar.tsx`](packages/react/src/components/Calendar/Calendar.tsx)
- [ ] **Carousel** [`Carousel.tsx`](packages/react/src/components/Carousel/Carousel.tsx)
- [ ] **CodeSnippet** [`CodeSnippet.tsx`](packages/react/src/components/CodeSnippet/CodeSnippet.tsx)
- [x] **DatePicker** [`DatePicker.tsx`](packages/react/src/components/DatePicker/DatePicker.tsx)
- [ ] **FileUploader** [`FileUploader.tsx`](packages/react/src/components/FileUploader/FileUploader.tsx)
- [ ] **HeaderNavigation** [`HeaderNavigation.tsx`](packages/react/src/components/HeaderNavigation/HeaderNavigation.tsx)
- [ ] **Icon** [`Icon.tsx`](packages/react/src/components/Icon/Icon.tsx)
- [ ] **InlineCTA** [`InlineCTA.tsx`](packages/react/src/components/InlineCTA/InlineCTA.tsx)
- [ ] **LoadingSpinner / LoadingDots / LoadingSkeleton** [`LoadingIndicators.tsx`](packages/react/src/components/LoadingIndicators/LoadingIndicators.tsx)
- [ ] **MetricCard / MetricGrid** [`Metrics.tsx`](packages/react/src/components/Metrics/Metrics.tsx)
- [x] **Modal** [`Modal.tsx`](packages/react/src/components/Modal/Modal.tsx)
- [ ] **ProgressBar / ProgressCircle** [`ProgressIndicators.tsx`](packages/react/src/components/ProgressIndicators/ProgressIndicators.tsx)
- [ ] **RatingStars / RatingBadge** [`Rating.tsx`](packages/react/src/components/Rating/Rating.tsx)
- [ ] **Tooltip** [`Tooltip.tsx`](packages/react/src/components/Tooltip/Tooltip.tsx)

---

## Polish / Lower Priority

### Accessibility — keyboard interaction

- [ ] **Carousel: add arrow-key navigation** — WCAG 2.1 requires keyboard operability for carousels. `ArrowLeft`/`ArrowRight` should call `goToIndex` on the carousel root div via `onKeyDown`. [`Carousel.tsx`](packages/react/src/components/Carousel/Carousel.tsx)
- [ ] **Tooltip: add focus ring to trigger span** — the trigger `<span>` has no visible focus indicator of its own; it relies entirely on the child element's styles. Add `:focus-visible` styles to `.pf-tooltip__trigger`. [`Tooltip.css`](packages/react/src/components/Tooltip/Tooltip.css)

### CSS — hardcoded values bypassing the token system

Values that should use `var(--space-*)`, `var(--font-size-*)`, or `var(--radius-*)` tokens:

- [ ] **Modal.css** — `font-size: 1.125rem`, `gap: 4px`, `font-size: 18px` [`Modal.css`](packages/react/src/components/Modal/Modal.css)
- [ ] **SlideoutMenu.css** — `font-size: 1.125rem`, `gap: 4px`, `font-size: 18px` [`SlideoutMenu.css`](packages/react/src/components/SlideoutMenu/SlideoutMenu.css)
- [ ] **Slider.css** — `height: 8px` (track), `height: 18px` / `width: 18px` (thumb), `border-radius: 999px`, `border: 2px solid`, `margin-top: -5px` [`Slider.css`](packages/react/src/components/Slider/Slider.css)
- [x] **Tabs.css** — `padding: 4px`, `padding: 8px 12px`, `padding: 10px 14px`, `border-bottom: 2px solid` [`Tabs.css`](packages/react/src/components/Tabs/Tabs.css)
- [x] **Dropdown.css** — `font-size: 12px`, `height: 16px` / `width: 16px` (icon sizes), `gap: 2px` [`Dropdown.css`](packages/react/src/components/Dropdown/Dropdown.css)
- [x] **Pagination.css** — `height: 32px`, `min-width: 32px`, `height: 36px` [`Pagination.css`](packages/react/src/components/Pagination/Pagination.css)
- [ ] **Tooltip.css** — `padding: 8px 10px` [`Tooltip.css`](packages/react/src/components/Tooltip/Tooltip.css)
