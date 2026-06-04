# Todo

## Dark mode

- [ ] Add a Storybook toolbar toggle that applies `data-theme="dark"` to the preview iframe root so all stories can be previewed in dark mode
- [ ] Audit all components in dark mode — verify colors, contrast, and legibility using the accessibility tab
- [ ] Add a `Dark` story variant (or a `globals`-driven background switch) to each component's examples stories so dark mode renders are documented
- [ ] Verify the dark mode layer in `theme.css` covers the `--color-semantic-status-*-bright` tokens used by Avatar presence indicators

## Components

- [x] `EmptyState` — component directory does not exist; implement component

## Storybook examples cleanup

Extract inline object/array props to named consts per the contributing guidelines (no inline `={[]}` or `={{}}` in JSX props):

- [ ] `LineBarChart.examples.stories.tsx` — `series={[]}` and `data={[]}` inline on multiple stories
- [ ] `PieChart.examples.stories.tsx` — `data={[]}` inline across all stories
- [ ] `ProgressSteps.examples.stories.tsx` — `steps={[]}` inline
- [ ] `RadarChart.examples.stories.tsx` — `data={[]}` inline
- [ ] `SidebarNavigation.examples.stories.tsx` — `sections={[]}` inline
