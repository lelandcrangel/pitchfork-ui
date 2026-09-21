# Pitchfork UI — Web Components Plan

A plan for making Pitchfork UI usable outside React **without retiring the React
component library**, which stays hand-authored and first-class throughout.

**Recommendation in one line:** publish `@pitchfork-ui/elements` as a
**tag-name contract** backed at first by the existing React components wrapped
with `@r2wc/react-to-web-component`, extract the behavioural hooks into a
framework-free `@pitchfork-ui/core`, then **graduate individual elements to
native Lit implementations on demand** — driven by real non-React usage, never
by a desire for completeness.

**Nothing in `packages/react` is deleted at any phase of this plan.**

---

## 0. Guiding principles

- **Nothing is deleted.** `packages/react/src/components` remains the
  hand-authored React library. Web components are an additional distribution,
  not a replacement.
- **The tag name is the contract, not the implementation.** `<pf-button>` can be
  React-inside today and native Lit tomorrow, and no consumer needs to know. This
  is what converts a rewrite into an incremental migration.
- **Graduate on demand.** A component earns a native implementation when a real
  non-React consumer needs it to be smaller, SSR-able or properly encapsulated.
  `<pf-radar-chart>` can stay React-wrapped forever if nothing asks otherwise.
- **The platform is the framework** — for graduated components. Where a browser
  primitive exists (`<dialog>`, `popover`, `ElementInternals`, the top layer),
  use it and delete the hand-rolled equivalent.
- **Tokens are untouched.** `@pitchfork-ui/tokens` and the
  `component var → theme alias → token` chain survive whole. CSS custom
  properties inherit through shadow boundaries; this is why the migration is
  tractable at all.
- **Extract behaviour once.** The hooks are the only genuinely hard, genuinely
  reusable code in the library. They become framework-free and both layers
  consume them.

---

## 1. What you are actually working with

Measured from the tree, not estimated:

| Asset                    | Count                                                  |
| ------------------------ | ------------------------------------------------------ |
| Component folders        | 74                                                     |
| Component TSX            | ~10,900 lines                                          |
| Component CSS            | ~8,200 lines                                           |
| **Behavioural hooks**    | **9 files, 479 lines total**                           |
| Test files / lines       | 74 / ~7,700 lines                                      |
| Storybook stories + MDX  | 150 `.stories.tsx` + 80 `.mdx`, ~16,200 lines          |
| `theme.css`              | 917 lines (`:root` aliases + one `[data-theme]` block) |
| Published packages       | `react@0.15.1`, `tokens@0.4.1`, `mcp@0.2.0`            |
| Internal React consumers | `apps/docs`, `apps/theme-builder`, `apps/demo`         |

### What makes this tractable

- **The hooks are 479 lines and barely React-coupled.** `useAnchoredPosition`,
  `useFocusTrap`, `useListNavigation`, `useOutsideInteraction`, `usePresence`,
  `useExitAnimation`, `useDisclosure`, `useControllableState` are DOM logic with
  a thin `useState`/`useEffect` shell. This is the single most important finding
  in this plan: **the expensive, correctness-critical part of the library is
  half a day's work away from being framework-free.** `useComposedRefs` (16
  lines) is the only one that is React-specific by nature.
- **Almost no React-idiom coupling in the components.** One `createContext` in
  the whole library (Toast). No compound-component context plumbing, two
  `cloneElement` uses, no Suspense, no reducers, no memo. Eight
  `useImperativeHandle`. The components are structurally DOM builders with local
  state.
- **Charts are hand-rolled SVG.** No charting dependency anywhere.
- **Only two React-only third-party deps**: `@fortawesome/react-fontawesome`
  (Icon) and `prism-react-renderer` (CodeSnippet).
- **Dark mode never appears in component CSS.** Zero `data-theme` and zero
  `prefers-color-scheme` selectors across all 74 `.css` files. Load-bearing:
  `:host-context()` is Chromium-only, so a component that styled itself on an
  ancestor `[data-theme]` would break in Safari and Firefox inside a shadow
  root. The existing discipline dodges that entirely.

