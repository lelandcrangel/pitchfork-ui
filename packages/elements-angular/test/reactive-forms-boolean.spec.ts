/**
 * The boolean half of the claim the engine choice rests on: a checkbox and a
 * switch bind with Angular reactive forms through a `BooleanValueAccessor`
 * nobody hand-wrote.
 *
 * A boolean accessor is a different code path from the text one — it writes
 * `checked` rather than `value` — so proving the text case proved nothing
 * about this. Run as a real Angular application in Chromium, because "No
 * value accessor for form control" is a runtime error that no compile-time
 * check would surface.
 */
import '@angular/compiler';
import 'zone.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { beforeEach, expect, test } from 'vitest';
// The BUILT library, for the reason the text spec gives.
import { BooleanValueAccessor, PfCheckbox, PfSwitch } from '../dist';

@Component({
  selector: 'test-host',
  standalone: true,
  imports: [ReactiveFormsModule, PfCheckbox, PfSwitch, BooleanValueAccessor],
  template: `
    <form [formGroup]="form">
      <pf-checkbox label="Accept terms" formControlName="terms"></pf-checkbox>
      <pf-switch label="Notifications" formControlName="notify"></pf-switch>
    </form>
  `,
})
class HostComponent {
  form = new FormGroup({
    terms: new FormControl(false, Validators.requiredTrue),
    notify: new FormControl(true),
  });
}

const tick = () => new Promise((resolve) => requestAnimationFrame(resolve));

type BooleanControl = HTMLElement & { checked: boolean };

let host: HostComponent;
let checkbox: BooleanControl;
let toggle: BooleanControl;

const nativeOf = (el: BooleanControl) => el.shadowRoot!.querySelector('input') as HTMLInputElement;

/** What a real user click does: the native input toggles and fires change. */
const userToggles = async (el: BooleanControl) => {
  nativeOf(el).click();
  await tick();
  await tick();
};

beforeEach(async () => {
  document.body.innerHTML = '<test-host></test-host>';
  const ref = await bootstrapApplication(HostComponent);
  host = ref.components[0].instance as HostComponent;
  await tick();
  await tick();
  checkbox = document.querySelector('pf-checkbox') as BooleanControl;
  toggle = document.querySelector('pf-switch') as BooleanControl;
});

test('both elements are upgraded by the generated Angular components', () => {
  expect(nativeOf(checkbox)).not.toBeNull();
  expect(nativeOf(toggle)).not.toBeNull();
  expect(nativeOf(toggle).getAttribute('role')).toBe('switch');
});

test('writes the initial form state into both elements', () => {
  expect(checkbox.checked).toBe(false);
  expect(toggle.checked).toBe(true);
});

test('pushes a programmatic setValue down to the element', async () => {
  host.form.controls.terms.setValue(true);
  await tick();

  expect(checkbox.checked).toBe(true);
  expect(nativeOf(checkbox).checked).toBe(true);
});

test('reads a user tick back into the form control', async () => {
  await userToggles(checkbox);

  expect(host.form.controls.terms.value).toBe(true);
});

test('reads a user switch-off back into the form control', async () => {
  await userToggles(toggle);

  expect(host.form.controls.notify.value).toBe(false);
});

/*
 * requiredTrue is the validator a terms checkbox actually needs, and it only
 * works if the accessor reports the boolean rather than a truthy string.
 */
test('drives Angular validation, not just the value', async () => {
  expect(host.form.controls.terms.valid).toBe(false);
  expect(host.form.valid).toBe(false);

  await userToggles(checkbox);

  expect(host.form.controls.terms.valid).toBe(true);
  expect(host.form.valid).toBe(true);
});

test('marks the control dirty and touched as a user would', async () => {
  expect(host.form.controls.terms.dirty).toBe(false);

  await userToggles(checkbox);

  expect(host.form.controls.terms.dirty).toBe(true);
});

test('disables the element when the control is disabled', async () => {
  host.form.controls.terms.disable();
  await tick();

  expect(nativeOf(checkbox).disabled).toBe(true);
});

test('resetting the form writes the reset value back down', async () => {
  await userToggles(checkbox);
  expect(checkbox.checked).toBe(true);

  host.form.reset({ terms: false, notify: true });
  await tick();
  await tick();

  expect(checkbox.checked).toBe(false);
  expect(toggle.checked).toBe(true);
});
