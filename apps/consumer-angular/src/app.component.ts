import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PfAvatar,
  PfBadge,
  PfBadgeGroup,
  PfButton,
  PfCard,
  PfCardContent,
  PfCardFooter,
  PfCardHeader,
  PfCheckbox,
  PfContentDivider,
  PfCreditCard,
  PfIcon,
  PfInput,
  PfKbd,
  PfLoadingDots,
  PfLoadingSkeleton,
  PfLoadingSpinner,
  PfPagination,
  PfProgressBar,
  PfProgressCircle,
  PfScrollArea,
  PfSlider,
  PfSwitch,
  PfTag,
  PfTextarea,
  PfToolbar,
  PfToolbarSeparator,
  PfUtilityButton,
  PfVisuallyHidden,
  TextValueAccessor,
  BooleanValueAccessor,
  NumericValueAccessor,
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
    PfBadgeGroup,
    PfButton,
    PfCard,
    PfCardContent,
    PfCardFooter,
    PfCardHeader,
    PfCheckbox,
    PfContentDivider,
    PfCreditCard,
    PfIcon,
    PfInput,
    PfKbd,
    PfLoadingDots,
    PfLoadingSkeleton,
    PfLoadingSpinner,
    PfPagination,
    PfProgressBar,
    PfProgressCircle,
    PfScrollArea,
    PfSlider,
    PfSwitch,
    PfTag,
    PfTextarea,
    PfToolbar,
    PfToolbarSeparator,
    PfUtilityButton,
    PfVisuallyHidden,
    TextValueAccessor,
    BooleanValueAccessor,
    NumericValueAccessor,
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

      <div class="row">
        <pf-badge-group label="2 new" message="See what changed" color="brand"></pf-badge-group>
        <pf-badge-group
          label="Beta"
          message="Try it out"
          color="success"
          appearance="modern"
          badge-position="trailing"
        ></pf-badge-group>
      </div>

      <div class="row">
        <!-- 30 of 60 is half drawn but must announce 30, not 50. -->
        <pf-progress-bar [value]="30" [max]="60" label="Upload"></pf-progress-bar>
        <pf-progress-circle [value]="75" label="Sync"></pf-progress-circle>
        <pf-progress-circle
          [value]="40"
          [size]="96"
          [strokeWidth]="10"
          [showValue]="false"
        ></pf-progress-circle>
      </div>

      <pf-credit-card
        brand="visa"
        card-number="4111111111111111"
        cardholder-name="Ada Lovelace"
        expiry="01/30"
        cvc="123"
      ></pf-credit-card>

      <!--
        One tab stop, then the arrows move within it. pf-button is not a native
        control, so it opts into the keyboard order with data-toolbar-item.
      -->
      <pf-toolbar>
        <pf-utility-button label="Search" data-toolbar-item>
          <pf-icon slot="icon" name="magnifying-glass"></pf-icon>
        </pf-utility-button>
        <pf-utility-button label="Download" data-toolbar-item>
          <pf-icon slot="icon" name="file-arrow-down"></pf-icon>
        </pf-utility-button>
        <pf-toolbar-separator></pf-toolbar-separator>
        <pf-button variant="ghost" data-toolbar-item>Share</pf-button>
      </pf-toolbar>

      <!-- Driven from Angular state: the element emits, the component decides. -->
      <pf-pagination
        [totalPages]="10"
        [page]="page()"
        (pfPageChange)="page.set($event.detail.page)"
      ></pf-pagination>
      <p data-testid="page-echo">page {{ page() }}</p>

      <!--
        The wave Stencil was chosen for: both bind with formControlName through
        a generated BooleanValueAccessor, and requiredTrue drives validation.
      -->
      <form [formGroup]="prefs" data-testid="prefs">
        <!--
          name and required alongside formControlName on purpose: Angular drives
          the value, and the native attributes keep the control in the browser's
          own submission and constraint validation. Both have to work.
        -->
        <pf-checkbox
          label="Accept terms"
          name="terms"
          required
          formControlName="terms"
        ></pf-checkbox>
        <pf-switch label="Email notifications" name="notify" formControlName="notify"></pf-switch>
        <pf-textarea label="Notes" name="notes" [rows]="3" formControlName="notes"></pf-textarea>
        <pf-slider
          label="Volume"
          name="volume"
          [min]="0"
          [max]="10"
          formControlName="volume"
        ></pf-slider>
      </form>
      <p data-testid="prefs-state">
        terms {{ prefs.controls.terms.value }} / notify {{ prefs.controls.notify.value }} / valid
        {{ prefs.valid }}
      </p>

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
  page = signal(3);
  prefs = new FormGroup({
    terms: new FormControl(false, Validators.requiredTrue),
    notify: new FormControl(true),
    notes: new FormControl('first draft'),
    volume: new FormControl(7),
  });

  removeTag(tag: string) {
    this.tags.update((current) => current.filter((t) => t !== tag));
  }
}
