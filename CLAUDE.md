# Pitchfork UI — Claude Context

Component library for lelandrangel.com. **108 standard custom elements** backed
by a Style Dictionary token system, with generated React, Angular and Vue
bindings, documented with Storybook.

`@pitchfork-ui/react` is being retired. It is still published and still builds,
but the elements are the library: the Storybook site documents them and nothing
else, `llms.txt` describes them, and `REACT-RETIREMENT-PLAN.md` carries the
remaining phases.

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
│   ├── elements-vue/   # Generated Vue bindings — never hand-edited
│   └── tokens/         # Design tokens + theming contract (@pitchfork-ui/tokens)
│       └── src/
│           ├── tokens/   # color.json, shadow.json, size.json, typography.json
│           └── theme.css # Global token aliases (:root vars), breakpoints, dark mode
└── apps/
    ├── docs/           # Storybook site (@pitchfork-ui/docs)
    │   └── src/
    │       ├── elements/        # Generated: one .mdx + .stories.tsx per element
    │       ├── patterns/        # Seven worked compositions
    │       ├── element-examples.ts  # Hand-written markup per element
    │       └── *.mdx            # Foundations prose (hand-written)
    ├── consumer-react/   # Vite app that smoke-tests the React bindings
    ├── consumer-angular/ # Angular CLI app that smoke-tests the Angular bindings
    └── consumer-vue/     # Vite app that smoke-tests the Vue bindings
```

`theme.css` sits in `packages/tokens` rather than in a rendering layer because
both `@pitchfork-ui/react` and `@pitchfork-ui/elements` ship it, and neither
owns it. It `@import`s `./variables.css` relatively, so any build that can
resolve a relative CSS import can consume the built copy directly.

---

## Common commands

```bash
npm run storybook        # Start Storybook dev server (port 6006)
npm run test             # Run Vitest (core, then react, then elements)
npm run typecheck        # tsc --build across all packages
npm run lint             # ESLint across workspace
npm run format           # Prettier across workspace
npm run build            # tokens → core → react → elements → bindings → metadata → docs
npm run build:tokens     # Style Dictionary → dist/css/variables.css + dist/json/tokens.json
npm run build:elements   # Stencil build + the three generated bindings
npm run build:react      # Vite lib build → dist/ (ESM + types + styles.css; no CJS)
```

The order is enforced by the `build` script and matters twice: tokens before
anything that reads a CSS variable, and `build:elements` before
`build:elements-metadata`, which reads Stencil's `docs.json`.

**`npm run typecheck` needs the bindings built too**, which is new and is not
obvious from either end. `apps/theme-builder` is in the root tsconfig's
references and imports `@pitchfork-ui/elements-react`, and that package
resolves only through its `exports` map to `dist/index.d.ts` — generated, with
`src/components/` gitignored and `dist/` never committed. So a clean checkout
has nothing for `tsc` to resolve, and the failure is **50 errors**: eight
`TS2307: Cannot find module` and forty-two `TS7006: Parameter 'event'
implicitly has an 'any' type` falling out of them, not one of which says
"build first". Reading that as a type error in the theme builder is the
obvious and wrong conclusion, and it is what CI reported the first time this
branch was opened as a PR — green locally, because the bindings were already
on disk from an earlier build.

`scripts/check-generated-bindings.mjs` runs ahead of `tsc -b` and names the
command instead. **Two workflows run the typecheck and they need different
answers.** `.github/workflows/deploy.yml` runs `build:hostinger`, which writes
that `dist` on its way through, so its typecheck simply moved to _after_ the
build — no extra work, and everything that uploads comes later, so it still
gates the deploy. `.github/workflows/ci.yml` cannot do that: its full build is
behind twenty minutes of tests, and a type error that surfaces there instead
of in the first minute is a worse trade than the rebuild. So it builds tokens,
core and the elements before the typecheck step — roughly 70 seconds against a job that is
well under 30 minutes when healthy, and the full build further down redoes it.
The guard refuses rather than building: a `typecheck` that quietly starts a
66-second Stencil build is a worse surprise than one that says which command
to run. Probed by moving `dist` away — it exits 1 with one message and zero TS
errors.

**The chains step over `packages/react` when it is not there.** `build`,
`build:hostinger`, `build:demo` and `test` call it through
`scripts/run-workspace.mjs`, because `npm run build -w @pitchfork-ui/react`
fails outright on a missing workspace and would kill the chain at that step for
a package that had been deliberately retired. `build:react` and `test:coverage`
still address the workspace directly, so asking for that package by name gets
npm's own error rather than a shrug.

---

## Adding a component

**Add an element, not a React component.** `packages/react` is in retirement and
takes no new components; everything below describes the layer that is being
replaced, and is kept because the package is still published and still gets
fixes. For a new element, see **Web components** further down: the component
folder in `packages/elements/src/components/`, an entry in
`apps/docs/src/element-examples.ts`, and the docs page and Interactive story
are generated.

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

### 3. Storybook docs

**There are none for a React component any more.** The 75 `*.stories.tsx`, 75
`*.examples.stories.tsx` and 75 `*.mdx` files were deleted when the elements
took over the `Components` section — 225 files, 14,678 lines. Two consequences
worth knowing:

- `metadata.json` read its **examples and descriptions** from those files, so
  the React half now carries props, types, defaults and resolved variable
  chains only. 69 of 91 components lost their examples and descriptions. That
  was a deliberate trade: the elements carry the depth now, in `elements.json`,
  and the MCP server answers `get_examples` for an element tag or name.
- `build-metadata.mjs` used to contain both extractors — `extractExamples` over
  `*.examples.stories.tsx` and `extractDocs` over `*.mdx`, 246 lines between
  them. Both ran over nothing on every build and reported `described: 0` and
  `examples: 0`, and both are gone. Code that can only produce nothing reads as
  code that might.

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

**The thirteen custom glyphs are data in core, not markup in either layer.**
`packages/core/src/custom-glyphs.ts` holds each one as a viewBox, a stroke
width and a list of `polyline`/`path`/`circle` shapes; `Icon` maps them to
React's camelCase presentation attributes and `pf-icon` to the hyphenated
spelling. That attribute-name difference is the whole reason core holds data
rather than an `<svg>` — it has no vdom of its own, the same reason
`getIconPaths` returns a viewBox and path strings. The geometry used to be
written out in both places, and no test in either layer could have seen the
two copies stop agreeing, because each only ever rendered its own. Moving it
also surfaced a real defect: the Font Awesome branch of `pf-icon` set
`part="svg"` and the custom branch did not, so `pf-icon::part(svg)` reached two
thirds of the icons and silently missed every chevron.

The Font Awesome glyphs cannot move, because each layer has to import them
individually to keep a consumer's bundle to the icons in use. What moved is the
**list of names**, as core's `BUNDLED_FA_ICON_NAMES`, and each layer has a test
asserting its own map against it — otherwise an icon added in one place draws
in React and renders nothing as an element, with every test in both layers
passing. The equivalent assertion for the custom glyphs was written, probed and
**deleted**: both layers now read the same list, so it compared a value with
itself and could not fail.

`scripts/build-metadata.mjs` parses these lists out of the source and throws a
named error when it cannot find them, which is how the move was caught
immediately rather than silently producing metadata with no custom icons in it.

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

For a listbox, menu or tree, three hooks over core's arithmetic do the
keyboard: `useListNavigation` (arrows, Home, End, wrapping, skipping disabled
items), `useTypeahead` (printable-character jumping) and `useRovingTabIndex`
(one tab stop for a group of controls, which `Toolbar` and
`RichTextEditor`'s toolbar share). Reach for both rather than
writing key handling by hand — `Combobox` clamped with `Math.min`/`Math.max`
and so stopped where `Select` next door wrapped, and `Select` had no typeahead
at all while `<pf-select>` did. `useTypeahead` holds its buffer in a **ref**,
because the buffer never reaches the DOM: what renders is the active index the
caller sets from the match.

**The typeahead branch goes after the activation branch.** A space is an
activation key in a listbox and is deliberately not a typeahead character, so
checking typeahead first puts a space into the buffer instead of selecting.

For a roving tab stop, three rules the `Calendar` port established:

- **`aria-disabled`, never `disabled`, on an item the focus must cross.** The
  ARIA pattern for a grid or a list is that focus moves freely while
  activation refuses, and a `disabled` button cannot take focus at all — so a
  long blocked stretch becomes uncrossable. Style on
  `[aria-disabled='true']` and refuse in the handler, because an
  `aria-disabled` button still fires a click.
- **Derive the focused item from the visible range; never synchronise it in an
  effect.** `CalendarGrid` reads its stored day through `monthDate` at render
  time, so the two cannot disagree. An effect that re-seated it worked but
  left one render where the focused day was not rendered — which means no item
  carries `tabIndex={0}` and the widget drops out of the tab order entirely.
  `react-hooks/set-state-in-effect` flags it.
- **Put the key handler on the items, not on their container.** A
  `role="grid"`/`role="listbox"` wrapper that never takes focus should not
  carry one (`jsx-a11y/interactive-supports-focus` says so), and the key
  always arrives at an item. This changes how the tests drive it: a synthetic
  event on the container never reaches the items, because React events bubble
  up, not down.

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
npm run test              # core, then react, then elements -- all single pass
npx vitest                # watch mode, from the package you are working in
```

Every workspace's `test` script is `vitest run`, so the root `test` is a single
pass and safe in CI. It chains the three packages behind one name, though, so
`.github/workflows/ci.yml` runs them as four separate steps — core, react,
elements unit, elements browser — each with its own `timeout-minutes`. A hang
under the chained name says only "Run npm run test", which is no help at all
when GitHub serves the logs from a host your client may not be able to reach.

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
  element does not inherit them. Three further rules, each learned from a
  defect the consumer apps caught:
  - **Reflect `name`.** The submission name comes from the `name` _content
    attribute_, not the property. The generated React bindings set properties,
    so an unreflected `name` leaves the control nameless and absent from the
    submission with every other sign of working.
  - **`setFormValue(null)`, not `''`, for an unchecked box.** An unticked
    checkbox is absent from the submission entirely; empty-but-present is a
    different thing, and a server telling "unticked" from "not sent" relies on
    it.
  - **`formResetCallback` restores the initial attribute**, not an empty value
    — verified against a native `<input value="initial">` and
    `<input type=checkbox checked>`, both of which come back to their attribute.
    The validity precedence (`error` beats `required`) lives in
    `src/form-validity.ts` so the controls cannot disagree about which message
    wins. `scripts/check-built-packages.mjs` checks every generated value
    accessor is exported from `elements-angular/src/public-api.ts`, which is
    hand-written while the accessors are generated.
- **Data-driven elements take child elements, not `options` arrays.** `<pf-select>`
  gets `<pf-option>` children; a consumer loops in their own template. Decided
  in `WEB-COMPONENTS-PLAN.md` §2.1, and forced for radios: a form-associated
  custom element gets no radio grouping from the browser, so a group element
  has to own single selection. `pf-radio-group` is the worked example — it is
  the form control, holding the one `name` and the one `value`, and
  `pf-radio-button` only asks to be chosen.
- **A child control restores its own DOM state before asking.** A native
  `<input type="radio">` checks itself the instant it is clicked, before the
  group has any say. `pf-radio-button.onChange` writes the dot back to its own
  `checked` first and then emits, which makes a disabled group, a disabled
  choice and a consumer holding `value` all correct without the group having to
  undo anything.
- **An overlay is a `popover`, not a portal.** `createPortal` has no
  equivalent inside a shadow root, and a positioned element there is clipped by
  any ancestor's `overflow` and loses to any higher stacking context. A
  `popover` opened from a shadow root is promoted to the top layer and escapes
  both — measured: it beats a `z-index: 999` sibling from inside an
  `overflow: hidden` box, where a plain absolute element in the same place
  loses. `pf-tooltip` is the worked example, and
  `scripts/smoke-consumer.mjs` asserts it against a real build by putting the
  tooltip in a 120x40 clip box.
