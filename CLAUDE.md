# Pitchfork UI — Claude Context

Component library for lelandrangel.com. React components backed by a Style Dictionary token system, documented with Storybook.

---

## Workspace structure

```
pitchfork-ui/
├── packages/
│   ├── core/           # Framework-free behaviour (@pitchfork-ui/core)
│   │   └── src/        # anchoring, focus, dismiss, navigation, keys, aria, motion, icons
│   ├── react/          # Component library (@pitchfork-ui/react)
│   │   └── src/
│   │       ├── components/   # One folder per component
│   │       ├── hooks/        # React adapters over @pitchfork-ui/core
│   │       ├── a11y/         # Re-exports the a11y helpers from core
│   │       ├── utils/cx.ts   # className joiner
│   │       └── index.ts      # Public exports
│   ├── elements/       # Stencil custom elements (@pitchfork-ui/elements)
│   ├── elements-react/ # Generated React bindings — never hand-edited
│   ├── elements-angular/ # Generated Angular bindings — never hand-edited
│   └── tokens/         # Design tokens + theming contract (@pitchfork-ui/tokens)
│       └── src/
│           ├── tokens/   # color.json, shadow.json, size.json, typography.json
│           └── theme.css # Global token aliases (:root vars), breakpoints, dark mode
└── apps/
    ├── docs/           # Storybook site (@pitchfork-ui/docs)
    │   └── src/        # *.stories.tsx, *.examples.stories.tsx, *.mdx per component
    ├── consumer-react/   # Vite app that smoke-tests the React bindings
    └── consumer-angular/ # Angular CLI app that smoke-tests the Angular bindings
```

`theme.css` sits in `packages/tokens` rather than in a rendering layer because
both `@pitchfork-ui/react` and `@pitchfork-ui/elements` ship it, and neither
owns it. It `@import`s `./variables.css` relatively, so any build that can
resolve a relative CSS import can consume the built copy directly.

---

## Common commands

```bash
npm run storybook        # Start Storybook dev server (port 6006)
npm run test             # Run Vitest (core, then react)
npm run typecheck        # tsc --build across all packages
npm run lint             # ESLint across workspace
npm run format           # Prettier across workspace
npm run build            # tokens → react → docs (in order)
npm run build:tokens     # Style Dictionary → dist/css/variables.css + dist/json/tokens.json
npm run build:react      # Vite lib build → dist/ (ESM + types + styles.css; no CJS)
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

Every story in `*.examples.stories.tsx` **must** include `parameters.docs.source.code` with a plain JSX string — no imports, no `render:` wrapper, no story boilerplate. This is what appears in the "Show code" panel and should look like application code:

```tsx
export const Basic: Story = {
  render: () => <MyComponent>...</MyComponent>,
  parameters: {
    docs: {
      source: {
        code: `<MyComponent>...</MyComponent>`,
      },
    },
  },
};
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
    <div
      ref={ref}
      className={cx('pf-mycomponent', `pf-mycomponent--${variant}`, className)}
      {...props}
    />
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

Token names (`--color-*`, `--space-*`, `--size-*`, `--font-*`, `--radius-*`, `--shadow-*`) come from Style Dictionary and must not be used directly in component CSS — go through a `theme.css` alias. Add new aliases to `packages/tokens/src/theme.css` as needed.

Dark mode is handled via `[data-theme='dark']` in `theme.css` — component CSS needs no dark mode selectors.

### Responsive breakpoints

This project uses **mobile-first** responsive CSS. Base styles target mobile; `@media (--breakpoint)` queries add wider-screen overrides.

| Token  | Min-width | Typical use                                        |
| ------ | --------- | -------------------------------------------------- |
| `--sm` | 640px     | Stacked → inline layouts                           |
| `--md` | 768px     | Single-col nav → multi-col, sheet → centered modal |
| `--lg` | 1024px    | Large/desktop layouts                              |

