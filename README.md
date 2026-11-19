# PitchforkUI

Pitchfork UI is an accessible, themeable design system of **112 standard custom
elements**, backed by a Style Dictionary token system, with generated bindings
for React, Angular and Vue. The elements are the library; the hand-written
`@pitchfork-ui/react` is deprecated and is removed after **30 April 2027**.

## Stack

- Stencil custom elements (`@pitchfork-ui/elements`)
- Generated React, Angular and Vue bindings
- Style Dictionary design tokens, delivered as CSS variables
- Storybook documentation
- Vitest, in jsdom and in Chromium through Playwright
- npm workspaces

## Getting Started

```bash
npm install
npm run build:tokens && npm run build:core && npm run build:elements
npm run dev
```

Storybook runs from `apps/docs` and documents the custom elements. It resolves
`@pitchfork-ui/elements` through the package's own exports, so the elements
have to be built before it starts; `npm run build` builds everything in order.

## Workspace

```txt
apps/docs              Storybook documentation app
apps/theme-builder     Live token-editing playground
apps/demo              Example application built on the library
apps/consumer-*        React, Angular and Vue apps that smoke-test the bindings
packages/elements      The custom elements (@pitchfork-ui/elements)
packages/elements-*    Generated React, Angular and Vue bindings
packages/core          Framework-free behaviour shared by every rendering layer
packages/tokens        Style Dictionary token source and CSS variable output
packages/mcp           MCP server exposing the library's API to coding agents
packages/react         Deprecated hand-written React components
scripts/               Metadata, llms.txt, docs and MCP data generators
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

```bash
claude mcp add pitchfork-ui -- npx -y @pitchfork-ui/mcp
```

The server exposes every element's attributes, events, slots and parts, the
design tokens, the house conventions, working examples, and a `validate_usage`
tool that checks `<pf-*>` markup or binding JSX against the real API. If you
would rather not install anything, the same content is published as
[`llms.txt`](https://lelandrangel.com/pitchfork-ui/llms.txt) and
[`llms-full.txt`](https://lelandrangel.com/pitchfork-ui/llms-full.txt), or as
`@pitchfork-ui/elements/metadata` for your own tooling.

This repository also carries an agent skill, `.claude/skills/pitchfork-ui`,
with the rules an agent cannot infer from the API alone.

See [Using with AI](https://lelandrangel.com/pitchfork-ui/?path=/docs/foundations-using-with-ai--docs)
for setup in other clients and for what changes in the output.
