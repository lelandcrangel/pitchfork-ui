# Pitchfork UI — Web Components Plan

A plan for re-basing Pitchfork UI on Stencil-authored custom elements, so the
same design system serves React, Angular and later Vue — **without retiring the
hand-written React component library**.

**The decision, in one line:** author the elements in **Stencil**, generate the
React, Angular and Vue wrappers from them, keep **npm workspaces** and **npm**
exactly as they are, and keep `@pitchfork-ui/react` hand-authored and published
throughout.

**Nothing in `packages/react/src/components` is deleted at any phase.**

---

## 0. Guiding principles

- **Nothing is deleted.** The React library stays hand-authored and shipping. The
  elements are an additional implementation, and existing consumers are never
  stranded.
- **Angular is the reason this is Stencil.** It is a committed target, not a
  hypothetical. That single fact decided the engine (§2).
- **Tokens and theming are untouched.** `@pitchfork-ui/tokens`, `theme.css` and
  the `component var → theme alias → token` chain all survive the port. This is
  verified, not assumed (§3).
- **Change the monorepo only when it hurts.** The full build is 35 seconds. npm
  workspaces is the right tool until that stops being true (§6).
- **Generate every wrapper.** React, Angular and Vue bindings come out of the
  Stencil build. A hand-maintained wrapper layer for three frameworks is the
  failure mode this plan exists to avoid.

---

## 1. What you are migrating

| Asset               | Count                                                |
| ------------------- | ---------------------------------------------------- |
| Component folders   | 74                                                   |
| Component TSX / CSS | ~10,900 / ~8,200 lines                               |
| Tests               | 74 files, ~7,700 lines                               |
| Stories + MDX       | 150 `.stories.tsx` + 80 `.mdx`, ~16,200 lines        |
| `theme.css`         | 917 lines (`:root` aliases + one `[data-theme]`)     |
| Published           | `react@0.15.2`, `tokens@0.4.1`, `mcp@0.2.0`          |
| Built, unpublished  | `core@0.1.0`                                         |
| Full build time     | **35s** (tokens 3, core 8, react 10, gen 2, docs 12) |

### What makes it tractable

- **The behaviour is already extracted.** `@pitchfork-ui/core` holds anchoring,
  focus trapping, dismissal, list navigation and the a11y helpers, framework-free
  and tested. Stencil components consume it as plain TypeScript, exactly as the
  React hooks do. Phase 1 was engine-agnostic by design and carries over whole.
- **Stencil's JSX is close to React's.** The template half of each port is closer
  to transcription than rewriting — materially cheaper than Lit's tagged
  templates across 74 components.
- **Almost no React-idiom coupling.** One `createContext` (Toast), two
  `cloneElement` uses, no Suspense, no reducers. The components are DOM builders
  with local state.
- **Charts are hand-rolled SVG.** No charting dependency to replace.
- **Dark mode never appears in component CSS** — zero `data-theme` and zero
  `prefers-color-scheme` selectors across all 74 files. Every theme switch lives
  in the `:root` custom-property layer, which is what lets the CSS move into
  shadow roots unchanged.

### What stays hard

- **22 components take data-array props** (`items`, `options`, `data`, `columns`)
  with `React.ReactNode` fields. `ReactNode` cannot cross the HTML boundary under
  any engine. These need API redesign around slots and child elements, not
  translation.
- **The docs are larger than the library.** ~16,200 lines of stories and MDX.
  They keep documenting the React components, so they are not rewritten — but the
  elements will eventually need their own documentation story.
- **The port is now front-loaded.** See §4: dropping r2wc means real components
  are needed sooner.

---

## 2. Decisions, and the evidence behind them

| Decision            | Choice                    | Why                                                                        |
| ------------------- | ------------------------- | -------------------------------------------------------------------------- |
| Element engine      | **Stencil**               | Official React + Angular + Vue output targets; Angular is committed        |
| Monorepo            | **npm workspaces** (keep) | Full build is 35s; nothing to orchestrate yet                              |
| Package manager     | **npm** (keep)            | OIDC trusted publishing already works; pnpm's gain does not cover the risk |
| React library       | **Kept, hand-authored**   | The standing constraint                                                    |
| Compatibility layer | **No r2wc**               | Ships React into Angular bundles — see §4                                  |

