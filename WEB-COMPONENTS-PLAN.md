# Pitchfork UI — Web Components Migration Plan

A plan for re-basing Pitchfork UI on custom elements so the library works in any
framework — or none — instead of only React.

**Recommendation in one line:** build `@pitchfork-ui/elements` on **Lit 3 with
shadow DOM**, keep `@pitchfork-ui/tokens` untouched, and republish
`@pitchfork-ui/react` as **generated thin wrappers** so no existing consumer is
stranded.

**The framing question, asked up front:** this migration buys framework
independence and portability. It does not buy smaller bundles, fewer files or
simpler code, and for a React-only consumer it is a net cost. If the only
consumer is a React site, stop here. If the intent is "a design system anyone
can drop into a Vue app, an Astro page, a Rails ERB template or a plain
`<script>` tag", read on — that is exactly what this delivers.

---

## 0. Guiding principles

- **The platform is the framework.** Where a browser primitive exists —
  `<dialog>`, `popover`, `ElementInternals`, slots, the top layer — use it and
  delete the hand-rolled equivalent. The migration should end with _less_
  behavioural code than it started with, not more.
- **Tokens are untouched.** `@pitchfork-ui/tokens` and the
  `component var → theme alias → token` chain survive the port whole. CSS custom
  properties inherit through shadow boundaries; this is the single biggest
  reason the migration is tractable.
- **One rewrite, not two.** Do not port React idioms mechanically and then fix
  the API later. The prop-to-slot redesign (§2c) happens component by component,
  as each is ported.
- **React stays a supported consumer.** It becomes a wrapper layer, generated
  from the manifest, not a parallel implementation. Two hand-maintained
  implementations of 74 components is the failure mode this plan exists to
  avoid.
- **Strangler, not big bang.** `packages/react` keeps building and publishing
  until the wrapper equivalent passes its tests. `main` is releasable every day
  of the migration.
- **Generate, never hand-write** — inherited from `AI-KIT-PLAN.md`, and more
  true here: the Custom Elements Manifest replaces the bespoke TS-interface
  extractor and feeds docs, wrappers, editor tooling, `llms.txt` and MCP from
  one source.

---

## 1. What you are actually migrating

Measured from the tree, not estimated:

| Asset                    | Count                                                  |
| ------------------------ | ------------------------------------------------------ |
| Component folders        | 74                                                     |
| Component TSX            | ~10,900 lines                                          |
| Component CSS            | ~8,200 lines                                           |
| Test files / lines       | 74 / ~7,700 lines                                      |
| Storybook stories + MDX  | 150 `.stories.tsx` + 80 `.mdx`, ~16,200 lines          |
| `theme.css`              | 917 lines (`:root` aliases + one `[data-theme]` block) |
| Published packages       | `react@0.15.1`, `tokens@0.4.1`, `mcp@0.2.0`            |
| Internal React consumers | `apps/docs`, `apps/theme-builder`, `apps/demo`         |

### What makes this easier than it looks

- **Almost no React-idiom coupling.** One `createContext` in the whole library
  (Toast). No compound-component context plumbing, no render props, two uses of
  `cloneElement`/`Children`, no Suspense, no reducers, no memo. Eight
  `useImperativeHandle` calls. The components are, structurally, DOM builders
  with local state.
- **Charts are hand-rolled SVG.** `PieChart`, `RadarChart`, `Heatmap`,
  `Sparkline`, `LineBarCharts`, `GaugeChart` have no charting dependency. They
  port as template translations.
- **Only two React-only third-party dependencies**: `@fortawesome/react-fontawesome`
  (Icon) and `prism-react-renderer` (CodeSnippet). Both have framework-free
  equivalents (§4).
- **Dark mode never appears in component CSS.** Zero `data-theme` and zero
  `prefers-color-scheme` selectors across all 74 `.css` files — every theme
  switch happens in the `:root` custom-property layer. This is load-bearing:
  `:host-context()` is Chromium-only, so a component that styled itself on an
  ancestor `[data-theme='dark']` would break in Safari and Firefox inside a
  shadow root. The existing discipline dodges that entirely.
