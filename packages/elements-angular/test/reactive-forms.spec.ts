/**
 * The claim the engine choice rests on: a Pitchfork form control binds with
 * Angular reactive forms, through a ControlValueAccessor nobody hand-wrote.
 *
 * This runs a real Angular application in Chromium rather than type-checking
 * one. "No value accessor for form control" is a runtime error, so a
 * compile-time check would not catch its absence.
 */
// @angular/compiler must load before anything Angular: some framework
// packages ship partial-Ivy and are JIT-compiled in this setup.
import '@angular/compiler';
import 'zone.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { beforeEach, expect, test } from 'vitest';
// The BUILT library, not the source: ng-packagr emits proper Ivy
// definitions, where JIT-compiling the source needs constructor metadata that
// esbuild does not produce. It also means this tests what consumers install.
import { PfInput, TextValueAccessor } from '../dist';

@Component({
  selector: 'test-host',
  standalone: true,
  imports: [ReactiveFormsModule, PfInput, TextValueAccessor],
  template: `<pf-input label="Email" [formControl]="email"></pf-input>`,
})
class HostComponent {
  email = new FormControl('initial');
}

const tick = () => new Promise((resolve) => requestAnimationFrame(resolve));

let host: HostComponent;
let element: HTMLElement & { value: string };

beforeEach(async () => {
  document.body.innerHTML = '<test-host></test-host>';
  const ref = await bootstrapApplication(HostComponent);
  host = ref.components[0].instance as HostComponent;
  await tick();
  await tick();
  element = document.querySelector('pf-input') as HTMLElement & { value: string };
});

test('the custom element is upgraded by the generated Angular component', () => {
  expect(element).not.toBeNull();
  expect(element.shadowRoot?.querySelector('input')).not.toBeNull();
});

test('writes the initial form value into the element', () => {
  expect(element.value).toBe('initial');
});

test('pushes a programmatic setValue down to the element', async () => {
  host.email.setValue('from-angular');
  await tick();

  expect(element.value).toBe('from-angular');
});

test('reads a user edit back into the form control', async () => {
  const native = element.shadowRoot!.querySelector('input')!;
  native.value = 'typed-by-user';
  native.dispatchEvent(new Event('input'));
  native.dispatchEvent(new Event('change'));
  await tick();

  expect(host.email.value).toBe('typed-by-user');
});

test('disables the element when the control is disabled', async () => {
  host.email.disable();
  await tick();

  expect(element.shadowRoot!.querySelector('input')!.disabled).toBe(true);
});