- **A `popover` is centred until you opt out, so `left`/`top` lie.** The UA
  stylesheet gives `[popover]` `inset: 0` and `margin: auto`, which centres it
  in the viewport; setting `left` then offsets an inset that `margin: auto`
  re-centres within. Measured: `left: 120px` on a 180px-wide popover in a
  600px viewport lands at **263**. Every panel therefore goes through
  `src/place-popover.ts`, which sets `inset: auto; margin: 0` inline alongside
  the coordinates — inline as well as in the stylesheet, because the test
  projects apply no `styleUrl` CSS. The bug survived three ported overlays
  because the obvious assertions cannot see it: `top >= anchor.bottom` is true
  of a viewport-centred panel whose trigger sits near the top, and a
  hit-test at the panel's own centre hits the panel wherever it is. The
  assertion that does see it is the box landing at the coordinate it was
  given, which each overlay spec now makes.
- **A wrapper around a `<slot>` cannot be collapsed from CSS.**
  `.icon:not(:has(*))` reads as "hide this when nothing was slotted in" and
  never matches, because the `<slot>` element is itself a child — measured.
  `pf-menu-item` shipped that rule and it was costing one `--space-2` in front
  of the label of every item with no icon, so labels in a menu that mixed the
  two did not line up. Two ways out, and which one depends on whether the box
  has to exist: style `::slotted(*)` and drop the wrapper, since an
  _unassigned_ slot is `display: contents` and generates nothing (what
  `pf-menu-item` does now), or ask the slot in JS and render accordingly (what
  `pf-slideout-menu`'s footer does, because it carries a border and padding).
  Taking the JS route, keep the slot in the tree and hide it — a slot that is
  not rendered never fires `slotchange`, so omitting it means content added
  later stays invisible for good.
- **A `::part()` on a slot wrapper is not worth having.** The convention above
  exists because a consumer cannot reach _shadow-internal_ nodes. Slotted
  content is their own element, which their own stylesheet already selects, so
  wrapping it in a part adds a hook for nothing and an obstacle to removing the
  wrapper later.
- **Assert an animation with `getAnimations()`, and assert it at all.**
  `pf-modal` animated with `var(--duration-medium)`, which is not one of the
  three duration tokens (`fast`, `moderate`, `slow`). An undefined custom
  property makes the whole shorthand invalid at computed-value time, so
  `animation-name` computes to `none` and nothing runs — its entrance animation
  had never played, and nothing noticed because no test looked. The two failure
  modes are told apart by what the computed values say, which is why
  `getAnimations()` is the only check that sees both: an undefined token reads
  `animation-name: none; duration: 0s`, while a missing `@keyframes` copy reads
  a perfectly good name and duration and still runs nothing. Both measured, by
  reintroducing each into a real build. Prefer the `--pf-transition-*` aliases
  over raw duration and easing tokens — that is what the React layer uses, and
  an alias cannot be half-right.
- **Wait for an exit animation on `Animation.finished`, never `animationend`.**
  An `animationend` listener never fires when no animation ever started, and
  there are three ordinary ways for that to happen: `prefers-reduced-motion`
  sets `animation: none`, neither Vitest project applies `styleUrl` CSS at all,
  and a consumer may not have loaded the stylesheet. `pf-notification.dismiss()`
  reads `getAnimations()` after a frame and resolves immediately when the list
  is empty — measured both ways: swapping in the listener version hangs four of
  its five browser tests to a 15s timeout.
- **An overlay cannot describe its trigger with an IDREF.** `aria-describedby`
  does not cross a shadow boundary, and `ariaDescribedByElements` silently
  reads back empty when handed an element from a root the trigger does not own
  — both measured. Copy the text onto the trigger as `aria-description`
  instead; Chromium's accessibility tree reports it identically to a same-root
  IDREF, also measured. And watch the content with a `MutationObserver`:
  `slotchange` fires when the assignment changes, not when text inside an
  already-assigned node is edited, so without it the visible tooltip updates
  while the accessible description goes stale.
- **An IDREF cannot point into a shadow root, but an element reference can
  point out of one.** The two cases are opposite directions of the same rule,
  and both are measured against Chromium's accessibility tree. `pf-tooltip`
  needs a light-DOM trigger to reference a panel _inside_ its shadow root:
  invalid scope, and `ariaDescribedByElements` reads back empty, hence
  `aria-description`. `pf-command-palette` needs the reverse — an input inside
  its shadow root referencing a slotted option in the document tree, which is
  an ancestor scope, and that is allowed. Measured side by side: a same-root
  IDREF resolves, a cross-root IDREF is **absent from the tree entirely**, and
  `ariaActiveDescendantElement` resolves to the right option. So an overlay
  copies text, while a combobox over slotted options sets the element.
  Assigning the property makes the platform write `aria-activedescendant=""` —
  an empty attribute, not a stale id — which is its way of saying the real
  value is the element reference; measured on a plain input with no framework
  involved. Feature-detect it: where element reflection is missing there is no
  cross-root equivalent, and the active option stops being announced while the
  arrows and Enter still work.
- **Grouping slotted children has to be structural.** One `<slot>` renders
  every assigned child in source order, and a shadow root cannot wrap a subset
  of them in a box, so a `group` _name_ on each item — which is what the React
  `CommandPalette` takes — has no equivalent. `pf-command-group` is the answer,
  and it is the §2.1 idiom anyway: the consumer nests.
- **Reflect any prop a selector will look for.** Already true of `name` on a
  form control, and true for the same reason wherever else code reads an
  attribute: the generated bindings set props as **properties**, so an
  unreflected prop leaves no attribute at all. `pf-command-item.value` was
  unreflected, so the palette's own `[value=...]` query matched nothing and
  every selection reported `''` — in the consumer apps only. Every browser
  test passed, because a test fixture writes `value="new"` into HTML and so
  creates the attribute the bindings never would. Prefer reading the property
  and keep the reflection for consumers; a test that sets the property is the
  one that proves it.
- **Let the browser dismiss it.** `popover="auto"` does light-dismiss and
  Escape itself, from inside a shadow root — measured with trusted input: a
  real outside click and a real Escape both close an `auto` popover while a
  `manual` one stays open. So `pf-popover` has no outside-click listener, and
  `dismissable="false"` is simply the `manual` switch (with an Escape handler
  of its own, since `manual` gets no help). Likewise `<dialog>.showModal()`
  gives the focus trap, Escape and the backdrop — measured: focus moves inside
  and a light-DOM button cannot take it back — so `pf-modal` needs none of
  core's `trapFocus`. The one thing `showModal()` does **not** do is lock page
  scroll, also measured, so the element does that itself.
- **Light-dismiss needs trusted input, so test it with `userEvent`.** A
  synthetic `.click()` or `dispatchEvent(new KeyboardEvent(...))` does not
  trigger it — measured — which makes a test written that way pass whether the
  feature works or not. Import `userEvent` from `vitest/browser` for
  anything the browser itself dismisses.
- **Emit the state change from `@Watch`, not from the DOM event.** Both
  `pf-popover` and `pf-modal` first announced their change from the `toggle` /
  `close` handler, and both fired for the browser-driven path and for none of
  the user-driven ones: by the time the DOM event arrives the element has
  already moved its own `open`, so the guard there sees no change. The watch is
  the one place every path passes through. Mirror the DOM event back into
  `open` and let the watch do the announcing.
- **Date arithmetic belongs at midday, and parsing is not `new Date()`.**
  Everything in `packages/core/src/date.ts` pins to 12:00, because a date at
  midnight is one DST shift from being the previous day and `addDays` across a
  boundary then loses or repeats one. Day steps go through the `Date`
  constructor rather than millisecond offsets for the same reason. Two further
  traps the tests pin: `new Date('2024-03-15')` parses a bare `YYYY-MM-DD` as
  **UTC**, so it is the 14th for anyone west of Greenwich — `parseISODate` is
  local and rejects the 31st of February rather than rolling it forward — and
  a month step from the 31st clamps into a shorter month instead of
  overflowing, since `new Date(2024, 1, 31)` is the 2nd of March.
- **A grid is one tab stop, not one per cell.** `pf-calendar` keeps `tabindex`
  at 0 on the focused day and -1 on the other 41, moves with the arrows
  through core's `moveCalendarDate`, and gives the new cell DOM focus in
  `componentDidRender` — the old button may not exist after the month scrolls.
  Focus crosses a disabled day while activation refuses it, which is the ARIA
  pattern and the only way past a long blocked stretch. The React `Calendar`
  has none of this and is 42 tab stops; `todo.md` has the fix.
- **`display: contents` is what makes a semantic row work in a CSS grid.** The
  grid pattern needs `role="row"` wrappers, and a row that forms a box of its
  own takes its seven cells out of the grid's columns, so nothing lines up
  under the weekday headers. `scripts/smoke-consumer.mjs` asserts the computed
  `display` of a row and the grid's column count, because neither test project
  applies the stylesheet that sets them.
- **Catch a child element's event on the child, not on the host.** A Stencil
  event is composed, so by the time it reaches a `@Listen` on the host it has
  been retargeted _to_ the host — a wrapper that re-emits its child's event
  cannot tell the two apart by `event.target`, since both read as the host.
  `composedPath()[0]` can, but the real problem is worse:
  `stopPropagation()` on a host listener does not stop the consumer's listener
  on that same node, so every pick from `pf-date-picker` reported twice until
  a test counted them. Attaching the listener to the child in a `ref` stops
  the event before it reaches the host at all, and does not depend on
  listener registration order the way `stopImmediatePropagation` would.
- **A same-root IDREF is the one that works, so use it where you have one.**
  `pf-dropdown` cannot set `aria-controls`, because its trigger is slotted
  light DOM and its panel is in the shadow root. `pf-date-picker` renders
  both into its own shadow root, so the reference resolves and is worth
  having — the same measurement that showed a cross-root IDREF absent from
  the accessibility tree showed a same-root one resolving.
- **An _imported_ type alias defeats Stencil's attribute coercion; an inline
  union does not.** Stencil converts an attribute string using the prop's type
  as _written_, and it cannot resolve a name it had to import. Measured side
  by side in a real DOM: `@Prop() hourCycle: HourCycle` on `pf-time-picker`
  — where `HourCycle` is `12 | 24` imported from core — receives
  `hour-cycle="12"` as the **string** `"12"`, so `=== 12` is false and the
  element silently stayed on its 24-hour branch, while
  `@Prop() weekStartsOn: 0 | 1` written out inline on `pf-heatmap` receives
  `week-starts-on="1"` as the **number** `1`. `docs.json` is the tell, and it
  is `complexType.original` that matters, not `type`: both record
  `resolved: "12 | 24"`-style text, but the first has
  `original: "HourCycle"` with an `import` reference and the second has
  `original: "0 | 1"`.
  The earlier note here blamed the union and was wrong; it was measured only
  in the mock DOM through the aliased prop, which hid the distinction.
  Either way, read such a prop through a getter that coerces
  (`Number(x) === 12`): it costs nothing, and it also covers a consumer who
  sets the _property_ to a string.
- **One form control can submit several entries.** `setFormValue` accepts a
  `FormData`, and every entry in it reaches the submission — measured, along
  with the fact that the element's own `name` attribute is then **ignored
  entirely**, so the keys have to be built into the `FormData` itself.
  `pf-date-range-picker` uses it to submit `${name}-start` and `${name}-end`,
  which is what a server handling a form wants, rather than one field a
  handler has to split. Its `value` property stays a single round-trippable
  `start/end` string.
- **Keep a half-made selection out of `value`, and then remember to read it.**
  `value` is what gets submitted, so a range with only one end does not belong
  in it — a form read mid-selection would see a start with no end. The trap is
  the other half: `pf-date-range-picker` held the pending start beside `value`
  and still fed `value` to the selection state machine, which then saw a range
  with no start and, correctly, began a new one. Every second click restarted
  instead of closing the range. Three browser tests caught it; whatever holds
  the in-progress state is what the state machine has to be given.
- **A synthetic key event needs `composed: true` to leave a shadow root.**
  `bubbles: true` alone is not enough: bubbling stops at the boundary, so an
  event dispatched on a shadow-internal trigger never reaches a `@Listen` on
  the host. Real key events are composed, so a test written without it is
  testing its own plumbing — every one of `pf-select`'s twelve keyboard
  assertions timed out until it was added. `pf-dropdown`'s tests do not need
  it, because its trigger is slotted light DOM and already outside the root.
- **`observeAnchoredPosition` reports `width` or `minWidth`, never both.**
  `matchAnchorWidth: true` (the default) gives a `width`; `false` gives a
  `minWidth`. `pf-select` wants the listbox to match its trigger and its
  `onChange` was copied from `pf-dropdown`, which wants the opposite — so it
  read only `minWidth`, found it undefined, and left a 156px listbox under a
  1216px trigger. Apply whichever is present. Neither Vitest project can see
  this, since the width comes from a measured layout; the consumer smoke test
  caught it.
- **An unresolved `var()` computes to the _initial_ value, not the inherited
  one.** Measured: with `--pf-option-text-disabled` deleted,
  `color: var(--pf-option-text-disabled)` computes to `rgb(0, 0, 0)` rather
  than inheriting the host's colour. That matters for how a missing alias is
  detected — a check comparing a disabled option's colour against a plain
  one's is **vacuous**, because the two differ whether the mapping exists or
  not, and it passed with the mapping deleted. Look for the initial value
  instead; nothing in this palette is pure black, so black is the fingerprint.
  The same goes for any `--pf-*` the smoke script asserts: compare against
  what an unresolved property actually leaves behind, not against a sibling.
- **Watch `name` whenever the submission name is built into a `FormData`.**
  A control that hands `setFormValue` a plain string takes its name from the
  reflected attribute, so the platform notices a change by itself. One that
  builds a `FormData` — `pf-multi-select` with a repeated key, and
  `pf-date-range-picker` with its two — bakes the name in, so without a
  `@Watch('name')` a name assigned after load never reaches the submission.
  The range picker had that gap and its test passed anyway, because the
  assignment happened to land before `componentWillLoad`; a version that sets
  the name well after load fails without the watch and the old one still
  passes, which is how the luck was visible.
- **A repeated key in that `FormData` submits once per value.** Measured, and
  it is what makes one multi-choice control behave like a native `multiple`
  select: `data.getAll(name)` reads the values back as an array, in the order
  they were appended. The React `MultiSelect` gets the same shape from
  rendering one hidden `<input>` per selection.
- **Fold a batch of additions; never loop a state setter over closed-over
  state.** The React `TagInput`'s paste handler called its add helper once per
  pasted candidate, and that helper built `[...currentTags, tag]` from the
  render's closure each time — so the last `setTags` won and pasting
  `alpha, beta, gamma` left one tag, with the maximum and the dedup equally
  blind. Both layers fold now: each candidate is added to the _result_ of the
  previous one. Three React tests cover it and fail against the old handler.
  Worth looking for wherever a handler adds several things at once.
- **`offsetLeft` cannot measure a slotted child.** `offsetParent` is resolved
  in the element's _own_ node tree, so for a slotted child it is the nearest
  positioned ancestor in the consumer's document and never the shadow box the
  child is actually laid out in. Measured twice: inside a `position: relative`
  wrapper a `pf-tab` reported `offsetParent: #wrapper` and `offsetLeft: 196`
  where its offset within the strip was 186, and placing `pf-tabs`' sliding
  indicator from `offsetLeft` in a real build painted it at 64 against a tab
  starting at 32. Measure with rect deltas plus the container's `scrollLeft`
  instead — which is also what makes the result scroll-invariant, since both
  rects move together when the container scrolls. The React `Tabs` _can_ use
  `offsetLeft`, because nothing is slotted there; that is the asymmetry to
  remember.
- **A child can assign itself to a slot.** `pf-tab` sets `slot="tab"` on itself
  in `connectedCallback`, which is what lets a consumer write one `pf-tab` and
  one `pf-tab-panel` per item — interleaved, as a loop over data produces — and
  still have the tabs land in the strip and the panels in the stack. Assigning
  `slot` moves the node between slots and fires `slotchange` on both, but
  writing the same value again is not a mutation, so it does not loop. Leave a
  `slot` the consumer set alone, so the explicit spelling keeps working.
- **Playwright will not click an `aria-disabled` element.** Its actionability
  check reads `aria-disabled="true"` as "not enabled" and waits for it to
  clear until the test times out — measured, 15s. The browser has no such
  scruple, since `aria-disabled` is not `pointer-events: none`, so a real click
  does arrive and swallowing it is the element's job. Dispatch the click for
  that one assertion; `userEvent` is still right for everything the browser
  itself does.
- **A transitioned length has to be read after `Animation.finished` too.** The
  rule above is about an animation existing; this is about measuring one. The
  consumer smoke read `pf-progress-bar`'s fill width straight after load and
  failed 1 run in 3 at 84–86 of an expected 90 — a flake that reads exactly
  like a broken percentage. Angular sets `value` as a property after
  hydration, so the bar animates up from empty, where React's is set at
  creation and never moves. Awaiting the fill's animations costs the React app
  nothing, because the list is empty there.
- **A rule _between_ slotted children belongs in the child.** `::slotted()`
  takes a compound selector and no combinator, so there is no way to write
  `::slotted(item + item)` from the container's sheet. `:host(:first-child)` in
  the child's own sheet says the same thing and needs no coordination — which
  is how `pf-accordion-item` draws a rule above every section but the first.
- **`inert` is not implied by a collapsed height.** `pf-accordion-item`'s panel
  animates to a `0fr` grid row with `overflow: hidden`, which hides its content
  and leaves it perfectly focusable: without `inert` on the closed panel, the
  next Tab from a closed header lands on a link inside the box that just shut.
  Three tests catch it, one of them simply tabbing through the group.
- **A dynamic heading tag has to be cast, not built.** Calling `h` with a
  computed tag string — "h" plus the level — type-checks under the test
  transpile and fails the Stencil build, because the overload for a plain
  string tag types `class` as a className map and rejects a plain string.
  Assign the tag to a variable cast to one of the literals (`as 'h3'`) and use
  ordinary JSX, which keeps the props checked against a real heading element.
  `pf-accordion-item` is the worked example.
- **Keep a group's answer out of the prop the consumer asked with.**
  `pf-breadcrumbs` resolves which crumb is the current page — the one marked,
  or the last — and first wrote that answer back to the children's `current`.
  It looked stable, and re-syncing did reach the same answer. Appending a crumb
  did not: the crumb that had merely happened to be last now carried `current`,
  so it read as a crumb the consumer had marked and kept the mark. The ask
  (`current`) and the answer (`current-page`) are separate props now, and a
  browser test that appends a crumb is what caught it. Worth remembering
  wherever a group writes derived state onto its children: `pf-tabs` is safe
  only because the ask lives on the group, as its `value`.
- **A repeated ornament cannot be a slot.** A slot renders its assigned
  content once, in one place, so a separator that has to appear between every
  pair of children has no slot form — `pf-breadcrumbs` takes the separator as
  a _string_ where the React `Breadcrumbs` takes a `ReactNode`, and pushes it
  down for each crumb to draw its own.
- **An undefined custom property computes the whole declaration away.**
  Measured in Chromium: `box-shadow: var(--focus-ring-shadow)` computes to
  `none` where that property is defined nowhere, while a defined one or a
  `var(…, fallback)` computes normally. The React `ProgressSteps` asked for
  exactly that name, which existed in no stylesheet, so the ring around the
  current step had never been drawn in either layer — the same shape as
  `pf-modal`'s `--duration-medium`, and invisible for the same reason: nothing
  looked. Both are fixed, and `scripts/smoke-consumer.mjs` now reads the
  computed `box-shadow` of the current step's marker, probed by putting the
  undefined name back.
- **Asking a slot in JS is the only way to size a box _around_ it.** The
  `:has(*)` half of the `pf-menu-item` rule above is worth stating on its own,
  because it keeps coming back: a marker, a footer or a badge wrapper that has
  to change when something is slotted in cannot be selected in CSS, and
  `::slotted()` reaches the content rather than the wrapper. `pf-timeline-item`
  reads its icon slot in `componentWillLoad` _and_ on `slotchange` — the first
  so the marker is the right size at first paint, the second because an icon
  can arrive later — and puts a class on the marker. Probed by swapping the
  class for `.marker:has(*)`: both markers then measure 28px in a real build,
  and `scripts/smoke-consumer.mjs` catches it.
- **Coerce a number a loop counts with.** The attribute-coercion trap has a
  second shape beside the imported-alias one: `max="5"` on `pf-rating-stars`
  arrives as a number because the prop is typed `number`, but anything built
  from `Number(x)` by hand — or read off an element rather than a prop — is a
  string, and `Array.from({ length: "5" })` is **empty** rather than five long.
  Read such a value through a getter that coerces and clamps, so a nonsense
  value renders nothing rather than throwing.
- **A one-class `.empty { display: none }` loses to the box's own `display`.**
  Specificity ties break on source order, and a box that sets
  `display: inline-flex` further down the file wins — so every hidden-when-empty
  box in `pf-metric-card`, `pf-empty-state` and the three headers was drawn
  anyway. Neither test project could see it, because neither applies the
  stylesheet; the consumer smoke caught it on the first run, as a bare metric
  card drawing all three of its empty boxes. Written as `.icon.empty,
.action.empty { … }` now, which beats them whatever the order.
- **`::slotted()` takes a compound selector, so reach for a pseudo-class.**
  The limit has two sides. A combinator cannot be written at all —
  `::slotted(pf-avatar) + ::slotted(pf-avatar)` matches nothing, measured: the
  overlap in `pf-avatar-group` vanished and the smoke caught it — while a
  pseudo-class _inside_ the parens is part of the compound selector and works,
  so `::slotted(pf-avatar:not(:first-child))` is how that rule is written. The
  same limit is why `pf-accordion`'s rule between sections lives in the child.
- **Reach a nested element's colours through its own custom properties.**
  `pf-avatar-group`'s `+N` chip is a `pf-avatar` in the shadow root — it needs
  an avatar's shape, size and ring, and reusing the element is how it gets all
  three — but a rule in the group's sheet cannot reach inside it. Setting the
  `--pf-avatar-bg` and `--pf-avatar-text` that `pf-avatar` already reads does,
  because custom properties inherit through the boundary. Assert the bridge by
  reading the property off the element, not by comparing colours: the chip's
  token and the avatar's own both resolve to
  `--color-semantic-background-subtle`, so a colour comparison passes whether
  the bridge applied or not.
- **A controlled consumer overwrites what you assign from outside.** Setting
  `el.value` from a test or a script is undone by the host framework's next
  render, because it holds the value and writes it back on every event —
  measured in the consumer smoke, where a stepper assigned `10` was back at
  `2.5` a frame later. Drive such an element the way a user does (click the
  button, press the key) and let the framework follow; assignment is only
  reliable on an element nothing else owns.
- **CSS tables, not a grid, when a row has to be a box.** A grid needs its
  semantic rows to be `display: contents` for the cells to line up in columns
  (the `pf-calendar` rule above), and an element with no box takes no
  background and no `:hover` — so striping and row hover would both have to be
  pushed down in JS. `display: table` / `table-row` / `table-cell` gives a row
  a box, sizes the columns itself, and takes a `width` from a header cell.
  Measured by making `pf-table-row` `display: contents` in a real build: the
  row reports 0px tall, every cell lands in one anonymous row so the columns
  stop lining up, and the explicit 140px column collapses to 106px. Four smoke
  checks catch it. The one thing CSS tables cannot do is `colspan`, so the
  empty state is a `display: table-caption` box with `caption-side: bottom` —
  the only box in a CSS table that spans every column.
- **An element reports a sort; it does not reorder a consumer's rows.**
  `pf-table` owns the header buttons, `aria-sort` and the indicator, and emits
  `pfSortChange`. Sorting would mean moving elements in the consumer's DOM,
  which their framework undoes on its next render and whose reconciliation it
  breaks on the way. `compareSortValues` and `sortRowsBy` are in core so the
  order a consumer produces matches the React `Table`, which does sort for
  itself.
- **A nested host cannot take a roving tabindex.** Measured in Chromium: a
  `tabindex="0"` host slotted into another host's shadow tree is skipped by
  sequential focus navigation **entirely** when the outer host's tabindex is
  negative — Tab goes straight past it to the next element, while
  `element.focus()` still works, which is what makes the trap subtle. That is
  exactly a nested `pf-tree-item` under a roving tabindex, so the first version
  of `pf-tree-view` was unreachable by Tab. The tree holds the tab stop itself
  and names the active item with `aria-activedescendant`, which resolves
  because the items are its own light-DOM descendants — the same-root IDREF
  rule again. Both the minimal case and the elements themselves are asserted
  in the browser spec, and the smoke checks the real build. A flat group
  (`pf-tabs`, `pf-toolbar`, `pf-radio-group`) is unaffected: its items are
  children of the group, not of each other.
- **`slotchange` does not cross a shadow boundary, so a grandchild arrives
  unannounced.** It is not composed: a tree hears its own slot change, never
  its children's. `pf-tree-item` therefore emits a `pfTreeStructure` event
  from its own `slotchange` and the tree listens for that — without it an item
  appended to a branch is never given a level, an id or a place in the
  keyboard order, which a browser test catches.
- **A strip of slides is CSS the tests cannot see, so measure it in the
  build.** `pf-carousel` moves one track with `transform: translateX(-N00%)`,
  which only lands a slide in the viewport because each slide is
  `flex: 0 0 100%` — a percentage transform resolves against the track's own
  border box, so one step is exactly one of its widths. Neither Vitest project
  applies `styleUrl` CSS, so both halves are invisible to them: with
  `flex: 0 0 auto` the slides measured 436px in a 1190px viewport and stacked
  inside the clip, and every unit assertion still passed. The browser spec can
  at least read the matrix the browser laid out by (`DOMMatrixReadOnly` over
  the computed `transform`, which is the inline style, not the sheet); the
  geometry — slide width, the next slide sitting past the clip, and the one it
  lands on coming to rest at the viewport's edge — is `scripts/smoke-consumer.mjs`'s
  job. All three measured by reverting each declaration in a real build.
- **`inert` is the only thing that keeps an off-screen slide out of the tab
  order, and a unit test cannot tell.** The fast project can see the attribute;
  it cannot see that the attribute does anything. Measured in Chromium and in
  the real build: a button inside a scrolled-out `pf-carousel-slide` refuses
  `element.focus()` outright, and the same button takes focus the moment its
  slide is the one on show. `aria-hidden` alone leaves it focusable — removing
  `inert` fails the browser spec and the consumer smoke and nothing else.
- **One timer, restarted, not stacked.** An autoplaying carousel whose interval
  a consumer changes mid-run will step twice as often for no visible reason if
  `startTimer` does not clear first, and a stacked timer is indistinguishable
  from a fast one in a screenshot. `pf-carousel.startTimer()` begins with
  `stopTimer()`, and the browser spec steps on a 60ms interval, swaps it for
  40ms, then turns autoplay off and asserts the index holds still for 200ms —
  the one assertion a leaked interval fails.
- **The mock DOM cannot parse `:scope`.** Measured: `querySelector(':scope >
[slot="brand"]')` throws out of jQuery's selector engine
  ("unsupported pseudo: scope") rather than returning nothing, and Stencil's
  `safeCall` then abandons the rest of the lifecycle method. Walk
  `el.children` and read each `slot` attribute instead, which is what
  `pf-slideout-menu` already did.
- **An element cannot know that it is the page's header.** The React
  `HeaderNavigation` renders a `<header>`, which is the banner landmark at the
  top level of a document, but a second banner on a page is a defect rather
  than a decoration — and a custom element has no way to tell whether it is the
  first. `pf-header-navigation` therefore renders only the `<nav>` landmark in
  its shadow root and carries no host role; a consumer who wants a banner puts
  it inside their own `<header>`. The same reasoning applies to `main` and
  `contentinfo`.
- **An anchor has no disabled state.** `aria-disabled` on an `<a href>` leaves
  it focusable and clickable, so a disabled `pf-nav-item` renders no anchor at
  all — a plain box with `aria-disabled="true"`, which is also what the React
  `SidebarNavigation` does for a disabled item with an `href`. The smoke
  asserts both halves against the real build: the tag is a `span`, and the box
  does not take focus.
- **A shared child's colours have no `:root` default.** `pf-nav-item` is one
  element in two navigations, so it reads a generic `--pf-nav-item-*` set that
  each navigation defines on its own host — the `pf-option` arrangement, and
  the only one that works, since custom properties inherit through a shadow
  boundary and `:host-context` is not in Firefox. Leaving the set out of
  `theme.css` is deliberate: with a `:root` fallback that happens to resolve to
  the same tokens, _every_ assertion about the bridge is vacuous — removing the
  bridge changes no colour and the smoke stays green. Without one, a missing
  bridge kills the declaration at computed-value time and shows up as an item
  with no colours at all. Both measured by deleting the bridge from the
  navigation's stylesheet.
- **A list the consumer groups cannot also be a list the group renders.**
  `pf-sidebar-navigation` renders no `<ul>` of its own: its children are
  `pf-nav-section`s, and a list whose children are sections rather than items
  is not a list. Each section owns its own `<ul>` and names it with a
  **same-root** IDREF — the title and the list are both in the section's shadow
  root, so the reference resolves, where an `aria-labelledby` from the host
  could reach neither. An untitled section sets no `aria-labelledby` at all,
  because pointing at an empty box names the list with an empty string rather
  than leaving it unnamed.
- **A slot's own `textContent` is the fallback, not what was slotted.** It bit
  the smoke here, reading a section title through `aria-labelledby`: the title
  box holds only a `<slot>`, so its `textContent` is `''` while the
  accessibility tree names the list perfectly well from the flattened tree.
  Read `assignedNodes()`/`assignedElements()` when checking what a reader would
  get.
- **Measure the thing a rule actually changes, not the thing nearby.** Three
  assertions written for `pf-nav-item`'s vertical orientation were vacuous, and
  each was only found by reverting the rule and watching the smoke stay green:
  the item host's width (a grid child of the list stretches to it whatever the
  item says), the link box's width (a block-level flex container fills its
  container with or without `width: 100%`), and the `--pf-nav-item-*` value
  compared between the two navigations (the sidebar's and the header's aliases
  resolve to the same token today). What does bite is the same element being
  taller and more generously padded in the sidebar than in the header, and the
  label's `flex-grow` being what pushes a badge to the far edge. **Revert every
  new assertion once.** A check that cannot fail is worse than no check: it
  reads as cover.