- **CSS is already component-scoped.** BEM with a `pf-` prefix, and cross-component
  descendant selectors are rare and always within one component's own subtree.

### What makes it harder than it looks

- **22 components take data-array props** (`items`, `options`, `data`, `columns`)
  whose fields are typed `React.ReactNode` — `Tabs`, `Accordion`, `Select`,
  `Combobox`, `MultiSelect`, `Dropdown`, `ContextMenu`, `CommandPalette`,
  `Table`, `TreeView`, `Timeline`, `SidebarNavigation`, `HeaderNavigation`,
  `Breadcrumbs`, `Pagination`, `RadioGroup`, `ButtonGroup`, `Toast` and the
  charts. `ReactNode` cannot cross the HTML boundary. These need API redesign,
  not translation. This is the real work.
- **14 components use `createPortal`.** Every overlay. The replacement is better
  than the original (§5), but it is a behavioural rewrite each time.
- **15 components wrap a native form control** and must become form-associated
  to keep working inside a `<form>`.
- **The docs are larger than the library.** ~16,200 lines of stories and MDX
  versus ~10,900 lines of components. Budget accordingly (§8.1).
- **A pre-existing discipline gap.** `CLAUDE.md` says never use raw tokens in
  component CSS, but ~658 direct `var(--space-*)`, `var(--font-*)`, `var(--radius-*)`
  references exist. Colour is disciplined; spacing and type are not. This is
  harmless for shadow DOM (custom properties still inherit) — note it, do not
  fix it during the port, and do not let the port depend on fixing it.

---

## 2. The decisions

### 2a. Base library — **Lit 3**

Reactive properties plus declarative templates keep each port close to a 1:1
rewrite of the JSX that exists. ~6 KB shared runtime, first-class TypeScript,
reactive controllers that map cleanly onto the existing hooks, `@lit/react` for
wrapper generation and `@lit-labs/ssr` if server rendering is ever needed.

**Rejected, and why:**

| Option                 | Why not                                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vanilla `HTMLElement`  | Zero dependencies, but you hand-roll list diffing 74 times. `Table`, `TreeView`, `Combobox` and `Calendar` are where the bugs would live.                                                         |
| Stencil                | Generates wrappers and docs for free, which is genuinely attractive — but it owns the toolchain, replaces the Vite setup the repo already knows, and its JSX is React-shaped without being React. |
| Mitosis / compile-many | Keeps React output "for free", but constrains authoring to a subset, makes debugging a generated-code exercise, and fights the data-prop→slot redesign that is the point of the migration.        |
| FAST, Atomico, etc.    | Smaller ecosystems; nothing they do that Lit does not.                                                                                                                                            |

### 2b. Shadow DOM — **yes, on by default**

Encapsulation is the reason to ship web components into pages you do not
control. Styles go in `static styles` as constructable stylesheets, shared
across every instance of an element.

What this costs, stated plainly:

1. **Consumer global CSS overrides stop working.** Anyone doing
   `.pf-button { border-radius: 0 }` today loses it. The replacement is a
   _designed_ API: a documented `::part()` surface plus per-component
   `--pf-*` custom properties. This is public API — inventory it, version it,
   and do not add parts ad hoc.
2. **ARIA IDREFs do not cross the boundary.** `aria-labelledby` pointing from
   inside a shadow root to an element outside it silently does nothing, and
   cross-root ARIA (`ariaLabelledByElements`) is Chromium-only. Keep each
   interactive element and its label in the _same_ root — which the field-wrapper
   pattern already does — and expose labels as attributes or slots rather than
   expecting consumers to wire IDREFs.
3. **`:host-context()` is unusable** (Chromium only). Covered by the existing
   no-dark-mode-in-component-CSS rule; keep enforcing it.