```css
/* base = mobile */
.pf-mycomponent {
  flex-direction: column;
}

@media (--md) {
  .pf-mycomponent {
    flex-direction: row;
  }
}
```

Breakpoints are defined in `packages/tokens/src/theme.css` and resolved at build time by `postcss-custom-media`. Never use raw `min-width`/`max-width` pixel values in component CSS.

---

## Icon system

Icons come from `@fortawesome/free-regular-svg-icons` only (the free **regular** set). Solid and brand sets are not installed.

**`Icon` resolves an explicit registry, not the whole regular set.** Each icon is an individual import in `bundledRegularIcons` inside `Icon.tsx`, which is what keeps a consumer's bundle to the icons actually in use. A name outside the registry renders `null` and warns once on the console — `paper-plane` and `comments` are real FA regular icons and neither of them works out of the box.

Custom SVGs (chevrons, `triangle-exclamation`) live in the `customIcons` map in the same file and take precedence over the FA lookup. Add new custom SVGs there when a needed icon isn't in the regular FA set.

`getAvailableIconNames()` lists the canonical names. `Icon` also accepts a Font Awesome alias (`bar-chart` for `chart-bar`) and a camelCase spelling (`chartBar`, `circleInfo`), because it kebab-cases before looking up. `metadata.json` carries all of it under `icons`, which is how the MCP server's `validate_usage` checks a name without rejecting the working spellings.

```tsx
<Icon name="circle-check" aria-hidden />
<Icon name="triangle-exclamation" label="Warning" />  {/* label adds aria-label */}
```

To add one this library doesn't bundle, register it once at startup from the peer dependency the consumer already installs:

```tsx
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { registerIcons } from '@pitchfork-ui/react';

registerIcons({ 'paper-plane': faPaperPlane });
```

`IconName` is the union of registered names widened with `string`, so editors complete the bundled names while a runtime registration is still accepted. Adding an icon the library's own components need goes in `bundledRegularIcons`, not in consumer code.

---

## Form field pattern

Form components (`Input`, `Select`, `Textarea`, etc.) wrap the control in a `.pf-field` div that handles label, description, and error display. They manage their own `id` generation via `useId` and wire up `aria-describedby` automatically.

Prefer `useControllableState` (from `hooks/`) for any component that supports both controlled and uncontrolled usage.

---

## Where behaviour lives

`@pitchfork-ui/core` holds the parts of the system that are about the DOM and
about arithmetic rather than about React: anchored positioning, focus trapping,
outside-interaction dismissal, list-navigation index maths, progress and
circular-arc geometry, avatar initials and card-number formatting, `Keys`,
`composeDescribedBy`, `getFocusableElements` and `prefersReducedMotion`. It
imports nothing.

**A shared pure function goes here on the way through, not afterwards.** When a
port finds arithmetic or string formatting that both layers need, move it to
core and point the React component at it in the same change. Two copies agree
on the day they are written and diverge the first time one is fixed — and the
divergence is silent, because each layer's tests still pass. `progress.ts` and
the card formatters in `text.ts` came out of the React components this way, and
the React tests passed unchanged across the move, which is the signal that the
extraction was faithful.

The dividing line, which decides where a new piece of behaviour goes:

- **Core owns the DOM and the maths.** Geometry, focus order, event wiring,
  index arithmetic — the parts that are identical in every rendering layer.
  Every `observe*`/`trap*`/`on*` function attaches listeners and returns a
  cleanup function.
- **The rendering layer owns its own reactivity.** `packages/react/src/hooks`
  are thin adapters: a `useEffect` that calls the core function and returns its
  cleanup, or a `useState` around a core pure function. Core is never a state
  container.

So a hook that is only a `useEffect` wrapper belongs in core; a hook that owns
React state keeps that state and delegates the calculation. When adding
behaviour, write and test it in core first, then adapt it.

The icon registry lives in core for the same reason, and it is the clearest
case: a consumer calling `registerIcons()` has to get the icon in React
components _and_ in `<pf-icon>`. A registry per layer would silently give them
one or the other. Core types the glyph structurally rather than importing
Font Awesome, so it still imports nothing.

