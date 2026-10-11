# Pitchfork UI — Retiring the React library

A plan for making `@pitchfork-ui/elements` the library, and `@pitchfork-ui/react`
the thing it replaced.

**The decision, in one line:** the custom elements become the one
implementation; React consumers move to the generated `@pitchfork-ui/elements-react`
bindings rather than away from React; `@pitchfork-ui/react` is deprecated on
npm and removed from the repo only after a stated window.

**This reverses the premise of `WEB-COMPONENTS-PLAN.md`,** which says in bold
that nothing in `packages/react/src/components` is deleted at any phase. That
was the right call while the elements were unproven. They are proven now — 108
elements, 1,239 tests, three binding packages, three consumer apps — so the
constraint goes.

---

## 0. Where this actually stands

| Package                          | Local  | On npm          |
| -------------------------------- | ------ | --------------- |
| `@pitchfork-ui/react`            | 0.15.2 | **0.15.2**      |
| `@pitchfork-ui/tokens`           | 0.4.2  | **0.4.2**       |
| `@pitchfork-ui/core`             | 0.1.0  | — not published |
| `@pitchfork-ui/elements`         | 0.1.0  | — not published |
| `@pitchfork-ui/elements-react`   | 0.1.0  | — not published |
| `@pitchfork-ui/elements-angular` | 0.1.0  | — not published |
| `@pitchfork-ui/elements-vue`     | 0.1.0  | — not published |

Two things follow from that table, and they decide the order of everything
else.

**The next React publish breaks the moment the web-components branch lands.**
Not before — the distinction matters, and the first draft of this document got
it wrong.

On `main` today, `packages/react/package.json` has no `dependencies` block at
all, only peer dependencies, exactly like the published 0.15.2. A release cut
from `main` installs fine, which is why release PR #107 (react 0.15.3) was
safe to leave sitting.

The core extraction lives on `claude/wizardly-wozniak-bvvomh`, and there
`packages/react/package.json` declares `"@pitchfork-ui/core": "^0.1.0"` while
`packages/react/dist` really does import it. The moment that branch merges,
any React release ships a dependency npm cannot resolve — including, with some
irony, the release that would carry the deprecation notice.

`.github/workflows/release-please.yml` already publishes tokens → core → react
in order, with a comment explaining why, so it covers the case where
release-please cuts **both**. What it does not cover is react being cut
**alone**: no core release means the `Publish @pitchfork-ui/core` step is
skipped, and react goes to a registry that has never heard of core.

**Nothing can be migrated to a package nobody can install.** Every phase below
waits on the first one.

`scripts/check-built-packages.mjs` does not catch this. It was taught that
every bare import must be _declared_; it never asks whether a declared
workspace dependency is _publishable_. `scripts/check-publishable.mjs` does,
and runs in the publish job before anything reaches the registry.

---

## 1. What the migration is for a consumer

**React applications do not leave React.** `@pitchfork-ui/elements-react` is
generated from the same build and gives every element a typed component with
real event props. The move is: change the import, rename `Button` to
`PfButton`, rename `onFoo` to `onPfFoo`. For half the library that is the whole
job.

Of 91 React components:

- **46 are drop-in.** Their props map one to one.
- **45 need the call site reshaped**, in one of two ways — 17 content-only,
  21 data-only, 7 both.

### Content props become slots (24 components)

A prop typed `ReactNode` has no element equivalent. A slot takes markup; it
cannot take a React tree. `heading`, `icon`, `action`, `footer`, `title` all
become slotted children:

```tsx
<Alert heading="Saved" icon={<Icon name="circle-check" />} />
// becomes
<PfAlert>
  <span slot="icon"><PfIcon name="circle-check" /></span>
  <span slot="heading">Saved</span>
</PfAlert>
```

`children` is not in this count — it maps to the default slot untouched.

### Data props become child elements (28 components)

`WEB-COMPONENTS-PLAN.md` §2.1: data-driven elements take child elements, not
arrays. Every consumer loop inverts.

```tsx
<Select options={fruits} />
// becomes
<PfSelect>{fruits.map(f => <PfOption key={f.value} value={f.value}>{f.label}</PfOption>)}</PfSelect>
```

### The full list

Generated from `packages/react/dist/metadata.json`; regenerate it rather than
trusting this copy. Three entries are softer than they look — `NumberInput`'s
`locale` and `FileUploader`'s `value` are properties rather than children, and
`Carousel`'s `slides` is both — so treat the table as the worklist, not as a
contract.

