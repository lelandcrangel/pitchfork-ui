# @pitchfork-ui/elements-react

React bindings for [`@pitchfork-ui/elements`](https://www.npmjs.com/package/@pitchfork-ui/elements) —
typed React components generated from the Pitchfork UI custom elements.

> **This is not `@pitchfork-ui/react`.** That package is the hand-written React
> component library and remains fully supported. This one wraps the custom
> elements so the same components can be shared with Angular and Vue
> applications. If you only build React apps, `@pitchfork-ui/react` is still the
> right choice.

## Install

```bash
npm install @pitchfork-ui/elements-react @pitchfork-ui/tokens
```

## Use

```tsx
import { PfButton } from '@pitchfork-ui/elements-react';

export const Save = () => (
  <PfButton variant="primary" size="md">
    Save
  </PfButton>
);
```

Load the token stylesheet once, at the root of your application:

```ts
import '@pitchfork-ui/tokens/css';
```

Props are fully typed, and custom events are exposed as `on*` props. The
components register their own custom elements on import, so there is no loader
to call.

## Generated, not hand-written

Every file under `src/components/` is produced by the Stencil React output
target when `@pitchfork-ui/elements` builds. Fix anything wrong with a wrapper
in the element it comes from, not here.

## Licence

MIT
