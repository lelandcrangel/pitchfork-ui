# @pitchfork-ui/elements-react

React bindings for [`@pitchfork-ui/elements`](https://www.npmjs.com/package/@pitchfork-ui/elements) —
typed React components generated from the Pitchfork UI custom elements.

> **This is not `@pitchfork-ui/react`.** That package is the hand-written React
> component library, and it is deprecated. This one wraps the custom elements,
> and it is the React package to use for anything new.

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

## Upgrading from 0.2

Seven components no longer take `onPfChange`, which is now reserved for form
controls. Each has an event of its own, with the same detail:

| Component       | 0.2          | 0.3                   |
| --------------- | ------------ | --------------------- |
| `PfTabs`        | `onPfChange` | `onPfTabChange`       |
| `PfAccordion`   | `onPfChange` | `onPfExpandedChange`  |
| `PfTreeView`    | `onPfChange` | `onPfSelectionChange` |
| `PfButtonGroup` | `onPfChange` | `onPfSelectionChange` |
| `PfCalendar`    | `onPfChange` | `onPfSelectionChange` |
| `PfCarousel`    | `onPfChange` | `onPfSlideChange`     |
| `PfResizable`   | `onPfChange` | `onPfResize`          |

The old prop is no longer in the component's type, so TypeScript names every
place that needs changing. A handler on one of these components used to hear
the `pfChange` of every form control inside it as well; it now hears only the
component's own change.

Overlay events (`onPfOpenChange`) and the other non-form events no longer
bubble. A handler passed as a prop listens on the element itself, so it is
unaffected; only a listener added by hand to an ancestor has to move.

## Generated, not hand-written

Every file under `src/components/` is produced by the Stencil React output
target when `@pitchfork-ui/elements` builds. Fix anything wrong with a wrapper
in the element it comes from, not here.

## Licence

MIT