### What stays hard regardless of approach

- **22 components take data-array props** (`items`, `options`, `data`,
  `columns`) whose fields are typed `React.ReactNode` — Tabs, Accordion, Select,
  Combobox, MultiSelect, Dropdown, ContextMenu, CommandPalette, Table, TreeView,
  Timeline, the navigations, Breadcrumbs, Pagination, RadioGroup, ButtonGroup,
  Toast and the charts. **`ReactNode` cannot cross the HTML boundary under any
  option in §2.** A JSON attribute carries `{ value, label: string }`; it cannot
  carry a rendered node. These components get a reduced API for non-React
  consumers until they are graduated and redesigned around slots.
- **The docs are larger than the library** — ~16,200 lines of stories and MDX
  versus ~10,900 of components. Under this plan they are _not_ rewritten (§10.1),
  which is a large part of why it is affordable.
- **A pre-existing discipline gap.** `CLAUDE.md` forbids raw tokens in component
  CSS, but ~658 direct `var(--space-*)`, `var(--font-*)`, `var(--radius-*)`
  references exist. Colour is disciplined; spacing and type are not. Harmless
  here — custom properties still inherit into shadow roots. Note it; do not let
  the migration depend on fixing it.

---

## 2. The real decision: which layer is the source of truth

"Keep the React components" narrows the field sharply. There are exactly four
self-consistent answers, and most of the technology choice follows from picking
one.

| #     | Source of truth          | React components are…                      | Web components are…                   | Verdict                   |
| ----- | ------------------------ | ------------------------------------------ | ------------------------------------- | ------------------------- |
| **1** | **React**                | hand-authored, unchanged                   | generated wrappers around them (r2wc) | **Start here**            |
| **2** | Web components           | generated wrappers (`@lit/react`, Stencil) | hand-authored                         | Violates the constraint   |
| **3** | A shared behaviour core  | hand-authored thin views                   | hand-authored thin views              | **End here, selectively** |
| **4** | One JSX source (Mitosis) | compiled output                            | compiled output                       | Rejected — see below      |

Option 2 is the plan as originally drafted, and it is out: it keeps the
`@pitchfork-ui/react` _package_ alive but retires the hand-written source, which
is precisely what was asked against.

Option 4 is the only one where a single JSX file literally produces both. It is
tempting and it is real — Mitosis is actively maintained (0.13.2, published
within the last month) and targets Lit, Stencil and raw web components alongside
React. It is rejected anyway, for this library specifically: Mitosis constrains
authoring to a JSX subset, and the failure mode reported by teams using it is
writing something in an ordinary React way and discovering it is not allowed.
Pitchfork UI's hard components — Calendar, DateRangePicker, Combobox, TreeView,
RichTextEditor — are exactly the ones that use ref arrays, imperative handles
and multi-stage effects. The existing 74 components would still be rewritten to
fit the subset, so the constraint is not actually honoured, and debugging moves
into generated code.

**Options 1 and 3 are not rivals — they are phases.** Option 1 ships a working
tag-name contract in weeks with zero component rewrites. Option 3 is what an
individual component becomes when it graduates. The core package extracted in
Phase 1 is what makes graduation cheap, and it is worth building even if the web
component work is abandoned entirely.

### Libraries evaluated (as of September 2026)

| Library                            | Health                                                                                                                  | Role here                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **`@r2wc/react-to-web-component`** | v2.1.1, **last release Feb 2025**; React 19 in peer deps; 1.4 KB; ~220 dependents                                       | **Adopt** for the v0 wrapper layer — with the staleness caveat in §10.6 |
| **Lit 3**                          | Google-maintained, the default for new work; Adobe Spectrum Web Components runs on it                                   | **Adopt** for graduated components                                      |
| **Stencil**                        | Alive — 4.44.2, Aug 2026, OutSystems has said it is growing the OSS teams. But Ionic ended commercial sales in Feb 2025 | **Reject** — see below                                                  |
| **Mitosis**                        | 0.13.2, active; outputs React + Lit + Stencil                                                                           | **Reject** — subset constraints (above)                                 |
| **Zag.js**                         | Chakra-maintained; framework-agnostic state machines, explicitly supports vanilla and web components                    | **Reference, don't adopt** — see below                                  |