### Why Stencil over Lit

`@stencil/angular-output-target` generates Angular wrappers with
`valueAccessorConfigs` — real `ControlValueAccessor` integration for reactive
forms and `ngModel`. **There are 15 form components here.** Hand-writing value
accessors for them is the kind of work that quietly consumes a quarter, and Lit
has no equivalent.

Lit remains the better pure-platform choice and nearly won: Shoelace migrated
_from_ Stencil _to_ Lit for a leaner codebase closer to the platform, and that is
the closest precedent to this library. Two things decided against it. Angular
form integration, above. And the measured Nx friction that favoured Lit
evaporated once npm workspaces stayed (§6).

Worth recording so nobody re-litigates it later: **`@stencil/react-output-target`
depends on `@lit/react`.** Choosing Stencil does not avoid Lit; it adds a
compiler above it.

### 2.1 Data-driven components take child elements, not options arrays

Decided after `pf-radio-group` forced the question. `<pf-select>` gets
`<pf-option>` children, not an `options` property; the same for every one of
the 22 data-driven components.

**Radios made part of it non-negotiable.** A form-associated custom element
gets no radio grouping from the browser. Measured against a hand-rolled one:
three such elements sharing a `name` all stay checked and the form submits one
entry _each_, where native radios submit one between them. So something has to
own single selection, and that something is a group element with the radios as
its children. There is no standalone-radio design that works.

**For the rest it was a choice, and this is what it costs.** The React library
keeps its `options`/`items` arrays, so the two layers' APIs diverge and their
docs stop matching. Rendering a list needs a loop in the consumer's template —
`@for` in Angular, `.map()` in React — rather than one property assignment.
Both consumer apps show exactly that, deliberately.

**What it buys:** a child's label is a slot, so it takes arbitrary content,
which an array of strings never can — and §1 names `React.ReactNode` fields in
those arrays as the thing that cannot cross the HTML boundary under any
engine. It also means one pattern rather than two, and it matches Shoelace,
which §2 already cites as the precedent for the engine choice.

### Angular output-target constraints, learned the hard way

Two rules about `valueAccessorConfigs`, both found by a failing build:

- **One config per `type`.** The generator merges the `elementSelectors` of
  same-typed configs but emits the host binding once per config, so a second
  `'text'` entry produces a duplicate `'(pfChange)'` key and TS1117. Put every
  text-valued element in the one text config.
- **A multi-tag selector defeats strict DOM event types.** The generated host
  binding is `$event.target?.["value"]`. Angular narrows `$event.target` when a
  selector names one tag but falls back to `EventTarget` across a list, and
  TS7053 follows. `strictDomEventTypes: false` on `packages/elements-angular`
  only — the package holds nothing but generated code, so no hand-written
  template loses checking.

### Rejected

| Option        | Why not                                                                               |
| ------------- | ------------------------------------------------------------------------------------- |
| Lit           | No Angular forms story; see above                                                     |
| Mitosis       | JSX subset the hard components would not survive; debugging moves into generated code |
| r2wc wrappers | Ships React + ReactDOM into every non-React consumer (§4)                             |
| Nx            | Stencil's Nx plugin is community and rough (§6); nothing else justified the migration |
| Turborepo     | A 35-second build has nothing to cache                                                |
| pnpm          | Its OIDC path is the known-fragile one for exactly this release setup (§6)            |

---

## 3. The CSS pipeline survives — verified

The largest migration risk was the PostCSS chain: 32 `@media (--sm/--md)` queries
and the whole token alias chain depend on `@csstools/postcss-global-data` plus
`postcss-custom-media`. This was tested on a real Stencil build via
`@stencil/postcss`, wiring the same two plugins against a `theme.css`:

- `@media (--md)` compiled to **`@media (min-width: 768px)`**
- no unresolved custom media in the output (only in `.js.map`, as expected)
- `var(--pf-button-primary-bg)` and `var(--space-2)` **preserved, not inlined** —
  the three-tier alias chain is intact