- **A JSX `onKeyDown` listens for `keyDown` in the mock DOM.** Measured, and
  the reason every keyboard test in this package is a browser test: Stencil
  resolves a JSX event prop by checking whether the lowercased member is a
  property of `window`, and `'onkeydown' in window` is **false** in the mock
  DOM, so it falls back to re-casing and registers the listener under
  `keyDown`. A dispatched `keydown` never reaches the handler — silently, with
  no error anywhere — while a hand-written
  `handle.addEventListener('keydown', …)` on the same node fires perfectly.
  Dispatching an event named `keyDown` runs the handler, which is how the
  mechanism was confirmed. So a keyboard assertion in the `unit` project is
  not a weaker test, it is a test of nothing.
- **Pointer drags end on `pointercancel` as well as `pointerup`.** A drag the
  browser takes away — a touch turning into a scroll gesture, a window losing
  focus mid-drag — fires only `pointercancel`, and a splitter listening for
  `pointerup` alone then follows the pointer around with no button held.
  `pf-resizable` listens for both, on the host rather than the handle, and its
  browser spec cancels a drag and then moves the pointer; removing the one
  decorator fails exactly that test. `touch-action: none` on the handle is the
  other half — without it a touch drag scrolls the page instead, which the
  smoke asserts because no test project loads the stylesheet.