What it does _not_ cost: slotted children stay in the light DOM and keep being
styled by the consumer's own stylesheet. `<pf-card>`'s internals are sealed;
the consumer's content inside it is not. That distinction resolves most of the
"shadow DOM breaks my styling" objection before it is raised.

**Light-DOM Lit is the fallback** if the `::part()` surface proves too large to
design — keeps existing CSS verbatim, loses encapsulation. Do not mix the two
modes across the library; a per-component rule nobody can remember is worse than
either consistent choice.

### 2c. Prop → element API mapping

The rule, applied component by component:

| React prop shape                              | Web component form                                                 |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `variant`, `size`, booleans, numbers, strings | **Attribute**, reflected, styled via `:host([variant='primary'])`  |
| `label`/`title`/`icon`/`children: ReactNode`  | **Slot** (named for anything but the default)                      |
| `items: { label: ReactNode, ... }[]`          | **Child elements** — `<pf-tab>`, `<pf-option>`, `<pf-tree-item>`   |
| `data: { x: number, y: number }[]`, `columns` | **Property only** (no attribute) — homogeneous data with no markup |
| `onValueChange`, `onOpenChange`               | **`CustomEvent`** — `pf-change`, `pf-open`                         |
| `className`, `style`, `data-*`, `aria-*`      | Nothing to do — the host _is_ an element                           |
| `...props` spread                             | Delete                                                             |
| `forwardRef` + `displayName`                  | Delete — the element is the ref                                    |

Applying this deletes 74 `forwardRef` wrappers, 74 prop spreads, and most `cx()`
calls on root elements. Expect the component bodies to shrink.

For the 22 data-driven components, ship **both**: child elements as the
authored/SSR-able API, and an `.items` property for the data-driven case.
`<pf-table>` genuinely wants rows as data; `<pf-tabs>` genuinely wants
`<pf-tab>` children. Most want both, and the property path can render into the
same internal template the slots feed.

### 2d. Events

- Name them `pf-<verb>`: `pf-change`, `pf-input`, `pf-open`, `pf-close`,
  `pf-select`, `pf-dismiss`.
- `bubbles: true, composed: true` for anything a consumer listens for from
  outside the shadow root. Everything user-facing, in practice.
- Payload in `detail`. Never reuse a native event name with a different shape.
- Form-associated elements also fire native `input`/`change` so they behave like
  a real control to form libraries and delegated listeners.
- Use `cancelable: true` for pre-action events (`pf-before-close`) where the
  consumer should be able to veto.

### 2e. React stays — as generated wrappers

`@pitchfork-ui/react` goes to v1.0 as a wrapper package produced from the Custom
Elements Manifest via `@lit/react`. React 19 handles custom-element properties
well, but the wrappers still earn their keep: typed props, JSX types, custom
events as `onPfChange` props, ref forwarding, and React 18 support for consumers
who have not upgraded.

This also de-risks the whole migration: `apps/docs`, `apps/theme-builder` and
`apps/demo` keep compiling against a React API throughout, which makes
`apps/demo` a free end-to-end regression test of the wrapper layer.

### 2f. Naming and registration

- `pf-` prefix, kebab-case: `pf-button`, `pf-date-picker`, `pf-command-palette`.
- Side-effect registration on import, guarded: `if (!customElements.get(name))`.
- Per-component entry points so `import '@pitchfork-ui/elements/button'` pulls
  one element, plus a barrel for `import '@pitchfork-ui/elements'`.
- **Two versions on one page will collide.** Scoped custom element registries
  are not baseline; treat single-version-per-page as a documented constraint,
  with `@webcomponents/scoped-custom-element-registry` as the escape hatch for
  micro-frontend consumers.

---

## 3. Target workspace structure

