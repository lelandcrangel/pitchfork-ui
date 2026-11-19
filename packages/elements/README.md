# @pitchfork-ui/elements

The [Pitchfork UI](https://lelandrangel.com/pitchfork-ui/) design system as
standard custom elements, authored with [Stencil](https://stenciljs.com/).

112 elements that run anywhere — React, Angular, Vue, or a plain HTML page.
Framework bindings are generated from this package rather than hand-written:
`@pitchfork-ui/elements-react`, `@pitchfork-ui/elements-angular` and
`@pitchfork-ui/elements-vue`.

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

To bundle only the elements you use, register each one yourself. Importing an
element's module registers nothing on its own, which is what lets a bundler
drop the rest:

```js
import { defineCustomElement as defineButton } from '@pitchfork-ui/elements/components/pf-button.js';

defineButton();
```

The React, Angular and Vue bindings do this for you.

## Theming

The `--pf-*` custom properties, and the semantic tokens they read, are declared
once on `:root` and inherit through the shadow boundary. Override a
`--color-semantic-*` token on `:root` to retheme everything that uses it, or one
`--pf-*` alias to change one thing. Component internals are encapsulated; the
token layer is not.

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

This is the library. It replaces `@pitchfork-ui/react`, which is deprecated and
is removed after **30 April 2027**; the
[migration guide](https://lelandrangel.com/pitchfork-ui/?path=/docs/foundations-migrating--docs)
gives every React component's element and which props change shape.

## Licence

MIT