- **A zero-length box is an ordinary state, so guard the division.** A
  splitter inside a collapsed disclosure, or dragged before its first layout,
  measures zero: `(position - start) / 0` is `Infinity`, or `NaN` when the
  pointer is at the box's own edge, and `flex-basis: NaN%` is invalid at
  computed-value time and takes the panel away. `splitSizeFromPointer` returns
  `null` instead and the caller keeps the size it had. Setting the case up in
  a browser test needs `display: block` in the _inline_ style as well as the
  width, because neither project applies `styleUrl` CSS and an inline box
  ignores `width` — the first attempt measured the content and clamped to
  `min` instead.
- **`accept` filters the picker, never a drop.** A dropped file passes no
  filter at all, so a dropzone that trusts the attribute accepts whatever is
  dragged onto it — which both layers did. `fileMatchesAccept` in core handles
  the three forms a file input takes (`.pdf`, `image/png`, `image/*`) and
  nothing else, and `validateFileSelection` reports the wrong kind before the
  wrong size, because the kind is the more specific complaint.
- **Merge, then validate; never truncate in between.** The React
  `FileUploader` cut the selection to `maxFiles` and then checked the cut
  list, which made its own "You can upload up to N files" message
  **unreachable**: the extra files were simply gone with nothing said. The
  test that pinned it was called "silently truncates to maxFiles", which is
  the shape of this mistake — the behaviour was written down rather than
  questioned. Core keeps the two steps apart so a caller can refuse a
  selection instead of quietly losing part of it.
- **Clear a file input after _any_ selection, accepted or refused.** A file
  input fires no `change` for an identical selection, so a rejected value left
  in place means picking the same file again does nothing and the error stands
  with no way to retry. And test it through the **picker**, not a drop: a drop
  never populates the input, so the same assertion after a drop passes whether
  the clearing happens or not — measured, by removing the line and watching
  the drop-based test stay green. `input.files` is settable from a
  `DataTransfer`, which is how to drive the picker without one.
- **Count drag depth; a boolean flickers.** `dragenter` and `dragleave` both
  bubble from the dropzone's own children, so moving the pointer from the icon
  to the title fires a leave and then an enter, and a boolean drops the
  highlight in between. A counter incremented on enter and decremented on
  leave does not, and a drop resets it to zero rather than decrementing, since
  the matching leaves never come.
- **One control, one entry per file.** `setFormValue` takes a `FormData`, and
  the element's own `name` attribute is then ignored entirely, so
  `pf-file-uploader` appends every file under its own `name` — which is how a
  native multi-file input submits. Nothing chosen sets `null`, not `''`: a
  file input with no file is absent from the submission, the same distinction
  `pf-checkbox` depends on.
- **The uploader's own complaint is a constraint failure, not just a
  message.** `@Watch` the `@State` holding it as well as the consumer's
  `error` prop, or `checkValidity()` reports a control that is visibly
  showing an error as valid. Two browser tests caught it.
- **Some controls have no Angular `ControlValueAccessor`, and that is the
  answer.** The generator offers accessors that write `value`, a number or
  `checked`; `pf-file-uploader`'s value is a `File[]`, so a text accessor
  would store `[object File]`. An Angular consumer binds `[files]` and
  `(pfChange)`, and the submission still works, because that goes through
  `ElementInternals` rather than through the accessor.
