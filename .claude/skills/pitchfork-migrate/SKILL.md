---
name: pitchfork-migrate
description: Use when moving code off the deprecated @pitchfork-ui/react onto the Pitchfork UI elements — "migrate to the elements", "replace the React components", a codebase that imports @pitchfork-ui/react, or `TODO(pitchfork-ui)` comments the codemod left behind. Covers running the codemod, reshaping the call sites it refuses, replacing hooks and helpers, fixing stylesheets, and checking the result.
---

# Migrating from @pitchfork-ui/react

`@pitchfork-ui/react` is deprecated and removed after **30 April 2027**. Its
replacement is `@pitchfork-ui/elements`; a React app moves to the generated
bindings in `@pitchfork-ui/elements-react` (`PfButton`, `PfSelect`, …) and
**stays a React app**.

The full component-by-component answer is the migration guide:
<https://lelandrangel.com/pitchfork-ui/?path=/docs/foundations-migrating--docs>.
It is generated from both libraries' metadata, so trust it over memory. With
the `pitchfork-ui` MCP server, `get_component <Name>` gives the same answer for
one component, and `get_element <tag>` the element's real API.

Work in this order. Each step leaves the app compiling and running: a file that
imports from both packages is a normal intermediate state.

## 1. Inventory with the codemod's report

The codemod lives in the Pitchfork UI repository, not on npm, because it reads
both metadata files. Clone it, `npm install`, then run against the app:

```bash
npm run codemod:elements -- /path/to/app/src          # report only, writes nothing
npm run codemod:elements -- --write /path/to/app/src  # apply
```

The report is the worklist. It lists, per file:

- what it would rename (import, component name, event props the element emits);
- every import it would leave on the old package, and why;
- **handlers the element cannot fire** — usually `onChange` on a form control;
- **stylesheet selectors on a React class name** (`.pf-button--primary`).

It exits 1 while any handler finding remains. If the repository cannot be
cloned, build the same list by hand: every `@pitchfork-ui/react` import, each
component looked up with `get_component` or in the guide's tables.

## 2. Install, then apply

Add `@pitchfork-ui/elements-react` and `@pitchfork-ui/elements` to the app's
dependencies (the codemod warns about a manifest that lacks them), then run
with `--write`.

It does exactly three things — the import, `Button` → `PfButton`, and event
props the element really emits (`onDismiss` → `onPfDismiss`) — and moves the
stylesheet import to `@pitchfork-ui/elements/styles.css`. Everything else stays
on `@pitchfork-ui/react` under a `TODO(pitchfork-ui)` block naming what each
component needs. **It is safe to rerun** after fixing a few call sites: the
block is rebuilt from what is still left, never stacked.

## 3. Reshape what it refused

Take the TODO block one line at a time. Each line names the kind of change:

**`-> slot`** — a `ReactNode` prop becomes a slotted child:

```tsx
<Alert variant="success" heading="Saved" icon={<Icon name="circle-check" />} />
// becomes
<PfAlert variant="success" heading="Saved">
  <PfIcon slot="icon" name="circle-check" />
</PfAlert>
```