| Component         | Becomes a slot                                        | Becomes children             |
| ----------------- | ----------------------------------------------------- | ---------------------------- |
| Accordion         |                                                       | items                        |
| Alert             | heading, description, icon                            |                              |
| AreaChart         |                                                       | data, series                 |
| AvatarGroup       |                                                       | avatars                      |
| BarChart          |                                                       | data, series                 |
| Breadcrumbs       | separator                                             | items                        |
| ButtonGroup       |                                                       | items                        |
| Carousel          | slides                                                | slides                       |
| CodeSnippet       | title                                                 |                              |
| Collapsible       | trigger                                               |                              |
| Combobox          |                                                       | options                      |
| CommandPalette    |                                                       | items                        |
| ContentDivider    | label                                                 |                              |
| ContextMenu       |                                                       | items                        |
| Dropdown          |                                                       | items                        |
| EmptyState        | heading, description, icon, action                    |                              |
| FileUploader      |                                                       | value (property)             |
| GaugeChart        | centerLabel, subLabel                                 |                              |
| HeaderNavigation  | brand, actions                                        | items                        |
| Heatmap           | emptyLabel                                            | data                         |
| InlineCTA         | heading, description, action, icon                    |                              |
| LineChart         |                                                       | data, series                 |
| MetricCard        | heading, value, description, trendLabel, icon, action |                              |
| Modal             | title, description, footer                            |                              |
| MultiSelect       |                                                       | options                      |
| Notification      | heading, description, icon, action                    |                              |
| NumberInput       |                                                       | locale (property)            |
| PageHeader        | eyebrow, heading, description, metadata, actions      |                              |
| Pagination        | prevLabel, nextLabel                                  |                              |
| PieChart          | centerLabel, emptyLabel                               | data                         |
| ProgressSteps     |                                                       | steps                        |
| RadarChart        |                                                       | data                         |
| RadioGroup        |                                                       | options                      |
| SectionFooter     | heading, description, actions                         |                              |
| SectionHeader     | eyebrow, heading, description, metadata, actions      |                              |
| Select            |                                                       | options                      |
| SidebarNavigation | header, footer                                        | sections                     |
| SlideoutMenu      | title, description, footer                            |                              |
| Table             | caption, emptyState                                   | columns, rows                |
| Tabs              |                                                       | items                        |
| Timeline          |                                                       | items                        |
| Tooltip           | content                                               |                              |
| TreeView          |                                                       | nodes                        |
| UtilityButton     | icon                                                  |                              |
| VideoPlayer       |                                                       | sources, tracks (properties) |

### Four components have no counterpart of their own

An element absorbed them rather than mirroring them, and `elements.json`'s
`reactCoverage` carries the mapping:

- `AreaChart` → `area` on `pf-line-chart`
- `CalendarGrid` → `pf-calendar` is one element
- `NotificationStack` → `pf-toaster`, with `placement` where React takes `position`
- `PageHeaderMeta` → `pf-page-header`'s `metadata` slot

---

## 2. Phases

**Phase 1 — Make publishing possible.** This is the phase with a step only an
account owner can take, so it is worth reading before Friday rather than during
it.

Release order is the dependency order, which `npm run check:publishable`
prints and the workflow enforces:

```
core → tokens → elements → elements-angular → elements-react → elements-vue → mcp → react
```

Two gaps, one closed and one open.

_Closed._ The publish workflow knew only four of the eight packages:
`release-please-config.json` listed all eight, but
`.github/workflows/release-please.yml` had `*_released` outputs and publish
steps for `core`, `react`, `mcp` and `tokens` only — so release-please would
have cut `elements@0.1.0` and the four binding packages, written their
changelogs, tagged them, and published none of them. A release that looks
complete and puts nothing on the registry. All eight are wired now, in
dependency order, with `check-publishable` gating the step.

_Open, and the actual blocker._ **Trusted publishing cannot create a package.**
Five of the eight names are not on the registry at all, and a trusted publisher
is configured per package against a package that already exists — so there is
nothing for the workflow's OIDC identity to match. npm answers a 404, which is
also what it answers when a publisher exists and does not match, so the error
points at the wrong cause. And it arrives after eight tags have been pushed.

Each of the five therefore needs one publish by hand, as an owner of the scope
and with `--access public` (a scoped package is private on its first publish
regardless), before its trusted publisher can be created at all. `todo.md` has
the commands and the two-day window that follows.
_Closed, and it was the one that would have shipped._ **Release-please does not
rewrite intra-workspace dependency ranges by itself**, and a caret on a 0.x
version is a patch range: `^0.1.0` is `>=0.1.0 <0.2.0`. So the pending 0.2.0
release would have bumped every version and left every range alone, publishing
five packages that resolve their sibling to the _older_ copy — the three
bindings against `elements`, and `elements` and `react` against `tokens` at
`^0.4.1` going to 0.5.0. A binding generated from an element build, paired with
the previous element, is a silent mismatch on the registry.

