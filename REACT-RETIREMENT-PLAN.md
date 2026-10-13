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

**Phase 4 — Migrate the in-repo apps. Done.** `apps/demo` and
`apps/theme-builder` are off the package; `apps/docs` never imported it. The
guide held up: the codemod moved what it could and the refusals named the right
props. What the port actually found is the reason to do it internally, and it
was five defects nothing else would have reported:

- **`pf-nav-item` never told its navigation that `current` had changed**, so
  the highlight and `aria-current="page"` stayed on whichever item the initial
  HTML marked -- for every framework consumer, since the bindings set props as
  properties.
- **`pf-modal` left focus outside the dialog** when its content and its `open`
  arrived in the same commit, which is what every framework does.
- **No form control could be named without a visible label.** `aria-label` on
  the host names the host; 0 of 13 controls had a named control, measured
  through Chromium's accessibility tree.
- **Four of the chart examples drew a flat line at zero**, because the rows
  were written as tuples where a row is `{ label } & Record<string, number>`.
- **24 renamed call sites carried a handler the element cannot fire.** The
  codemod's rename alone is not enough: `onChange` on a form component is
  React's own synthetic handler, declared nowhere, so no metadata sees it and
  nothing was reported. It audits call sites now, which is also how five
  already-committed ones in `apps/demo` turned up.

_Exit:_ nothing in `apps/` imports `@pitchfork-ui/react`. **Met.**

**Phase 5 — Flip the agent surface and unpick the coupling. Done.** Both halves
are easy to forget and both bite later. See §3, which is now a record of what
actually broke rather than a prediction.

The agent surface was further from flipped than the prose suggested. Three
things were measured, not reasoned about:

- **`llms-full.txt` put 89.5 KB of deprecated React components before the
  elements began**, and served the React `Component conventions` and
  `Form field pattern` as its house rules — while its own comment claimed "The
  React half comes last". The elements now start at byte 13,438.
- **The MCP server required the React metadata and threw without it**, so a
  consumer who had installed only `@pitchfork-ui/elements` got a server that
  refused to start over an artifact belonging to a package they had no reason
  to have.
- **`validate_usage` never checked an icon name in element markup.**
  `<pf-icon name="paper-plane">` — a real Font Awesome regular icon this
  library does not bundle — validated as "No problems found" and renders
  nothing. `isIconProp` knew only `iconName` anywhere and `name` on `Icon`.

_Exit:_ `npm run build` succeeds with `packages/react` renamed away. **Met**,
and run that way: exit 0, with `llms-full.txt` at 184 KB of elements,
`elements.json` reporting "0 with a React counterpart", the MCP server
answering all six element tools, and typecheck, lint, `check:icons`,
`check:examples` and `check:package` all passing.

**Phase 6 — Deprecate. Prepared; the registry write is the owner's.**
`npm run deprecate:react` reports what it would do;
`npm run deprecate:react -- --apply` writes it. It is a script and not a
command in a commit message for three reasons, each of which is a way to get
this wrong once and not find out:

- **The range has to be `*`.** `npm deprecate <pkg> <message>` with no range
  deprecates _nothing_ and exits 0 — it reads the bare name as the spec and
  matches no version. There are 18 published versions (0.1.9 to 0.15.3) and
  someone pinning an old one has to be told too.
- **The message is the only thing a consumer sees**, on every install of every
  version, and changing it means running the command again. It is built from
  the window and the guide's real URL rather than typed at a terminal.
- **Nothing checks it afterwards.** Deprecation is metadata and the package
  keeps installing, so the script reads the registry back and names the
  versions that still carry no notice — through the cached packument's lag,
  which is why it retries.

**The window ends 30 April 2027.** Two quarters: long enough for a consumer to
migrate on their own schedule, and it lands well after the elements have had
time to settle. Until then the package stays installable _and publishable_, so
a security patch remains possible. Deprecation is a notice, not a removal.

**Re-run the script after any further publish.** The registry stores the flag
per version, not per package, so a patch release arrives undeprecated and
silently. `latest` is 0.15.3 today while the repository is at 0.16.0 — the
release that adds the `@deprecated` JSDoc tags is cut and waiting on an
approval — so the first run should come after that publish, not before.

**The editor tag is the notice that was not true.** 0.16.0's BREAKING CHANGE
says "every export of `@pitchfork-ui/react` is marked `@deprecated`". Nothing
checked it: **90 of 282** carried the tag, and the 90 were the components. The
other 192 were 172 exported types and — the ones that matter — 20 runtime
values: every hook, the four a11y helpers, the three icon-registry functions,
`toast` and `useToast`. A consumer importing `useDisclosure` or `registerIcons`
got no signal at all, and those are exactly the exports somebody uses without
touching a component. All 282 carry it now, each naming the replacement that
is actually right for it: the element for a component, and
`@pitchfork-ui/core` for the twenty-odd things that only live here as a
re-export.

`npm run check:deprecated` is the thing that makes the claim checkable, and it
took three goes to measure the right surface — worth writing down, because
each wrong version passed:

- A **grep** would have counted the string. The tag has to be on the exported
  _symbol_, which a grep cannot see.
- A **source-only** check read the tags but resolved `@pitchfork-ui/core`
  through whatever was on disk, so `HourCycle` and `ListNavigationAction` read
  as tagged until core's `dist` existed. It maps core to its sources now, so
  the answer cannot move with the build state.