```txt
packages/
├── tokens/            UNCHANGED — Style Dictionary, the load-bearing asset
├── elements/          NEW — @pitchfork-ui/elements (Lit 3)
│   └── src/
│       ├── components/ComponentName/
│       │   ├── pf-component-name.ts      element + styles import
│       │   ├── pf-component-name.css     PostCSS-processed, inlined via postcss-lit
│       │   └── index.ts
│       ├── controllers/                  replaces hooks/
│       ├── internals/                    form association, a11y helpers
│       ├── styles/theme.css              MOVED from packages/react
│       └── index.ts
├── react/             @pitchfork-ui/react v1 — GENERATED wrappers over elements
└── mcp/               unchanged shape, fed from CEM instead of metadata.json
apps/
├── docs/              Storybook @storybook/web-components-vite
├── theme-builder/     unchanged (edits :root custom properties — still works)
└── demo/              unchanged (consumes the React wrappers — regression test)
scripts/
├── build-metadata.mjs    REPLACED by CEM analyzer + a small transform
├── build-llms-txt.mjs    input changes to custom-elements.json
└── build-mcp-data.mjs    input changes to custom-elements.json
```

`theme.css` moves to `packages/elements` and `packages/react` consumes it from
there. It stays a `:root`-level stylesheet loaded once by the page — it is the
theming contract, and it must not move into shadow roots.

---

## 4. Technology choices

| Concern              | Today                                               | Proposed                                                                                                                                                                                              |
| -------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component base       | React 18/19 + `forwardRef`                          | **Lit 3**                                                                                                                                                                                             |
| Styles in components | `.css` file + Vite CSS import                       | Same `.css` files, inlined into `static styles` by **`postcss-lit`** — keeps `@csstools/postcss-global-data` + `postcss-custom-media` working, so the 32 `@media (--sm/--md)` queries need no rewrite |
| Tokens               | Style Dictionary                                    | **Unchanged**                                                                                                                                                                                         |
| Build                | Vite lib mode, `preserveModules`                    | **Unchanged**, plus per-component entries                                                                                                                                                             |
| API metadata         | `scripts/build-metadata.mjs` (TS interface parsing) | **`@custom-elements-manifest/analyzer`** + Lit plugin → `custom-elements.json`                                                                                                                        |
| Editor support       | none                                                | Free from CEM: `vscode.html-custom-data.json`, JetBrains `web-types.json`                                                                                                                             |
| Docs                 | `@storybook/react-vite`                             | **`@storybook/web-components-vite`**                                                                                                                                                                  |
| Tests                | Vitest + jsdom + RTL-React                          | **Vitest browser mode + Playwright** (already in devDependencies) + `@open-wc/testing-helpers` + `@testing-library/dom`                                                                               |
| Icons                | `@fortawesome/react-fontawesome`                    | `@fortawesome/fontawesome-svg-core` `icon()` → raw SVG string, or inline path data. Drops a React dependency and shrinks the payload.                                                                 |
| Syntax highlighting  | `prism-react-renderer`                              | `prismjs` core (small, same grammar) or `shiki` (better output, heavier — only if CodeSnippet warrants it)                                                                                            |
| SSR                  | `'use client'` banner                               | Declarative Shadow DOM + `@lit-labs/ssr` **if needed** — decide once, see §8.4                                                                                                                        |

---

## 5. Translation guide — React idiom → platform equivalent

Write this table into `CLAUDE.md` once Wave 0 lands; it is the porting contract.