`plugins: ["node-workspace"]` fixes it: the plugin preserves the range prefix,
so `^0.1.0` becomes `^0.2.0`. It also patch-bumps a dependent whose dependency
moved even when that dependent had no commits of its own, so releases are more
all-or-nothing than before — worth knowing, and the right trade here.

`check-publishable.mjs` was blind to all five: it skipped a dependency outright
when that dependency was in the same release, which skipped the range question
along with the registry question it meant to skip. It now compares the declared
range against the version being published.

_Exit:_ `npm install @pitchfork-ui/elements-react` works in a clean directory,
and the installed `@pitchfork-ui/elements` is the version released alongside
it.

**Phase 2 — Make the elements viewable. Done.** `apps/docs` depends on
`@pitchfork-ui/elements`, `preview.ts` registers all 108 through
`defineCustomElements()`, and every generated reference page now carries a
live element above its tables, rendered from a hand-written example in
`apps/docs/src/element-examples.ts`. Someone deciding whether to move can see
the element beside the component it replaces, in the same site, in both
themes.

Two checks keep it that way, because an unregistered custom element is
perfectly valid HTML and a wrong attribute renders without complaint:
`build-elements-docs --strict` fails on an element with no example, and
`smoke-storybook.mjs` fails when a sampled page's `pf-*` host never hydrates.
`npm run check:examples` runs `validate_usage` over all 108 examples — it
found nine wrong enum values in the first draft, and `check:icons` found six
invented icon names in the same draft.

Each element now has the same two sidebar children as a React component, a
`Docs` page and an `Interactive` story, through the same mechanism: a generated
`*.stories.tsx` holds the title and the MDX attaches to it with `<Meta of>`.
The controls are derived from `docs.json`, since a custom element exposes no
props Storybook can read, and `ElementPlayground` applies the args as
properties — the one path that works for an array or a function. A sweep of all
108 in Chromium found one story rendering nothing usable, and it was the
assertion that was wrong: `pf-visually-hidden` is 1x1 by design.
_Exit:_ met. Every element renders in Storybook, with a controls panel.

**Phase 2b — Elements take over the `Components` namespace. Done.** The sidebar
is three sections now: `Foundations` (6 pages), `Patterns` (7) and `Components`
(108 elements, each with Docs and Interactive). 225 React docs files went —
14,678 lines — and nothing in `apps/docs` imports `@pitchfork-ui/react`.

What it cost, and it is worth stating plainly: `metadata.json` read its
**examples and descriptions** from `*.examples.stories.tsx` and `*.mdx`, so 69
of 91 components lost both. The React half of the metadata is props, types,
defaults and resolved variable chains now. The depth moved rather than
vanishing — `elements.json` carries a worked example for all 108, and
`get_examples` answers for an element tag or name — but anyone maintaining
React code gets less from the server than they did.

Three things were reframed rather than deleted, because deleting them would
have made the artifacts lie:

- **`llms.txt` leads with the elements** and keeps a `Retiring:
@pitchfork-ui/react` section that names all 91 components, says the package
  is still published, and points at `get_component`. A link to a page that no
  longer exists would be worse than no link, so the components are listed
  unlinked. `--strict` now asserts every _element_ has a docs page, which is
  the question that can go wrong.
- **The changelog page** prefers `packages/elements/CHANGELOG.md` and falls
  back to the React library's, because release-please writes one only at a
  package's first release and the elements have not had one. It flips by
  itself, and the page says which package it is describing.
- **`theme.starter.css` moved to `packages/tokens`**, which is where
  `theme.css` already lives because neither rendering layer owns it. The docs
  pointed at `@pitchfork-ui/react/theme.starter.css`; pointing them at a
  tokens path that did not exist yet was caught before it shipped.

Three MCP tests were retargeted at the elements rather than deleted: the
false-positive corpus (`validate_usage` over every documented example) is the
elements' 156 strings now instead of the React examples, and it is a stronger
corpus than what it replaced. One test could only have passed vacuously — it
pinned `build-metadata.mjs`'s handling of shorthand `args` in an example story,
and there are no example stories left — so it was replaced by the property it
was really protecting: that no element reaches the server with nothing to show.

`storybook-project.spec.ts` was broken by the deletions and had **never failed
a build**, because nothing invoked the root `vitest.config.ts`. It asserts the
generated pages' pairing invariants now, and `npm run test:docs` is in CI.

_Still open:_ the dead example-parsing code in `build-metadata.mjs`, which goes
with Phase 5.

**Phase 2b's original note.** Two halves that only made sense together: remove
the React components from Storybook, and rename the element pages from
`Web components/PfButton` to `Components/Button`, which could not happen while
React occupied that namespace.

Only the **page names** lose the prefix. A custom element tag must contain a
hyphen, so `pf-button` stays, and `pf-` is this library's namespace in a
consumer's HTML. The generated binding class names (`PfButton` in
`elements-react`) come from the tag through Stencil's output targets; changing
those is a published-API change and a separate decision.

