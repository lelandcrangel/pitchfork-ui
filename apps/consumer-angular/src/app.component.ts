import { Component, computed, ElementRef, signal, viewChild } from '@angular/core';
import { sortRowsBy, type SortState } from '@pitchfork-ui/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PfAccordion,
  PfAccordionItem,
  PfAvatar,
  PfAvatarGroup,
  PfBarChart,
  PfBadge,
  PfBadgeGroup,
  PfBreadcrumb,
  PfBreadcrumbs,
  PfButton,
  PfButtonGroup,
  PfButtonGroupItem,
  PfCalendar,
  PfCarousel,
  PfCarouselSlide,
  PfCard,
  PfCardContent,
  PfCardFooter,
  PfCardHeader,
  PfChartSeries,
  PfCheckbox,
  PfCommandGroup,
  PfCommandItem,
  PfCodeSnippet,
  PfCollapsible,
  PfCommandPalette,
  PfCombobox,
  PfContentDivider,
  PfDatePicker,
  PfDateRangePicker,
  PfContextMenu,
  PfCreditCard,
  PfDropdown,
  PfEmptyState,
  PfHeaderNavigation,
  PfFileUploader,
  PfGaugeChart,
  PfHeatmap,
  PfIcon,
  PfInlineCta,
  PfInput,
  PfKbd,
  PfLoadingDots,
  PfLoadingSkeleton,
  PfLoadingSpinner,
  PfMenuItem,
  PfMenuSeparator,
  PfMetricCard,
  PfMetricGrid,
  PfNavItem,
  PfLineChart,
  PfModal,
  PfModalBody,
  PfModalFooter,
  PfModalHeader,
  PfMultiSelect,
  PfNavSection,
  PfNotification,
  PfNumberInput,
  PfPageHeader,
  PfPagination,
  PfPieChart,
  PfPieSlice,
  PfPopover,
  PfProgressBar,
  PfProgressCircle,
  PfProgressStep,
  PfProgressSteps,
  PfRadarAxis,
  PfRadarChart,
  PfRadioButton,
  PfOption,
  PfRadioGroup,
  PfRatingBadge,
  PfRatingStars,
  PfResizable,
  PfRichTextEditor,
  PfScrollArea,
  PfSectionFooter,
  PfSectionHeader,
  PfSelect,
  PfSlideoutMenu,
  PfSlider,
  PfSidebarNavigation,
  PfSparkline,
  PfSwitch,
  PfTab,
  PfTable,
  PfTableCell,
  PfTableRow,
  PfTabPanel,
  PfTabs,
  PfTag,
  PfTagInput,
  PfTextarea,
  PfTimeline,
  PfTimelineItem,
  PfTimePicker,
  PfToaster,
  PfToolbar,
  PfTooltip,
  PfTreeItem,
  PfTreeView,
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
    PfAccordion,
    PfAccordionItem,
    PfAvatar,
    PfAvatarGroup,
    PfBarChart,
    PfBadge,
    PfBadgeGroup,
    PfBreadcrumb,
    PfBreadcrumbs,
    PfButton,
    PfButtonGroup,
    PfButtonGroupItem,
    PfCalendar,
    PfCarousel,
    PfCarouselSlide,
    PfCard,
    PfCardContent,
    PfCardFooter,
    PfCardHeader,
    PfChartSeries,
    PfCheckbox,
    PfCommandGroup,
    PfCommandItem,
    PfCodeSnippet,
    PfCollapsible,
    PfCommandPalette,
    PfCombobox,
    PfContentDivider,
    PfDatePicker,
    PfDateRangePicker,
    PfContextMenu,
    PfCreditCard,
    PfDropdown,
    PfEmptyState,
    PfHeaderNavigation,
    PfFileUploader,
    PfGaugeChart,
    PfHeatmap,
    PfIcon,
    PfInlineCta,
    PfInput,
    PfKbd,
    PfLoadingDots,
    PfLoadingSkeleton,
    PfLoadingSpinner,
    PfMenuItem,
    PfMenuSeparator,
    PfMetricCard,
    PfMetricGrid,
    PfNavItem,
    PfLineChart,
    PfModal,
    PfModalBody,
    PfModalFooter,
    PfModalHeader,
    PfMultiSelect,
    PfNavSection,
    PfNotification,
    PfNumberInput,
    PfPageHeader,
    PfPagination,
    PfPieChart,
    PfPieSlice,
    PfPopover,
    PfProgressBar,
    PfProgressCircle,
    PfProgressStep,
    PfProgressSteps,
    PfRadarAxis,
    PfRadarChart,
    PfRadioButton,
    PfOption,
    PfRadioGroup,
    PfRatingBadge,
    PfRatingStars,
    PfResizable,
    PfRichTextEditor,
    PfScrollArea,
    PfSectionFooter,
    PfSectionHeader,
    PfSelect,
    PfSlideoutMenu,
    PfSlider,
    PfSidebarNavigation,
    PfSparkline,
    PfSwitch,
    PfTab,
    PfTable,
    PfTableCell,
    PfTableRow,
    PfTabPanel,
    PfTabs,
    PfTag,
    PfTagInput,
    PfTextarea,
    PfTimeline,
    PfTimelineItem,
    PfTimePicker,
    PfToaster,
    PfToolbar,
    PfTooltip,
    PfTreeItem,
    PfTreeView,
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
        <!-- Form-associated, unlike the React DatePicker. -->
        <!-- One control, two submitted entries. -->
        <pf-date-range-picker
          label="Trip dates"
          name="trip"
          [value]="trip()"
          allow-clear
          data-testid="date-range-picker"
          (pfChange)="trip.set($event.detail.value)"
        ></pf-date-range-picker>
        <!-- Free text, with pf-tag chips. -->
        <pf-tag-input
          label="Topics"
          name="topics"
          [value]="topics()"
          [max]="5"
          data-testid="tag-input"
          (pfChange)="topics.set($event.detail.value)"
        ></pf-tag-input>

        <!-- One control, one submitted entry per value. -->
        <pf-multi-select
          label="Colours"
          name="colours"
          [value]="colours()"
          data-testid="multi-select"
          (pfChange)="colours.set($event.detail.value)"
        >
          <pf-option value="red">Red</pf-option>
          <pf-option value="green">Green</pf-option>
          <pf-option value="blue">Blue</pf-option>
          <pf-option value="grey" disabled>Grey</pf-option>
        </pf-multi-select>

        <!-- Shares pf-option with pf-select through the --pf-option-* bridge. -->
        <pf-combobox
          label="City"
          name="city"
          [value]="city()"
          data-testid="combobox"
          (pfChange)="city.set($event.detail.value)"
        >
          <pf-option value="berlin">Berlin</pf-option>
          <pf-option value="bristol">Bristol</pf-option>
          <pf-option value="cardiff">Cardiff</pf-option>
          <pf-option value="coventry" disabled>Coventry</pf-option>
        </pf-combobox>

        <!-- Children, not an options array; and typeahead. -->
        <pf-select
          label="Fruit"
          name="fruit"
          [value]="fruit()"
          data-testid="select"
          (pfChange)="fruit.set($event.detail.value)"
        >
          <pf-option value="apple">Apple</pf-option>
          <pf-option value="apricot">Apricot</pf-option>
          <pf-option value="banana">Banana <small>(in season)</small></pf-option>
          <pf-option value="blackberry" disabled>Blackberry</pf-option>
          <pf-option value="cherry">Cherry</pf-option>
        </pf-select>
        <!-- 12-hour display, 24-hour value. -->
        <!-- Form-associated, and the value is a string; see the React consumer. -->
        <pf-number-input
          label="Quantity"
          name="quantity"
          [value]="quantity()"
          [min]="0"
          [max]="10"
          [step]="0.5"
          data-testid="number-input"
          (pfChange)="quantity.set($event.detail.value)"
        ></pf-number-input>
        <pf-time-picker
          label="Start time"
          name="at"
          [value]="at()"
          [hourCycle]="12"
          [minuteStep]="15"
          data-testid="time-picker"
          (pfChange)="at.set($event.detail.value)"
        ></pf-time-picker>
        <pf-date-picker
          label="Due date"
          name="due"
          [value]="day()"
          min="2024-03-05"
          max="2024-03-26"
          allow-clear
          data-testid="date-picker"
          (pfChange)="day.set($event.detail.value)"
        ></pf-date-picker>
        <!--
          Children rendered with @for, not an options array. The group is the
          one form control; Angular never sees the radios inside it.
        -->
        <pf-radio-group legend="Plan" name="plan" formControlName="plan">
          @for (option of plans; track option.value) {
            <pf-radio-button [value]="option.value">{{ option.label }}</pf-radio-button>
          }
        </pf-radio-group>
      </form>
      <p data-testid="prefs-state">
        terms {{ prefs.controls.terms.value }} / notify {{ prefs.controls.notify.value }} / valid
        {{ prefs.valid }}
      </p>

      <!--
        Deliberately inside a clipping, stacking-context box: the panel is a
        popover, so it escapes both.
      -->
      <div
        data-testid="tooltip-clip"
        style="overflow: hidden; width: 120px; height: 40px; position: relative; z-index: 0"
      >
        <pf-tooltip [open]="true" placement="bottom">
          <button type="button">Anchored</button>
          <span slot="content">Escapes the clip box and the stacking context</span>
        </pf-tooltip>
      </div>
      <div style="position: relative; z-index: 999; height: 4px"></div>

      <div class="row">
        <!-- Light-dismiss and Escape come from the browser, not from us. -->
        <pf-popover label="Quick settings">
          <pf-button variant="secondary">Settings</pf-button>
          <div slot="content"><p style="margin: 0">Anchored, and dismissed by the browser.</p></div>
        </pf-popover>

        <pf-button variant="primary" (click)="modalOpen.set(true)">Open modal</pf-button>
      </div>

      <pf-modal
        [open]="modalOpen()"
        label="Confirm"
        (pfOpenChange)="modalOpen.set($event.detail.open)"
      >
        <pf-modal-header><strong>Confirm</strong></pf-modal-header>
        <pf-modal-body>
          A native dialog: the focus trap, Escape and the backdrop are the browser's. Only the
          page-scroll lock is ours.
        </pf-modal-body>
        <pf-modal-footer>
          <pf-button variant="secondary" (click)="modalOpen.set(false)">Cancel</pf-button>
          <pf-button variant="primary" (click)="modalOpen.set(false)">Confirm</pf-button>
        </pf-modal-footer>
      </pf-modal>

      <!--
        Both menus share pf-menu-item and pf-menu-separator; each container maps
        the generic --pf-menu-* set the item reads to its own alias family, so
        the same element is themed by whichever menu it sits in.
      -->
      <div class="row">
        <pf-dropdown
          label="Document actions"
          data-testid="dropdown"
          (pfSelect)="menuChoice.set($event.detail.value)"
        >
          <pf-button variant="secondary">Actions</pf-button>
          <pf-menu-item slot="menu" value="rename">
            Rename
            <pf-kbd slot="shortcut">F2</pf-kbd>
          </pf-menu-item>
          <pf-menu-item slot="menu" value="duplicate">Duplicate</pf-menu-item>
          <pf-menu-item slot="menu" value="archive" disabled>Archive</pf-menu-item>
          <pf-menu-separator slot="menu"></pf-menu-separator>
          <pf-menu-item slot="menu" value="delete" destructive>Delete</pf-menu-item>
        </pf-dropdown>

        <output data-testid="menu-choice">{{ menuChoice() || 'nothing chosen' }}</output>
      </div>

      <pf-context-menu
        label="Row actions"
        data-testid="context-menu"
        (pfSelect)="menuChoice.set($event.detail.value)"
      >
        <div style="border: 1px dashed var(--pf-surface-border); border-radius: 8px; padding: 16px">
          Right-click anywhere in this box.
        </div>
        <pf-menu-item slot="menu" value="open">Open</pf-menu-item>
        <pf-menu-item slot="menu" value="copy">
          Copy
          <pf-kbd slot="shortcut">Ctrl C</pf-kbd>
        </pf-menu-item>
        <pf-menu-separator slot="menu"></pf-menu-separator>
        <pf-menu-item slot="menu" value="remove" destructive>Remove</pf-menu-item>
      </pf-context-menu>

      <!--
        A slideout is a modal dialog pinned to an edge: showModal() gives the
        focus trap, Escape and the backdrop. Only the page-scroll lock is ours.
      -->
      <div class="row">
        <pf-button variant="secondary" (click)="slideoutOpen.set(true)">Open slideout</pf-button>
        <pf-button variant="primary" (click)="notify('success')">Toast</pf-button>
        <pf-button variant="secondary" (click)="notify('danger')">Toast a failure</pf-button>
      </div>

      <pf-slideout-menu
        [open]="slideoutOpen()"
        heading="Filters"
        description="Narrow the list down"
        (pfOpenChange)="slideoutOpen.set($event.detail.open)"
      >
        <p style="margin-top: 0">
          The heading is a prop rendered into the element's own shadow root, so this dialog names
          itself with aria-labelledby.
        </p>
        <pf-button slot="footer" variant="secondary" (click)="slideoutOpen.set(false)">
          Cancel
        </pf-button>
        <pf-button slot="footer" variant="primary" (click)="slideoutOpen.set(false)">
          Apply
        </pf-button>
      </pf-slideout-menu>

      <pf-notification
        variant="warning"
        heading="Scheduled maintenance"
        description="Saturday, 02:00-04:00 UTC."
        data-testid="page-notification"
      ></pf-notification>

      <pf-toaster #toaster placement="top-right" data-testid="toaster"></pf-toaster>

      <!--
        Options are slotted light DOM while the search input sits in the
        element's shadow root, so the active option is set as an element
        reference; a cross-root aria-activedescendant resolves to nothing.
      -->
      <div class="row">
        <pf-button variant="secondary" (click)="paletteOpen.set(true)">
          Open command palette
        </pf-button>
        <output data-testid="command-choice">{{ menuChoice() || 'nothing chosen' }}</output>
      </div>

      <pf-command-palette
        [open]="paletteOpen()"
        data-testid="command-palette"
        (pfOpenChange)="paletteOpen.set($event.detail.open)"
        (pfSelect)="menuChoice.set($event.detail.value)"
      >
        <pf-command-group label="File">
          <pf-command-item value="new">New file</pf-command-item>
          <pf-command-item value="open" description="Pick from recent">Open file</pf-command-item>
        </pf-command-group>
        <pf-command-group label="App">
          <pf-command-item value="settings">Settings</pf-command-item>
          <pf-command-item value="quit" disabled>Quit</pf-command-item>
        </pf-command-group>
      </pf-command-palette>

      <!-- One tab stop, arrows to move; see the React consumer for why. -->
      <div class="row">
        <pf-calendar
          [value]="day()"
          min="2024-03-05"
          max="2024-03-26"
          [startYear]="2020"
          [endYear]="2030"
          data-testid="calendar"
          (pfChange)="day.set($event.detail.value)"
        ></pf-calendar>
        <output data-testid="calendar-value">{{ day() }}</output>
      </div>

      <!--
        Interleaved children, one pair per item, with no "slot" set anywhere:
        each pf-tab assigns itself to the strip. Angular writes props as
        properties, so "count" arrives as a number and "value" only has an
        attribute because the element reflects it.
      -->
      <pf-tabs
        [value]="tab()"
        variant="underline"
        data-testid="tabs"
        (pfChange)="tab.set($event.detail.value)"
      >
        <pf-tab value="overview" icon="circle-info">Overview</pf-tab>
        <pf-tab-panel value="overview">
          <p>An overview of the thing, with rather a lot of words in it.</p>
        </pf-tab-panel>
        <pf-tab value="issues" [count]="12">Issues</pf-tab>
        <pf-tab-panel value="issues">
          <p>Twelve issues, counted in the badge beside the label.</p>
        </pf-tab-panel>
        <pf-tab value="archive" disabled>Archive</pf-tab>
        <pf-tab-panel value="archive">
          <p>Nothing here; the tab is disabled.</p>
        </pf-tab-panel>
      </pf-tabs>
      <output data-testid="tabs-value">{{ tab() }}</output>

      <!--
        One group, three self-contained sections; see the React consumer for
        the division of labour. The heading level is pushed down from the
        group, which is why no section sets it.
      -->
      <pf-accordion
        type="multiple"
        [value]="sections()"
        [headingLevel]="3"
        data-testid="accordion"
        (pfChange)="sections.set($event.detail.value)"
      >
        <pf-accordion-item value="shipping">
          <span slot="title">Shipping</span>
          <p>
            Ships in two days. <a href="#shipping-detail">Read the detail</a>, which is focusable
            and so has to be inert while this section is closed.
          </p>
        </pf-accordion-item>
        <pf-accordion-item value="returns">
          <span slot="title">Returns</span>
          <p>Thirty days, no questions.</p>
        </pf-accordion-item>
        <pf-accordion-item value="warranty" disabled>
          <span slot="title">Warranty</span>
          <p>Nothing here; the section is disabled.</p>
        </pf-accordion-item>
      </pf-accordion>
      <output data-testid="accordion-value">{{ sections() || 'none' }}</output>

      <!-- One disclosure, no group; see the React consumer. -->
      <pf-collapsible
        [open]="details()"
        data-testid="collapsible"
        (pfOpenChange)="details.set($event.detail.open)"
      >
        <span slot="trigger">Advanced options</span>
        <p>
          <a href="#advanced-detail">A focusable link</a>, which is why the closed panel is inert.
        </p>
      </pf-collapsible>
      <output data-testid="collapsible-value">{{ details() ? 'open' : 'closed' }}</output>

      <!-- A string separator, drawn by each crumb; see the React consumer. -->
      <pf-breadcrumbs label="Site breadcrumb" separator="›" data-testid="breadcrumbs">
        <pf-breadcrumb href="#home">Home</pf-breadcrumb>
        <pf-breadcrumb href="#products">Products</pf-breadcrumb>
        <pf-breadcrumb>Shoes</pf-breadcrumb>
      </pf-breadcrumbs>

      <!-- One step asks, the group infers the rest; see the React consumer. -->
      <pf-progress-steps data-testid="progress-steps">
        <pf-progress-step>
          <span slot="title">Account</span>
        </pf-progress-step>
        <pf-progress-step status="current">
          <span slot="title">Details</span>
          <span slot="description">Fill in your details.</span>
        </pf-progress-step>
        <pf-progress-step>
          <span slot="title">Confirm</span>
        </pf-progress-step>
      </pf-progress-steps>

      <!-- One entry carries an icon, one a timestamp, one neither; see the React consumer. -->
      <pf-timeline label="Release history" data-testid="timeline">
        <pf-timeline-item tone="success">
          <span slot="title">Deployed</span>
          <span slot="timestamp">2 hours ago</span>
          <span slot="description">Version 1.4.0 went out.</span>
          <pf-icon slot="icon" name="circle-check" aria-hidden="true"></pf-icon>
        </pf-timeline-item>
        <pf-timeline-item>
          <span slot="title">Reviewed</span>
          <span slot="timestamp">Yesterday</span>
        </pf-timeline-item>
        <pf-timeline-item tone="danger">
          <span slot="title">Opened</span>
        </pf-timeline-item>
      </pf-timeline>

      <!-- 3.5 of 5, the fourth star clipped to half; see the React consumer. -->
      <div class="row">
        <pf-rating-stars [value]="3.5" showValue data-testid="rating-stars"></pf-rating-stars>
        <pf-rating-badge [value]="4.5" [reviews]="1234" data-testid="rating-badge">
        </pf-rating-badge>
      </div>

      <!-- Hidden boxes rather than absent slots; see the React consumer. -->
      <pf-empty-state icon="folder-open" data-testid="empty-state">
        No results
        <span slot="description">Try a different search, or clear the filters.</span>
        <pf-button slot="action" variant="secondary">Clear filters</pf-button>
      </pf-empty-state>

      <!--
        One arrangement across all four: a box that carries layout is hidden
        when empty rather than left out, and a slot that carries none has no
        box at all. See the React consumer.
      -->
      <pf-page-header data-testid="page-header">
        <pf-breadcrumbs slot="breadcrumbs" label="Page breadcrumb">
          <pf-breadcrumb href="#shop">Shop</pf-breadcrumb>
          <pf-breadcrumb>Orders</pf-breadcrumb>
        </pf-breadcrumbs>
        <span slot="eyebrow">Shop</span>
        Orders
        <span slot="description">Everything bought this month, newest first.</span>
        <span slot="metadata">24 orders · £24,500</span>
        <pf-button slot="actions" variant="secondary">Export</pf-button>
      </pf-page-header>

      <pf-section-header divider data-testid="section-header">
        <span slot="eyebrow">This month</span>
        Recent activity
        <span slot="description">What has changed since the last report.</span>
        <span slot="metadata">Updated today</span>
        <pf-button slot="actions" variant="ghost">Refresh</pf-button>
      </pf-section-header>

      <pf-metric-grid data-testid="metric-grid">
        <pf-metric-card trend="positive" icon="chart-bar" data-testid="metric-card">
          <span slot="heading">Revenue</span>
          £24,500
          <span slot="trend">12% on last month</span>
          <span slot="description">Since April</span>
          <pf-button slot="action" variant="ghost" size="sm">Export</pf-button>
        </pf-metric-card>
        <pf-metric-card trend="negative">
          <span slot="heading">Refunds</span>
          £1,200
          <span slot="trend">3% on last month</span>
        </pf-metric-card>
        <pf-metric-card>
          <span slot="heading">Orders</span>
          1,204
        </pf-metric-card>
      </pf-metric-grid>

      <pf-section-footer data-testid="section-footer">
        Next steps
        <span slot="description">Nothing is blocked.</span>
        <pf-button slot="actions">Save</pf-button>
      </pf-section-footer>

      <!-- Two of forty shown; see the React consumer. -->
      <pf-avatar-group [max]="2" [total]="40" data-testid="avatar-group">
        <pf-avatar name="Ada Lovelace"></pf-avatar>
        <pf-avatar name="Grace Hopper"></pf-avatar>
        <pf-avatar name="Alan Turing"></pf-avatar>
        <pf-avatar name="Katherine Johnson"></pf-avatar>
      </pf-avatar-group>

      <!-- Toggle buttons, one tab stop each; see the React consumer. -->
      <div class="row">
        <pf-button-group
          [value]="range()"
          data-testid="button-group"
          (pfChange)="range.set($event.detail.value)"
        >
          <pf-button-group-item value="day">Day</pf-button-group-item>
          <pf-button-group-item value="week" icon="calendar">Week</pf-button-group-item>
          <pf-button-group-item value="month" dot>Month</pf-button-group-item>
          <pf-button-group-item value="year" disabled>Year</pf-button-group-item>
        </pf-button-group>
        <output data-testid="button-group-value">{{ range() }}</output>
      </div>

      <!-- Dismissal waits on the animation, not a timeout; see the React consumer. -->
      @if (cta()) {
        <pf-inline-cta
          tone="info"
          icon="circle-info"
          dismissible
          data-testid="inline-cta"
          (pfDismiss)="cta.set(false)"
        >
          Finish setting up your account
          <span slot="description">Two steps left, and they are quick ones.</span>
          <pf-button slot="action" variant="secondary">Continue</pf-button>
        </pf-inline-cta>
      } @else {
        <p data-testid="inline-cta-echo">dismissed</p>
      }

      <!--
        The table reports a sort and this app does the sorting, with the same
        comparison core gives the React Table. The layout is CSS tables, so a
        row is a box and can take the stripe and the hover.
      -->
      <pf-table
        striped
        sticky-header
        label="Orders"
        [sortKey]="sort().key"
        [sortDirection]="sort().direction"
        data-testid="table"
        (pfSortChange)="sort.set($event.detail)"
      >
        <span slot="caption">Orders this month</span>
        <pf-table-row head>
          <pf-table-cell sortable sortKey="name">Name</pf-table-cell>
          <pf-table-cell sortable sortKey="total" align="right" width="140px">Total</pf-table-cell>
          <pf-table-cell>Notes</pf-table-cell>
        </pf-table-row>
        @for (order of orders(); track order.name) {
          <pf-table-row>
            <pf-table-cell>{{ order.name }}</pf-table-cell>
            <pf-table-cell align="right">£{{ order.total.toFixed(2) }}</pf-table-cell>
            <pf-table-cell>{{ order.notes ?? '—' }}</pf-table-cell>
          </pf-table-row>
        }
      </pf-table>
      <output data-testid="table-sort">{{ sort().key }} {{ sort().direction }}</output>

      <!-- The tree is the tab stop, not the items; see the React consumer. -->
      <pf-tree-view
        [value]="file()"
        [expanded]="openFolders()"
        label="Project files"
        data-testid="tree-view"
        (pfChange)="file.set($event.detail.value)"
        (pfExpandedChange)="openFolders.set($event.detail.value)"
      >
        <pf-tree-item value="src" icon="folder-open">
          <span slot="label">src</span>
          <pf-tree-item value="index.ts">
            <span slot="label">index.ts</span>
            <pf-badge slot="badge" variant="brand">new</pf-badge>
          </pf-tree-item>
          <pf-tree-item value="components">
            <span slot="label">components</span>
            <pf-tree-item value="Button.tsx">
              <span slot="label">Button.tsx</span>
            </pf-tree-item>
          </pf-tree-item>
        </pf-tree-item>
        <pf-tree-item value="package.json">
          <span slot="label">package.json</span>
        </pf-tree-item>
        <pf-tree-item value="node_modules" disabled>
          <span slot="label">node_modules</span>
        </pf-tree-item>
      </pf-tree-view>
      <output data-testid="tree-value">{{ file() }} / {{ openFolders() || 'none' }}</output>

      <!-- One nav landmark, no banner, and two items asking to be current; see the React consumer. -->
      <pf-header-navigation label="Site navigation" data-testid="header-navigation">
        <span slot="brand">Pitchfork</span>
        <pf-nav-item href="#overview" [current]="true" data-testid="header-nav-current">
          Overview
        </pf-nav-item>
        <pf-nav-item href="#docs" [current]="true" data-testid="header-nav-second">
          Docs
        </pf-nav-item>
        <pf-nav-item href="#pricing" data-testid="header-nav-plain">Pricing</pf-nav-item>
        <pf-nav-item href="#archive" [disabled]="true" data-testid="header-nav-disabled">
          Archive
        </pf-nav-item>
        <pf-button slot="actions" variant="secondary">Sign in</pf-button>
      </pf-header-navigation>

      <!-- Grouped items, each section owning its own list; see the React consumer. -->
      <pf-sidebar-navigation label="Workspace" data-testid="sidebar-navigation">
        <span slot="header">Acme Inc.</span>
        <pf-nav-section data-testid="sidebar-section">
          <span slot="title">Main</span>
          <pf-nav-item href="#home" [current]="true" data-testid="sidebar-nav-current">
            <pf-icon slot="icon" name="folder-open" aria-hidden="true"></pf-icon>
            Home
            <pf-badge slot="badge" variant="brand">3</pf-badge>
          </pf-nav-item>
          <pf-nav-item href="#reports" data-testid="sidebar-nav-plain">
            <pf-icon slot="icon" name="chart-bar" aria-hidden="true"></pf-icon>
            Reports
          </pf-nav-item>
        </pf-nav-section>
        <pf-nav-section data-testid="sidebar-section-untitled">
          <pf-nav-item href="#users" [current]="true" data-testid="sidebar-nav-second">
            Users
          </pf-nav-item>
          <pf-nav-item href="#audit" [disabled]="true" data-testid="sidebar-nav-disabled">
            Audit log
          </pf-nav-item>
        </pf-nav-section>
        <span slot="footer">v2.1.0</span>
      </pf-sidebar-navigation>

      <!-- The same navigation with nothing slotted into either box; see the React consumer. -->
      <pf-header-navigation label="Sections" data-testid="header-navigation-bare">
        <pf-nav-item href="#one">One</pf-nav-item>
        <pf-nav-item href="#two">Two</pf-nav-item>
      </pf-header-navigation>

      <!-- A carousel is a region whose content changes; see the React consumer. -->
      <pf-carousel
        [index]="slide()"
        label="Featured work"
        [loop]="true"
        data-testid="carousel"
        (pfChange)="slide.set($event.detail.index)"
      >
        <pf-carousel-slide data-testid="carousel-slide-1">
          <pf-card>
            <pf-card-header>
              <h3>First slide</h3>
            </pf-card-header>
            <pf-card-content>
              <p>The track steps by one of its own widths per slide.</p>
              <pf-button variant="secondary" data-testid="carousel-slide-1-button">
                Open the first
              </pf-button>
            </pf-card-content>
          </pf-card>
        </pf-carousel-slide>
        <pf-carousel-slide data-testid="carousel-slide-2">
          <pf-card>
            <pf-card-header>
              <h3>Second slide</h3>
            </pf-card-header>
            <pf-card-content>
              <p>Each slide names its place, so a reader is never lost.</p>
              <pf-button variant="secondary" data-testid="carousel-slide-2-button">
                Open the second
              </pf-button>
            </pf-card-content>
          </pf-card>
        </pf-carousel-slide>
        <pf-carousel-slide data-testid="carousel-slide-3">
          <pf-card>
            <pf-card-header>
              <h3>Third slide</h3>
            </pf-card-header>
            <pf-card-content>
              <p>The dots jump straight to a slide, and mark the one on show.</p>
            </pf-card-content>
          </pf-card>
        </pf-carousel-slide>
      </pf-carousel>
      <output data-testid="carousel-index">{{ slide() }}</output>

      <!-- A line chart and a bar chart over the same rows; see the React consumer. -->
      <pf-line-chart
        [data]="traffic"
        [area]="true"
        yAxisLabel="Visits"
        label="Traffic by month"
        data-testid="line-chart"
      >
        <pf-chart-series seriesKey="visits" data-testid="line-series-1"> Visits </pf-chart-series>
        <pf-chart-series seriesKey="signups" [dashed]="true" data-testid="line-series-2">
          Signups
        </pf-chart-series>
      </pf-line-chart>

      <pf-bar-chart [data]="traffic" [stacked]="true" yAxisLabel="Visits" data-testid="bar-chart">
        <pf-chart-series seriesKey="visits" data-testid="bar-series-1">Visits</pf-chart-series>
        <pf-chart-series seriesKey="signups" data-testid="bar-series-2">Signups</pf-chart-series>
      </pf-bar-chart>

      <!-- A radar chart, whose axis names are attributes; see the React consumer. -->
      <pf-radar-chart [size]="240" [max]="10" label="Vehicle profile" data-testid="radar">
        <pf-radar-axis label="Speed" [value]="9" data-testid="radar-axis-1"></pf-radar-axis>
        <pf-radar-axis label="Power" [value]="6" data-testid="radar-axis-2"></pf-radar-axis>
        <pf-radar-axis label="Range" [value]="3" data-testid="radar-axis-3"></pf-radar-axis>
        <pf-radar-axis label="Comfort" [value]="7" data-testid="radar-axis-4"></pf-radar-axis>
        <pf-radar-axis label="Price" [value]="-1" data-testid="radar-axis-dropped"></pf-radar-axis>
      </pf-radar-chart>

      <!-- A calendar heatmap, whose date stepping is core's; see the React consumer. -->
      <pf-heatmap
        [data]="activity"
        [cellSize]="12"
        [cellGap]="3"
        label="Commits"
        data-testid="heatmap"
      ></pf-heatmap>

      <!-- A gauge and a pie; see the React consumer. -->
      <div style="display: flex; gap: var(--space-6); align-items: center">
        <pf-gauge-chart
          [value]="73"
          [size]="140"
          [strokeWidth]="12"
          label="Disk used"
          data-testid="gauge"
        >
          <span slot="sub">of 500 GB</span>
        </pf-gauge-chart>

        <pf-pie-chart [size]="160" label="Traffic sources" data-testid="pie-chart">
          <span slot="center">8.4k</span>
          <pf-pie-slice [value]="1" data-testid="pie-slice-1">Direct</pf-pie-slice>
          <pf-pie-slice [value]="1" data-testid="pie-slice-2">Search</pf-pie-slice>
          <pf-pie-slice [value]="1" data-testid="pie-slice-3">Social</pf-pie-slice>
          <pf-pie-slice [value]="0" data-testid="pie-slice-empty">Referral</pf-pie-slice>
        </pf-pie-chart>
      </div>

      <!-- Three sparklines; see the React consumer. -->
      <div style="display: flex; gap: var(--space-4); align-items: center">
        <pf-sparkline
          [data]="trend"
          label="Weekly signups"
          [endDot]="true"
          data-testid="sparkline"
        ></pf-sparkline>
        <pf-sparkline
          [data]="trend"
          variant="area"
          [animated]="true"
          data-testid="sparkline-area"
        ></pf-sparkline>
        <pf-sparkline
          [data]="flat"
          [width]="100"
          [height]="40"
          data-testid="sparkline-flat"
        ></pf-sparkline>
      </div>

      <!-- A form-associated rich-text field; see the React consumer. -->
      <pf-rich-text-editor
        name="notes"
        label="Notes"
        description="Formatting is kept."
        [characterMax]="200"
        [minHeight]="120"
        [value]="notes()"
        data-testid="rich-text-editor"
        (pfChange)="notes.set($event.detail.value)"
      ></pf-rich-text-editor>
      <output data-testid="rich-text-length">{{ notes().length }}</output>

      <!-- No syntax highlighting, deliberately; see the React consumer. -->
      <pf-code-snippet
        heading="install.sh"
        language="bash"
        [showLineNumbers]="true"
        [maxHeight]="160"
        [code]="snippet"
        data-testid="code-snippet"
        (pfCopy)="copiedCode.set($event.detail.code)"
      ></pf-code-snippet>
      <output data-testid="code-snippet-copied">{{ copiedCode().length }}</output>

      <!-- A form-associated file picker; see the React consumer. -->
      <pf-file-uploader
        name="docs"
        label="Attachments"
        description="Anything the team should see."
        accept=".pdf,image/*"
        [maxFiles]="3"
        [maxFileSize]="1048576"
        [files]="uploads()"
        data-testid="file-uploader"
        (pfChange)="uploads.set($event.detail.files)"
      ></pf-file-uploader>
      <output data-testid="file-uploader-count">{{ uploads().length }}</output>

      <!-- The panels are slotted by name; see the React consumer. -->
      <pf-resizable
        [size]="split()"
        [min]="20"
        [max]="80"
        [step]="5"
        style="height: 140px; border: 1px solid var(--pf-resizable-handle-bg)"
        data-testid="resizable"
        (pfChange)="split.set($event.detail.size)"
      >
        <div slot="start" style="padding: var(--space-3)" data-testid="resizable-start">
          The first panel, whose share the separator controls.
        </div>
        <div slot="end" style="padding: var(--space-3)" data-testid="resizable-end">
          The second takes whatever is left.
        </div>
      </pf-resizable>
      <output data-testid="resizable-size">{{ split() }}</output>

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
  modalOpen = signal(false);
  menuChoice = signal('');
  slideoutOpen = signal(false);
  paletteOpen = signal(false);
  tab = signal('overview');
  sections = signal('shipping');
  details = signal(false);
  range = signal('week');
  cta = signal(true);
  quantity = signal('2');
  sort = signal<SortState>({ key: 'name', direction: 'asc' });
  file = signal('index.ts');
  slide = signal(0);
  split = signal(40);
  uploads = signal<File[]>([]);
  copiedCode = signal('');
  traffic = [
    { label: 'Jan', visits: 1200, signups: 320 },
    { label: 'Feb', visits: 2400, signups: 540 },
    { label: 'Mar', visits: 1800, signups: 410 },
    { label: 'Apr', visits: 3200, signups: 760 },
  ];
  // Two months, crossing a month boundary and the spring-forward Sunday.
  activity = Array.from({ length: 61 }, (_, index) => {
    const day = new Date(2024, 1, 15 + index, 12);
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(
      day.getDate(),
    ).padStart(2, '0')}`;
    return { date: iso, value: index % 7 };
  });
  trend = [4, 9, 6, 12, 10, 16];
  flat = [7, 7, 7, 7];
  notes = signal('<p>A <strong>first</strong> note.</p><p>And a second.</p>');
  snippet = 'npm install @pitchfork-ui/elements\n\nnpm run build\n';
  openFolders = signal('src');
  // Sorted with core's own comparison, which is what makes the element's
  // reported sort and the React Table's internal one agree.
  orders = computed(() =>
    sortRowsBy(
      [
        // The cheapest is the last by name, so sorting by total really does
        // reorder the rows; see the React consumer.
        { name: 'Item 10', total: 9, notes: 'Rush' },
        { name: 'Item 2', total: 18.5, notes: undefined as string | undefined },
        { name: 'Item 1', total: 24, notes: 'Gift' },
      ],
      (row) => (this.sort().key === 'total' ? row.total : row.name),
      this.sort().direction,
    ),
  );
  day = signal('2024-03-15');
  at = signal('14:30');
  trip = signal('2024-03-10/2024-03-20');
  fruit = signal('banana');
  city = signal('');
  colours = signal('red,blue');
  topics = signal('design,systems');
  private toaster = viewChild<ElementRef<HTMLPfToasterElement>>('toaster');

  notify(variant: 'success' | 'danger') {
    void this.toaster()?.nativeElement.toast(
      variant === 'success'
        ? { variant, heading: 'Saved', description: 'Your changes are live.' }
        : {
            variant,
            heading: 'Upload failed',
            description: 'Announced assertively, unlike the success above.',
            duration: 0,
          },
    );
  }
  prefs = new FormGroup({
    terms: new FormControl(false, Validators.requiredTrue),
    notify: new FormControl(true),
    notes: new FormControl('first draft'),
    volume: new FormControl(7),
    plan: new FormControl('pro'),
  });

  plans = [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
    { value: 'team', label: 'Team' },
  ];

  removeTag(tag: string) {
    this.tags.update((current) => current.filter((t) => t !== tag));
  }
}