| React                                              | Web component                                                                                                                                                                                            |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useState`                                         | `@state()` / `@property()`                                                                                                                                                                               |
| `useRef` (DOM)                                     | `@query('.selector')`                                                                                                                                                                                    |
| `useEffect`                                        | `connectedCallback` / `updated()` / a reactive controller                                                                                                                                                |
| `useLayoutEffect` + the isomorphic dance in `Tabs` | `updated()` — the SSR guard disappears                                                                                                                                                                   |
| **`useId` (31 components)**                        | **Delete.** IDs are scoped per shadow root; use literal `id="trigger"`. A real simplification, not a workaround.                                                                                         |
| `useMemo` / `useCallback`                          | Plain methods; `cache`/`guard` directives only where measured                                                                                                                                            |
| `useControllableState`                             | Mirror the platform: the element owns its state and emits `pf-change`; a consumer "controls" it by setting the property back. There is no controlled/uncontrolled split in the DOM — `<input>` is proof. |
| `useDisclosure`                                    | `open` boolean attribute + `show()`/`hide()`/`toggle()` methods                                                                                                                                          |
| `useFocusTrap`                                     | `<dialog>.showModal()` (Modal, CommandPalette) — trap, `inert` and top layer for free                                                                                                                    |
| `useOutsideInteraction`                            | `popover` light-dismiss. Where JS is still needed, **use `event.composedPath()`, never `contains()`** — `contains()` is wrong across shadow boundaries and this will bite silently.                      |
| `useAnchoredPosition`                              | Port to an `AnchoredController`. CSS anchor positioning is Chromium-only — treat as progressive enhancement, keep the JS path.                                                                           |
| `usePresence` / `useExitAnimation`                 | `@starting-style` + `transition-behavior: allow-discrete`, controller as fallback                                                                                                                        |
| `useComposedRefs`                                  | Delete                                                                                                                                                                                                   |
| **`createPortal` (14 components)**                 | **`popover` attribute** — top layer without moving the node in the DOM. This is the best win in the migration: no portal target, no z-index war, no focus restoration bookkeeping.                       |
| `createContext` (Toast only)                       | Module-level singleton + a `<pf-toaster>` host element, or a bubbling `pf-toast-show` event                                                                                                              |
| `useImperativeHandle` (8)                          | Public methods on the element — that is just what a class is                                                                                                                                             |
| Native `<input>` wrappers (15)                     | `static formAssociated = true` + `ElementInternals` — gives `name`/`value` in `FormData`, `:invalid`, validation messages, and `<label for>` association                                                 |

---

## 6. Build order

Ordered by leverage and by the internal dependency graph (`Icon` has a fan-in of
25; 45 of 74 components import nothing internal at all).

| Wave  | Scope                                                                                                                                                   | Notes                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0** | Infrastructure + **`pf-button` end to end**                                                                                                             | One component through every stage: build, CEM, Storybook, browser test, React wrapper, published dry run. Do not start Wave 1 until this is boring.     |
| **1** | `pf-icon`, base class, shared controllers, `theme.css` move                                                                                             | `Icon` unblocks 25 components. Drop the FA React dependency here.                                                                                       |
| **2** | The 45 leaves — Badge, Card, Tag, Avatar, Kbd, Metrics, EmptyState, dividers, layout, progress, loading                                                 | Mechanical. Highest components-per-day. Build the `::part()` conventions here while stakes are low.                                                     |
| **3** | Form controls (15) — Input, Textarea, Checkbox, Switch, RadioButton/Group, Slider, NumberInput, TagInput, FileUploader                                  | `ElementInternals` and the field-wrapper pattern, done once and reused.                                                                                 |
| **4** | Overlays (14) — Modal, Tooltip, Popover, Dropdown, ContextMenu, SlideoutMenu, Toast, CommandPalette                                                     | `<dialog>` and `popover`. Where the most hand-rolled code gets deleted.                                                                                 |
| **5** | Data-driven composites — Tabs, Accordion, Select, Combobox, MultiSelect, Table, TreeView, Timeline, navigation, Pagination, Calendar, date/time pickers | **The hard wave.** Every one needs the §2c API redesign. Do not schedule this early to "get it over with" — do it once the slot conventions are proven. |
| **6** | Charts + media — Pie, Radar, Heatmap, Sparkline, Line/Bar/Area, Gauge, Carousel, VideoPlayer, RichTextEditor, CodeSnippet                               | Bulky, low-risk, mostly SVG template translation. Good parallel work.                                                                                   |
| **7** | Cutover — docs, wrapper generation, metadata pipeline, release                                                                                          | See §7.                                                                                                                                                 |

---

## 7. Phases and exit criteria

**Phase 1 — Spike (Wave 0).** `packages/elements` exists; `pf-button` builds,
has a browser test, appears in Storybook with a docs page generated from the
CEM, and a generated React wrapper renders it in `apps/demo`. CI runs both
packages.
_Exit:_ a second developer can add `pf-badge` by copying `pf-button` and reading
no prose.

**Phase 2 — Foundations (Wave 1).** Base class, controllers, theme move, icon.
_Exit:_ `theme.css` loads once at `:root` and every custom property resolves
inside a shadow root; dark mode verified in Safari and Firefox, not just
Chromium.

**Phase 3 — Bulk port (Waves 2–4).** ~70% of components.
_Exit:_ `::part()` surface documented for every ported component; contrast check
(`scripts/check-dark-contrast.mjs`) passing against the new stylesheets.

**Phase 4 — API redesign (Wave 5).** The 22 data-driven components.
_Exit:_ every one authorable as plain HTML with no JavaScript beyond the module
import, _and_ drivable from a `.items` property.

**Phase 5 — Completion (Wave 6).**
_Exit:_ 74/74 elements shipped; every component has at least one a11y-focused
browser test, matching the current bar.

**Phase 6 — Cutover (Wave 7).**
_Exit:_ `packages/react/src/components` deleted; `@pitchfork-ui/react` publishes
generated wrappers at v1.0.0; `build-metadata.mjs` deleted and `llms.txt` + MCP
data generated from `custom-elements.json`; migration guide published; Storybook
deploys to Hostinger unchanged.

A realistic shape for one person working steadily: Phase 1 is days, Phases 2–3
are the long middle, Phase 4 is where the schedule slips, Phase 6 is a week of
tooling. The component port is not the critical path — §8.1 is.

---

## 8. Things to consider

### 8.1 The docs are the real cost

~16,200 lines across 150 story files and 80 MDX pages, versus ~10,900 lines of
components. Every `*.examples.stories.tsx` carries a hand-written
`parameters.docs.source.code` JSX string (a repo convention), and every one of
those must be rewritten as HTML. Stories become ``html` `` templates; MDX prose
mostly survives but every code fence changes.

