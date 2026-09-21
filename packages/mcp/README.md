# @pitchfork-ui/mcp

An [MCP](https://modelcontextprotocol.io) server for
[Pitchfork UI](https://lelandrangel.com/pitchfork-ui/). It gives a coding agent
the library's real API — props, variants, design tokens, accessibility contracts
and house conventions — so generated code uses the design system correctly
instead of guessing at it.

Everything it serves is generated from source at build time. The server holds no
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

If the project you are working in has `@pitchfork-ui/react` installed, the server
answers from _that_ copy, so its answers match the version you are building
against. Otherwise it falls back to the metadata bundled with the server.

## Tools

| Tool                | What it does                                                                 |
| ------------------- | ---------------------------------------------------------------------------- |
| `list_components`   | Every component, optionally filtered by category                             |
| `search_components` | Find a component from a plain-language description                           |
| `get_component`     | Full API for one component: props, defaults, a11y contract, theme variables  |
| `get_examples`      | Every worked example for a component, as copy-ready JSX                      |
| `get_tokens`        | The design token tree — colours, spacing, radii, typography, shadows, motion |
| `get_conventions`   | The house rules: naming, the CSS variable chain, breakpoints, forms, a11y    |
| `validate_usage`    | Check a JSX snippet against the real API                                     |

### validate_usage

Most component-library MCP servers only read. This one checks work:

```tsx
<Badge variant="primary">New</Badge>
<Buton>Go</Buton>
<Alert varient="info" />
<div style={{ color: '#4f46e5' }} />
```

```
3 error(s), 1 warning(s).

- error (line 1): `variant="primary"` is not valid on `Badge`. Expected one of:
  "success", "warning", "danger", "neutral", "brand".
- error (line 2): `Buton` is not exported by the library. Did you mean `Button`?
- error (line 3): `Alert` has no prop `varient`. Did you mean `variant`?
- warning (line 4): Hardcoded colour `#4f46e5`. Use a CSS variable instead.
```

For an attribute that is not a declared prop, the rule is:

- `data-*`, `aria-*`, `on*` handlers and DOM attributes pass, because almost
  every component spreads onto a native element — `onMouseEnter` and
  `data-testid` are legitimate anywhere.
- Anything else is reported as invented, with a suggestion when it is close to a
  real prop (`varient` → `variant`) and the component's real prop list when it
  is not (`padding` on `Card`).
- Components whose props cannot be fully enumerated are skipped entirely. `Icon`
  extends a type from outside the library, so an unlisted prop there proves
  nothing; its metadata carries `propsComplete: false`.

The consequence worth knowing: a _valid DOM attribute_ that is meaningless on a
given component is not flagged. `<Badge type="success">` passes, because `type`
is real HTML and rejecting it would mean rejecting legitimate passthrough props
everywhere else.

## Configuration

| Variable                | Purpose                                                 |
| ----------------------- | ------------------------------------------------------- |
| `PITCHFORK_UI_METADATA` | Path to a `metadata.json` to use instead of the default |
| `PITCHFORK_UI_TOKENS`   | Path to a `tokens.json` to use instead of the default   |

By default the server answers from the `@pitchfork-ui/react` installed in your
project, falling back to the copy bundled here. To point it at a specific file:

```bash
PITCHFORK_UI_METADATA=./node_modules/@pitchfork-ui/react/dist/metadata.json \
  npx -y @pitchfork-ui/mcp
```

When developing the library itself, run the server from source instead — inside
the monorepo `npx` resolves the workspace symlink and cannot find the bin:

```bash
PITCHFORK_UI_METADATA=./packages/react/dist/metadata.json node packages/mcp/src/index.mjs
```

A path that does not exist is not an error; the server quietly falls back to its
bundled copy. The startup line on stderr names the file it actually loaded, so
check that if an override seems to have no effect.

## License

MIT