**The theming architecture ports unchanged.** Carry this config into
`packages/elements/stencil.config.ts` verbatim.

---

## 4. Why there is no r2wc layer any more

The previous plan opened with a compatibility layer: wrap the existing React
components as custom elements with `@r2wc/react-to-web-component`, giving all 74
tags in weeks without rewriting anything. Its premise was that consumers are
React, so shipping React inside each element costs nothing.

**Angular voids that premise.** Every r2wc element drags React + ReactDOM
(~45 kB gzip) into an Angular bundle and mounts a separate React root per
element. That is indefensible in a design system you are shipping to your own
Angular applications.

The consequence is a real increase in near-term cost, and it should be stated
plainly rather than discovered later: **the native port is on the critical path.**
There is no cheap bridge. Angular apps need real components, so components get
built before Angular apps can use them.

---

## 5. Target shape

```txt
packages/
├── tokens/     unchanged — Style Dictionary
├── core/       unchanged — framework-free behaviour, consumed by BOTH layers
├── react/      KEPT, HAND-AUTHORED — the existing library, still published
├── elements/   NEW — @pitchfork-ui/elements, Stencil custom elements
├── angular/    GENERATED — @stencil/angular-output-target (+ value accessors)
├── vue/        GENERATED — @stencil/vue-output-target
└── mcp/        unchanged in shape
```

**An unresolved naming decision, needed before the first wrapper ships:** the
Stencil-generated React wrappers cannot be `@pitchfork-ui/react`, which the
hand-written library owns. Either give them a distinct name
(`@pitchfork-ui/react-elements`) or plan for them to become `@pitchfork-ui/react`
v2 later and name them provisionally now. Pick one deliberately; drifting into it
produces two packages nobody can tell apart.

---

## 6. Monorepo and tooling — deliberately unchanged

Both alternatives were tested rather than argued about.

**Nx** was measured on a real Nx 23.2.0 workspace with the default TypeScript
setup. The community `@nxext/stencil` plugin generated (the open issue #1175 did
_not_ reproduce), but: it scaffolded at the repo root unless given `--directory`;
it left root `tsconfig.json` `references: []` unwired where `@nx/js` wires them
automatically; its generated `stencil.config.ts` declared **no `outputTargets`**,
so the build died on a missing `workbox-build@4.3.1` until real library targets
were written; and it pulled `@nx/jest@23.2.1` into a workspace pinned at
`23.2.0`, breaking installs twice until overridden. All survivable, none of it
worth paying for.

**Turborepo** was ruled out on measurement: a 35-second build has nothing
meaningful to cache, and npm workspaces plus an explicit ordered script is
clearer at four packages. Note the category difference — workspaces is dependency
linking, Turborepo is a task runner on top; they are not alternatives.

**pnpm** was ruled out on risk, not merit. Its strict `node_modules` is a genuine
correctness win and would have caught a phantom dependency during the core
extraction. But OIDC trusted publishing works today, `todo.md` records what it
cost, and pnpm's OIDC path only became reliable in pnpm 11 — with a known 404
when combined with the `.npmrc` that `actions/setup-node` writes with
`NODE_AUTH_TOKEN` unset, which is exactly this release workflow.

**Revisit all three** when the elements port lands and the package count roughly
doubles. The trigger is measurable: a build past ~2 minutes, or a chain past ~10
steps. If pnpm is adopted then, pin ≥ 11.1.3 or keep `npm publish` for the
release step, and re-verify every trusted publisher first.

---

## 7. Build order

Ordered by leverage and by the dependency graph — `Icon` has a fan-in of 25, and
45 of 74 components import nothing internal.

