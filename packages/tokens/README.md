# @pitchfork-ui/tokens

The design tokens behind [Pitchfork UI](https://lelandrangel.com/pitchfork-ui/) —
colour, spacing, radii, typography, shadow and motion, built with
[Style Dictionary](https://styledictionary.com) from a single source of truth.

**[Full documentation →](https://lelandrangel.com/pitchfork-ui/)**

---

## Do you need this package?

Probably not. If you are using `@pitchfork-ui/react`, every one of these tokens
is already inlined into its stylesheet:

```ts
import '@pitchfork-ui/react/styles.css';
```

Install this package when you want the tokens as **data** rather than CSS — a
Figma sync, a React Native theme, a linter, or a docs site of your own.

## Installation

```bash
npm install @pitchfork-ui/tokens
```

## Usage

Two entry points, the same values in both.

**CSS custom properties** — defines the variables on `:root`:

```css
@import '@pitchfork-ui/tokens/css';

.thing {
  color: var(--color-brand-600);
  padding: var(--space-4);
  border-radius: var(--radius-md);
}
```

**JSON** — a flat object, grouped by category:

```ts
import tokens from '@pitchfork-ui/tokens/tokens' with { type: 'json' };

tokens.color.brand['600']; // "#4f46e5"
tokens.space['4']; // "1rem"
```

## What is in it

| Group      | Count | Example                                    |
| ---------- | ----- | ------------------------------------------ |
| `color`    | 85    | `--color-brand-600`, `--color-gray-50`     |
| `space`    | 16    | `--space-4`                                |
| `font`     | 16    | `--font-size-md`, `--font-weight-semibold` |
| `size`     | 6     | `--size-control-md`                        |
| `shadow`   | 4     | `--shadow-md`                              |
| `radius`   | 4     | `--radius-md`                              |
| `duration` | 3     | `--duration-fast`                          |
| `easing`   | 3     | `--easing-standard`                        |

137 values in total.

## A note on theming

These are raw tokens — the bottom of a three-tier chain:

```
token  →  theme alias  →  component variable
--color-semantic-action-primary  →  --pf-button-primary-bg  →  background
```

`@pitchfork-ui/react` owns the middle tier. If you are theming the component
library, override the `--pf-*` aliases rather than these tokens; if you are
building something of your own, start here.

Dark mode lives in the react package's `theme.css` under `[data-theme='dark']`,
not in this package. These values are mode-independent.

## License

MIT