`packages/react/src/a11y` re-exports core's helpers because they are part of
`@pitchfork-ui/react`'s public API — import from `../../a11y` inside components
as before.

Full reasoning: `WEB-COMPONENTS-PLAN.md`.

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

## Web components (`packages/elements`)

Stencil-authored custom elements, with the React bindings in
`packages/elements-react` **generated** by the Stencil output target — never
hand-edited. Fix a wrapper by fixing the element it comes from.

Things that differ from the React library, learned by porting the first two:

- **`@keyframes` do not cross a shadow boundary.** The React library declares
  `pf-spin` once in `LoadingIndicators.css` and everything picks it up from the
  global sheet. Each element needs its own copy. The same goes for anything
  else that relies on CSS being global — including `.pf-sr-only`, which the
  loading indicators each redeclare locally.
  To check a copy is really there, use `element.getAnimations().length`:
  `getComputedStyle(el).animationName` reports whatever `animation` declared
  whether or not the keyframes resolve, so it cannot tell a working animation
  from a missing one. `scripts/smoke-consumer.mjs` asserts this for all three
  loading elements.
- **No `useId`.** IDs are scoped to the shadow root, so use literal ones
  (`id="input"`).
- **Variants select on reflected attributes**, not BEM classes:
  `:host([variant='primary'])`. Reflect any prop the stylesheet reads.
- **Expose internals as `::part()`**, and document each part on the component.
  A consumer's stylesheet cannot otherwise reach inside.
- **Form controls must be `formAssociated` with `@AttachInternals()`.** A plain
  `<input>` in a shadow root does not reach the surrounding form. Forward
  `checkValidity`/`reportValidity` with `@Method()` — a form-associated custom
  element does not inherit them.
- **A component file may have only one export** — the component class.
  Helpers go in a sibling module, which is why `pf-icon` has `custom-icons.tsx`
  and `icon-names.ts` beside it.
- **The package cannot be `"type": "module"`** — Stencil loads
  `stencil.config.ts` through `require()`. Hence `vitest.config.mts`.

### Testing elements

Two Vitest projects, because the two kinds of test need different DOMs:

```bash
npm run test:unit -w @pitchfork-ui/elements     # Stencil's environment, fast
npm run test:browser -w @pitchfork-ui/elements  # Chromium, via Playwright
npm run test -w @pitchfork-ui/elements          # both
```

**A form-associated component is browser-tested in full**, not just its form
assertions. Stencil's mock DOM stubs `ElementInternals`, and jsdom 30 provides
`attachInternals()` but neither `setFormValue` nor `setValidity`, so such a
component throws on its first lifecycle call anywhere but a real browser.
Everything else belongs in the fast `unit` project.

What each project cannot do, measured rather than assumed:

- **The mock DOM never fires `slotchange`.** Anything that reacts to slotted
  content changing has to be browser-tested. Read the light DOM in
  `componentWillLoad` as well, so first paint is right without waiting for the
  event — that part the `unit` project can cover. `pf-content-divider` is the
  worked example, and its two spec files split exactly along this line.
- **Neither project applies `styleUrl` CSS.** A mounted element's shadow root
  has zero adopted stylesheets and zero `<style>` tags, because the styles are
  bundled by the output targets and neither test project runs them. So no test
  here can assert a computed colour or `display`; assert the class names and
  reflected attributes the stylesheet selects on instead. Computed styles are
  the consumer apps' job — `scripts/smoke-consumer.mjs` asserts them against a
  real build, which is where a missing `--pf-*` alias actually shows up.

**Stencil's queue is `async`**, so a re-render provoked by an event lands
several frames after the mutation. A single `requestAnimationFrame` is reliably
too early. Poll to a deadline rather than picking a sleep.

Set `PW_CHROMIUM_PATH` if the environment already has a Chromium that
Playwright's pinned build does not match.

---

## Known gaps

See `todo.md` at the repo root.
