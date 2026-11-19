# @pitchfork-ui/mcp

An [MCP](https://modelcontextprotocol.io) server for
[Pitchfork UI](https://lelandrangel.com/pitchfork-ui/). It gives a coding agent
the real API of the library's 112 custom elements — attributes, events, slots,
`::part()`s, design tokens and house conventions — and checks the markup it
writes, so generated code uses the design system instead of guessing at it.

Everything it serves is generated from the library's build. The server holds no
knowledge of its own, so it cannot drift from the library.

## Install

Claude Code:

```bash
claude mcp add pitchfork-ui -- npx -y @pitchfork-ui/mcp
```

Or add it to your MCP client config:

```json
{
  "mcpServers": {
    "pitchfork-ui": {
      "command": "npx",
      "args": ["-y", "@pitchfork-ui/mcp"]
    }
  }
}
```

If the project you are working in has `@pitchfork-ui/elements` installed, the
server answers from _that_ copy, so its answers match the version you are
building against. Otherwise it answers from the copy bundled with the server.

## Tools

| Tool              | What it does                                                                 |
| ----------------- | ---------------------------------------------------------------------------- |
| `list_elements`   | Every custom element, optionally filtered by category                        |
| `get_element`     | Full API for one element: attributes, events, methods, slots, `::part()`s    |
| `get_examples`    | Copy-ready markup for an element tag                                         |
| `get_tokens`      | The design token tree — colours, spacing, radii, typography, shadows, motion |
| `get_conventions` | The house rules: installing, styling, events, icons, accessibility           |
| `validate_usage`  | Check `<pf-*>` markup or a framework binding against the real API            |

`list_elements` marks which elements are form controls and which only make
sense inside a parent. In React, Angular and Vue, use the generated bindings
(`@pitchfork-ui/elements-react`, `-angular`, `-vue`); `validate_usage` checks
those as well as plain markup.

### The deprecated React components

`@pitchfork-ui/react` is deprecated and removed after 30 April 2027. Three tools
answer about it, for code that still imports it:

| Tool                | What it does                                                       |
| ------------------- | ------------------------------------------------------------------ |
| `list_components`   | Every React component, optionally filtered by category             |
| `search_components` | Find something from a plain-language description                   |
| `get_component`     | Full API for one React component, and the element that replaces it |

Each answer names the element to use instead: `get_component AreaChart` says to
set `area` on `<pf-line-chart>`. `search_components` is the one to reach for
when you know the job ("pick a date range") but not the element — each result
names its element. These three need the React metadata, so in a project
without `@pitchfork-ui/react` they answer from the bundled copy.

### validate_usage

Most component-library MCP servers only read. This one checks work. Given:

```html
<pf-buton variant="primary">Go</pf-buton>
<pf-tabs variant="pill"></pf-tabs>
<pf-video-player sources="clip.mp4"></pf-video-player>
<pf-time-picker hourCycle="12"></pf-time-picker>
<pf-alert style="color: #4f46e5"></pf-alert>
```

it returns:

```
3 error(s), 2 warning(s).

- error (line 1): `<pf-buton>` is not an element in this library. Did you mean
  `<pf-button>`?
- error (line 2): `variant="pill"` is not valid on `<pf-tabs>`. Expected one of:
  "pills", "underline".
- error (line 3): `sources` on `<pf-video-player>` is `PfVideoSource[]`, which
  has no attribute — setting it in markup does nothing. Assign the property in
  JavaScript, or pass it as a prop through one of the framework bindings.
- warning (line 4): `hourCycle` is the property name; the attribute is
  `hour-cycle`. Correct in a framework binding, inert in plain HTML.
- warning (line 5): Hardcoded colour `#4f46e5`. Use a CSS variable instead —
  component styles go through a `--pf-*` alias, never a raw value.
```

The third is the one worth having: the markup parses, the element renders, and
the value simply never arrives.

A framework binding is checked against its element, by property and event name:

```tsx
<PfButton variant="ghostly">Go</PfButton>
<PfTabs onPfChange={select} />
<PfInput lable="Email" />
```

```
3 error(s), 0 warning(s).

- error (line 1): `variant="ghostly"` is not valid on `PfButton`. Expected one
  of: "destructive", "ghost", "primary", "secondary".
- error (line 2): `PfTabs` has no event for `onPfChange`. Its events are:
  `onPfTabChange`.
- error (line 3): `PfInput` has no prop `lable`. Did you mean `label`?
```

Each binding also gets an `info` note naming the package it comes from, which
never makes a clean result dirty. Angular's `[prop]`/`(event)` and Vue's
`:prop`/`@event` spellings are recognised and left alone.

For an attribute that is not a declared prop, the rule is:

- `data-*`, `aria-*`, `on*` handlers and global HTML attributes pass, because
  they are legitimate on any element — `id`, `class`, `slot` and
  `data-testid` included.
- Anything else is reported as invented, with a suggestion when it is close to a
  real prop (`lable` → `label`) and the element's real attribute list when it
  is not.

Icon names are checked against the built-in glyphs, the bundled Font Awesome
icons, their aliases and the roles. Anything else is a **warning**, not an
error: an app can register any icon under any name at runtime
(`registerIconSet()`, `registerIconGlyphs()`, `registerIcons()`), and a
snippet never shows the entry point that does it. Pass the names the app
registers as `registeredIcons` and they pass:

```json
{ "code": "<pf-icon name=\"rocket\"></pf-icon>", "registeredIcons": ["rocket"] }
```

A near-miss of a known name still gets its suggestion (`clsoe` → `close`).

JSX that uses the deprecated React components is checked the same way, against
their props: an invalid `variant`, a misspelled prop or component name, and a
hardcoded colour in a `style` prop.

## Configuration

| Variable                | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `PITCHFORK_UI_ELEMENTS` | Path to an `elements.json` to use instead of the default |
| `PITCHFORK_UI_TOKENS`   | Path to a `tokens.json` to use instead of the default    |
| `PITCHFORK_UI_METADATA` | Path to the deprecated React layer's `metadata.json`     |

By default each comes from the package installed in your project
(`@pitchfork-ui/elements/metadata`, `@pitchfork-ui/tokens/tokens`,
`@pitchfork-ui/react/metadata`), falling back to the copy bundled here. The
element metadata is the one the server needs; the React metadata is optional.
To point it at a specific file:

```bash
PITCHFORK_UI_ELEMENTS=./node_modules/@pitchfork-ui/elements/dist/elements.json \
  npx -y @pitchfork-ui/mcp
```

When developing the library itself, run the server from source instead — inside
the monorepo `npx` resolves the workspace symlink and cannot find the bin:

```bash
PITCHFORK_UI_ELEMENTS=./packages/elements/dist/elements.json node packages/mcp/src/index.mjs
```

A path that does not exist is not an error; the server quietly falls back to its
bundled copy. The startup line on stderr names the files it actually loaded, so
check that if an override seems to have no effect.

## License

MIT