**Mitigation worth costing before Wave 2:** generate the `source.code` strings
from the rendered story instead of hand-authoring them. Storybook's
web-components renderer can serialise the actual DOM, which removes the
convention's maintenance burden permanently — one of the few places this
migration can leave the repo structurally better off.

### 8.2 The agent-facing story gets better

`build-metadata.mjs` is a bespoke TypeScript-interface extractor. CEM is a
published schema with an ecosystem: editor completions in VS Code and JetBrains
fall out for free, and `llms.txt` and the MCP data get a more accurate input
(slots, parts, CSS properties and events are first-class in CEM; they are
inferred today). Keep the `--strict` CI gate — port it to validate the manifest.

### 8.3 Browser support — what is and is not safe

| Feature                               | Status                                                        |
| ------------------------------------- | ------------------------------------------------------------- |
| Custom elements, shadow DOM, slots    | Safe                                                          |
| Constructable stylesheets, `::part()` | Safe                                                          |
| `ElementInternals` / form-associated  | Safe                                                          |
| Declarative Shadow DOM                | Safe                                                          |
| `<dialog>`, `popover`                 | Safe                                                          |
| `@starting-style`, `allow-discrete`   | Safe enough — degrade to no exit animation                    |
| **CSS anchor positioning**            | **Chromium only** — progressive enhancement, keep the JS path |
| **Scoped custom element registries**  | **Not baseline** — document one-version-per-page              |
| **Cross-root ARIA**                   | **Chromium only** — design around it (§2b)                    |
| **`:host-context()`**                 | **Chromium only** — never use it                              |

Verify the middle tier against the project's actual support target before
committing; the three bold rows are the ones that quietly produce a Chromium-only
component library if nobody is watching.

