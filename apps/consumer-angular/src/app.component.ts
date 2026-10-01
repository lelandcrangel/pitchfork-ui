import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  PfAvatar,
  PfBadge,
  PfButton,
  PfIcon,
  PfInput,
  PfKbd,
  PfTag,
  TextValueAccessor,
} from '@pitchfork-ui/elements-angular';

/**
 * Every element the library ships, used the way an Angular application would —
 * including a reactive form bound through the generated ControlValueAccessor,
 * which is the capability Stencil was chosen for.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PfAvatar,
    PfBadge,
    PfButton,
    PfIcon,
    PfInput,
    PfKbd,
    PfTag,
    TextValueAccessor,
  ],
  template: `
    <main data-testid="app">
      <h1><pf-icon name="circle-check" label="Working"></pf-icon> Angular consumer</h1>

      <div class="row">
        <pf-button variant="primary">Save</pf-button>
        <pf-button variant="secondary">Cancel</pf-button>
        <pf-button variant="ghost">Skip</pf-button>
        <pf-button variant="destructive">Delete</pf-button>
        <pf-button variant="primary" [loading]="true">Saving</pf-button>
      </div>

      <div class="row">
        <pf-badge>neutral</pf-badge>
        <pf-badge variant="brand">brand</pf-badge>
        <pf-badge variant="success">success</pf-badge>
        <pf-badge variant="warning">warning</pf-badge>
        <pf-badge variant="danger">danger</pf-badge>
      </div>

      <div class="row">
        @for (tag of tags(); track tag) {
          <pf-tag variant="brand" [dismissible]="true" (pfDismiss)="removeTag(tag)">
            {{ tag }}
          </pf-tag>
        }
      </div>

      <div class="row">
        <pf-avatar name="Ada Lovelace"></pf-avatar>
        <pf-avatar name="Ada Lovelace" size="lg" status="online"></pf-avatar>
        <pf-avatar size="xl"></pf-avatar>
      </div>

      <div class="row">
        <pf-kbd>Esc</pf-kbd>
        <pf-kbd size="sm" [keys]="['⌘', 'K']"></pf-kbd>
      </div>

      <div class="row">
        <pf-input
          label="Email"
          description="Bound with formControl, through the generated value accessor."
          [formControl]="email"
        ></pf-input>
        <p data-testid="echo">{{ email.value }}</p>
      </div>
    </main>
  `,
})
export class AppComponent {
  email = new FormControl('ada@example.com');
  tags = signal(['design', 'systems']);

  removeTag(tag: string) {
    this.tags.update((current) => current.filter((t) => t !== tag));
  }
}
