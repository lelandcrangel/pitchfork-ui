<script setup lang="ts">
/*
 * A deliberately small application. The React and Angular consumers render
 * every element, because they are what proves the whole library styles and
 * behaves in a real build. This one proves the three things only the Vue
 * bindings can get wrong:
 *
 *   1. that `@pitchfork-ui/elements-vue` resolves through its exports map and
 *      registers the elements it imports,
 *   2. that `v-model` round-trips in both directions on the six controls the
 *      output target models, and
 *   3. that the token stylesheet reaches a Vue-rendered shadow root the same
 *      way it reaches a React-rendered one.
 */
import {
  PfAlert,
  PfBadge,
  PfButton,
  PfCheckbox,
  PfInput,
  PfRadioButton,
  PfRadioGroup,
  PfSlider,
  PfSwitch,
  PfTextarea,
} from '@pitchfork-ui/elements-vue';
import { ref } from 'vue';

const email = ref('ada@example.com');
const notes = ref('A first note.');
const plan = ref('pro');
const volume = ref(4);
const notify = ref(true);
const dark = ref(false);

/*
 * Writing to the refs from outside proves the other direction: a `v-model`
 * that only ever reads the element's events would leave these unchanged in
 * the control.
 */
const reset = () => {
  email.value = 'reset@example.com';
  notes.value = 'Reset.';
  plan.value = 'free';
  volume.value = 9;
  notify.value = false;
  dark.value = true;
};
</script>

<template>
  <h1>Pitchfork UI — Vue consumer</h1>

  <PfAlert variant="info" heading="Vue bindings" data-testid="alert">
    These components come from <code>@pitchfork-ui/elements-vue</code>, generated from the same
    custom elements.
  </PfAlert>

  <div class="row">
    <PfBadge variant="brand" data-testid="badge">Generated</PfBadge>
    <PfButton variant="primary" data-testid="reset" @click="reset">Set every value</PfButton>
  </div>

  <div class="row">
    <PfInput v-model="email" label="Email" name="email" data-testid="input" />
    <output data-testid="email-echo">{{ email }}</output>
  </div>

  <div class="row">
    <PfTextarea v-model="notes" label="Notes" name="notes" data-testid="textarea" />
    <output data-testid="notes-echo">{{ notes }}</output>
  </div>

  <div class="row">
    <PfRadioGroup v-model="plan" name="plan" label="Plan" data-testid="radio-group">
      <PfRadioButton value="free">Free</PfRadioButton>
      <PfRadioButton value="pro">Pro</PfRadioButton>
    </PfRadioGroup>
    <output data-testid="plan-echo">{{ plan }}</output>
  </div>

  <div class="row">
    <PfSlider
      v-model="volume"
      :min="0"
      :max="10"
      label="Volume"
      name="volume"
      data-testid="slider"
    />
    <output data-testid="volume-echo">{{ volume }}</output>
  </div>

  <div class="row">
    <PfCheckbox v-model="notify" label="Email notifications" name="notify" data-testid="checkbox" />
    <output data-testid="notify-echo">{{ notify }}</output>
  </div>

  <div class="row">
    <PfSwitch v-model="dark" label="Dark mode" name="dark" data-testid="switch" />
    <output data-testid="dark-echo">{{ dark }}</output>
  </div>
</template>