- The version that passed while **six exports were invisible to consumers**.
  `export { Keys } from '@pitchfork-ui/core'` with the JSDoc on the specifier
  is honoured when the file is opened as a path and lost when the same file is
  reached as `@pitchfork-ui/react` — measured both ways on this package's own
  `dist/index.d.ts`, `own=[deprecated]` against `own=[]`. A consumer only ever
  does the second. The six are re-declared now
  (`export const Keys = coreKeys`, same value, so `Keys === core.Keys`), and
  the check rejects the specifier shape by name.

Each leg was probed by breaking it: a removed tag, a specifier-only tag, and
`packages/react` moved away, which the check skips rather than failing on —
Phase 7 deletes the package and a check for something gone is not a failure.

Two things found while preparing it, both in the thing Phase 6 announces:

- **The guide told consumers to run a command they do not have.** It said
  `npm run codemod:elements -- <paths>` with nothing to say that is a script in
  _this_ workspace, so anyone following it got `Missing script`. It now says
  where the codemod lives and how to run it against their own checkout.
  Publishing it is a real option and a separate decision: it reads both
  metadata artifacts, and `@pitchfork-ui/mcp` already ships both and already
  has a `bin`.
- **The README had no notice at all**, which is the surface npm actually
  renders. It has one now, and the `description` — which is what npm search
  shows, where a README does not reach — leads with `DEPRECATED`. Both reach
  the registry only on the _next_ publish, since `react-v0.16.0` is already
  cut; the `npm deprecate` notice is the one that covers every version at once,
  which is why it is the primary mechanism and these are secondary.

**Phase 7 — Delete `packages/react`.** Only after the window closes on
30 April 2027. This is the one irreversible step and there is no reason to take
it early. §3 names the four references left for it.

---

## 3. What breaks when `packages/react` goes

This section predicted four scripts. **Eleven things broke**, and the four
scripts were the easy half — the rest were found only by moving the package out
of the workspace and running everything. All eleven are fixed; the list is kept
because the shape of the miss is the useful part.

The four that were predicted:

- **`scripts/build-elements-metadata.mjs`** read
  `packages/react/dist/metadata.json` for its category taxonomy, its
  `reactCounterpart` mapping and its `reactCoverage` check. Every element's
  category was derived from its React counterpart's, so the taxonomy went with
  the package and `--strict` failed with no categories at all. The ten names
  and the 87 non-child assignments are written down in the elements builder
  now, generated from its own React-derived output and cross-checked against
  it while there is something to check against.
- **`scripts/build-llms-txt.mjs`** read the same file, plus
  `packages/react/package.json` for the site URL and description.
- **`scripts/build-mcp-data.mjs`** bundled `metadata.json` into
  `@pitchfork-ui/mcp`. It now _deletes_ a stale bundled copy when the source is
  gone, because the fallback copy is exactly what makes `npx` work with no
  install — and would otherwise keep answering for a package that no longer
  exists.
- **`scripts/check-built-packages.mjs`** had `packages/react` in its list.

Three more scripts, unlisted:

- **`scripts/check-icon-names.mjs`** read the icon registry out of the React
  metadata, as did the MCP server's `validate_usage`. Three of the registry's
  four inputs are in `@pitchfork-ui/core`; the fourth is each layer's own
  `name: faXxx` map, which has to stay per-layer so a consumer's bundle carries
  only the icons in use. `scripts/lib/icon-registry.mjs` reads either layer and
  asserts its map against core's `BUNDLED_FA_ICON_NAMES`.
- **`scripts/build-metadata.mjs`** reads `packages/react/src/components`, so it
  threw rather than exiting.
- **`scripts/lib/conventions.mjs`** — the house rules travelled only inside the
  React metadata, so an agent writing `<pf-input>` was handed rules about
  `forwardRef` and the `pf-field` wrapper.

And four things that are not scripts at all:

- **The build chains.** `npm run build -w @pitchfork-ui/react` fails outright
  when the directory is gone, killing `build`, `build:hostinger`, `build:demo`
  and `test` at that step. `scripts/run-workspace.mjs` makes those four
  tolerant; `build:react` and `test:coverage` still address the workspace
  directly, so asking for it by name still gets npm's own error.
- **The root `tsconfig.json`'s project reference**, which broke the _docs
  build_, not `tsc`: `main.ts` aliases `@pitchfork-ui/core` to its sources, so
  the bundler resolves a file outside `apps/docs`, walks up to the root
  tsconfig and tries to resolve its references — "Tsconfig not found
  .../packages/react" out of rolldown. `npm run typecheck` chains the tolerant
  runner instead, so the package is still type-checked while it exists.
- **`vitest.config.ts`.** A `projects` entry naming a file that is not there is
  a startup error, not a skipped project: `npm run test:docs` died even though
  it filters to `--project storybook-smoke` and never runs the React one.
  Loading the list is what fails.
- **The docs app's CSS-variable scrape**, which globbed
  `packages/react/src/components/**/*.css` to generate Storybook controls. It
  worked only because both layers declare the same `--pf-*` names, and would
  have stopped silently.

And the agent surface itself: the MCP server and `llms.txt` presented 91 React
components as the primary API. Until that inverted, every agent writing against
this library kept generating code for the layer being retired — the difference
between a deprecation and a deprecation nobody follows.

What is **left** for Phase 7, because each one is part of deleting the package
rather than decoupling from it: `eslint.config.js`'s three React rules,
`vitest.config.ts`'s now-conditional entry, CI's "Test @pitchfork-ui/react"
step, and `release-please.yml`'s publish job. All four are correct while the
package is published.

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
