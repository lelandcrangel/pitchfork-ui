# @pitchfork-ui/core

Framework-free behaviour for [Pitchfork UI](https://lelandrangel.com/pitchfork-ui/).

This package holds the parts of the design system that are about the DOM and
about arithmetic rather than about any particular UI framework: anchored
positioning, focus trapping, outside-interaction dismissal, list navigation and
a handful of accessibility helpers. It imports nothing.

`@pitchfork-ui/react` is built on top of it — its hooks are thin adapters that
wire these functions into React's lifecycle. Anything else that renders DOM can
use them the same way.

## Install

```bash
npm install @pitchfork-ui/core
```

## What belongs here

The dividing line is deliberate:

- **Core owns the DOM and the maths.** Geometry, focus order, event wiring,
  index arithmetic — the parts that are hard to get right and identical
  everywhere.
- **The rendering layer owns its own reactivity.** React keeps its `useState`,
  a custom element keeps its reactive properties. Core never tries to be a
  state container, which is why it needs no adapter of its own.

## API

Every `observe*`/`trap*`/`on*` function attaches listeners and returns a cleanup
function. Calling the cleanup is always safe, including in environments with no
`window` or `document`, where these are no-ops.

### Positioning

```ts
import { computeAnchoredPosition, observeAnchoredPosition } from '@pitchfork-ui/core';

const release = observeAnchoredPosition({
  getAnchor: () => triggerElement,
  getFloating: () => menuElement,
  flip: true,
  onChange: ({ left, top, width }) => {
    Object.assign(menuElement.style, { left: `${left}px`, top: `${top}px`, width: `${width}px` });
  },
});
```

`computeAnchoredPosition(anchorRect, floatingRect, viewport, options)` is the
pure function underneath — no DOM, fully testable, useful if you already have
the rects.

### Focus

```ts
import { getFocusableElements, trapFocus } from '@pitchfork-ui/core';

const release = trapFocus({ getContainer: () => dialog, onEscape: close });
```

`getContainer` is read fresh on every keypress, so a container that mounts or
swaps after the trap is installed still works. `release()` removes the listener
and restores focus to whatever held it before, unless `restoreFocus: false`.

### Dismissal

```ts
import { onOutsideInteraction } from '@pitchfork-ui/core';

const release = onOutsideInteraction({
  getContainers: () => [popover, trigger],
  onInteractOutside: close,
});
```

Containment is tested with `contains`, which does not see through a shadow
boundary. That is correct for light-DOM components; a component living in a
shadow root wants `composedPath()` instead.

### List navigation

```ts
import { getEnabledIndexes, resolveListMove } from '@pitchfork-ui/core';

const enabled = getEnabledIndexes(items, (item) => item.disabled);
const next = resolveListMove('next', enabled, activeIndex); // -1 if nothing is selectable
```

Wraps at both ends. Entering from `-1` lands on the first item going forward and
the last going backward.

### Accessibility helpers

```ts
import { composeDescribedBy, isActivationKey, Keys } from '@pitchfork-ui/core';
```

`Keys` is the keyboard-event name constant used across the system.
`composeDescribedBy(...ids)` merges `aria-describedby` values, dropping falsy
ones and returning `undefined` rather than an empty string.

### Motion

`prefersReducedMotion()` reports the user's preference, and answers "no
preference" rather than throwing where `matchMedia` is unavailable.

## Licence

MIT