A prop the element takes as a **string** (`pf-alert`'s `heading`) moves across
unchanged while its value is text. Markup in it (`heading={<b>Saved</b>}`)
cannot go into an attribute: make it text, or use a slot if the element has one.

**`-> child elements`** — an array prop becomes children you loop over:

```tsx
<Select label="Fruit" options={fruits} onValueChange={setFruit} />
// becomes
<PfSelect label="Fruit" value={fruit} onPfChange={(e) => setFruit(e.detail.value)}>
  {fruits.map((f) => (
    <PfOption key={f.value} value={f.value}>{f.label}</PfOption>
  ))}
</PfSelect>
```

A chart's `data` is the exception: rows stay a property, and only its `series`
become `PfChartSeries` children. The guide's "Still a property" column says
which is which.

**`-> the X prop`** — a rename: `CodeSnippet`'s and `SlideoutMenu`'s `title` is
`heading`.

**`-> needs a destination`** — no slot or prop of that name. The guide's
"Needs a destination" table lists the element's slots, and `get_element`
describes each. Often it is the **default** slot (`PageHeader`'s `heading`
is the page header's own content), sometimes a child element: a `Modal`'s
`title`, body and `footer` become `PfModalHeader`, `PfModalBody` and
`PfModalFooter` children of `PfModal`.

**`-> no matching event … pick the right one`** — the React prop has no
same-named event. Look the element's events up rather than guessing, because
**a wrong handler prop compiles, renders and never fires**:

| Component                                         | Handler becomes       | `detail`                          |
| ------------------------------------------------- | --------------------- | --------------------------------- |
| `Select`, `Combobox`, `Input`, `Textarea`         | `onPfChange`          | `{ value }`                       |
| `Slider`                                          | `onPfChange`          | `{ value }` (number)              |
| `Switch`, `Checkbox`                              | `onPfChange`          | `{ checked, value }`              |
| `Tabs`                                            | `onPfTabChange`       | `{ value }`                       |
| `Accordion`                                       | `onPfExpandedChange`  | `{ value, values }`               |
| `Calendar`, `TreeView` (selection), `ButtonGroup` | `onPfSelectionChange` | `{ value }` / `{ value, values }` |
| `Carousel`                                        | `onPfSlideChange`     | `{ index }`                       |
| `Resizable`                                       | `onPfResize`          | `{ size }`                        |
| `Modal`, `Popover`, `Dropdown`                    | `onPfOpenChange`      | `{ open }`                        |

The value is in **`event.detail`**, never `event.target.value` or
`event.target.checked`.

**`absorbed by …`** — no binding of its own: `AreaChart` is `area` on
`PfLineChart`, `PageHeaderMeta` is the `metadata` slot of `PfPageHeader`,
`NotificationStack` is `PfToaster`, `CalendarGrid` is `PfCalendar`.

**`imported as …`** — an aliased import (`Button as Btn`). The codemod will not
rename an alias. Import the binding under the name the file uses
(`import { PfButton as Btn }`) or drop the alias.

**`not a component in the metadata`** — a hook, helper or type. Its
`@deprecated` JSDoc (the strikethrough in the editor) names the replacement,
and `check:deprecated` holds every core name in those messages to a real
export. For example: `registerIcons` is `registerIconGlyphs` from
`@pitchfork-ui/core`, with the same argument; `Keys` is `isActivationKey`
from core; `useFocusTrap` is `trapFocus` from core, or nothing, since
`PfModal` traps focus itself; `useDisclosure` has no replacement — it is a
`useState` boolean.

## 4. Fix the handlers and stylesheets

**Every handler finding.** `<PfSwitch onChange={(e) => set(e.target.checked)}>`
is the classic: the drop-in rename kept React's own `onChange`, which the
element never fires. It becomes
`onPfChange={(e) => set(e.detail.checked)}`.

**Every selector finding.** An element renders its parts in a shadow root, so a
selector on `.pf-button--primary` matches nothing and fails silently. Restyle
through what crosses the boundary:

- a theme alias on `:root` or on the element: `--pf-button-primary-bg`;
- a semantic token on `:root`: `--color-semantic-action-primary`;
- a `::part()` the element exposes: `pf-input::part(input)`.

`get_element` lists each element's parts. `className` and `style` on a binding
still work, on the element itself.

## 5. Check it

- **Run the codemod's report again.** Done means no `@pitchfork-ui/react`
  imports, no handler findings and no selector findings.
- **`validate_usage`** on each changed file catches a wrong value, an invented
  prop and an event prop the binding does not have.
- **Typecheck.** Each binding drops the props it does not have, so a leftover
  `onValueChange` is a type error.
- **Run the app.** Use every control you changed: does the handler fire, does
  the value show, does a form submit it? A form control's value reaches
  `FormData` through its `name`, with no hidden inputs.
- Then delete the TODO blocks and remove `@pitchfork-ui/react` from the
  dependencies.

## What does not change

The tokens and the theme: `--pf-*` aliases and semantic tokens on `:root`
reach inside every element, and dark mode is still `data-theme="dark"` on an
ancestor. A theme file written for the React components keeps working.
