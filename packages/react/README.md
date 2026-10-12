# @pitchfork-ui/react

> [!WARNING]
> **This package is deprecated.** Use
> [`@pitchfork-ui/elements`](https://www.npmjs.com/package/@pitchfork-ui/elements)
> instead — the same design system as standard custom elements, with generated
> bindings for React
> ([`@pitchfork-ui/elements-react`](https://www.npmjs.com/package/@pitchfork-ui/elements-react)),
> Angular and Vue.
>
> **[Migration guide →](https://lelandrangel.com/pitchfork-ui/?path=/docs/foundations-migrating--docs)**
> — every component's element answer, which props change shape, and a codemod
> for the mechanical part. 37 of the 91 components are a drop-in rename.
>
> It remains installable and will be patched for security until
> **30 April 2027**, after which it is removed. Nothing about it stops working
> in the meantime; deprecation is a notice, not a removal. Every export also
> carries a `@deprecated` JSDoc tag from 0.16.0, so an editor strikes it
> through at the call site.

Accessible, token-driven React components for [lelandrangel.com](https://lelandrangel.com).

**[Full documentation →](https://lelandrangel.com/pitchfork-ui/)** — note that
the Storybook site documents the **elements**; these components no longer have
reference pages, and their API is in
`@pitchfork-ui/react/metadata` and in `llms-full.txt`.

---

## Installation

```bash
npm install @pitchfork-ui/react
```

> **Required peer dependencies** — install these if not already in your project:
>
> ```bash
> npm install @fortawesome/fontawesome-svg-core @fortawesome/free-regular-svg-icons @fortawesome/react-fontawesome
> ```
>
> **Optional peer dependencies** — only needed if you use specific components:
>
> | Package                | Component     |
> | ---------------------- | ------------- |
> | `prism-react-renderer` | `CodeSnippet` |
>
> ```bash
> npm install prism-react-renderer
> ```

## Setup

No stylesheet import needed. Component CSS and design token variables are injected automatically when components are imported.

```tsx
// CSS loads automatically — nothing else required
import { Button } from '@pitchfork-ui/react';
```

> **CJS / SSR environments** — if your bundler does not support CSS-in-JS injection, import the full stylesheet manually:
>
> ```ts
> import '@pitchfork-ui/react/styles.css';
> ```

## Usage

```tsx
import { Button, Card, Input } from '@pitchfork-ui/react';

export function Example() {
  return (
    <Card>
      <Input label="Email" placeholder="you@example.com" />
      <Button>Subscribe</Button>
    </Card>
  );
}
```

## Dark mode

Apply `data-theme="dark"` to any ancestor element (typically `<html>`) to switch to the dark theme:

```html
<html data-theme="dark"></html>
```

## Requirements

- React 18.2+ or 19+

## License

MIT
