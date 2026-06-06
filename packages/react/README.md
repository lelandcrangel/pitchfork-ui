# @pitchfork-ui/react

Accessible, token-driven React components for [lelandrangel.com](https://lelandrangel.com).

**[Full documentation →](https://lelandrangel.com/pitchfork-ui/)**

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

Import the stylesheet once at your app's entry point:

```ts
import '@pitchfork-ui/react/styles.css';
```

This single file includes all component styles and design token variables. No separate token package required.

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
