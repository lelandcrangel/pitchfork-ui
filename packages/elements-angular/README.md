# @pitchfork-ui/elements-angular

Angular bindings for [`@pitchfork-ui/elements`](https://www.npmjs.com/package/@pitchfork-ui/elements) —
standalone components and `ControlValueAccessor` directives generated from the
Pitchfork UI custom elements.

## Install

```bash
npm install @pitchfork-ui/elements-angular @pitchfork-ui/tokens
```

## Use

The components are standalone, so import them where you need them:

```ts
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { PfButton, PfInput, TextValueAccessor } from '@pitchfork-ui/elements-angular';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, PfInput, TextValueAccessor, PfButton],
  template: `
    <pf-input label="Email" [formControl]="email"></pf-input>
    <pf-button variant="primary">Save</pf-button>
  `,
})
export class SignUpComponent {
  email = new FormControl('');
}
```

Load the token stylesheet once, at the root of your application:

```css
@import '@pitchfork-ui/tokens/css';
```

## Forms

Form controls ship a `ControlValueAccessor`, so `formControlName`, `[formControl]`
and `[(ngModel)]` all work. Import the accessor directive alongside the
component — `TextValueAccessor` for text-like controls.

The elements are form-associated at the platform level too, so they take part
in native `FormData`, constraint validation and form reset whether or not
Angular is involved.

## Generated, not hand-written

Everything under `src/lib/` is produced by the Stencil Angular output target
when `@pitchfork-ui/elements` builds. Fix anything wrong with a wrapper in the
element it comes from, not here.

## Licence

MIT