**Why not Stencil**, given it was asked about directly: it is the strongest
_option 2_ answer — one implementation, JSX that reads like React, and
`@stencil/react-output-target` generates the React package for free. If the
constraint were "keep the React _package_" rather than "keep the React
_components_", it would be the recommendation. But it cannot consume the
existing React components; the 74 would be rewritten into Stencil classes
(decorators, no hooks), and the hand-written React source would then be dead
code. It also owns the toolchain — its own compiler and test runner would
displace the Vite, Vitest and Playwright setup already working here — and the
Ionic commercial wind-down is a real, if survivable, signal for a dependency a
design system cannot cheaply leave.

**Why reference Zag.js rather than adopt it:** Zag is option 3 done properly by
someone else — framework-agnostic state machines for exactly these interaction
patterns. But adopting it means re-basing 74 components' behaviour onto someone
else's machines, which is a far larger rewrite than de-Reacting 479 lines of
hooks that already work and are already tested. Read Zag's machines when
designing `@pitchfork-ui/core`; do not depend on them.

---

## 3. Recommended architecture

```txt
packages/
├── tokens/            UNCHANGED
├── core/              NEW — @pitchfork-ui/core
│                      Framework-free behaviour: anchoring, focus trap, list
│                      navigation, dismissal, presence/exit, disclosure.
│                      No React import anywhere. ~500 lines to start.
├── react/             KEPT AND HAND-AUTHORED — thin hook adapters over core.
│                      Nothing deleted; the components lose logic, not existence.
├── elements/          NEW — @pitchfork-ui/elements
│                      ├── wrapped/   r2wc around the React component (default)
│                      └── native/    Lit implementation (graduated components)
│                      Same tag names either way. Consumers cannot tell.
└── mcp/               unchanged shape
```

### The two speeds

**Speed 1 — wrap (weeks, all 74 components).** `@r2wc/react-to-web-component`
turns each React component into a custom element with a props manifest. Run it
in **light DOM mode**: the existing global `.pf-*` stylesheet then works exactly
as it does for React consumers today, which preserves the styling model 1:1 and
sidesteps the entire `::part()` design problem for v0. A non-React consumer
loads `styles.css` and writes `<pf-button variant="primary">Save</pf-button>`.

What Speed 1 honestly does not give you: React and ReactDOM ship inside the
bundle; each element mounts its own React root, so there is no shared
reconciliation and Toast's context does not span elements; `ReactNode` props
degrade to strings or JSON; and there is no style encapsulation. It is a
compatibility layer, and it should be documented as one.

**Speed 2 — graduate (ongoing, on demand).** A component is reimplemented in Lit
behind the same tag name when a real consumer needs what Speed 1 cannot give.
The React implementation stays exactly where it is. At that point the component
has two hand-written views over one shared core — option 3, applied to one
component rather than all 74.

**Graduation is a per-component decision with a written trigger**, not a
schedule: bundle size matters for this consumer, or it needs SSR, or it needs
real encapsulation, or its `ReactNode` props are blocking someone. If no trigger
fires, the wrapper is the final answer for that component and that is a success,
not a deferral.

---

## 4. Workspace structure

```txt
packages/core/src/
├── anchoring/      positionAnchored(anchor, floating, opts) -> cleanup
├── focus/          trapFocus(container) -> release; getFocusableElements
├── navigation/     listNavigation(opts) — roving tabindex, typeahead
├── dismiss/        onOutsideInteraction(el, cb)  // composedPath, not contains
├── presence/       presence(el, opts) — enter/exit lifecycle
├── keys.ts         moved from a11y/
└── aria.ts         composeDescribedBy, moved from a11y/

packages/react/src/hooks/   thin adapters: useEffect wrappers over core
packages/elements/src/
├── wrapped/        generated from a per-component manifest
├── native/         Lit elements, added one at a time
└── index.ts        registers whichever implementation is current
```