- **`vi.useFakeTimers()` wedges every browser test after it.** It replaces
  `requestAnimationFrame`, which Stencil's render queue runs on, so every
  `await frame()` poll stops resolving — measured: one fake-timer test took
  four others down with it, each to the 15s timeout, and `useRealTimers()` in
  a `finally` did not recover them. Give the component a prop for the delay
  and use real time with a short value. `pf-code-snippet.feedbackDuration` is
  that prop, and it is a real knob anyway: a live region still holding
  "Copied" when the next copy happens announces nothing.
- **A copy button's label is a claim, so read what the clipboard reported.**
  The React `CodeSnippet` wrote
  `if (navigator.clipboard?.writeText) await …writeText(code)` and then set
  `copied` unconditionally, so wherever the API is missing — every insecure
  context, and any iframe without clipboard permission — nothing was copied
  and the button said "Copied". `copyText` in core resolves to a boolean and
  both layers read it. There is deliberately no `execCommand` fallback: it is
  deprecated, needs a focused selection, and fails in most of the same places,
  so it would only be a second silent path to the same false claim.
- **Highlighting is the consumer's, and saying so is the design.**
  `prism-react-renderer` is a React renderer with no framework-free
  equivalent, and every alternative is a large runtime dependency, so
  `pf-code-snippet` renders plain text and shows **slotted markup instead**
  when a consumer provides their own. Line numbers are then withheld, because
  aligning a gutter with someone else's markup needs to know where their lines
  break. The gutter for the plain path is a grid with `grid-template-columns:
subgrid` on each line rather than a table: the numbers only have to share a
  column, and a row here needs no box of its own — the opposite of
  `pf-table`, where the row does.
- **Two copies of a font stack diverge.** Both layers set code in the same
  seven-family monospace list, written out twice. It is now
  `--pf-code-font-family` in `theme.css`, which is where the smoke found it:
  the element had reached for a `--font-family-mono` token that does not
  exist, the declaration died at computed-value time, and the code rendered in
  the sans-serif body font with every test still green.
- **A `contenteditable` and a vdom cannot both own the content.** The person
  types, the DOM changes under the renderer, and the next render puts the old
  content back with the caret at the start. `pf-rich-text-editor` renders the
  editable box **empty, once** and writes `innerHTML` imperatively, only when
  the value it holds and the value in the box differ. It is the one place in
  this package where the render function is deliberately not the source of
  truth.
- **A `label[for]` cannot name a `contenteditable`.** `for` must point at a
  labelable element and a `div` is not one, however convincing its
  `role="textbox"` is. The name comes from an `aria-labelledby` IDREF to a
  label in the **same shadow root**, which is the kind that resolves.
- **"Filled" for a rich-text field means text, not markup.** A browser left to
  itself puts `<br>` or an empty `<p>` into an emptied `contenteditable`, so a
  `required` check against the value would call an empty field filled.
  `applyControlValidity` is given `textContent.trim().length > 0`; a browser
  test types `<p><br></p>` and expects it to still be invalid, and swapping in
  `Boolean(this.value)` fails exactly that.
- **Assert the rule you own, not the one the UA also has.** The smoke's first
  attempt checked a paragraph's `margin-bottom` inside the editor, which the
  UA stylesheet supplies anyway — deleting `.editor p { margin }` kept the
  check green. `p:last-child { margin-bottom: 0 }` has no UA equivalent, so it
  is the margin worth measuring. Same shape as the `.empty` boxes: a
  "different colour" check passes when the colour is _missing_, so assert
  both — not the same as the other box, **and** not transparent.
- **`animate` is a reserved prop name.** `Element.prototype.animate` is the
  Web Animations API, and Stencil refuses to build a `@Prop()` that shadows a
  prototype member — with a warning that reads as advisory and a build that
  fails. `pf-sparkline` takes `animated` where the React `Sparkline` takes
  `animate`; a React component is a function taking props and has no such
  collision. Check any prop name that is also a DOM method: `animate`,
  `remove`, `before`, `after`, `replaceWith`, `scroll`, `focus`.
- **An animation cannot be tested in either Vitest project, at all.** Neither
  applies `styleUrl` CSS, so `getAnimations()` comes back empty whether the
  shadow-root copy of the `@keyframes` exists or not — measured, by writing
  three animation assertions and watching all three fail against a correct
  element. They belong in `scripts/smoke-consumer.mjs`, which also happens to
  be the only place the three failure modes are distinguishable, each
  confirmed by reintroducing it into a real build: a missing `@keyframes` copy
  reads a good name and duration and runs nothing; an undefined duration
  token (`--duration-medium`, which does not exist) computes
  `animation-name: none` and `0s`; and a fade whose `to` is `opacity: 1`
  rather than the stylesheet's own tint finishes opaque.
- **A chart's edge cases are its arithmetic's, so put them in core.** Three in
  the React `Sparkline`, all of which the element would have inherited by
  copying: one value divided by `data.length - 1` and rendered `cx="NaN"`; a
  flat series fell to a `max - min || 1` guard and sat on the bottom edge,
  which reads as a collapse rather than as "no change"; and a
  `buildPath(points, close = false)` whose closing branch interpolated the
  **boolean** into the `d` — unreachable, because every call site passed one
  argument, so the broken code sat there looking fine while the area path was
  written out again inline.
- **`getAnimations()` reports nothing for a finished animation with no fill
  mode.** Both chart entrance animations run correctly on load and are long
  over by the time a consumer-smoke block reaches them, so waiting for them
  waits forever — while the sparkline's survives the same check only because
  it is declared `both`, which keeps a finished animation in effect. Restart
  it to observe it: clear the inline `animation`, let a frame pass, restore
  it. **Not** `void node.offsetWidth`: `offsetWidth` is `undefined` on an SVG
  element, so the usual force-a-reflow idiom is a no-op there and the two
  assignments collapse into one with no restart. Measured by watching the
  check report "ran none" against an element whose `@keyframes` were
  demonstrably present in its adopted stylesheet and whose
  `animation-duration` computed to `0.28s`.
- **`@property` registers from inside a shadow root.** Measured: the pie's
  sweep mask interpolates a `<percentage>` custom property, which an
  unregistered custom property cannot do, and declaring `@property` in the
  element's own `styleUrl` CSS is enough — the registration is
  document-global, so the element does not have to rely on the React library's
  copy being loaded. Deleting it fails the smoke, which is how it was
  confirmed rather than assumed.
- **Filter, then total.** The React `PieChart` took the total of the
  _unfiltered_ values, so one `NaN` made the total `NaN`, slipped past a
  `total <= 0` guard that `NaN` does not satisfy, and left every **surviving**
  slice at `NaN%` — an invalid `conic-gradient` and a chart that drew blank.
  The order is the fix; a `Number.isFinite` guard on the values changes
  nothing, which is how the order was identified rather than guessed.
- **Round a set of percentages together, not one at a time.** Largest
  remainder, in `roundPercentages`: floor everything, then give the leftover
  points to the slices that lost the most. Rounding each on its own shows
  three equal thirds as "33%, 33%, 33%", which invites a reader to notice that
  the breakdown does not add up. Ties break on position so the same data
  always rounds the same way.
- **A legend of slotted labels has to be built from the slices.** A slot
  renders its assigned content once and in one place, so a legend in the
  chart's shadow root could never reach labels that live in the light DOM.
  `pf-pie-slice` renders its own legend row and the chart pushes down the two
  things only it knows — the colour and the share — which is the
  `pf-breadcrumb` arrangement again. The index of the slice in the original
  children is what carries the answer back to the right one, because the
  drawable slices are filtered and their own positions no longer line up.
- **A meter's name says what is measured; the value goes in
  `aria-valuetext`.** The React `GaugeChart` puts the percentage in
  `aria-label`, which leaves a reader told "73%" with no idea what is 73%
  full. `pf-gauge-chart` takes a `label` and reports the percentage
  separately.
- **Both test projects now run in a timezone that has daylight saving.**
  `process.env.TZ = 'America/New_York'` at the top of `packages/core` and
  `packages/react`'s Vitest configs, set before the workers fork so `Date`
  picks it up. The default here is UTC, which has no DST at all — and that
  hides a whole class of date defect: swapping `date.ts`'s midday-pinned
  `addDays` for a millisecond offset makes `buildHeatmapWeeks` lose a day
  across the spring-forward Sunday, which fails under New York and **passes
  under UTC**. Measured both ways; every test in both packages passes under
  both zones, so the change costs nothing.
- **The total of padding cells cannot show a grid's alignment.** A heatmap's
  grid is rectangular, so a week moved forward at the start is a week moved
  back at the end: a Sunday-first and a Monday-first rendering of the same
  range both came to seven padding cells. Count the padding _before the first
  real day_ instead — the first assertion written here passed under both
  alignments.
- **Never name a private getter after a DOM property.** A component class's
  members land on the custom element itself, so `private get children()` on
  `pf-radar-chart` _shadowed_ `Element.children`: `this.el.children` called
  the getter, which called `this.el.children`, and the mock DOM's own
  `getElementsByTagName` — which walks `.children` — recursed until the stack
  ran out. Stencil warns about a `@Prop` that shadows a prototype member
  (`animate` is one, and it fails the build) and says **nothing** about a
  getter. The symptom was 19 tests failing with `Maximum call stack size
exceeded` pointing into the mock DOM's selector engine, which reads as a
  mock-DOM limitation and is not one.
- **An SVG `<text>` cannot hold arbitrary markup**, which is why
  `pf-radar-axis` takes its name as a `label` _attribute_ where the React
  `RadarChart` takes a `ReactNode`. The chart has to draw each name inside
  its own SVG, and the legend row the axis draws for itself uses the same
  string, so the two cannot disagree. A narrower API for a reason, and worth
  saying out loud rather than quietly accepting a `ReactNode` the SVG would
  stringify.
- **`transform-box: view-box` is the initial value now**, so asserting it
  proves nothing — measured, by deleting the declaration and watching the
  check stay green. What the element actually decides is
  `transform-origin`, and a grow-from-the-centre animation without it scales
  about the shape's own bounding box, which moves with the data. Assert the
  origin.
- **Clamp a chart's values into its grid.** A point outside the outer ring is
  drawn outside the viewBox and clipped, so a value above `max` does not
  overshoot — it **disappears**. `radarValuePoints` clamps, and an explicit
  `max` wins over a larger value because a consumer who set a scale meant it.
- **A chart's axis labels and its geometry must come from one tick scale.**
  A chart whose gridlines say 40 while its line peaks at three-quarters
  height is worse than one with no gridlines, so `niceAxisTicks` is the only
  source of both in `cartesian.ts`. Three things the React version got wrong
  inside it: a maximum that is not a number fell through its `<= 0` guard,
  made the step `NaN` and produced an **empty** tick array — after which
  `maxTick` was `undefined` and every coordinate came out `NaN`; the ticks
  were accumulated with `v += step`, so a step of `0.1` printed
  `0.30000000000000004` as a label; and `formatAxisTick` ended in
  `String(Math.round(value))`, so **every** tick on an axis topping out below
  1 printed as `0` — six gridlines all labelled zero on a chart of rates.
- **A negative `width` or `height` on an SVG shape drops the shape.** Not an
  error, not a clamp: the browser discards the element. The React `BarChart`'s
  `(total - gap * (m - 1)) / m` goes negative with enough series, so a chart
  of twenty series across six groups silently drew no bars at all;
  `barGeometry` floors the width at 1. And the first test written for it
  passed with the fix reverted, because one group of twelve still comes out
  positive — the shape only goes negative once the groups are narrow too.
