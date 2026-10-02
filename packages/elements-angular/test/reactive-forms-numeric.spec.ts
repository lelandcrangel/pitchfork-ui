/**
 * The remaining two accessor shapes: the text one extended to `pf-textarea`,
 * and the numeric one for `pf-slider`.
 *
 * The numeric accessor is its own code path — it overrides `registerOnChange`
 * to `parseFloat` what the DOM hands back. Without it Angular would store the
 * string "7", and a `Validators.min(5)` comparing that to a number would be
 * comparing a string. That is the kind of bug a type-check cannot see, so this
 * drives a real Angular form in Chromium.
 */
import '@angular/compiler';
import 'zone.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { beforeEach, expect, test } from 'vitest';
import {
  NumericValueAccessor,
  PfRadioButton,
  PfRadioGroup,
  PfSlider,
  PfTextarea,
  TextValueAccessor,
} from '../dist';

@Component({
  selector: 'test-host',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PfSlider,
    PfTextarea,
    PfRadioGroup,
    PfRadioButton,
    TextValueAccessor,
    NumericValueAccessor,
  ],
  template: `
    <form [formGroup]="form">
      <pf-textarea label="Notes" formControlName="notes"></pf-textarea>
      <pf-slider label="Volume" [min]="0" [max]="10" formControlName="volume"></pf-slider>
      <pf-radio-group legend="Plan" formControlName="plan">
        @for (option of plans; track option.value) {
          <pf-radio-button [value]="option.value">{{ option.label }}</pf-radio-button>
        }
      </pf-radio-group>
    </form>
  `,
})
class HostComponent {
  form = new FormGroup({
    notes: new FormControl('first draft'),
    volume: new FormControl(3, [Validators.min(5)]),
    plan: new FormControl('', Validators.required),
  });

  /*
   * Rendered with @for rather than passed as an options array — the decision
   * for every data-driven element in this layer. This is what that costs and
   * what it buys: a loop in the template, and a child element whose content
   * is a slot rather than a string.
   */
  plans = [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
  ];
}

const tick = () => new Promise((resolve) => requestAnimationFrame(resolve));

let host: HostComponent;
let notes: HTMLElement & { value: string };
let volume: HTMLElement & { value: number };
let plan: HTMLElement & { value: string };

/** What a real edit does: set the native control, then fire input + change. */
const userEdits = async (host_: HTMLElement, next: string) => {
  const native = host_.shadowRoot!.querySelector('input, textarea') as
    HTMLInputElement | HTMLTextAreaElement;
  native.value = next;
  native.dispatchEvent(new Event('input'));
  native.dispatchEvent(new Event('change'));
  await tick();
  await tick();
};

beforeEach(async () => {
  document.body.innerHTML = '<test-host></test-host>';
  const ref = await bootstrapApplication(HostComponent);
  host = ref.components[0].instance as HostComponent;
  await tick();
  await tick();
  notes = document.querySelector('pf-textarea') as HTMLElement & { value: string };
  volume = document.querySelector('pf-slider') as HTMLElement & { value: number };
  plan = document.querySelector('pf-radio-group') as HTMLElement & { value: string };
});

test('both elements are upgraded by the generated Angular components', () => {
  expect(notes.shadowRoot?.querySelector('textarea')).not.toBeNull();
  expect(volume.shadowRoot?.querySelector('input')?.type).toBe('range');
});

test('writes the initial form values into both elements', () => {
  expect(notes.value).toBe('first draft');
  expect(volume.value).toBe(3);
});

test('pushes a programmatic setValue down to the textarea', async () => {
  host.form.controls.notes.setValue('from angular');
  await tick();

  expect(notes.shadowRoot!.querySelector('textarea')!.value).toBe('from angular');
});

test('reads a textarea edit back into the form control', async () => {
  await userEdits(notes, 'typed by user');

  expect(host.form.controls.notes.value).toBe('typed by user');
});

test('pushes a programmatic setValue down to the slider', async () => {
  host.form.controls.volume.setValue(8);
  await tick();

  expect(volume.shadowRoot!.querySelector('input')!.value).toBe('8');
});

/*
 * The whole point of the numeric accessor: a number, not the string the DOM
 * gave back. `typeof` is the assertion that matters — `'7' == 7` would hide it.
 */
test('reads a slider move back as a number, not a string', async () => {
  await userEdits(volume, '7');

  expect(host.form.controls.volume.value).toBe(7);
  expect(typeof host.form.controls.volume.value).toBe('number');
});

test('drives a numeric validator, which a string value would break', async () => {
  expect(host.form.controls.volume.valid).toBe(false);

  await userEdits(volume, '7');

  expect(host.form.controls.volume.valid).toBe(true);
});

test('disables both elements when their controls are disabled', async () => {
  host.form.controls.notes.disable();
  host.form.controls.volume.disable();
  await tick();

  expect(notes.shadowRoot!.querySelector('textarea')!.disabled).toBe(true);
  expect(volume.shadowRoot!.querySelector('input')!.disabled).toBe(true);
});

/*
 * The group binds as one control through the text accessor: the radios inside
 * it are children rendered by @for, and Angular never sees them.
 */
test('the radio group binds as a single control', async () => {
  expect(plan.getAttribute('role')).toBe('radiogroup');
  expect(plan.querySelectorAll('pf-radio-button')).toHaveLength(2);
  expect(host.form.controls.plan.value).toBe('');
  expect(host.form.controls.plan.valid).toBe(false);
});

test('pushes a programmatic setValue down to the chosen radio', async () => {
  host.form.controls.plan.setValue('pro');
  await tick();
  await tick();

  const chosen = [...plan.querySelectorAll('pf-radio-button')].filter(
    (r) => (r as HTMLElement & { checked: boolean }).checked,
  );
  expect(chosen).toHaveLength(1);
  expect((chosen[0] as HTMLElement & { value: string }).value).toBe('pro');
});

test('reads a user choice back into the form control', async () => {
  const second = plan.querySelectorAll('pf-radio-button')[1];
  (second.shadowRoot!.querySelector('input') as HTMLInputElement).click();
  await tick();
  await tick();

  expect(host.form.controls.plan.value).toBe('pro');
  expect(host.form.controls.plan.valid).toBe(true);
});
