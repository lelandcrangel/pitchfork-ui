# PitchforkUI

PitchforkUI is a React-based design system scaffold focused on accessible, performant, token-driven components.

## Stack

- React + TypeScript
- Vite library builds
- Storybook React/Vite documentation
- Style Dictionary design tokens
- CSS variables for theming
- Vitest + Testing Library
- npm workspaces

## Getting Started

```bash
npm install
npm run build:tokens
npm run dev
```

Storybook runs from `apps/docs` and imports components from `@pitchfork-ui/react`.

## Workspace

```txt
apps/docs              Storybook documentation app
apps/theme-builder     Live token-editing playground
apps/demo              Example application built on the library
packages/react         React component library
packages/tokens        Style Dictionary token source and CSS variable output
packages/mcp           MCP server exposing the library's API to coding agents
scripts/               Metadata, llms.txt and MCP data generators
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

## Using it with a coding agent

The library publishes its own API in machine-readable form, generated from
source on every build, so an agent does not have to guess at prop names.

`@pitchfork-ui/mcp` is not on npm yet, so point your MCP client at a checkout
for now. Run `npm install && npm run build` in it first, so the metadata the
server reads exists:

```json
{
  "mcpServers": {
    "pitchfork-ui": {
      "command": "node",
      "args": ["/absolute/path/to/pitchfork-ui/packages/mcp/src/index.mjs"]
    }
  }
}
```

Once the package is published, that becomes a one-liner:

```bash
claude mcp add pitchfork-ui -- npx -y @pitchfork-ui/mcp
```

The server exposes the component list, props, design tokens, the house
conventions, working examples, and a `validate_usage` tool that checks a JSX
snippet against the real API. If you would rather not install anything, the
same content is published as
[`llms.txt`](https://lelandrangel.com/pitchfork-ui/llms.txt) and
[`llms-full.txt`](https://lelandrangel.com/pitchfork-ui/llms-full.txt), or as
`@pitchfork-ui/react/metadata` for your own tooling.

See [Using with AI](https://lelandrangel.com/pitchfork-ui/?path=/docs/foundations-using-with-ai--docs)
for setup in other clients and for what changes in the output.