What the removal touches beyond deleting 273 files: `UsingWithAI.mdx` and three
other pages render React components, `CssVariableDecorator` imports `Icon`,
`sync-changelog` mirrors `packages/react/CHANGELOG.md` into the site, and
`build-llms-txt --strict` asserts every React component is linked to a docs
page — that assertion is the one that breaks, and deciding what `llms.txt`
should say about a package that is still published but no longer documented is
the real question in this phase, not the file deletions.
_Exit:_ nothing in `apps/docs` imports `@pitchfork-ui/react`, and the sidebar
reads `Components/Button`.

**Phase 3 — Migration guide and codemod.** The mapping table above is
generated, so the guide is too. For the 46 drop-ins a codemod is realistic:
rewrite the import, PascalCase to `Pf`-prefixed, `onFoo` to `onPfFoo`. For the
45 it should **refuse and annotate** — a wrong automatic rewrite of a
`ReactNode` prop is worse than a `// TODO` pointing at the right page.
_Exit:_ the codemod runs clean over `apps/demo`.

**Phase 4 — Migrate the in-repo apps.** `apps/theme-builder`, `apps/demo` and
`apps/docs` are the only consumers under this roof and the only honest test of
the guide. If the 45 do not migrate cleanly here, the guide is wrong, and
finding that out internally is the entire point of doing them first.
_Exit:_ nothing in `apps/` imports `@pitchfork-ui/react`.

**Phase 5 — Flip the agent surface and unpick the coupling.** Both halves are
easy to forget and both bite later. See §3.
_Exit:_ `npm run build` succeeds with `packages/react` renamed away.

**Phase 6 — Deprecate.** `npm deprecate @pitchfork-ui/react` with a message
pointing at the guide. Keep it publishable for a stated window so a security
patch remains possible. The package keeps working the whole time; deprecation
is a notice, not a removal.

**Phase 7 — Delete `packages/react`.** Only after the window. This is the one
irreversible step and there is no reason to take it early.

---

## 3. What breaks when `packages/react` goes

Four scripts read it, and three of them produce the artifacts an agent uses to
write code against this library:

- **`scripts/build-elements-metadata.mjs`** reads
  `packages/react/dist/metadata.json` for its category taxonomy, its
  `reactCounterpart` mapping and its `reactCoverage` check. Without React the
  element metadata has no categories at all, and `--strict` fails. The
  taxonomy has to move — probably into the elements builder itself, since it
  is the layer that survives.
- **`scripts/build-llms-txt.mjs`** reads the same file and
  `packages/react/package.json` for the site URL and description.
- **`scripts/build-mcp-data.mjs`** bundles `metadata.json` into
  `@pitchfork-ui/mcp`.
- **`scripts/check-built-packages.mjs`** has `packages/react` in its list and
  checks React's bundle for the `Icon` warning and ambient type leaks.

And the agent surface itself: the MCP server and `llms.txt` currently present
91 React components as the primary API. Until that inverts, every agent writing
against this library keeps generating code for the layer being retired. That
is Phase 5 and it is not optional — it is the difference between a deprecation
and a deprecation nobody follows.

The Storybook host is `@storybook/react-vite`. That can stay: React remains a
fine way to _render_ a docs site for custom elements, and the element pages are
MDX either way.

---

## 4. Open questions

**Who actually consumes 0.15.2.** `WEB-COMPONENTS-PLAN.md` §9 records the
honest trade: for an existing React consumer, elements plus wrappers ship more
bytes than the hand-written library, and the return is Angular and Vue. If the
real consumer set is React-only, this decision costs bundle size and buys
optionality that is not being used. npm download counts are the input and are
not visible from here.

**Whether the element pages get controls.** Matching the React stories means a
real story file per element rather than MDX, which is 108 files. Static
examples on the generated pages are cheaper and less useful. Phase 2 needs an
answer.

**What happens to the five React-side gaps in `todo.md`** — `FileUploader` and
`RichTextEditor` reaching a form, `GaugeChart`'s accessible name, the
navigations' `ReactNode` labels, `pf-table` sorting. Each was deferred as a
public-API decision. If React is going away, four of the five stop mattering
and only the `pf-table` one survives.

---

## Reference

- `WEB-COMPONENTS-PLAN.md` — the original port, whose §2.1 and §5 explain the
  API shapes this migration has to reshape. Its "nothing is deleted" premise is
  superseded by this document.
- `todo.md` — the publishing failure in Phase 1, and the deferred React gaps.
- `packages/elements/dist/elements.json` — `reactCounterpart`, `childOf` and
  `reactCoverage`, which is where the migration mapping is generated from.