| Wave  | Scope                                                                 | Notes                                                                                                                                                                       |
| ----- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0** | `packages/elements` + **`pf-button` end to end**                      | Stencil config with the verified PostCSS chain, React + Angular output targets, one component published through the whole pipeline. Do not start Wave 1 until this is dull. |
| **1** | `pf-icon`, shared controllers over `core`, `theme.css` wiring         | Icon unblocks 25 components. Drop `@fortawesome/react-fontawesome` here.                                                                                                    |
| **2** | The 45 leaves — Badge, Card, Tag, Avatar, Kbd, Metrics, EmptyState, … | Mechanical. Establish the `::part()` conventions while stakes are low.                                                                                                      |
| **3** | Form controls (15)                                                    | `valueAccessorConfigs` for every one. **The wave that justified Stencil** — prove the Angular forms story end to end here.                                                  |
| **4** | Overlays (14)                                                         | `<dialog>` and `popover` replace the portal machinery.                                                                                                                      |
| **5** | Data-driven composites (22)                                           | The §1 API redesign — **child elements, decided**; see §2.1. Hardest wave; do it once the slot conventions are proven.                                                      |
| **6** | Charts and media                                                      | Bulky, low-risk SVG transcription. Good parallel work.                                                                                                                      |
| **7** | Wrapper packages, docs story, release wiring                          | Angular and Vue packages published; elements documented.                                                                                                                    |

---

## 8. Phases and exit criteria

**Phase 1 — Core extraction. ✅ Done.** `@pitchfork-ui/core` ships the behaviour
framework-free, the React hooks are adapters over it, 933 React tests pass
untouched, and 57 new tests cover logic that previously had none.

**Phase 2 — Wave 0.** `packages/elements` exists; `pf-button` builds with the
real PostCSS chain, has a test, and renders through generated React _and_ Angular
wrappers.
_Exit:_ someone can add `pf-badge` by copying `pf-button` and reading no prose.

**Phase 3 — Waves 1–2.** Icon and the 45 leaves.
_Exit:_ `::part()` surface documented per component; dark mode verified in
Safari and Firefox, not only Chromium.

**Phase 4 — Wave 3.** Form controls with Angular value accessors.
_Exit:_ a real Angular reactive form driven entirely by `@pitchfork-ui/angular`.

**Phase 5 — Waves 4–6.** Overlays, composites, charts.
_Exit:_ 74/74 elements, each with at least one a11y-focused test.

**Phase 6 — Wave 7.** Wrapper packages published, docs, release wiring.
_Exit:_ an Angular app and a React app both build against published packages.

---

## 9. Things to consider

- **Browser support.** Safe: custom elements, shadow DOM, constructable
  stylesheets, `::part()`, `ElementInternals`, declarative shadow DOM,
  `<dialog>`, `popover`. **Chromium-only, do not depend on:** CSS anchor
  positioning, scoped custom element registries, cross-root ARIA,
  `:host-context()`. Those four are how a library quietly becomes Chromium-only.
- **Stencil 5 is in alpha.** Build on 4.x; the output targets already declare
  5.x peer ranges.
- **Release mechanics.** Each new published package needs an npm trusted
  publisher, and **`Allow npm publish` is off by default** — `todo.md` documents
  this exact failure. Set them up and verify with the _Verify npm trusted
  publisher_ workflow before the first release, not after release-please cuts a
  tag.
- **Two implementations is the standing risk.** React and elements both
  hand-written. The mitigations are structural: `core` means behaviour is shared
  and only the template diverges, and a shared test suite run against both
  catches drift. Add that suite at the second component, not the tenth.
- **`ReactNode` props are a permanent asterisk** until a component is redesigned
  around slots. Document it per-prop, not as a blanket disclaimer.
- **Bundle size.** Honest framing: for an existing React consumer, elements plus
  wrappers ship more bytes than the hand-written library. The return is Angular
  and Vue, not size.

---

## Reference

| Thing                      | Where                            |
| -------------------------- | -------------------------------- |
| React components (kept)    | `packages/react/src/components/` |
| Framework-free behaviour   | `packages/core/src/`             |
| Theming contract           | `packages/tokens/src/theme.css`  |
| PostCSS chain to replicate | `packages/react/vite.config.ts`  |
| Tokens                     | `packages/tokens/src/tokens/`    |
| Conventions                | `CLAUDE.md`                      |
| Release gotchas            | `todo.md`                        |
