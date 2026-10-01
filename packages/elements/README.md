# @pitchfork-ui/elements

The [Pitchfork UI](https://lelandrangel.com/pitchfork-ui/) design system as
standard custom elements, authored with [Stencil](https://stenciljs.com/).

These are the same components as `@pitchfork-ui/react`, built to run anywhere —
React, Angular, Vue, or a plain HTML page. Framework wrappers are generated from
this package rather than hand-written.

## Install

```bash
npm install @pitchfork-ui/elements @pitchfork-ui/tokens
```

## Use

Load the design tokens once, then the element definitions:

```html
<link rel="stylesheet" href="node_modules/@pitchfork-ui/tokens/dist/css/variables.css" />
<script
  type="module"
  src="node_modules/@pitchfork-ui/elements/dist/pitchfork/pitchfork.esm.js"
></script>

<pf-button variant="primary" size="md">Save</pf-button>
```

Or from a bundler:

```js
import { defineCustomElements } from '@pitchfork-ui/elements/loader';

defineCustomElements();
```

## Theming

Theming works exactly as it does in the React library: the `--pf-*` custom
properties are declared once on `:root` and inherit through the shadow boundary.
Component internals are encapsulated; the token layer is not.

```css
:root {
  --pf-button-primary-bg: rebeccapurple;
}
```

Switch themes with `[data-theme='dark']` on an ancestor, as before.

## Styling internals

Shadow DOM means a consumer's stylesheet cannot reach inside a component.
Each element exposes a documented `::part()` surface instead:

```css
pf-button::part(button) {
  border-radius: 0;
}
```

Content you slot into a component stays in the light DOM and is styled by your
own CSS as normal.

## Status

Early. Components land in waves — see `WEB-COMPONENTS-PLAN.md` in the
repository. `@pitchfork-ui/react` remains the complete, hand-authored library
and is not going away.

## Licence

MIT
