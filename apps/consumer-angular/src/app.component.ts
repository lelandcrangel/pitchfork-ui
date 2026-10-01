import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  PfAvatar,
  PfBadge,
  PfButton,
  PfCard,
  PfCardContent,
  PfCardFooter,
  PfCardHeader,
  PfContentDivider,
  PfIcon,
  PfInput,
  PfKbd,
  PfLoadingDots,
  PfLoadingSkeleton,
  PfLoadingSpinner,
  PfScrollArea,
  PfTag,
  PfUtilityButton,
  PfVisuallyHidden,
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
    PfCard,
    PfCardContent,
    PfCardFooter,
    PfCardHeader,
    PfContentDivider,
    PfIcon,
    PfInput,
    PfKbd,
    PfLoadingDots,
    PfLoadingSkeleton,
    PfLoadingSpinner,
    PfScrollArea,
    PfTag,
    PfUtilityButton,
    PfVisuallyHidden,
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

      <pf-content-divider></pf-content-divider>

      <pf-card>
        <pf-card-header>
          <strong>Card</strong>
          <pf-visually-hidden> (a grouping surface)</pf-visually-hidden>
        </pf-card-header>
        <pf-card-content>
          Three sections, each its own element. A card using only some of them still renders
          correctly.
        </pf-card-content>
        <pf-card-footer>
          <pf-button variant="secondary">Dismiss</pf-button>
          <pf-button variant="primary">Confirm</pf-button>
        </pf-card-footer>
      </pf-card>

      <pf-content-divider>or</pf-content-divider>

      <pf-card>
        <pf-card-content>A card with content alone — no header, no footer.</pf-card-content>
      </pf-card>

      <div class="row">
        <pf-loading-spinner></pf-loading-spinner>
        <pf-loading-spinner [size]="40" label="Fetching"></pf-loading-spinner>
        <pf-loading-dots size="sm"></pf-loading-dots>
        <pf-loading-dots></pf-loading-dots>
        <pf-loading-dots size="lg"></pf-loading-dots>
      </div>

      <div class="row">
        <pf-loading-skeleton [width]="160" [height]="12"></pf-loading-skeleton>
        <pf-loading-skeleton width="40%" [rounded]="true"></pf-loading-skeleton>
      </div>

      <div class="row">
        <!-- Icon-only, label-only and both: the three slot combinations. -->
        <pf-utility-button label="Search">
          <pf-icon slot="icon" name="magnifying-glass"></pf-icon>
        </pf-utility-button>
        <pf-utility-button variant="brand">Archive</pf-utility-button>
        <pf-utility-button variant="destructive" size="sm">
          <pf-icon slot="icon" name="circle-xmark"></pf-icon>
          Delete
        </pf-utility-button>
      </div>

      <pf-scroll-area style="height: 80px; max-width: 280px">
        <p>
          A scroll area is focusable by default, so it can be scrolled with the arrow keys even when
          it holds no focusable child.
        </p>
        <p>Its scrollbar reserves a gutter rather than overlaying this text.</p>
        <p>Third paragraph, to make sure there is something to scroll to.</p>
      </pf-scroll-area>
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