`theme.css` stays in `packages/react` and is re-exported by `elements`. It is a
`:root`-level stylesheet loaded once by the page — the theming contract — and it
must not move into shadow roots.

---

## 5. Technology choices

| Concern             | Today                                 | Proposed                                                                                                                              |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| React components    | React 18/19 + `forwardRef`            | **Unchanged**, minus logic that moves to core                                                                                         |
| Behaviour           | 9 hooks in `packages/react/src/hooks` | **`@pitchfork-ui/core`**, framework-free; hooks become adapters                                                                       |
| WC v0               | —                                     | **`@r2wc/react-to-web-component`**, light DOM                                                                                         |
| WC graduated        | —                                     | **Lit 3**, shadow DOM, `::part()` surface                                                                                             |
| Tokens              | Style Dictionary                      | **Unchanged**                                                                                                                         |
| Build               | Vite lib mode, `preserveModules`      | **Unchanged**; `elements` is a third Vite lib build                                                                                   |
| API metadata        | `scripts/build-metadata.mjs`          | **Kept** for React; **plus** `custom-elements.json` emitted for elements                                                              |
| Editor support      | none                                  | Free from CEM: VS Code `html-custom-data`, JetBrains `web-types`                                                                      |
| Docs                | `@storybook/react-vite`               | **Unchanged** — see §10.1                                                                                                             |
| Tests               | Vitest + jsdom + RTL-React            | **Unchanged for React.** Core gets plain unit tests; elements get Vitest browser mode on Playwright (both already in devDependencies) |
| Icons               | `@fortawesome/react-fontawesome`      | Unchanged until Icon graduates                                                                                                        |
| Syntax highlighting | `prism-react-renderer`                | Unchanged until CodeSnippet graduates                                                                                                 |

---

## 6. Translation guide — for graduated components only

Applies when a component moves from wrapped to native Lit. Write this into
`CLAUDE.md` when the first component graduates.

