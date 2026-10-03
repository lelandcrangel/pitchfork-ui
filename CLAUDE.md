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
  feature works or not. Import `userEvent` from `@vitest/browser/context` for
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
- **The mock DOM has no `toggleAttribute`.** Measured, and worth knowing how
  it fails rather than just that it does: Stencil's `safeCall` swallows the
  `TypeError`, so the lifecycle method carries on as if nothing happened. The
  symptom was `pf-command-palette` rendering "No results found" over a full
  list, with no error anywhere. Use `setAttribute`/`removeAttribute`.
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