- **Split chart data by what it is, not by one rule.** §2.1 says a consumer
  nests, and that is right for the _series_ — they have names and colours, and
  a legend built in the chart's shadow root could never reach a label in the
  light DOM. The rows are bulk numbers with no identity, so they stay a
  property (an array, or JSON for plain HTML). `pf-line-chart` and
  `pf-bar-chart` share `pf-chart-series` for the same reason `pf-nav-item`
  serves two navigations.
- **A stacked bar chart scales to the tallest stack, not the tallest bar.**
  Obvious once said and silent when wrong: scaling to the tallest single bar
  draws the top of every stack above the plot, where the viewBox clips it.
- **`<label for>` works on a labelable element and nothing else.** A `<video>`
  is not one, any more than a `contenteditable` div is, so the React
  `VideoPlayer`'s `htmlFor` was silently naming nothing and the video had no
  accessible name at all. Both layers use `aria-labelledby` now, and in the
  element it is a same-root IDREF — the kind that resolves. The smoke reads
  the name back through the reference rather than checking the attribute,
  because the attribute was never the part that was wrong.
- **A `<source>` has to be a child of the `<video>` itself**, so slotted
  children cannot work: a slotted `<source>` is a child of the _host_ and the
  video never looks at it. `pf-video-player` takes `sources` and `tracks` as
  properties and renders them inside its shadow `<video>` — one of the few
  places where a property beats the §2.1 nesting idiom, and the browser spec
  proves it by putting a stray `<source>` in the light DOM and watching the
  video ignore it.
- **`safeCall` hides a throw by leaving the last render on screen**, which
  makes "did it survive bad input?" a trap: asserting that the element is
  still there passes whether the guard exists or not, because the _previous_
  render is what you are looking at. Set something else in the same breath —
  `pf-video-player`'s test sets a new `label` alongside the bad `sources` —
  so the assertion only holds if the render actually completed.
- **Wait for the animation, never for a number.** `animationsFinished` in
  core is the one way to do it, and it replaced a hard-coded 220ms
  `setTimeout` in the React `useExitAnimation`. Every alternative fails
  somewhere ordinary: an `animationend` listener waits for ever when nothing
  ever started (reduced motion sets `animation: none`, a consumer may not have
  loaded the stylesheet, and no test project applies one);
  `getComputedStyle().animationName` reports whatever `animation` declared
  whether or not the keyframes resolve; and a timeout goes stale the moment a
  duration changes. It waits a frame first, so a class applied in the same
  tick has landed, and treats a cancelled animation as finished. The hook now
  returns a `ref` to attach to the animating element, which is what replaced
  the `duration` option.
- **Two components that look alike and behave differently stay two
  components.** `pf-alert` and `pf-notification` share an icon, a heading, a
  body and a dismiss, and differ in the only way that matters: an alert sits
  in the page's flow and collapses its own height on the way out so the
  content below reflows, while a notification slides out of a corner stack.
  Folding them into one element with a `placement` prop would have meant one
  stylesheet trying to be both.
- **Read a child element's prop as a property in a real build.** The smoke
  asked a slot's fallback `pf-icon` for its `name` **attribute** and got
  `null`: Stencil's vdom sets props on an upgraded child as properties, so the
  attribute is simply absent — where a test fixture's HTML would have had it.
  The same trap `pf-command-item.value` was a live defect for, seen from the
  test's side this time.
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
- **The mock DOM ignores `:disabled` and `:not(:disabled)`.** Measured:
  `button:not(:disabled)` matches 2 of 2 buttons when one is disabled, and
  `button.disabled` reads `undefined` there. So anything that filters items by
  disabled state is untestable in the `unit` project — put those assertions in
  a browser spec. Core's own tests do cover it, because they run on jsdom,
  which honours the selector; `pf-toolbar` is the worked example.
- **The mock DOM has no `getAnimations` either.** It fails differently from
  the missing `toggleAttribute` above, and more usefully: a `TypeError` thrown
  inside an `@Method` rejects the promise that method returned, where one
  thrown from a lifecycle method is swallowed by `safeCall`. So
  `pf-inline-cta.dismiss()` reported its own bug, with a stack. Guard the call
  with `typeof`, which also covers a consumer on an older browser.
- **The mock DOM has no `toggleAttribute`.** Measured, and worth knowing how
  it fails rather than just that it does: Stencil's `safeCall` swallows the
  `TypeError`, so the lifecycle method carries on as if nothing happened. The
  symptom was `pf-command-palette` rendering "No results found" over a full
  list, with no error anywhere. Use `setAttribute`/`removeAttribute`.
- **Importing a child component changes what a spec can read.** A nested
  `<pf-icon name="chevron-down">` leaves a `name` attribute only while
  `pf-icon` is _not_ imported by the spec: once it upgrades, Stencil sets the
  prop as a property and no attribute is written. So
  `getAttribute('name')` reads null in a spec that imports it and the right
  string in one that does not — the unreflected-prop trap seen from the other
  side. Import the children a test really exercises, and read properties
  rather than attributes when it does.
- **Neither project applies `styleUrl` CSS.** A mounted element's shadow root
  has zero adopted stylesheets and zero `<style>` tags, because the styles are
  bundled by the output targets and neither test project runs them. So no test
  here can assert a computed colour or `display`; assert the class names and
  reflected attributes the stylesheet selects on instead. Computed styles are
  the consumer apps' job — `scripts/smoke-consumer.mjs` asserts them against a
  real build, which is where a missing `--pf-*` alias actually shows up.

- **A dep Vite discovers mid-run reloads the page and kills a suite.** Browser
  mode serves the suites off a real Vite dev server, so every bare specifier
  has to be pre-bundled; `@stencil/core/internal/client` is reached through the
  runtime rather than through an import the dep scanner can see, so on a **cold**
  `node_modules/.vite` Vite finds it part-way through the run, re-optimizes and
  reloads. Whichever suite is mid-fetch then dies with "Failed to fetch
  dynamically imported module" and **zero tests**, while every test that did run
  passes — so the summary reads `1 failed | 51 passed` with `620 passed` and no
  assertion failure anywhere. It is a different suite each time, and it never
  reproduces locally, because the cache is warm from the previous run: delete
  `packages/elements/node_modules/.vite` to see it. The config declares the dep
  in the browser project's `optimizeDeps.include`, which is what Vite's own
  warning asks for. Any dep that only ever shows up in that warning belongs
  there too.

**Rebuild `@pitchfork-ui/core` before running these tests.** The elements
package imports core's _build_, not its sources, so a function added to core
and not yet built is `undefined` here — and Stencil's `safeCall` swallows the
`TypeError`, exactly as it does for the missing `toggleAttribute`. The symptom
is a handler that silently does nothing: `pf-accordion`'s toggle was reached,
stopped the event and then vanished mid-call, with five tests failing and no
error anywhere. `npm run build:core` is part of running an elements test, not
part of shipping.

**Stencil's queue is `async`**, so a re-render provoked by an event lands
several frames after the mutation. A single `requestAnimationFrame` is reliably
too early. Poll to a deadline rather than picking a sleep.

Set `PW_CHROMIUM_PATH` if the environment already has a Chromium that
Playwright's pinned build does not match.

---

## Documenting the elements

`apps/docs/src/WebComponents.mdx` is hand-written and is the only prose about
the elements: how to install them, the custom-property-versus-`::part()`
split, and the handful of places the element API deliberately differs from the
React one. That last part is the whole value of the page, and no generator
knows it.

Everything else is generated. `scripts/build-elements-docs.mjs` reads Stencil's
own `dist/docs.json` and writes one page per element to
`apps/docs/src/elements/`, with its doc comment, its properties, events,
methods, slots and parts. **Edit the component's doc comments, never those
pages.** `--verify` in CI fails on a stale page, a missing one, or a page for
an element that no longer exists; `--strict` fails on an element with no doc
comment at all, which is what got the six earliest elements their prose.

**Each element has a `Docs` page and an `Interactive` story**, which is the
shape `Components/Button` has on the React side — and it is the same mechanism:
the generated `PfAlert.stories.tsx` holds the title, and `PfAlert.mdx` attaches
to it with `<Meta of={PfAlertStories} />` rather than a title of its own. A
title in both would make two sidebar entries instead of one with two children.

`preview.ts` calls `defineCustomElements()` from `@pitchfork-ui/elements/loader`
so all 108 are registered, and each page renders one through
`ElementPreview`. The markup comes from `apps/docs/src/element-examples.ts`,
keyed by tag — `docs.json` records every prop and slot and has no idea that
`pf-select` needs `pf-option` children or what a sensible `data` array looks
like, so a generated example would be `<pf-line-chart></pf-line-chart>`, an
empty box. `--strict` fails on an element with no example and on an example
for an element that no longer exists.

**The controls come from `docs.json`, because there is nothing to infer.**
Storybook reads a React component's props for itself; a custom element exposes
none a React renderer can see, so the generator derives `argTypes` from each
prop's recorded type — a quoted union becomes a select, a numeric union a
numeric select, a function gets `control: false` because a text box for a
predicate invites a reader to type a string. `ElementPlayground` then applies
the args as **properties** on the element, which is what a consumer's
framework does and the one path that works for an array or a function.

Four things that shape those stories:

- **Two effects, and in that order.** Storybook hands a fresh `args` object on
  every render, so writing the markup and applying the args in one effect
  would re-run `innerHTML` for each keystroke in the panel — rebuilding the
  element and losing its state. Split, a control change writes a property onto
  the live element, which is the thing being demonstrated.
- **`interactive` is a single instance, and optional.** 65 of the examples are
  already one instance, so the story falls back to `html` and no copy exists to
  drift. `--strict` requires it for the other 43: controls that drive the first
  of six buttons while five sit unchanged are worse than no controls. It is
  also where `pf-modal` and `pf-command-palette` are **`open`** — both are a
  native `<dialog>` opened with `showModal()`, so an open one fills the
  viewport, which is wrong inside a docs page and exactly right in a story.
- **Args are seeded from the instance's attributes, not just the prop
  defaults.** `pf-alert`'s instance carries `heading="Scheduled maintenance"`,
  which the element renders while `heading` has no default in `docs.json` — so
  without this the panel showed an empty text box beside a visible heading.
  The attribute is the truth about what is on screen, so it wins.
- **`children` is the one arg that is not a prop**, and it is offered only
  where the instance holds text and nothing else. An element's default slot is
  not part of its API the way React's `children` is, and assigning
  `textContent` to an element whose slot holds child elements would delete
  them.

Every prop is offered as a control, including the ones a parent normally sets
(`pf-pie-slice.drawn`, `pf-table-row.odd`): they are real props, the reference
table above lists them, and a hand-maintained list of exceptions would be
judgement with no check behind it.

`apps/docs/src/elements/` is in `eslint.config.js`'s ignores as well as
`.prettierignore` now, for the same reason the generated bindings are — but it
is still covered by `tsc -b`, which is what proves 108 generated stories
compile.

Five things this settled, three of them the hard way:

- **`innerHTML`, not JSX.** `ElementPreview` sets the markup with `innerHTML`
  and the browser's own parser upgrades the elements, which is the path a
  consumer writing plain HTML takes. The same markup written as JSX would go
  through React's custom-element handling, which decides between an attribute
  and a property per value — a second set of rules, documented nowhere on
  these pages, between the reader and what they will type. It also means the
  preview and the code block cannot disagree, because they are one string.
- **`setup` is for the eight props with no attribute**, and nothing else.
  `pf-kbd.keys`, `pf-video-player.sources` and the `isDateDisabled` predicates
  cannot be written in markup at all, so the example assigns the property as a
  consumer would. Using it to tidy anything else would hide the honest answer
  behind a nicer preview.
- **Hydration is `classList.contains('hydrated')`, not a non-empty shadow
  root.** `pf-menu-separator` and `pf-toolbar-separator` render `<Host>` with
  no children — the host _is_ the rule, styled through `:host` — so they
  hydrate correctly with an empty shadow root, and the first version of the
  check called all three of them broken.
