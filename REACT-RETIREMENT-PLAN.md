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
_Exit:_ `npm install @pitchfork-ui/elements-react` works in a clean directory.

**Phase 2 — Make the elements viewable.** The Storybook gap stops being
cosmetic here; it is the migration documentation. Today `apps/docs` does not
depend on `@pitchfork-ui/elements` and `preview.ts` loads no element bundle, so
the 108 generated pages are reference tables that render nothing. Someone
deciding whether to move needs to see the element beside the component it
replaces.
_Exit:_ every element renders in Storybook, next to its React counterpart.

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