| React                                              | Lit / platform                                                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useState`                                         | `@state()` / `@property()`                                                                                                                                         |
| `useRef` (DOM)                                     | `@query('.selector')`                                                                                                                                              |
| `useEffect`                                        | `connectedCallback` / `updated()` / a reactive controller over core                                                                                                |
| `useLayoutEffect` + the isomorphic dance in `Tabs` | `updated()` — the SSR guard disappears                                                                                                                             |
| **`useId` (31 components)**                        | **Delete.** IDs are scoped per shadow root; use literal `id="trigger"`. A real simplification, not a workaround.                                                   |
| `useControllableState`                             | Mirror the platform: the element owns its state and emits `pf-change`; a consumer "controls" it by setting the property back. `<input>` is the precedent.          |
| `useDisclosure`                                    | `open` boolean attribute + `show()`/`hide()`/`toggle()`                                                                                                            |
| `useFocusTrap`                                     | `<dialog>.showModal()` — trap, `inert` and top layer for free                                                                                                      |
| `useOutsideInteraction`                            | `popover` light-dismiss. Where JS remains, **use `event.composedPath()`, never `contains()`** — `contains()` is wrong across shadow boundaries and fails silently. |
| `useAnchoredPosition`                              | Core's `positionAnchored`. CSS anchor positioning is Chromium-only — progressive enhancement, keep the JS path.                                                    |
| `usePresence` / `useExitAnimation`                 | `@starting-style` + `transition-behavior: allow-discrete`, core as fallback                                                                                        |
| `useComposedRefs`                                  | Not needed                                                                                                                                                         |
| **`createPortal` (14 components)**                 | **`popover` attribute** — top layer without moving the node. No portal target, no z-index war, no focus bookkeeping.                                               |
| `createContext` (Toast only)                       | Module-level singleton + a `<pf-toaster>` host element                                                                                                             |
| `useImperativeHandle` (8)                          | Public methods on the element — that is what a class is                                                                                                            |
| Native `<input>` wrappers (15)                     | `static formAssociated = true` + `ElementInternals` — `FormData` participation, `:invalid`, `<label for>`                                                          |
| `items: { label: ReactNode }[]`                    | Child elements — `<pf-tab>`, `<pf-option>` — plus an `.items` property for plain data                                                                              |

---

## 7. Phases and exit criteria

**Phase 1 — Extract the core.** Move the 9 hooks' logic into
`@pitchfork-ui/core` with no React import; rewrite `packages/react/src/hooks` as
adapters over it. No component changes, no API changes.
_Exit:_ the existing React test suite passes untouched. **This phase is worth
doing on its own merits and commits you to nothing.**

**Phase 2 — Prove the contract.** `@pitchfork-ui/elements` exists;
`<pf-button>`, `<pf-badge>` and `<pf-input>` are r2wc-wrapped and work in a
plain HTML page and one non-React framework. `custom-elements.json` is emitted.
_Exit:_ a `<script type="module">` and a stylesheet link are all a plain HTML
page needs. CI builds all four packages.

**Phase 3 — Wrap the rest.** All 74 elements exist via generated wrappers, with
a per-component props manifest. Document the Speed 1 limitations honestly,
per-component, including which props degrade.
_Exit:_ 74/74 tags registered; smoke-tested in a non-React host; published as
`@pitchfork-ui/elements@0.1.0`.

**Phase 4 — Write the graduation trigger.** Agree in writing what earns a native
implementation, and instrument enough to know. Nothing is built in this phase.
_Exit:_ the trigger is in `CLAUDE.md` and at least one real consumer exists.

**Phase 5 — Graduate, on demand, forever.** Suggested order when triggers fire:
`pf-icon` first (fan-in of 25, and it drops the FA React dependency), then the
45 leaf components (cheapest, highest volume, and where the `::part()`
conventions get established at low stakes), then overlays (where `popover` and
`<dialog>` delete the most hand-rolled code), then form controls, then the 22
data-driven components last — their slot redesign should happen only once the
conventions are proven.
_Exit:_ none. This phase does not finish, and it is not supposed to.

---

## 8. Things to consider

### 8.1 The docs do not get rewritten — and that is the point

~16,200 lines of stories and MDX stay exactly as they are, because Storybook
keeps documenting the React components, which remain the reference
implementation. This is the largest single saving in this plan versus a full
port, and it is a direct consequence of keeping React first-class.

What is needed instead: a short "Using Pitchfork UI without React" MDX page, and
per-component notes where a wrapped element's API differs from the React one.
Generate those notes from the props manifest rather than writing them by hand.

### 8.2 `ReactNode` props are the permanent asterisk

No option in §2 makes `label: ReactNode` expressible in HTML. Under Speed 1 it
degrades to a string; under Speed 2 it becomes a slot. Until a component
graduates, its non-React API is genuinely reduced, and the docs must say so
per-prop rather than in a general disclaimer nobody reads.

### 8.3 Two implementations is the risk this plan manages, not avoids

Every graduated component is a second hand-written view to keep in sync. The
mitigations are structural: the core package means the _behaviour_ is shared and
only the template diverges; graduating on demand means the count stays small;
and a shared test suite run against both implementations catches drift. Add that
shared suite when the second component graduates, not the tenth.

### 8.4 Browser support for graduated components

| Feature                               | Status                                                      |
| ------------------------------------- | ----------------------------------------------------------- |
| Custom elements, shadow DOM, slots    | Safe                                                        |
| Constructable stylesheets, `::part()` | Safe                                                        |
| `ElementInternals` / form-associated  | Safe                                                        |
| Declarative Shadow DOM                | Safe                                                        |
| `<dialog>`, `popover`                 | Safe                                                        |
| `@starting-style`, `allow-discrete`   | Safe enough — degrade to no exit animation                  |
| **CSS anchor positioning**            | **Chromium only** — progressive enhancement                 |
| **Scoped custom element registries**  | **Not baseline** — document one-version-per-page            |
| **Cross-root ARIA**                   | **Chromium only** — keep label and control in the same root |
| **`:host-context()`**                 | **Chromium only** — never use it                            |

The four bold rows are how a library quietly becomes Chromium-only.

### 8.5 SSR

Speed 1 cannot server-render — React mounts on the client inside each element.
If a consumer needs content in the initial HTML, that component must graduate,
and graduation then implies Declarative Shadow DOM and `@lit-labs/ssr`. Treat
"needs SSR" as a graduation trigger rather than a property of the whole library.

### 8.6 r2wc's release cadence is the one dependency risk worth naming

Latest release v2.1.1, February 2025 — no releases in about nineteen months at
the time of writing. React 19 is in its peer deps and it is only ~1.4 KB with a
small, stable surface, so the exposure is low and the code is vendorable if it
ever comes to that. But confirm the current state before Phase 2, and treat
"r2wc goes unmaintained" as a scenario with a written answer: vendor it, or
accelerate graduation for the components that matter.

### 8.7 Release mechanics

Two new published packages (`core`, `elements`) means two new npm trusted
publishers, and **`Allow npm publish` is off by default** — `todo.md` documents
this exact failure and how to tell the three error cases apart. Set them up and
verify with the _Verify npm trusted publisher_ workflow before the first
release, not after release-please has cut a tag. Add both to
`release-please-config.json` in Phase 1.

### 8.8 Versioning

`@pitchfork-ui/react` needs no major version under this plan — its API does not
change. `@pitchfork-ui/elements` starts at 0.x and stays there until the props
manifests stop moving. Document that a graduated element may change its
_internal_ DOM and its `::part()` surface, and version the parts surface as
public API from the first graduation.

### 8.9 Bundle size

Be honest in the README: Speed 1 ships React inside the element. For a React
consumer that is free (already loaded); for a plain HTML page it is ~45 KB gzip
before any component code. That is the price of not rewriting 74 components, it
is the main thing graduation buys back, and it should be stated plainly rather
than discovered.

### 8.10 theme-builder and demo

`apps/theme-builder` writes `--pf-*` values onto `:root` and keeps working
unchanged, including through shadow boundaries once components graduate — a
useful early proof. `apps/demo` consumes the React API and should never need an
edit; if it does, the core extraction in Phase 1 went wrong.

---

## 9. When to stop

- **After Phase 1, if nothing else is wanted.** The core extraction stands alone:
  better-tested behaviour, no duplication, no commitment to web components.
- **After Phase 3, permanently.** If wrapped elements serve every real consumer,
  there is no reason to graduate anything. Stopping here is the expected outcome,
  not a failure.
- **Before Phase 5 gets ambitious.** If graduated components start drifting from
  their React counterparts faster than the shared test suite catches it, stop
  graduating and fix the seam first.
- **If no non-React consumer materialises by Phase 4.** The entire return is
  framework independence. Ship Phase 1, shelve the rest, and lose nothing.

---

## Reference — source of truth in this repo

| Thing                      | Where                                 |
| -------------------------- | ------------------------------------- |
| React components (kept)    | `packages/react/src/components/`      |
| Hooks to extract into core | `packages/react/src/hooks/`           |
| a11y helpers to extract    | `packages/react/src/a11y/index.ts`    |
| Theming contract           | `packages/react/src/styles/theme.css` |
| Tokens                     | `packages/tokens/src/tokens/`         |
| Conventions to update      | `CLAUDE.md`                           |
| Metadata extractor (kept)  | `scripts/build-metadata.mjs`          |
| Agent-facing plan it feeds | `AI-KIT-PLAN.md`                      |
| Release gotchas            | `todo.md`                             |