- **An unregistered element is valid HTML**, so nothing in a build says the
  registration is missing: the markup, the tables and the page all look right
  and the box is simply empty. `scripts/smoke-storybook.mjs` samples six
  reference pages and fails when a `pf-*` host never hydrates, and makes the
  same check on whichever stories its deterministic sample lands on. Probed by
  deleting `defineCustomElements()` and rebuilding — all six pages fail,
  naming it.
- **A sweep of all 108 Interactive stories** found exactly one that rendered
  nothing usable, and it was the assertion that was wrong:
  `pf-visually-hidden` is 1x1 by design. Worth knowing before writing a
  "renders at a usable size" check over this library.
- **`npm run check:examples`** runs the MCP server's own `validate_usage` over
  every example **and** every `interactive` instance beside it — checking only
  `html` would have left 48 hand-written instances unvalidated, which is
  exactly the state that produced the nine wrong enum values below. `validate_usage` exists so an _agent_ can check its markup
  before presenting it; nothing checked ours, which is the same gap
  `check:icons` closes for icon names, and it bit immediately: the first draft
  had nine wrong enum values — `trend="up"` where `pf-metric-card` takes
  `positive`, `variant="pill"` where `pf-tabs` takes `pills`, and `sort="asc"`
  on `pf-table-cell`, which takes the aria-sort vocabulary (`ascending`) while
  the table's own `sort-direction` really is `asc`. `check:icons` caught six
  invented icon names in the same draft. Every one of them parses, renders,
  and does nothing.

`main.ts` has **no alias to the elements' source**, for the same reason
`apps/consumer-react/vite.config.ts` has none: the docs resolve
`@pitchfork-ui/elements` through its own exports map, which is the path a
source alias hides. So `npm run storybook` on a fresh clone needs
`npm run build:elements` first; `npm run build` already runs them in order.
And `preview.ts` deliberately does not import `@pitchfork-ui/elements/styles.css`
— that file is the token sheet, and `main.ts` already aliases
`@pitchfork-ui/react/styles.css` to the same built `theme.css`. Each element's
own CSS is injected into its shadow root by the loader, so nothing is missing.

Two things that bit while writing it:

- **MDX is JSX, so a doc comment's `<` and `{` matter** — but only outside
  markdown code spans. These comments are full of `` `<pf-tooltip>` `` and
  `` `<a routerLink>` `` written inside backticks, where MDX already treats
  the content literally: escaping there renders `&lt;Link>` as visible
  mojibake, while _not_ escaping outside there lets MDX parse `<Link>` as a
  component and fail the build. The first draft managed both in one file.
- **A multi-line `{/* */}` comment in an MDX file is mangled by Prettier.**
  Measured both ways: Prettier reads the `/*` and `*/` as a markdown emphasis
  span and normalises it, so `{/* ... */}` becomes **`{/_ ... _/}`** — which is
  not valid JS, and the Storybook build fails with "Could not parse expression
  with acorn" naming the file. A comment that happens to contain an
  `*emphasis*` pair of its own survives, because the inner `*` pairs first;
  that is luck, not correctness, and deleting the emphasis breaks the build.
  Keep an MDX comment on **one line**. The long reasoning goes here instead,
  which is where the rest of it lives anyway. The generated pages escape this
  only because they are in `.prettierignore`.
- **The generated pages are in `.prettierignore`**, because `--verify`
  compares the generator's own output. Formatting them afterwards would make
  every build report 108 stale pages.
- **Storybook's MDX runs remark with no GFM extension**, so a pipe table is a
  paragraph of pipe characters until `remark-gfm` is in addon-docs'
  `mdxCompileOptions`. These pages are almost entirely tables, so the whole
  section rendered as pipe soup — with no error, no failed request and every
  story fine, because nothing in CI had ever opened a docs page. Measured by
  removing the plugin and rebuilding: `PfAlert`'s table count goes from 5 to 0
  and its header row turns up as literal text. `scripts/smoke-storybook.mjs`
  now asserts both halves on one reference page.

**`vw` in a docs page is the iframe, not the window.** The Introduction hero
borrows `pf-page-header`, whose heading is
`clamp(--font-size-3xl, 3vw, --font-size-5xl)` — and Storybook's docs iframe is
about 300px narrower than the browser window, so the landing title measured
**29.4px at a 1280px window** against the 24px `<h2>` directly below it: a page
title 1.2x its own section headings. The element is right for the job it has,
which is an application page header; a landing hero is a different job, so the
page overrides the size through `::part(heading)` — the one mechanism that
reaches a shadow-internal box — scoped to a wrapper class so it cannot touch
any other page header. Verified by driving a real SPA navigation away from the
page: the `<style>` unmounts and a page header elsewhere is back to the
element's own 34.2px.

The override's own `vw` is iframe-relative too, which is the thing to remember
when picking a number: `7.5vw` is **73.5px at a 1280px window**, not 96px,
because the iframe is 980px there. Measured at four widths, it reads
80 / 73.5 / 54.3 / 44px at windows of 1440 / 1280 / 1024 / 600, on one line
with no horizontal overflow at any of them. The first pass at this was a third
smaller and tracked at `-0.04em`, which is display tracking for 100px type and
reads as squeezed at 60 — `-0.02em` is the setting that holds up across the
whole clamp.

**And none of that was what a reader saw, because MDX wraps the title line in a
`<p>`.** That `<p>` is the node that gets slotted, and Storybook's docs CSS
pins every unescaped paragraph —
`.css-… :where(p:not(.sb-anchor, .sb-unstyled, .sb-unstyled p))` — to 14px.
`font-size` does not reach it, because that rule wins over inheritance;
`letter-spacing` does, because it had already computed to an **absolute**
-2.352px from the heading's 58.8px. So the live title rendered at 14px tracked
at -0.17em, with the letters touching and the word space closed to nothing —
"PitchforkUI" — while `getComputedStyle` on the `::part(heading)` box reported
a perfect 58.8px. Both measured on the deployed site. The fix is one rule,
`.pf-docs-hero pf-page-header p { font: inherit; letter-spacing: inherit;
margin: 0 }`, which hands the paragraph back to whichever box it was slotted
into; `:where()` has zero specificity, so Storybook's selector is only
`.css-…` and a two-class rule beats it.

The lesson is bigger than this page: **a `::part()` override sizes the part,
and the part is not always what the text is in.** Whenever a slot is filled
from MDX, measure the slotted node.

`scripts/smoke-storybook.mjs` asserts the hero against the page's own `<h2>`
rather than against a pixel count, because the ratio is what a reader
perceives and it separates the two states cleanly — 1.28x without the
override, 3.20x with it. It reads the **slotted element** rather than the
shadow heading, and asserts the tracking as a fraction of the size the text is
actually drawn at, which is the only form in which an inherited absolute
letter-spacing is visible. Its first version read the heading and so passed
through the entire 14px defect. Probed three ways, each by rebuilding: without
the `<p>` reset it reports 14px at 0.58x, without the `::part` override 30.72px
at 1.28x, and at `-0.1em` it reports the tracking.

### The seven patterns

`apps/docs/src/patterns/` holds the worked compositions, and they are elements
now rather than React components. `pattern-markup.ts` is the one place each is
written down — the story canvas, the "Show code" panel and `check:examples`
all read it, the same arrangement as `element-examples.ts`.

**The React versions kept two copies of themselves**, a JSX `render` and a
`parameters.docs.source.code` string written to match it, and they had already
drifted: the login form's row lost its `flexWrap` and `gap` in the copy a
reader was shown. Nothing could have caught it, because nothing compares a
story's output with the code printed beside it. One string cannot disagree with
itself.

Four are static. Three are not, and that is the part worth reading:

- **`checkout-form`** listens for `pfInput` and writes three properties onto
  `pf-credit-card`. The value has to be written back to the control as well —
  the element holds its own, so nothing else will reformat it.
- **`data-table`** is the worked example of the rule `pf-table` is built on:
  the element reports a sort and reorders nothing. The handler does the
  reordering with core's own `sortRowsBy`, so the order matches what the React
  `Table` produced for itself.
- **`multi-step-wizard`** keeps one `pf-modal` open while its
  `pf-progress-step` states advance.

`settings-page` is deliberately in the static four: `pf-tabs` owns which panel
shows through its own `value`, and each `pf-switch` keeps its own state, so
there is nothing to wire. That is worth noticing rather than assuming a tab
strip needs a handler.

A pattern with wiring shows its `setup` source in the "Show code" panel through
`Function.prototype.toString()`, so the code beside the demo is the code
running it. That depends on `main.ts` setting `minify: false`, which it already
does for other reasons.

`check:examples` validates all seven against `elements.json` as well as the 108
examples — each puts a dozen elements together, so a wrong attribute has a
dozen places to hide. Probed with `variant="hero"` on a `pf-button`.

---

## Framework bindings

Three generated wrapper packages come off the same elements build, from three
output targets configured in `packages/elements/stencil.config.ts`:
`elements-react`, `elements-angular`, `elements-vue`. All three are generated
on every build and **never hand-edited** — fix a wrapper by fixing the element.
Each one is in `.prettierignore` and in `eslint.config.js`'s ignores for that
reason; formatting a generated file only means the next build reports it
changed.

Vue can render a custom element without any wrapper, so `elements-vue` is a
convenience rather than a necessity: what it adds is typed props, `@pf-*`
listeners instead of `addEventListener`, and `v-model`. Its `componentModels`
cover the same six controls as the Angular value accessors, bound the same way
— `pf-checkbox` and `pf-switch` model `checked`, `pf-input`, `pf-textarea`,
`pf-radio-group` and `pf-slider` model `value`, all on `pfChange` rather than
`pfInput`, because `pfChange` is the moment a framework should see a new value.
Keeping the two lists identical is deliberate: a control that models in one
framework and not the other is a difference no test would report.

**A generated wrapper imports its output target's runtime, and nothing
hand-written mentions it.** The Vue proxies open with
`import { defineContainer } from '@stencil/vue-output-target/runtime'`, and the
bundler here keeps `@stencil/*` external, so the specifier survives into
`dist/components.js`. `@pitchfork-ui/elements-vue` declared it nowhere — and
every build, test and smoke passed, because inside the workspace the specifier
resolves from the root `node_modules` whether the package asks for it or not.
A consumer installing from npm would have got a package whose first import
fails to resolve. `scripts/check-built-packages.mjs` now reads every bare
specifier out of each built bundle and fails on any that is not in that
package's own `dependencies`, `peerDependencies` or `optionalDependencies`.
Adding it found two more of the same shape: `elements-angular`'s fesm bundle
imports `fromEvent` from `rxjs`, and the `dist/collection` that
`packages/elements` advertises through `collection:main` imports
`@stencil/core`.

### Smoke-testing them

`scripts/smoke-consumer.mjs` renders all 108 elements and asserts their
computed styles; `consumer-react` and `consumer-angular` both run it.
`scripts/smoke-vue.mjs` is deliberately a different script rather than
`smoke-consumer.mjs --label vue`: rendering all 108 a third time would prove
nothing new about the _bindings_, which is what the package is. It renders ten
elements and checks the three things only a Vue binding can get wrong:

1. `@pitchfork-ui/elements-vue` resolves through its exports map and registers
   the elements it imports — the path a workspace alias hides.
2. `v-model` round-trips in **both** directions. A binding that only listens to
   the element's events looks perfectly correct until the application writes to
   the ref, which is why `consumer-vue` has one button that writes to every ref
   at once.
3. The token stylesheet reaches a Vue-rendered shadow root the same way it
   reaches a React-rendered one.

---

## What the agent-facing artifacts know

Three artifacts exist so an agent can build with this library from its real API
rather than from guesswork. **`elements.json` is the one that matters**, and
every consumer of it treats the React metadata as optional:

