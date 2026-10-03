# Known gaps

Tracked here rather than in issues when the fix is small, well understood, and
does not need discussion. Referenced from `CLAUDE.md`.

---

## Markdown tables do not render in Storybook MDX

Storybook's MDX pipeline does not load `remark-gfm`, so a GFM table in an
`.mdx` file renders as a paragraph of pipe characters rather than a table. The
one table in the docs — the MCP tool list in `UsingWithAI.mdx` — hit this and
now uses the library's own `Table` component instead, which looks better
anyway. But the trap is still there for the next person who writes one.

**Fix:** add `remark-gfm` to the docs addon's
`mdxPluginOptions.mdxCompileOptions.remarkPlugins` in
`apps/docs/.storybook/main.ts`. Worth checking the other MDX pages afterwards,
since the same plugin also turns on strikethrough, footnotes and autolinks.

---

## Publishing a new package: tick "Allow npm publish"

Not an open gap — all three trusted publishers are verified. Kept because this
will bite the next package added to the workspace, and this is where someone
would look.

On npmjs.com a package's trusted publisher has an **Allowed actions** section,
and **`Allow npm publish` is off by default** — the publisher may only _stage_ a
publish. The release workflow runs `npm publish`, so with the box unticked a
release fails at the publish step, after release-please has already cut the tag.

Tell the two failure modes apart by the message, not the exit code; the good
case and one bad case are both E403:

| Output                                   | Meaning                                                       |
| ---------------------------------------- | ------------------------------------------------------------- |
| `cannot publish over`                    | Authenticated, duplicate refused — the publisher is correct   |
| `OIDC permission denied for this action` | Publisher matches, `npm publish` not permitted — tick the box |
| `E404` on `PUT`, no provenance line      | No usable publisher; npm masks unauthorised writes as 404     |

`@pitchfork-ui/react`'s configuration is the known-good reference to copy.

**Check it without releasing:** Actions → _Verify npm trusted publisher_ → pick
the package. It attempts to publish a version already on the registry, which
exercises the whole OIDC path and cannot ship anything — npm authenticates
before it rejects a duplicate. `npm publish --dry-run` cannot do this; it never
authenticates at all.

Verified this way on 2026-09-21:

```
@pitchfork-ui/react   0.15.0  published via OIDC with provenance
@pitchfork-ui/tokens  0.4.1   published via OIDC with provenance
@pitchfork-ui/mcp     0.2.0   publisher verified; publishes on its next release
```

---

## Root `optionalDependencies` pin OXC bindings nothing consumes

`package.json` pins `@oxc-parser/binding-linux-x64-gnu` and
`@oxc-resolver/binding-linux-x64-gnu` at exact versions in
`optionalDependencies` — a workaround for npm omitting platform-specific
optional dependencies from the lockfile, which broke `npm ci` on CI.

The pins have since drifted away from the packages that actually use them.
Today the root pins 0.150.0 and 11.24.2, while `oxc-parser@0.127.0` and
`oxc-resolver@11.21.2` each require their own exact match — so npm installs
the pinned versions at the top level, nests the correct ones underneath, and
nothing ever loads the pinned copies. Verified: both modules load, and the
bindings they load are the nested ones.

