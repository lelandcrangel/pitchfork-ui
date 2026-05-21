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
packages/tokens        Style Dictionary token source and CSS variable output
packages/react         React component library
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```
