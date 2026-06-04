# Todo

## Performance

- [x] Externalize `@fortawesome/*`, `prism-react-renderer`, and `clsx` as `peerDependencies` — prerequisite for enabling `preserveModules`. Without externalizing these, `preserveModules` pollutes `dist/` with a `node_modules/` directory. Note: `sideEffects: ["**/*.css"]` in `package.json` already enables JS tree-shaking from the single bundle for modern bundlers (webpack 5+, Vite, Rollup).
- [x] Once deps are externalized: enable `preserveModules: true` on the ESM Rollup output for per-component module files

## CI / Developer experience

- [x] Add a `ci.yml` GitHub Actions workflow that runs `typecheck → lint → test` on every PR
- [x] Add `lint-staged` + `husky` pre-commit hooks to enforce Prettier and ESLint on changed files before every commit

## Testing

- [x] Add tests for `EmptyState` component (only component currently missing a test)

## Accessibility

- [x] Add `aria-label` prop enforcement / warning for `UtilityButton` — it renders a `<button>` with no visible text and no mechanism to warn when neither `aria-label` nor `aria-labelledby` is provided

## Code quality

- [x] Add `displayName` to `Icon` component (only component missing it — hurts React DevTools and error stack traces)

## Dark mode

- [x] Add a Storybook toolbar toggle that applies `data-theme="dark"` to the preview iframe root so all stories can be previewed in dark mode
- [ ] Audit all components in dark mode — verify colors, contrast, and legibility using the accessibility tab
- [ ] Run the Storybook a11y addon on every component in dark mode (switch toolbar to Dark, open the Accessibility panel, confirm no violations)
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