| Artifact                | Built by                      | Source                                              |
| ----------------------- | ----------------------------- | --------------------------------------------------- |
| `elements.json`         | `build-elements-metadata.mjs` | Stencil's `docs.json` + `element-examples.ts`       |
| `metadata.json`         | `build-metadata.mjs`          | the React TypeScript and CSS (**deprecated layer**) |
| `llms.txt`, `-full.txt` | `build-llms-txt.mjs`          | `elements.json`, plus `metadata.json` if present    |

**Which artifact is required is the whole of Phase 5.** It used to be
`metadata.json`: the MCP server threw without it, so a consumer who had
installed only `@pitchfork-ui/elements` got a server that refused to start over
an artifact belonging to a package they had no reason to have. Three things
lived only in the React half and had to move, and the first was invisible until
the package was taken away:

- **The category taxonomy.** Every element's category was _derived_ from its
  React counterpart's, so the ten names and all 108 assignments went with the
  package. `CATEGORY` in the elements builder is the source now — generated
  from that builder's own React-derived output, so the first rebuild was
  byte-identical, and cross-checked against the derivation for as long as the
  React metadata is on disk.
- **The icon registry.** `validate_usage` and `check:icons` checked a name
  against the _React_ registry whichever layer the markup was for.
  `scripts/lib/icon-registry.mjs` reads either layer, and is the thing that
  makes them agree rather than the thing that assumes it: it asserts each
  layer's `name: faXxx` map against core's `BUNDLED_FA_ICON_NAMES` and throws
  on a divergence. Three of the registry's four inputs are in core and survive;
  the fourth cannot be shared, because each layer imports its Font Awesome
  glyphs individually to keep a consumer's bundle to the icons in use.
- **The house conventions.** They travelled only inside the React metadata, so
  an agent writing `<pf-input>` was handed rules about `forwardRef` and the
  `pf-field` wrapper. `scripts/lib/conventions.mjs` serves a different set per
  layer, picked at **H3** where an H2 mixes them: `Component conventions` holds
  the token chain and the breakpoints, which apply to anyone, alongside
  `forwardRef` and BEM class names, which do not. The elements' set leads with
  `WebComponents.mdx`, because that is the consumer-facing prose — CLAUDE.md's
  own `Web components` section is 74 KB written for someone editing this
  repository and is deliberately excluded.

Two measurements worth keeping:

- **`llms-full.txt` put 89.5 KB of deprecated React components before the
  elements began**, with the React conventions as its house rules, while its
  own comment claimed "The React half comes last". The elements start at byte
  13,438 now.
- **`validate_usage` never checked an icon name in element markup.**
  `<pf-icon name="paper-plane">` — a real Font Awesome regular icon this
  library does not bundle — validated as "No problems found" and renders
  nothing. `isIconProp` knew only `iconName` anywhere and `name` on `Icon`;
  `validateElements` had no icon check at all. The element rule is derived
  rather than listed: `name` on `pf-icon`, `icon` on any element.

**The element examples are one file, read by four things.** `docs.json` has
every prop and slot and no idea that `pf-select` needs `pf-option` children, so
the markup is hand-written in `apps/docs/src/element-examples.ts` — and the
reference pages, the `Interactive` stories, `elements.json` and
`llms-full.txt` all read that same file. A second copy written for the MCP
server would be a second copy to drift.

`build-elements-metadata.mjs` imports it and throws a named error when the
export is gone, because an empty object would publish metadata with no
examples in it and nothing would say so. `get_examples` answers for a
component name, an element tag or an element name, and prints the single
`interactive` instance only where it differs from the example — repeating a
one-instance example as "a single instance of itself" says nothing. Three MCP
tests cover it, probed by emptying the examples out of the metadata: all three
fail, and the other 47 pass.

The React metadata is _parsed_, because nothing else records that API. The
element metadata is _read_: Stencil writes every prop, attribute, event,
method, slot and part into `docs.json` at build time, so the only judgement the
builder adds is the category — Stencil has no concept of one, and an agent
asking "what is there for navigation?" needs both layers to answer the same
way. Four tables carry that judgement, and `--strict` checks each:

- **`CATEGORY`** gives each of the 87 non-child elements its category. The
  three tables below are still derivations; this one is the only written-down
  answer, because the thing it used to be derived from is going away.
- **`CHILD_OF`** maps a child element to its parent _tag_, not to a category,
  so moving a parent between categories takes its children with it.
- **`COUNTERPART`** covers the two names pascal-casing does not find
  (`pf-inline-cta` → `InlineCTA`, `pf-toaster` → `ToastProvider`).
- **`ABSORBED`** records the four React components an element took in rather
  than mirrored, with how to get the same thing: `AreaChart` is `area` on
  `pf-line-chart`, `PageHeaderMeta` is a slot. Without it the metadata would
  answer "there is no element for `AreaChart`", which is wrong in the way that
  matters. `--strict` fails on a React component in neither table nor a
  counterpart, which is what keeps "every React component has an element
  answer" true as components are added — and which, like every other React
  check here, only runs while the React metadata is on disk.

**A new check that catches nothing is the failure mode here, and two of them
were shipping.** Both were found by writing the test that should fail and
watching it pass:

- **Stencil normalises a union to double quotes.** `docs.json` records
  `variant` as `"ghost" | "primary"` where the React extractor reproduces this
  repo's single quotes. `unionMembers` accepted only single quotes, so every
  variant check on every element passed — `validate_usage` reported
  `<pf-button variant="ghostly">` as clean, which is the one thing it exists to
  catch.
- **A framework binding's attribute sigils have to be part of the name.** The
  attribute scanner's name pattern started at `[A-Za-z_]`, so it stepped over
  the punctuation and read the bare word: `[formControl]="email"` arrived as an
  attribute called `formControl` and then one called `email`, and
  `(pfChange)="onChange($event)"` added `event`. Four invented-attribute errors
  on entirely correct Angular markup.

The element-specific finding worth knowing about is **a prop with no
attribute**. A prop typed as an array or a function (`sources`,
`isDateDisabled`, `files` — eight of them across the library) gets no attribute
from Stencil at all, so writing it in markup parses, renders, and never
delivers the value. `validate_usage` reports it as an error, `get_element`
marks it _property only_, and `llms.txt` says so in its preamble.
`<PfButton>` in JSX is reported as a binding rather than as an unknown
component, because "not exported by the library" would send an agent hunting a
typo it has not made.

---

## Dependency specifiers

Everything is a caret range on the version actually installed. Nothing is
`latest` or `*` any more, with one deliberate exception: a workspace sibling
(`"@pitchfork-ui/react": "*"`) stays `*`, which is the idiom and resolves to
the local package rather than to the registry.

**Pin to the version that workspace resolves, not the one at the root.**
`apps/consumer-angular` nests TypeScript 5.9.3 and Vite 7.3.6 where the root
has 6.0.3 and 8.2.2, because `@angular/build@21` peers `typescript >=5.9 <6.0`
and Vite 7 — and it only does so because those two were `*`, which left npm
free to pick a version the peers accept. Pinning them to the root's versions
produced a range nothing can satisfy: the install stayed green off the
existing lockfile, and `npm audit fix` was the thing that reported the
conflict, because it is the command that re-resolves.

**A caret on a 0.x version is a patch range, and release-please does not
rewrite ranges by itself.** `^0.1.0` is `>=0.1.0 <0.2.0` — measured, not
assumed — so a release that takes `elements` to 0.2.0 while `elements-react`
still declares `^0.1.0` publishes a binding that resolves to the **old**
element. The bindings are generated from the element build, so that is a silent
mismatch, and it lands on the registry where it cannot be taken back. The
pending 0.2.0 release had **five** of them: the three bindings against
`elements`, and `elements` and `react` against `tokens` at `^0.4.1` going to
0.5.0.

`plugins: ["node-workspace"]` in `release-please-config.json` is the fix. Its
`newVersionWithRange` **preserves the range prefix** (`^0.1.0` + `0.2.0` →
`^0.2.0`) and skips anything carrying an npm protocol (`/^[a-z]+:/`), read out
of the plugin's own source rather than guessed. Two things follow: a range with
**no** prefix would be rewritten to a bare pinned version, and the plugin only
walks the packages listed in the config — so the `"*"` siblings in `apps/*`
are untouched and the idiom above survives. Every intra-workspace range in the
eight published packages is a caret, which is what makes this safe.

`check-publishable.mjs` could not see any of it: it skipped a dependency
entirely when that dependency was part of the same release
(`if (publishing.has(dep.name)) continue`), which skipped the registry question
it meant to skip **and** the range question it did not. It now compares the
declared range against the version the release is about to publish, which both
halves of are on disk by then. Probed both ways: it names all five mismatches
and exits 1 against a simulated 0.2.0 release, and goes quiet once the ranges
read `^0.2.0`.

**Regenerate the lockfile incrementally.** `npm install --package-lock-only` on
top of the committed lockfile gives a 33-line diff of specifier strings.
Deleting it first and letting npm rebuild it gives a 24,000-line diff with no
version changes in it — and this repo's `engines` ask for npm 11 while a
container may well have 10, so a wholesale rebuild is a rewrite by the wrong
tool.

The root `optionalDependencies` that pinned two OXC platform bindings are
gone. They worked around npm omitting platform-specific optionals from the
lockfile, which does not happen any more: the lockfile records every binding
for every consumer, nested, with its `cpu` and `os`. Verified by removing
them, regenerating, running a real `npm ci`, and confirming both modules load
from the nested copies.

---

## Deprecating a package's public API

`@pitchfork-ui/react` is deprecated, and the notice a developer actually meets
is the editor's strikethrough — the `npm deprecate` flag shows once at install,
the README shows on a page they may never open, and the JSDoc tag shows every
time they type the name. `npm run check:deprecated` asserts that all **282**
public exports carry `@deprecated`; it skips itself once `packages/react` is
gone, which is Phase 7.

Three things it measures that the obvious version does not, each found by
writing a check that passed when it should not have:

- **The tag belongs to the exported symbol, not the file.** A grep counts the
  string and cannot tell which declaration it attaches to. The check walks the
  real public API through the TypeScript checker. The first honest count was
  **90 of 282**: the components had tags and nothing else did, while the
  changelog announced that every export had one.
- **A check that resolves a sibling package through its build moves with the
  build.** `HourCycle` and `ListNavigationAction` are `export type { X }`
  re-exports of core types, and they read as tagged until core's `dist`
  existed and the alias resolved to the real declaration. The check maps
  `@pitchfork-ui/core` to its **sources** so the answer is the same on every
  machine.
- **A JSDoc tag on an export specifier does not cross the package boundary.**
  `export { Keys } from '@pitchfork-ui/core'` with the tag on the name is
  honoured when that file is opened as a path and **lost** when the same file
  is reached as `@pitchfork-ui/react` — measured both ways on one
  `dist/index.d.ts`, which reported `own=[deprecated]` and then `own=[]`. A
  consumer only ever does the second, so six exports were tagged for nobody.
  Re-declare instead: `import { Keys as coreKeys }` then
  `/** @deprecated … */ export const Keys = coreKeys`, which keeps
  `Keys === core.Keys` and puts the tag on a declaration the package owns. The
  check rejects the specifier shape and says so by name.

**Name the replacement that is right for the export, not one message for all
of them.** A component points at its element; a hook points at the core
function it wraps (`useFocusTrap` → `trapFocus`), or says plainly that there is
no framework-free half and no element replaces it (`useDisclosure`); anything
that only lives in this package as a re-export points at
`@pitchfork-ui/core`, where it is not deprecated. The first pass generated the
types' messages from the first tag in each file, which told a reader reaching
for `IconName` to import a registry function — plausible, wrong, and worth
catching before it shipped. `RegisteredIconName` was pointed at core until
core turned out not to export it.

---

## Known gaps

See `todo.md` at the repo root.
