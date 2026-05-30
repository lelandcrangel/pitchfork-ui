# Pitchfork UI — Claude Context

Component library for lelandrangel.com. React components backed by a Style Dictionary token system, documented with Storybook.

---

## Workspace structure

```
pitchfork-ui/
├── packages/
│   ├── react/          # Component library (@pitchfork-ui/react)
│   │   └── src/
│   │       ├── components/   # One folder per component
│   │       ├── hooks/        # Shared hooks (useDisclosure, useListNavigation, etc.)
│   │       ├── a11y/         # Shared a11y utilities (Keys, getFocusableElements, etc.)
│   │       ├── utils/cx.ts   # className joiner
│   │       ├── styles/theme.css  # Global token aliases (:root vars)
│   │       └── index.ts      # Public exports
│   └── tokens/         # Design tokens (@pitchfork-ui/tokens)
│       └── src/tokens/ # color.json, shadow.json, size.json, typography.json
└── apps/
    └── docs/           # Storybook site (@pitchfork-ui/docs)
        └── src/        # *.stories.tsx, *.examples.stories.tsx, *.mdx per component
```

---

## Common commands

```bash
npm run storybook        # Start Storybook dev server (port 6006)
npm run test             # Run Vitest (packages/react only)
npm run typecheck        # tsc --build across all packages
npm run lint             # ESLint across workspace
npm run format           # Prettier across workspace
npm run build            # tokens → react → docs (in order)
npm run build:tokens     # Style Dictionary → dist/css/variables.css + dist/json/tokens.json
npm run build:react      # Vite lib build → dist/ (ESM + CJS + types)
```

Tokens must be built before react. The `build` script enforces this order.

---

## Adding a component

### 1. Component files (`packages/react/src/components/ComponentName/`)

```
ComponentName/
├── ComponentName.tsx   # Component + exported types
├── ComponentName.css   # Scoped styles using CSS variables
└── index.ts           # export * from './ComponentName'
```

### 2. Export from the package

Add to `packages/react/src/index.ts`:
```ts
export * from './components/ComponentName';
```

### 3. Storybook docs (`apps/docs/src/`)

Three files per component:
```
ComponentName.stories.tsx          # Controls/args stories
ComponentName.examples.stories.tsx # Example compositions
ComponentName.mdx                  # Documentation page
```

---

## Component conventions

### TypeScript

- Export a `ComponentNameProps` interface — always.
- Extend the native element's HTML attributes (`React.HTMLAttributes<HTMLDivElement>`, `React.ButtonHTMLAttributes<HTMLButtonElement>`, etc.) so all standard HTML props pass through.
- Use `forwardRef` for interactive elements and any component a consumer might need to measure or animate.
- Spread `...props` onto the root native element after your own props so consumers can set `data-*`, `aria-*`, `className`, `style`, etc.
- Default `type="button"` on any `<button>` not inside a `<form>`.

```tsx
export interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'a' | 'b';
}

export const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant = 'a', ...props }, ref) => (
    <div ref={ref} className={cx('pf-mycomponent', `pf-mycomponent--${variant}`, className)} {...props} />
  ),
);

MyComponent.displayName = 'MyComponent';
```

### CSS class naming

BEM-like with a `pf-` prefix:

```css
.pf-componentname           /* root */
.pf-componentname--variant  /* modifier */
.pf-componentname__element  /* child element */
```

### CSS variable inheritance chain

Never hardcode colors, spacing, or radii. Use the three-tier alias chain:

```
component-specific var → theme alias → token
```

Example from `theme.css`:
```css
--pf-button-primary-bg: var(--color-semantic-action-primary);
```

Example from a component CSS file:
```css
.pf-button--primary {
  background: var(--pf-button-primary-bg);
}
```

Token names (`--color-*`, `--space-*`, `--size-*`, `--font-*`, `--radius-*`, `--shadow-*`) come from Style Dictionary and must not be used directly in component CSS — go through a `theme.css` alias. Add new aliases to `packages/react/src/styles/theme.css` as needed.

Dark mode is handled via `[data-theme='dark']` in `theme.css` — component CSS needs no dark mode selectors.

---

## Icon system

Icons come from `@fortawesome/free-regular-svg-icons` only (the free **regular** set). Solid and brand sets are not installed.

Custom SVGs (chevrons, `triangle-exclamation`) live in the `customIcons` map inside `Icon.tsx` and take precedence over the FA lookup. Add new custom SVGs there when a needed icon isn't in the regular FA set.

`IconName` is typed as `string`. Pass any valid FA regular icon kebab-case name (e.g. `"circle-check"`, `"circle-xmark"`) or a custom icon name.

```tsx
<Icon name="circle-check" aria-hidden />
<Icon name="triangle-exclamation" label="Warning" />  {/* label adds aria-label */}
```

Icons return `null` silently for unknown names in production. Use `getAvailableIconNames()` to list what's registered.

---

## Form field pattern

Form components (`Input`, `Select`, `Textarea`, etc.) wrap the control in a `.pf-field` div that handles label, description, and error display. They manage their own `id` generation via `useId` and wire up `aria-describedby` automatically.

Prefer `useControllableState` (from `hooks/`) for any component that supports both controlled and uncontrolled usage.

---

## Accessibility

- Use semantic HTML elements first — prefer `<button>` over `<div role="button">`.
- Use `composeDescribedBy(...ids)` (from `a11y/`) to merge `aria-describedby` values without dropping consumer-provided ones.
- For live region components (alerts, notifications): `role="alert"` is assertive and interrupts screen readers — use it only for `warning`/`danger`. Use `role="status"` for `info`/`success`.
- Use `Keys` constant (from `a11y/`) for keyboard event comparisons.

---

## Testing

Vitest + Testing Library + jsdom. Setup file: `packages/react/src/test/setup.ts`.

```bash
npm run test              # watch mode
npm run test -- --run     # single pass
```

Each component should have at minimum one accessibility-focused test (role presence, keyboard interaction, or aria attribute wiring). See `Button.test.tsx` for a minimal example and `Tooltip.test.tsx` for a more involved one.

---

## Known gaps (see todo.md)

- Test coverage is very low (~4% of components have tests).
- `EmptyState` and `LineBarCharts` component directories exist but are empty.
- `Button` has no loading/pending state.
- Form components don't surface a `required` visual indicator.
- Many display components are missing `forwardRef`.
