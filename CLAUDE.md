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
│   ├── elements-vue/   # Generated Vue bindings — never hand-edited
│   └── tokens/         # Design tokens + theming contract (@pitchfork-ui/tokens)
│       └── src/
│           ├── tokens/   # color.json, shadow.json, size.json, typography.json
│           └── theme.css # Global token aliases (:root vars), breakpoints, dark mode
└── apps/
    ├── docs/           # Storybook site (@pitchfork-ui/docs)
    │   └── src/        # *.stories.tsx, *.examples.stories.tsx, *.mdx per component
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

Two things that bit while writing it:

- **MDX is JSX, so a doc comment's `<` and `{` matter** — but only outside
  markdown code spans. These comments are full of `` `<pf-tooltip>` `` and
  `` `<a routerLink>` `` written inside backticks, where MDX already treats
  the content literally: escaping there renders `&lt;Link>` as visible
  mojibake, while _not_ escaping outside there lets MDX parse `<Link>` as a
  component and fail the build. The first draft managed both in one file.
- **The generated pages are in `.prettierignore`**, because `--verify`
  compares the generator's own output. Formatting them afterwards would make
  every build report 108 stale pages.

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
rather than from guesswork, and all three now cover both layers:

| Artifact                | Built by                      | Source                          |
| ----------------------- | ----------------------------- | ------------------------------- |
| `metadata.json`         | `build-metadata.mjs`          | the React TypeScript, docs, CSS |
| `elements.json`         | `build-elements-metadata.mjs` | Stencil's `docs.json`           |
| `llms.txt`, `-full.txt` | `build-llms-txt.mjs`          | both of the above               |

The React metadata is _parsed_, because nothing else records that API. The
element metadata is _read_: Stencil writes every prop, attribute, event,
method, slot and part into `docs.json` at build time, so the only judgement the
builder adds is the category — Stencil has no concept of one, and an agent
asking "what is there for navigation?" needs both layers to answer the same
way. Three tables carry that judgement, and `--strict` checks each:

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
  answer" true as components are added.

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

## Known gaps

See `todo.md` at the repo root.
