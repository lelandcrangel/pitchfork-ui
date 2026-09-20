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

It deliberately does **not** flag every unrecognised prop. Almost every component
spreads onto a native element, so `onMouseEnter` and `data-testid` are valid; an
unknown prop is reported only when it looks like a typo of a real one.

## Configuration

| Variable                | Purpose                                                 |
| ----------------------- | ------------------------------------------------------- |
| `PITCHFORK_UI_METADATA` | Path to a `metadata.json` to use instead of the default |
| `PITCHFORK_UI_TOKENS`   | Path to a `tokens.json` to use instead of the default   |

Useful when developing the library itself:

```bash
PITCHFORK_UI_METADATA=./packages/react/dist/metadata.json npx @pitchfork-ui/mcp
```

## License

MIT
