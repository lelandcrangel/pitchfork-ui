---
name: pitchfork-ui
description: Use when writing, reviewing or refactoring UI that uses Pitchfork UI — the `<pf-*>` custom elements from @pitchfork-ui/elements, their generated React, Angular or Vue bindings (`PfButton`, @pitchfork-ui/elements-react, -angular, -vue), or theming them through `--pf-*` and `--color-semantic-*` variables. Also use on any @pitchfork-ui/react import: that package is deprecated, and new code goes to the elements.
---

# Pitchfork UI

Pitchfork UI is **112 standard custom elements** (`<pf-button>`, `<pf-select>`,
`<pf-modal>`, …) with generated bindings for React, Angular and Vue.
`@pitchfork-ui/react` is the deprecated hand-written layer, removed after
30 April 2027: never write new code against it.

Never guess the API. Values and structure are not guessable, and a wrong guess
parses, renders and does nothing: `pf-metric-card`'s `trend` is `positive`, not
`up`; `pf-tabs` takes `variant="pills"`, not `pill`; `pf-select` takes
`<pf-option>` children, not an `options` array.

## Get the real API first

The `pitchfork-ui` MCP server is generated from the library's build, so it
cannot be out of date. If it is not connected:
`claude mcp add pitchfork-ui -- npx -y @pitchfork-ui/mcp`.

| Need                                           | Tool                 |
| ---------------------------------------------- | -------------------- |
| What elements exist, by category               | `list_elements`      |
| Attributes, events, methods, slots, `::part`s  | `get_element`        |
| Working markup for a tag                       | `get_examples`       |
| Which element does a job ("pick a date range") | `search_components`  |
| Colours, spacing, radii, type, motion          | `get_tokens`         |
| The house rules in full                        | `get_conventions`    |
| **Check what you wrote**                       | **`validate_usage`** |

`search_components` searches the deprecated components, and every result names
the element that replaces it — use it to find the element, then `get_element`.

**Run `validate_usage` on every snippet before presenting it**, markup and
bindings alike. It catches unknown tags and attributes, invalid values, a prop
that cannot be written in markup, unknown icon names and hardcoded colours.

Without the server, the same data is in the installed package —
`@pitchfork-ui/elements/metadata` resolves to `dist/elements.json`, with every
prop, attribute, event, slot, part and a working example — or in one fetch from
<https://lelandrangel.com/pitchfork-ui/llms-full.txt>.

## Setting up

Load the token stylesheet once, by its exported name:
`import '@pitchfork-ui/elements/styles.css'`. A deep import of the file inside
`dist/` fails to resolve.

Then register the elements **one** way:

- **Plain HTML:** `defineCustomElements()` from `@pitchfork-ui/elements/loader`.
- **A binding package:** nothing. Each component registers its own tag when it
  first renders. Calling the loader as well registers every tag a second time.

Per framework:

- **React** — `import { PfButton } from '@pitchfork-ui/elements-react'`. A
  native event keeps its React name (`onClick`); an element's own event is
  `onPf*` (`onPfChange`, `onPfOpenChange`).
- **Angular** — standalone components, plus a value-accessor directive imported
  beside a form control: `TextValueAccessor`, `BooleanValueAccessor` for
  `pf-checkbox` and `pf-switch`, `NumericValueAccessor` for `pf-slider`. Without
  it Angular reports "No value accessor".
- **Vue** — `v-model` on `pf-input`, `pf-textarea`, `pf-radio-group`,
  `pf-slider` (`value`), `pf-checkbox` and `pf-switch` (`checked`). Element
  events are `@pf-*` listeners.

## Rules that do not bend

**Data goes in as child elements, not arrays.** Loop in your own template:

| Parent                                                       | Children                            |
| ------------------------------------------------------------ | ----------------------------------- |
| `pf-select`, `pf-multi-select`, `pf-combobox`                | `pf-option`                         |
| `pf-tabs`                                                    | `pf-tab` and `pf-tab-panel`, paired |
| `pf-table`                                                   | `pf-table-row` of `pf-table-cell`   |
| `pf-radio-group` / `pf-checkbox-group`                       | `pf-radio-button` / `pf-checkbox`   |
| `pf-accordion`, `pf-tree-view`, `pf-carousel`, `pf-timeline` | their `-item` / `-slide` element    |
| `pf-line-chart`, `pf-bar-chart`                              | `pf-chart-series`                   |

