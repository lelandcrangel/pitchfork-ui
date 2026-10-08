# @pitchfork-ui/elements-vue

Vue bindings for [`@pitchfork-ui/elements`](https://www.npmjs.com/package/@pitchfork-ui/elements) —
typed Vue components generated from the Pitchfork UI custom elements.

Vue can render custom elements directly, so these bindings are a convenience
rather than a necessity. What they add is worth having: typed props, events
exposed as `@pf-*` listeners rather than `addEventListener`, and `v-model`
support on the form controls.

## Install

```bash
npm install @pitchfork-ui/elements-vue @pitchfork-ui/tokens
```

## Use

```vue
<script setup lang="ts">
import { PfButton, PfInput } from '@pitchfork-ui/elements-vue';
import { ref } from 'vue';

const email = ref('');
</script>

<template>
  <PfInput v-model="email" label="Email" name="email" />
  <PfButton variant="primary">Save</PfButton>
</template>
```

Load the token stylesheet once, at the root of your application:

```ts
import '@pitchfork-ui/tokens/css';
```

`v-model` works on `pf-input`, `pf-textarea`, `pf-radio-group`, `pf-slider`,
`pf-checkbox` and `pf-switch` — the same six controls that have an Angular
`ControlValueAccessor`, bound the same way. A checkbox and a switch model
their `checked`; the others model their `value`.

## Generated, not hand-written

Every file under `src/components/` is produced by the Stencil Vue output
target when `@pitchfork-ui/elements` builds. Fix anything wrong with a wrapper
in the element it comes from, not here.

## Licence

MIT