It works, but Dependabot now bumps these pins on their own schedule,
unanchored to any consumer, and each bump is a change that cannot affect
anything. Copilot flagged the drift on
[#98](https://github.com/lelandcrangel/pitchfork-ui/pull/98).

**Fix:** check whether the npm bug that prompted the pins is still live (it
was fixed in npm 10.x for most cases). If it is, tie the pins to the
consumers' versions and add a check that they match. If it isn't, drop both
pins and the `optionalDependencies` block with them.

---

## Two names for the Chromium-path escape hatch

Four places launch Playwright Chromium, and they disagree on which
environment variable points at a pre-installed browser:

| Entry point                                   | Variable                   |
| --------------------------------------------- | -------------------------- |
| `packages/elements/vitest.config.mts`         | `PW_CHROMIUM_PATH`         |
| `packages/elements-angular/vitest.config.mts` | `PW_CHROMIUM_PATH`         |
| `scripts/smoke-consumer.mjs`                  | `PW_CHROMIUM_PATH`         |
| `scripts/smoke-storybook.mjs`                 | `PLAYWRIGHT_CHROMIUM_PATH` |

`CLAUDE.md` documents only the first name. So in an environment whose
Chromium does not match Playwright's pinned build, setting the documented
variable gets three of the four suites passing and leaves `npm run
test:smoke` failing with Playwright's own "run npx playwright install"
banner — which points at the wrong cause entirely.

**Fix:** settle on `PW_CHROMIUM_PATH` and have `smoke-storybook.mjs` read
it, keeping the old name as a fallback if anything depends on it.

---

## An ellipsis can stand in for a single page

`getPaginationItems` in `packages/core/src/pagination.ts` opens a gap wherever
the sibling window does not reach the boundary — even when exactly one page is
behind it. At 4 of 7 with the default counts the run is

```
1 … 3 4 5 … 7
```

where each ellipsis hides one page: 2 on the left, 6 on the right. An ellipsis
costs the same room as the page it hides and says less, so showing `1 2 3 4 5 6
7` would be strictly better there.

This is the React component's long-standing behaviour, carried over verbatim
when the maths moved into core, and both layers now share the one
implementation. It is asserted in `pagination.test.ts` so the port is
faithful, not so the behaviour is blessed.

**Fix:** collapse a gap that would hide fewer than two pages into the page
itself — in core, which changes `Pagination` and `<pf-pagination>` together.
Update the two assertions in `pagination.test.ts` that pin the current run, and
check the Pagination stories still read sensibly at small totals.

---

## The command palette's active option is not announced without ARIA element reflection

`pf-command-palette` keeps its search input in its shadow root and its options
in the light DOM, so it points at the active one with
`input.ariaActiveDescendantElement`. There is no cross-root fallback:
`aria-activedescendant` is an IDREF, and a cross-root IDREF is **absent from
Chromium's accessibility tree entirely** — measured against a same-root IDREF,
which does resolve.

The assignment is feature-detected (`'ariaActiveDescendantElement' in input`),
so where element reflection is missing the palette still filters, highlights,
moves with the arrows and runs on Enter. What is lost is the _announcement_:
a screen reader is not told which option is active as the user arrows through.
Only Chromium has been measured here; support elsewhere was not verified in
this environment.

**Fix:** measure the other engines rather than trusting a support table, and if
one lacks it, give the palette a roving-focus mode for that engine — move DOM
focus to the active `pf-command-item` and forward typing back to the input.
That is the only pattern that needs no cross-root reference at all. Worth
pairing with a decision about whether the React `CommandPalette`, which has no
shadow boundary and so uses a plain IDREF, should adopt the same mode for
consistency.

---

## The React Calendar has no keyboard

`Calendar` and `DateRangePicker` render 42 day buttons through `CalendarGrid`
and handle no keys at all. So the grid is 42 sequential tab stops, there is no
way to move by week, and reaching the end of a month from its start takes 42
presses of Tab. The ARIA grid pattern is one tab stop plus arrows.

`<pf-calendar>` implements that pattern, and the arithmetic behind it —
`moveCalendarDate` — is in `packages/core/src/date.ts` precisely so the React
component can adopt it without the two layers disagreeing about what
PageDown from the 31st of January means.

**Fix:** give `CalendarGrid` a `focusedDate` of its own, a roving `tabIndex`
(0 on the focused day, -1 on the other 41), and an `onKeyDown` that calls
`moveCalendarDate` and moves DOM focus to the new cell. Both `Calendar` and
`DateRangePicker` get it at once, since the grid is shared. `pf-calendar`'s
browser spec is the behaviour to match, including the two decisions worth
keeping: focus crosses a disabled day while activation refuses it, and
focus leaving the month scrolls the grid with it.

---

## The React Select has no typeahead

The ARIA listbox pattern expects printable-character typeahead: typing `b`
moves to the next option beginning with `b`, `br` narrows, and pressing one
letter repeatedly cycles through the options that match it. `Select` handles
`ArrowUp`/`ArrowDown`/`Home`/`End`/`Enter`/`Escape` and no character keys at
all, so a long list can only be walked one arrow at a time.

`<pf-select>` implements it, and the matching is in
`packages/core/src/typeahead.ts` — `isTypeaheadKey`, `nextTypeaheadBuffer` and
`findTypeaheadMatch` — precisely so the two layers cannot disagree about what
`bbb` means.

**Fix:** hold a buffer and a `TYPEAHEAD_TIMEOUT_MS` timer in `Select` (core
owns the matching, not the timer), and on a typeahead key move `activeIndex` to
`findTypeaheadMatch`'s answer. Two decisions worth copying from the element:
a disabled option is never matched, because the keyboard would land somewhere
it cannot act; and with the listbox closed, typeahead _chooses_ rather than
highlighting, which is what a native `<select>` does and the only feedback
available when nothing is on screen. `pf-select`'s browser spec is the
behaviour to match.

The same applies to `Combobox`, `MultiSelect` and `TreeView` when their turn
comes.

---

## The React Combobox has no Home or End, and its arrows stop at the ends

`Combobox` handles `ArrowDown`/`ArrowUp` with `Math.min`/`Math.max`, so the
active option stops at the first and last match rather than wrapping, and
`Home`/`End` do nothing at all. `Select` next door wraps, through core's
`resolveListMove`. One design system with two arrow behaviours in neighbouring
controls is the actual problem; which way they both go matters less.

`<pf-combobox>` and `<pf-select>` both use `resolveListMove`, so they wrap and
both answer `Home`/`End`.

**Fix:** replace the clamping arithmetic in `Combobox` with
`resolveListMove(action, getEnabledIndexes(filtered, …), activeIndex)` and add
the two keys. `MultiSelect` and `TagInput` have the same gap and the same
remedy.

---

## `TagInput`'s paste handler only ever added the last tag — fixed

Recorded because the fix shipped with `<pf-tag-input>` rather than on its own,
and the shape of the mistake is worth remembering.

`onPaste` split the clipboard text and then called the component's own
`addTag` once per candidate. That helper read `currentTags` from the render's
closure and called `setTags([...currentTags, tag])`, so every call built its
list from the _same_ base and the last `setTags` won. Pasting
`alpha, beta, gamma` left one tag. The maximum and the dedup were equally
blind, for the same reason.

Both layers now fold the additions — each candidate is added to the result of
the previous one — through core's `addTag`. Three React tests cover it and
fail against the old handler.

**Nothing left to do here.** The entry stands as a note that a loop of state
setters over closed-over state is the failure mode to look for in the
remaining ports: `MultiSelect`, `Combobox` and `TreeView` all have handlers
shaped like that one.

---

## The React `Tabs` is one tab stop per tab, and reports an unchanged selection

Two gaps, both found porting it to `<pf-tabs>`.

`Tabs` renders `tabIndex={item.disabled ? -1 : 0}`, so a six-tab strip is six
tab stops and tabbing through the page walks every one. The ARIA tabs pattern
is a single stop on the _selected_ tab, with the arrows moving inside the
group — which `Tabs` already implements, so the keyboard half is there and
only the tabindex is wrong. `<pf-tabs>` does it with core's
`syncRovingTabIndex`, the same call `pf-toolbar` and `pf-radio-group` make, and
its browser spec asserts that tabbing in from outside lands on the selection.

`onClick` then calls `setSelectedValue(item.value)` unconditionally, so
clicking the tab that is already selected calls `onValueChange` with a value
that did not change. A native `<select>` does not fire `change` for the same
option. `<pf-tabs>` compares against the tab actually on show — not against
`value`, which is still `''` while the first enabled tab is selected by
fallback — and a unit test pins it.

**Fix:** set `tabIndex` from `item.value === selectedItem?.value` (falling back
to the first enabled tab when nothing matches, which `resolveSelectedTab`
already works out), and guard the click on `item.value !== selectedItem?.value`.
Both are small; they are here rather than done because changing which element
is tabbable is a behaviour change for consumers' own tests.

---

## The React `Breadcrumbs` marked two current pages — fixed

`aria-current="page"` identifies one page. `Breadcrumbs` read
`item.current ?? isLast` per item, so marking any crumb but the last left the
attribute on both it and the last one, and a screen reader was told the user
was on two pages at once.

Both layers now take one index from core's `resolveCurrentCrumb` — the first
crumb marked, or the last when none is. Two React tests cover it and the first
fails against the old expression.

**Nothing left to do here.** The entry stands as a note that a per-item
`?? isLast` is the shape to look for: the same reading would be wrong in
`ProgressSteps` and in `Timeline`, both of which have a "current" of their own
and are still to be ported.

---

## The React `ProgressSteps` said nothing about where the trail had got to — fixed

Two gaps, both found porting it to `<pf-progress-steps>`.

The marker is `aria-hidden` and `complete`/`current`/`upcoming` were conveyed
by colour alone, so nothing in the accessibility tree said which step the user
was on. Both layers now put `aria-current="step"` on the current step, and only
on that one. Two React tests cover it.

The ring around the current marker asked for `--focus-ring-shadow`, which is
defined in no stylesheet in this repository — and an undefined custom property
makes the declaration invalid at computed-value time, so `box-shadow` computed
to `none` and the ring had never been drawn. Measured in Chromium, and fixed to
`--pf-focus-ring` in both layers; `scripts/smoke-consumer.mjs` reads the
computed value now.

**What is left:** the three statuses are still only colour and a ring, so a
screen reader is told which step is current but not which are done. The usual
remedy is visually-hidden text in each step ("Completed: ", "Current step: "),
which changes every step's accessible name — worth doing deliberately, with the
docs examples updated, rather than folded into a port.

---

## The React `useExitAnimation` waits on a guess

`useExitAnimation` sets a class and then calls back after a fixed 220ms, which
is wrong in both directions: too early or too late if the stylesheet's duration
changes, and it fires at all when nothing animated — under
`prefers-reduced-motion`, or for a consumer who has not loaded the CSS.

`<pf-inline-cta>` and `<pf-notification>` both read `getAnimations()` after a
frame and await `Animation.finished`, resolving at once when the list is empty.
Measured in the browser spec: swapping the element's version for a 220ms
timeout makes the no-animation case take 220ms instead of a frame, which is the
test that fails.

**Fix:** have `useExitAnimation` take the element and await its animations
rather than a duration — `const animations = el.getAnimations(); if
(animations.length === 0) { onExited(); return; }` and otherwise
`Promise.all(animations.map((a) => a.finished))`. `InlineCTA` is the only
caller, which is what makes this a small change; the hook's `duration` option
goes away with it.

---

## `<pf-table>` reports a sort where the React `Table` performs one

Not a defect in either, but the one API difference in Wave 5 worth having
written down.

The React `Table` takes `rows` and sorts them itself. `<pf-table>` cannot: the
rows are `pf-table-row` elements the consumer wrote, and reordering them means
moving nodes in the consumer's DOM — which their framework undoes on its next
render, and whose reconciliation it breaks on the way. So the element owns the
header buttons, `aria-sort` and the indicator, and emits `pfSortChange` for the
consumer to sort their own data with.

`compareSortValues`, `sortRowsBy` and `nextSortState` are in core so that both
orders agree: a consumer calling `sortRowsBy` gets exactly what the React
`Table` would have produced, down to the collation ("Item 2" before "Item 10",
case and accents ignored). Both consumer apps do precisely that, and the smoke
asserts the round trip — header reports, app sorts, first row changes.

**Nothing to do unless** a sorted-for-you element is wanted later, in which
case the shape to reach for is a `rows` property of plain data on the element
(no slotted rows at all) — a different component, not a change to this one.

---

## The React `TreeView` is one tab stop per visible item

`TreeView` renders every visible node as a `<button role="treeitem">` with no
tabindex management, so a tree of thirty open nodes is thirty tab stops and
tabbing through the page walks every one. The ARIA tree pattern is a single tab
stop with the arrows moving inside — which `TreeView` already implements, so
the keyboard half is there and only the focus management is wrong.

`<pf-tree-view>` could not use a roving tabindex even if it wanted to: a
`tabindex="0"` host slotted into another host's shadow tree is skipped by
sequential navigation when the outer host's tabindex is negative, which is
measured in its browser spec. It holds the tab stop itself and names the active
item with `aria-activedescendant`.

**Fix:** either of the two ARIA variants works in React, where the nesting is
in one tree. The smaller change is a roving tabindex — `tabIndex={isActive ? 0
: -1}` over the flattened list, with the active value in state beside the
selected one, since the two are not the same thing. Core's `resolveTreeKey`
already returns focus intents, so the handler does not change.

---

## The React navigations take `ReactNode` labels and an `items` array

Both `HeaderNavigation` and `SidebarNavigation` take arrays of plain objects,
which is the shape the element layer cannot have — `<pf-nav-item>` children
are what let a consumer loop in their own template and slot their framework's
router link in. That difference is deliberate and §2.1 of
`WEB-COMPONENTS-PLAN.md` settles it; nothing to do.

What _was_ wrong and is now fixed: both read `item.active` per item, so two
active items put `aria-current="page"` on both and announced the reader as
being on two pages at once. Core's `resolveCurrentNavItem` resolves one index,
the same call `<pf-header-navigation>` makes, and the highlight follows the
announcement — a second highlighted item with no `aria-current` is a
sighted-only lie. The sidebar resolves across every section rather than within
one, and counts items rather than comparing them, since nothing stops a
consumer reusing one item object twice.

**Still open:** neither React navigation is a single tab stop, which is correct
for a list of links (a navigation is not a composite widget) — but
`SidebarNavigation` renders a disabled item with an `href` as a `<span>` and a
disabled item with an `onClick` as a `disabled` button, so the two disabled
states are differently reachable. `<pf-nav-item>` has one rule: a disabled item
renders no anchor at all.

---

## `<pf-sidebar-navigation>` has no collapsed state

The React `SidebarNavigation` has none either, so nothing has been lost — but a
sidebar that cannot narrow to icons only is the obvious gap in both layers. The
element is the better place to add it: `pf-nav-item` already has the icon slot
and a pushed-down `orientation`, so a `collapsed` prop on the navigation would
push the same way and the item would hide its label and badge and keep the
icon. The label still has to reach a screen reader, which means
`aria-label` from the slotted text rather than `display: none` on it.

**Not yet done because** it needs a decision on the tooltip a collapsed item
should show, and `pf-tooltip` cannot describe a trigger across a shadow
boundary with an IDREF — it copies the text onto the trigger as
`aria-description`. Two elements each copying text onto the same node is the
part to think about first.

---

## The React `FileUploader` is not a form control

It renders a real `<input type="file">`, so a file reaches a surrounding form
the moment one is picked — but the component holds its _own_ list in state and
clears the input after every selection, which means the input is empty by the
time anything is submitted. A `<form>` around it submits nothing.
`<pf-file-uploader>` has no such gap: being form-associated, it submits its
held list through `ElementInternals`, one entry per file.

**Fix:** the same shape the element uses — keep the real input for the picker
only, and add a hidden carrier the component writes to. There is no way to set
`FileList` on an input other than through a `DataTransfer`, which is
constructible in every current browser, so `new DataTransfer()` filled from
the held list and assigned to a hidden `<input type="file" name>` would do it.
Worth a measurement first: Safari's `DataTransfer` constructor has been the
late one historically.

**Not done here** because it changes what a form sees, which is a decision
about the public API rather than a port, and the element covers the case today.

---

## `<pf-code-snippet>` does not highlight

Deliberate, and documented on the element: `prism-react-renderer` is a React
renderer, and every framework-free highlighter is a large runtime dependency
that an element in a design system should not force into a consumer's bundle.
A consumer who already highlights slots the markup their highlighter produced
into the default slot and keeps the frame, header, copy button, scroll box and
announcement; line numbers are then withheld, because aligning a gutter with
someone else's markup needs to know where their lines break.

**If this is ever wanted built in**, the shape to reach for is a registry
rather than a dependency: a `registerHighlighter(fn)` in core taking
`(code, language) => string` of markup, defaulting to identity, so a consumer
who already has Shiki or Prism wires it once at startup — exactly what
`registerIcons` does for glyphs, and for the same reason. The element would
then set that markup rather than text, which is the only place in either layer
that would need `innerHTML`, so the decision to make is whose escaping is
trusted.

---

## The React `RichTextEditor` is six tab stops, and reaches no form

Two gaps, both of which `<pf-rich-text-editor>` closes:

- Its toolbar is `role="toolbar"` with six focusable buttons inside, so
  tabbing past the field walks every one. The ARIA toolbar pattern is one tab
  stop with the arrows moving inside, which is what `pf-toolbar` and the
  element's own toolbar do. Core already has `getRovingItems`,
  `resolveRovingKey`, `resolveListMove` and `syncRovingTabIndex`, so the fix
  is a `ref` on the toolbar and the same three handlers the element has — no
  new logic at all.
- A `contenteditable` is not a form control, so a `<form>` around the React
  editor submits nothing. Same shape as the `FileUploader` entry above, and the
  same fix: a hidden input the component writes its value to. Simpler here,
  because the value is a string.

Both were left alone because they change the public behaviour of a shipped
component rather than being part of the port.

---

## The React `GaugeChart`'s accessible name is its value

`aria-label={`${pct}%`}` on `role="meter"`, so a reader is told "73%" with no
idea what is 73% full — and `aria-valuenow` already carries the number, so the
name is pure duplication. `<pf-gauge-chart>` takes a `label` for what is being
measured and puts the percentage in `aria-valuetext`, which is where a reader
looks for it.

**Fix:** add a `label` prop defaulting to nothing, use it for `aria-label`, and
move the percentage to `aria-valuetext`. Left alone here because a gauge that
suddenly has no accessible name would be a regression for any consumer relying
on the current one, so the default needs a decision: `"Gauge"`, as the element
uses, or required.