`get_element` names the children of everything else. A chart's _rows_ are the
exception: bulk numbers, so `data` is a property (or JSON in the attribute).

**Eight props have no attribute.** Written in markup they parse, render and
never arrive. Set them as properties — a binding prop, or `el.prop = …`:
`isDateDisabled` on `pf-calendar`, `pf-date-picker` and `pf-date-range-picker`;
`files` on `pf-file-uploader`; `keys` on `pf-kbd`; `validate` on
`pf-tag-input`; `sources` and `tracks` on `pf-video-player`.

**Events follow the platform.** Every event is a `CustomEvent` with its payload
in `detail`.

- `pfChange` and `pfInput` come only from form controls, and they bubble, so
  one listener on a `<form>` hears every control in it.
- Everything else stops at its element: `pfOpenChange`, `pfSelect`,
  `pfDismiss`, `pfSortChange`, `pfPageChange`. Listen on the element, never on
  an ancestor. Every binding already does.
- A container's change has a name of its own: `pfTabChange` (`pf-tabs`),
  `pfExpandedChange` (`pf-accordion`), `pfSelectionChange` (`pf-tree-view`,
  `pf-button-group`, `pf-calendar`), `pfSlideChange` (`pf-carousel`),
  `pfResize` (`pf-resizable`). They do not emit `pfChange`.

**Form controls are real form controls.** They are form-associated, so inside a
`<form>` the `name` puts the value in `FormData`, `required` and `error` take
part in validation, and a reset restores the starting value. No hidden inputs,
no manual serialising. `<pf-button type="submit">` submits its form.

**An element sorts nothing and filters nothing.** `pf-table` reports a sort
with `pfSortChange` and `pf-pagination` reports `pfPageChange`. Sort or slice
your own data and render the result; `sortRowsBy` in `@pitchfork-ui/core`
orders rows the way the table's indicator says.

**Styling goes through CSS variables and `::part()`.**

- Never hardcode a colour, spacing, radius or font size. `get_tokens` has the
  values; reference them as variables.
- Custom properties cross the shadow boundary; selectors do not. Style an
  element's inside through the `::part()`s `get_element` lists.
- **Theme with semantic tokens on `:root`**, such as
  `--color-semantic-action-primary`. Each `--pf-*` alias reads it where the
  alias is declared, on `:root`, so the same override on a wrapper never
  reaches it. To restyle one element, override its `--pf-*` alias on that
  element instead.
- Dark mode is `data-theme="dark"` on an ancestor, usually `<html>`. Write no
  dark-mode selectors of your own.

**Icons are named, and only bundled names draw.** A name the library does not
bundle draws nothing. Register more once at startup with `registerIconSet()`
or `registerIconGlyphs()` from `@pitchfork-ui/core`, and pass those names to
`validate_usage` as `registeredIcons`. Elements ask for roles (`close`,
`next`, `warning`), so one `registerIconSet()` swaps the whole set.

**Name what has no visible text.** An icon-only `pf-button`,
`pf-utility-button` or `pf-icon` takes a `label`; a `pf-modal` takes a
`label` or a `pf-modal-header` child, and with neither the dialog is unnamed.
Prefer the element over a `div` with a role.

## Existing @pitchfork-ui/react code

Do not extend it. `get_component` on a React component names its element, and
the migration guide lists every component's answer and which props change
shape:
<https://lelandrangel.com/pitchfork-ui/?path=/docs/foundations-migrating--docs>.
It also documents a codemod for the mechanical renames, run from a clone of
this repository: `npm run codemod:elements -- /path/to/src`, then `--write` to
apply.

## In this repository

`CLAUDE.md` is authoritative, and its **Web components** section is the
reasoning behind every rule above. In short:

- A new component is an **element**: a folder in
  `packages/elements/src/components/` and an entry in
  `apps/docs/src/element-examples.ts`. Its docs page, story, bindings and
  metadata are generated. `packages/react` takes no new components.
- A new `--pf-*` variable gets an alias in `packages/tokens/src/theme.css`
  that names a **semantic** token, so it changes with the mode.
- Commits are Conventional Commits. Never write a tag in angle brackets in a
  commit message, backticks or not: release-please reads it as HTML.
