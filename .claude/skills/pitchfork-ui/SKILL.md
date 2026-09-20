---
name: pitchfork-ui
description: Use when writing, reviewing or refactoring UI code that uses Pitchfork UI (@pitchfork-ui/react) — building screens or components from the library, theming it, or checking that generated JSX uses real props and design tokens. Triggers on @pitchfork-ui/react imports, pf- class names, --pf-* CSS variables, or any work in this repository's packages/react.
---

# Pitchfork UI

Never guess this library's API. It has 91 exported components and the prop names
are not guessable — `Badge` takes `variant`, not `type`; `Button`'s sizes are
`sm`/`md`/`lg`, not `small`/`medium`/`large`.

## Get the real API first

If the `pitchfork-ui` MCP server is available, use it — it is generated from
source, so it is never out of date:

| Need                           | Tool                 |
| ------------------------------ | -------------------- |
| What components exist          | `list_components`    |
| Which component fits a job     | `search_components`  |
| Props, defaults, a11y contract | `get_component`      |
| Working JSX                    | `get_examples`       |
| Colours, spacing, radii        | `get_tokens`         |
| The house rules in full        | `get_conventions`    |
| **Check what you wrote**       | **`validate_usage`** |

Run `validate_usage` on any JSX you produce before presenting it. It catches
invalid variant values, misspelled props and hardcoded colours.

Without the MCP server, read `node_modules/@pitchfork-ui/react/dist/metadata.json`,
or fetch <https://lelandrangel.com/pitchfork-ui/llms-full.txt>. In this
repository, the source in `packages/react/src/components/` is authoritative.

## Rules that do not bend

- **Never hardcode a colour, radius, spacing or font size.** Everything goes
  through a CSS variable. In component CSS, use a `--pf-*` theme alias, not a
  raw `--color-*` token.
- **Semantic HTML first.** A `<button>`, never a `<div role="button">`.
- **Dark mode is automatic** via `[data-theme='dark']` in `theme.css`. Component
  CSS must not contain dark-mode selectors.
- **Mobile-first.** Base styles target small screens; widen in `@media (--sm)`,
  `(--md)`, `(--lg)`. Never write a raw pixel breakpoint.
- **Class names** are BEM-like under `pf-`: `.pf-card`, `.pf-card--elevated`,
  `.pf-card__header`.

## Writing a component in this repository

Follow the existing shape exactly — `get_conventions` has it in full. In short:
a `ComponentNameProps` interface that extends the native element's attributes,
`forwardRef` for anything interactive, `...props` spread onto the root element
after your own, and `cx()` for class names. Every component needs at least one
accessibility-focused test; `Button.test.tsx` is the minimal example and
`Tooltip.test.tsx` a thorough one.

Adding a component means four things, not one: the component folder, an export
in `packages/react/src/index.ts`, the three Storybook files in `apps/docs/src/`,
and a theme alias in `styles/theme.css` for each new `--pf-*` variable.

Commits follow Conventional Commits with the component as scope:
`feat(Badge): add outline variant`. See `CONTRIBUTING.md`.