### 8.4 SSR — decide once, early

If the consuming site is statically built or client-rendered, skip SSR entirely
and guard the flash with `:not(:defined) { visibility: hidden }`. If it is
server-rendered and content needs to be in the initial HTML, that means
Declarative Shadow DOM and `@lit-labs/ssr`, which is a meaningful ongoing tax on
every component. Deciding this in Phase 1 costs an hour; deciding it in Phase 5
costs a re-port.

### 8.5 This is a breaking change for existing consumers

Global `.pf-*` overrides stop working, and every `items`-prop call site is
rewritten. Required: a major version, a migration guide with a per-component
before/after, and the `::part()` inventory as documented API. Consider keeping
`@pitchfork-ui/react@0.x` on a maintenance branch for bug fixes during the
transition — but set an end date, because two implementations is the thing this
plan is built to avoid.

### 8.6 Release mechanics

A new published package means a new npm trusted publisher, and **`Allow npm
publish` is off by default** — see `todo.md`, which documents exactly this
failure and how to tell the three error cases apart. Set it up and verify with
the _Verify npm trusted publisher_ workflow before the first release, not after
release-please has already cut a tag. Add `packages/elements` to
`release-please-config.json` in Phase 1 so its changelog accumulates from the
first commit.

### 8.7 Testing changes shape

jsdom's shadow DOM and `ElementInternals` support is too incomplete to trust for
this library. Move to Vitest browser mode on Playwright — both are already in
`devDependencies`. Consequences: ~7,700 lines of Testing-Library-React tests are
rewritten (not ported), suites run slower, and queries need shadow-aware helpers
because `@testing-library/dom` does not pierce shadow roots. Budget it as its
own line item alongside §8.1, and keep the existing bar: every component gets at
least one a11y-focused test.

### 8.8 Bundle size — be honest

For a React consumer, custom elements plus wrappers ship _more_ bytes than
today: Lit's runtime is additive where React's is already paid for. For a
non-React consumer, the comparison is strongly favourable. Do not sell this
migration on size.

### 8.9 Feature freeze policy

Freeze new components and API changes on `packages/react` from Phase 3 onward;
keep shipping bug fixes and token changes. Without a freeze, Wave 5 ports a
moving target.

### 8.10 theme-builder and demo

`apps/theme-builder` writes `--pf-*` values onto `:root` — it keeps working
through shadow boundaries with no changes, which is a useful early proof in
Phase 2. `apps/demo` consumes the React API and should keep compiling untouched;
if it needs edits, the wrapper layer is wrong.

---

## 9. When to stop

Reasons to abandon rather than push through, worth agreeing on now:

- The `::part()` surface for the Wave 5 components turns out to need more parts
  than the component has elements. That means shadow DOM is the wrong call —
  fall back to light-DOM Lit (§2b) rather than shipping a component nobody can
  style.
- The only consumers are still React apps by Phase 4. The migration's entire
  return is framework independence; if nothing is exercising it, the remaining
  waves are unpaid work.
- Wave 5 API redesign stalls on two or three components. Ship those as
  property-driven only and document the gap; do not let `pf-table`'s slot design
  hold the release.

---

## Reference — source of truth in this repo

| Thing                        | Where                                 |
| ---------------------------- | ------------------------------------- |
| Current component source     | `packages/react/src/components/`      |
| Hooks to become controllers  | `packages/react/src/hooks/`           |
| a11y helpers                 | `packages/react/src/a11y/index.ts`    |
| Theming contract             | `packages/react/src/styles/theme.css` |
| Tokens                       | `packages/tokens/src/tokens/`         |
| Conventions to update        | `CLAUDE.md`                           |
| Metadata extractor to retire | `scripts/build-metadata.mjs`          |
| Agent-facing plan it feeds   | `AI-KIT-PLAN.md`                      |
| Release gotchas              | `todo.md`                             |
