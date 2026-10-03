import { sortRowsBy, type SortState } from '@pitchfork-ui/core';
import { useMemo, useRef, useState } from 'react';
import {
  PfAccordion,
  PfAccordionItem,
  PfAvatar,
  PfAvatarGroup,
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
  PfModal,
  PfNavItem,
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
} from '@pitchfork-ui/elements-react';

/**
 * Every element the library ships, used the way an application would. The
 * point is not to look good — it is that this file compiles, bundles and
 * renders styled output against the published wrapper package.
 */
export function App() {
  const [email, setEmail] = useState('ada@example.com');
  const [tags, setTags] = useState(['design', 'systems']);
  const [page, setPage] = useState(3);
  const [submitted, setSubmitted] = useState('');
  const [volume] = useState(7);
  const [modalOpen, setModalOpen] = useState(false);
  const [menuChoice, setMenuChoice] = useState('');
  const [slideoutOpen, setSlideoutOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tab, setTab] = useState('overview');
  const [sections, setSections] = useState('shipping');
  const [details, setDetails] = useState(false);
  const [range, setRange] = useState('week');
  const [cta, setCta] = useState(true);
  const [quantity, setQuantity] = useState('2');
  const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'asc' });
  const [file, setFile] = useState('index.ts');
  const [slide, setSlide] = useState(0);
  const [split, setSplit] = useState(40);
  const [uploads, setUploads] = useState<File[]>([]);
  const [copiedCode, setCopiedCode] = useState('');
  // Two months, so the heatmap crosses a month boundary and the spring-forward
  // Sunday — the day a midnight-based step would lose or repeat.
  const activity = Array.from({ length: 61 }, (_, index) => {
    const day = new Date(2024, 1, 15 + index, 12);
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(
      day.getDate(),
    ).padStart(2, '0')}`;
    return { date: iso, value: index % 7 };
  });
  const [notes, setNotes] = useState('<p>A <strong>first</strong> note.</p><p>And a second.</p>');
  const [openFolders, setOpenFolders] = useState('src');
  // Sorted with core's own comparison, which is what makes the element's
  // reported sort and the React Table's internal one agree.
  const orders = useMemo(
    () =>
      sortRowsBy(
        [
          // The cheapest is the last by name, so sorting by total really
          // does reorder the rows — the smoke's check would be vacuous
          // otherwise, and was.
          { name: 'Item 10', total: 9, notes: 'Rush' },
          { name: 'Item 2', total: 18.5, notes: undefined },
          { name: 'Item 1', total: 24, notes: 'Gift' },
        ],
        (row) => (sort.key === 'total' ? row.total : row.name),
        sort.direction,
      ),
    [sort],
  );
  const [day, setDay] = useState('2024-03-15');
  const [at, setAt] = useState('14:30');
  const [trip, setTrip] = useState('2024-03-10/2024-03-20');
  const [fruit, setFruit] = useState('banana');
  const [city, setCity] = useState('');
  const [colours, setColours] = useState('red,blue');
  const [topics, setTopics] = useState('design,systems');
  const toaster = useRef<HTMLPfToasterElement>(null);
  const [plan, setPlan] = useState('pro');
  const plans = [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
    { value: 'team', label: 'Team' },
  ];

  return (
    <main data-testid="app">
      <h1>
        <PfIcon name="circle-check" label="Working" /> React consumer
      </h1>

      <div className="row">
        <PfButton variant="primary">Save</PfButton>
        <PfButton variant="secondary">Cancel</PfButton>
        <PfButton variant="ghost">Skip</PfButton>
        <PfButton variant="destructive">Delete</PfButton>
        <PfButton variant="primary" loading>
          Saving
        </PfButton>
      </div>

      <div className="row">
        <PfBadge>neutral</PfBadge>
        <PfBadge variant="brand">brand</PfBadge>
        <PfBadge variant="success">success</PfBadge>
        <PfBadge variant="warning">warning</PfBadge>
        <PfBadge variant="danger">danger</PfBadge>
      </div>

      <div className="row">
        {tags.map((tag) => (
          <PfTag
            key={tag}
            variant="brand"
            dismissible
            onPfDismiss={() => setTags((current) => current.filter((t) => t !== tag))}
          >
            {tag}
          </PfTag>
        ))}
      </div>

      <div className="row">
        <PfAvatar name="Ada Lovelace" />
        <PfAvatar name="Ada Lovelace" size="lg" status="online" />
        <PfAvatar size="xl" />
      </div>

      <div className="row">
        <PfKbd>Esc</PfKbd>
        <PfKbd size="sm" keys={['⌘', 'K']} />
      </div>

      <div className="row">
        <PfInput
          label="Email"
          description="Changing this updates React state."
          value={email}
          onPfInput={(event) => setEmail(event.detail.value)}
        />
        <p data-testid="echo">{email}</p>
      </div>

      <PfContentDivider />

      <PfCard>
        <PfCardHeader>
          <strong>Card</strong>
          <PfVisuallyHidden> (a grouping surface)</PfVisuallyHidden>
        </PfCardHeader>
        <PfCardContent>
          Three sections, each its own element. A card using only some of them still renders
          correctly.
        </PfCardContent>
        <PfCardFooter>
          <PfButton variant="secondary">Dismiss</PfButton>
          <PfButton variant="primary">Confirm</PfButton>
        </PfCardFooter>
      </PfCard>

      <PfContentDivider>or</PfContentDivider>

      <PfCard>
        <PfCardContent>A card with content alone — no header, no footer.</PfCardContent>
      </PfCard>

      <div className="row">
        <PfLoadingSpinner />
        <PfLoadingSpinner size={40} label="Fetching" />
        <PfLoadingDots size="sm" />
        <PfLoadingDots />
        <PfLoadingDots size="lg" />
      </div>

      <div className="row">
        <PfLoadingSkeleton width={160} height={12} />
        <PfLoadingSkeleton width="40%" rounded />
      </div>

      <div className="row">
        {/* Icon-only, label-only and both: the three slot combinations. */}
        <PfUtilityButton label="Search">
          <PfIcon slot="icon" name="magnifying-glass" />
        </PfUtilityButton>
        <PfUtilityButton variant="brand">Archive</PfUtilityButton>
        <PfUtilityButton variant="destructive" size="sm">
          <PfIcon slot="icon" name="circle-xmark" />
          Delete
        </PfUtilityButton>
      </div>

      <div className="row">
        <PfBadgeGroup label="2 new" message="See what changed" color="brand" />
        <PfBadgeGroup
          label="Beta"
          message="Try it out"
          color="success"
          appearance="modern"
          badgePosition="trailing"
        />
      </div>

      <div className="row">
        {/* 30 of 60 is half drawn but must announce 30, not 50. */}
        <PfProgressBar value={30} max={60} label="Upload" />
        <PfProgressCircle value={75} label="Sync" />
        <PfProgressCircle value={40} size={96} strokeWidth={10} showValue={false} />
      </div>

      <PfCreditCard
        brand="visa"
        cardNumber="4111111111111111"
        cardholderName="Ada Lovelace"
        expiry="01/30"
        cvc="123"
      />

      {/*
        One tab stop, then the arrows move within it. pf-button is not a native
        control, so it opts into the keyboard order with data-toolbar-item.
      */}
      <PfToolbar>
        <PfUtilityButton label="Search" data-toolbar-item>
          <PfIcon slot="icon" name="magnifying-glass" />
        </PfUtilityButton>
        <PfUtilityButton label="Download" data-toolbar-item>
          <PfIcon slot="icon" name="file-arrow-down" />
        </PfUtilityButton>
        <PfToolbarSeparator />
        <PfButton variant="ghost" data-toolbar-item>
          Share
        </PfButton>
      </PfToolbar>

      {/* Uncontrolled: the element advances itself and reports where it went. */}
      <PfPagination
        totalPages={10}
        page={page}
        onPfPageChange={(event) => setPage(event.detail.page)}
      />
      <p data-testid="page-echo">page {page}</p>

      {/* Form-associated: these reach a real <form> through ElementInternals. */}
      <form
        data-testid="prefs"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSubmitted([...data.keys()].sort().join(','));
        }}
      >
        <PfCheckbox name="terms" label="Accept terms" required />
        <PfSwitch name="notify" label="Email notifications" checked />
        <PfTextarea
          name="notes"
          label="Notes"
          description="Multi-line, form-associated."
          rows={3}
        />
        <PfSlider name="volume" label="Volume" min={0} max={10} value={volume} />
        {/*
          Form-associated, which the React DatePicker is not — its value only
          reaches a form if the consumer wires it there. In the form on
          purpose: the submission assertion is what caught an unreflected
          `name` on the other controls.
        */}
        {/*
          12-hour display, 24-hour value — the submission below proves it. The
          cycle is read through a getter, because an attribute of a
          union-literal type arrives as a string.
        */}
        {/*
          One control, two submitted entries: setFormValue accepts a FormData
          and submits every entry in it, so `trip-start` and `trip-end` both
          appear below.
        */}
        <PfDateRangePicker
          label="Trip dates"
          name="trip"
          value={trip}
          allowClear
          data-testid="date-range-picker"
          onPfChange={(event) => setTrip(event.detail.value)}
        />
        {/*
          Free text rather than a fixed list, so no pf-option children — the
          chips are pf-tag elements, which already have the dismiss button.
        */}
        <PfTagInput
          label="Topics"
          name="topics"
          value={topics}
          max={5}
          data-testid="tag-input"
          onPfChange={(event) => setTopics(event.detail.value)}
        />

        {/*
          One control, one entry per value: setFormValue takes a FormData and a
          repeated key submits once per value, so `colours` appears twice below.
        */}
        <PfMultiSelect
          label="Colours"
          name="colours"
          value={colours}
          data-testid="multi-select"
          onPfChange={(event) => setColours(event.detail.value)}
        >
          <PfOption value="red">Red</PfOption>
          <PfOption value="green">Green</PfOption>
          <PfOption value="blue">Blue</PfOption>
          <PfOption value="grey" disabled>
            Grey
          </PfOption>
        </PfMultiSelect>

        {/*
          Shares pf-option with pf-select: the option reads a generic
          --pf-option-* set that each listbox maps to its own family, so one
          element is themed by whichever container it is slotted into.
        */}
        <PfCombobox
          label="City"
          name="city"
          value={city}
          data-testid="combobox"
          onPfChange={(event) => setCity(event.detail.value)}
        >
          <PfOption value="berlin">Berlin</PfOption>
          <PfOption value="bristol">Bristol</PfOption>
          <PfOption value="cardiff">Cardiff</PfOption>
          <PfOption value="coventry" disabled>
            Coventry
          </PfOption>
        </PfCombobox>

        {/*
          Wave 5's first: options are child elements, so a label is a slot and
          can hold markup — which an `options` array of strings cannot. It also
          has typeahead, which the React Select does not.
        */}
        <PfSelect
          label="Fruit"
          name="fruit"
          value={fruit}
          data-testid="select"
          onPfChange={(event) => setFruit(event.detail.value)}
        >
          <PfOption value="apple">Apple</PfOption>
          <PfOption value="apricot">Apricot</PfOption>
          <PfOption value="banana">
            Banana <small>(in season)</small>
          </PfOption>
          <PfOption value="blackberry" disabled>
            Blackberry
          </PfOption>
          <PfOption value="cherry">Cherry</PfOption>
        </PfSelect>
        {/*
          A form control, so form-associated: the value reaches FormData and
          the submission below shows it. The value is a string — an empty one
          is an empty field, not zero, which a form reading one as the other
          would get wrong. All the arithmetic is core's, so ten steps of 0.1
          reach exactly 1 here and in the React NumberInput.
        */}
        <PfNumberInput
          label="Quantity"
          name="quantity"
          value={quantity}
          min={0}
          max={10}
          step={0.5}
          data-testid="number-input"
          onPfChange={(event) => setQuantity(event.detail.value)}
        />
        <PfTimePicker
          label="Start time"
          name="at"
          value={at}
          hourCycle={12}
          minuteStep={15}
          data-testid="time-picker"
          onPfChange={(event) => setAt(event.detail.value)}
        />
        <PfDatePicker
          label="Due date"
          name="due"
          value={day}
          min="2024-03-05"
          max="2024-03-26"
          allowClear
          data-testid="date-picker"
          onPfChange={(event) => setDay(event.detail.value)}
        />
        {/*
          Children, not an options array — the decision for every data-driven
          element in this layer. The cost is the map; the gain is that a
          choice's label is a slot, so it can hold anything.
        */}
        <PfRadioGroup
          name="plan"
          legend="Plan"
          value={plan}
          onPfChange={(e) => setPlan(e.detail.value)}
        >
          {plans.map((option) => (
            <PfRadioButton key={option.value} value={option.value}>
              {option.label}
            </PfRadioButton>
          ))}
        </PfRadioGroup>
        <PfButton type="submit" variant="primary">
          Save
        </PfButton>
      </form>
      <p data-testid="submitted">submitted: {submitted}</p>

      {/*
        Deliberately inside a clipping, stacking-context box: the panel is a
        popover, so it escapes both. A plain positioned element here would be
        cut off and lose to the z-index below it.
      */}
      <div
        data-testid="tooltip-clip"
        style={{
          overflow: 'hidden',
          width: '120px',
          height: '40px',
          position: 'relative',
          zIndex: 0,
        }}
      >
        <PfTooltip open placement="bottom">
          <button type="button">Anchored</button>
          <span slot="content">Escapes the clip box and the stacking context</span>
        </PfTooltip>
      </div>
      <div style={{ position: 'relative', zIndex: 999, height: '4px' }} />

      <div className="row">
        {/* Light-dismiss and Escape come from the browser, not from us. */}
        <PfPopover label="Quick settings">
          <PfButton variant="secondary">Settings</PfButton>
          <div slot="content">
            <p style={{ margin: 0 }}>Anchored, and dismissed by the browser.</p>
          </div>
        </PfPopover>

        <PfButton variant="primary" onClick={() => setModalOpen(true)}>
          Open modal
        </PfButton>
      </div>

      <PfModal
        open={modalOpen}
        label="Confirm"
        onPfOpenChange={(event) => setModalOpen(event.detail.open)}
      >
        <PfModalHeader>
          <strong>Confirm</strong>
        </PfModalHeader>
        <PfModalBody>
          A native dialog: the focus trap, Escape and the backdrop are the browser&rsquo;s. Only the
          page-scroll lock is ours.
        </PfModalBody>
        <PfModalFooter>
          <PfButton variant="secondary" onClick={() => setModalOpen(false)}>
            Cancel
          </PfButton>
          <PfButton variant="primary" onClick={() => setModalOpen(false)}>
            Confirm
          </PfButton>
        </PfModalFooter>
      </PfModal>

      {/*
        Both menus share pf-menu-item and pf-menu-separator. The item reads a
        generic `--pf-menu-*` set which each container maps to its own alias
        family, so the same element is themed by whichever menu it sits in --
        an inheritance that only a real stylesheet exercises, which is why it
        is asserted here and not in the browser project.
      */}
      <div className="row">
        <PfDropdown
          label="Document actions"
          data-testid="dropdown"
          onPfSelect={(event) => setMenuChoice(event.detail.value)}
        >
          <PfButton variant="secondary">Actions</PfButton>
          <PfMenuItem slot="menu" value="rename">
            Rename
            <PfKbd slot="shortcut">F2</PfKbd>
          </PfMenuItem>
          <PfMenuItem slot="menu" value="duplicate">
            Duplicate
          </PfMenuItem>
          <PfMenuItem slot="menu" value="archive" disabled>
            Archive
          </PfMenuItem>
          <PfMenuSeparator slot="menu" />
          <PfMenuItem slot="menu" value="delete" destructive>
            Delete
          </PfMenuItem>
        </PfDropdown>

        <output data-testid="menu-choice">{menuChoice || 'nothing chosen'}</output>
      </div>

      <PfContextMenu
        label="Row actions"
        data-testid="context-menu"
        onPfSelect={(event) => setMenuChoice(event.detail.value)}
      >
        <div
          style={{
            border: '1px dashed var(--pf-surface-border)',
            borderRadius: '8px',
            padding: 'var(--space-4)',
          }}
        >
          Right-click anywhere in this box.
        </div>
        <PfMenuItem slot="menu" value="open">
          Open
        </PfMenuItem>
        <PfMenuItem slot="menu" value="copy">
          Copy
          <PfKbd slot="shortcut">Ctrl C</PfKbd>
        </PfMenuItem>
        <PfMenuSeparator slot="menu" />
        <PfMenuItem slot="menu" value="remove" destructive>
          Remove
        </PfMenuItem>
      </PfContextMenu>

      {/*
        A slideout is a modal dialog pinned to an edge, so showModal() supplies
        the focus trap, Escape and the backdrop. Only the page-scroll lock is
        ours, and it is reference-counted in core so a slideout over a modal
        cannot leave the page stuck.
      */}
      <div className="row">
        <PfButton variant="secondary" onClick={() => setSlideoutOpen(true)}>
          Open slideout
        </PfButton>

        <PfButton
          variant="primary"
          onClick={() =>
            void toaster.current?.toast({
              variant: 'success',
              heading: 'Saved',
              description: 'Your changes are live.',
            })
          }
        >
          Toast
        </PfButton>

        <PfButton
          variant="secondary"
          onClick={() =>
            void toaster.current?.toast({
              variant: 'danger',
              heading: 'Upload failed',
              description: 'Announced assertively, unlike the success above.',
              duration: 0,
            })
          }
        >
          Toast a failure
        </PfButton>
      </div>

      <PfSlideoutMenu
        open={slideoutOpen}
        heading="Filters"
        description="Narrow the list down"
        onPfOpenChange={(event) => setSlideoutOpen(event.detail.open)}
      >
        <p style={{ marginTop: 0 }}>
          The heading above is a prop rendered into the element&rsquo;s own shadow root, so this
          dialog can name itself with <code>aria-labelledby</code> — which pf-modal cannot, because
          its header is slotted light DOM.
        </p>
        <PfButton slot="footer" variant="secondary" onClick={() => setSlideoutOpen(false)}>
          Cancel
        </PfButton>
        <PfButton slot="footer" variant="primary" onClick={() => setSlideoutOpen(false)}>
          Apply
        </PfButton>
      </PfSlideoutMenu>

      {/* A notification in the page, rather than in response to an action. */}
      <PfNotification
        variant="warning"
        heading="Scheduled maintenance"
        description="Saturday, 02:00–04:00 UTC."
        data-testid="page-notification"
      />

      <PfToaster ref={toaster} placement="top-right" data-testid="toaster" />

      {/*
        The command palette's options are slotted light-DOM children, and the
        search input is in the element's shadow root, so the active option is
        pointed at with `ariaActiveDescendantElement` rather than an IDREF --
        a cross-root `aria-activedescendant` is absent from the accessibility
        tree entirely. Grouping is structural for the same reason: one <slot>
        renders every child in source order, so a shadow root cannot box a
        subset of them.
      */}
      <div className="row">
        <PfButton variant="secondary" onClick={() => setPaletteOpen(true)}>
          Open command palette
        </PfButton>
        <output data-testid="command-choice">{menuChoice || 'nothing chosen'}</output>
      </div>

      <PfCommandPalette
        open={paletteOpen}
        data-testid="command-palette"
        onPfOpenChange={(event) => setPaletteOpen(event.detail.open)}
        onPfSelect={(event) => setMenuChoice(event.detail.value)}
      >
        <PfCommandGroup label="File">
          <PfCommandItem value="new">New file</PfCommandItem>
          <PfCommandItem value="open" description="Pick from recent">
            Open file
          </PfCommandItem>
        </PfCommandGroup>
        <PfCommandGroup label="App">
          <PfCommandItem value="settings">Settings</PfCommandItem>
          <PfCommandItem value="quit" disabled>
            Quit
          </PfCommandItem>
        </PfCommandGroup>
      </PfCommandPalette>

      {/*
        One tab stop and arrow-key movement, which the React Calendar does not
        have — it renders 42 buttons and no key handling. The arithmetic is
        core's, so both layers can agree once React adopts it.
      */}
      <div className="row">
        <PfCalendar
          value={day}
          min="2024-03-05"
          max="2024-03-26"
          startYear={2020}
          endYear={2030}
          data-testid="calendar"
          onPfChange={(event) => setDay(event.detail.value)}
        />
        <output data-testid="calendar-value">{day}</output>
      </div>

      {/*
        Interleaved children — one pf-tab and one pf-tab-panel per item, which
        is what a loop over data produces. Each tab assigns itself to the strip
        and the panels fall to the default slot, so nothing here sets `slot`.

        The indicator is placed from rect measurements: a slotted tab's
        offsetParent is the nearest positioned ancestor in *this* tree, not the
        strip inside the shadow root, so offsetLeft would place it elsewhere.
        Only a real stylesheet makes that visible, which is what the smoke
        script checks.
      */}
      <PfTabs
        value={tab}
        variant="underline"
        data-testid="tabs"
        onPfChange={(event) => setTab(event.detail.value)}
      >
        <PfTab value="overview" icon="circle-info">
          Overview
        </PfTab>
        <PfTabPanel value="overview">
          <p>An overview of the thing, with rather a lot of words in it.</p>
        </PfTabPanel>
        <PfTab value="issues" count={12}>
          Issues
        </PfTab>
        <PfTabPanel value="issues">
          <p>Twelve issues, counted in the badge beside the label.</p>
        </PfTabPanel>
        <PfTab value="archive" disabled>
          Archive
        </PfTab>
        <PfTabPanel value="archive">
          <p>Nothing here; the tab is disabled.</p>
        </PfTabPanel>
      </PfTabs>
      <output data-testid="tabs-value">{tab}</output>

      {/*
        Each section is self-contained — it owns its header, its panel and the
        0fr → 1fr height animation — and the group owns only which sections are
        open, because in single mode that depends on what else is. The heading
        level is pushed down, so one prop sets it for every section.
      */}
      <PfAccordion
        type="multiple"
        value={sections}
        headingLevel={3}
        data-testid="accordion"
        onPfChange={(event) => setSections(event.detail.value)}
      >
        <PfAccordionItem value="shipping">
          <span slot="title">Shipping</span>
          <p>
            Ships in two days. <a href="#shipping-detail">Read the detail</a>, which is focusable
            and so has to be inert while this section is closed.
          </p>
        </PfAccordionItem>
        <PfAccordionItem value="returns">
          <span slot="title">Returns</span>
          <p>Thirty days, no questions.</p>
        </PfAccordionItem>
        <PfAccordionItem value="warranty" disabled>
          <span slot="title">Warranty</span>
          <p>Nothing here; the section is disabled.</p>
        </PfAccordionItem>
      </PfAccordion>
      <output data-testid="accordion-value">{sections || 'none'}</output>

      {/*
        The same panel mechanics as a section of the accordion, with no group
        above it — so Escape on the header closes it, which an accordion
        section leaves to its group.
      */}
      <PfCollapsible
        open={details}
        data-testid="collapsible"
        onPfOpenChange={(event) => setDetails(event.detail.open)}
      >
        <span slot="trigger">Advanced options</span>
        <p>
          <a href="#advanced-detail">A focusable link</a>, which is why the closed panel is inert.
        </p>
      </PfCollapsible>
      <output data-testid="collapsible-value">{details ? 'open' : 'closed'}</output>

      {/*
        The separator is a string, not a slot: it appears between every pair,
        and a slot renders its content once — so each crumb draws its own from
        the string the group pushes down. `current` is what a consumer asks
        with; `current-page` is the group's answer, and only one crumb in the
        trail carries it.
      */}
      <PfBreadcrumbs label="Site breadcrumb" separator="›" data-testid="breadcrumbs">
        <PfBreadcrumb href="#home">Home</PfBreadcrumb>
        <PfBreadcrumb href="#products">Products</PfBreadcrumb>
        <PfBreadcrumb>Shoes</PfBreadcrumb>
      </PfBreadcrumbs>

      {/*
        One step says it is current and the group infers the rest, writing the
        answer to `state` rather than back onto the `status` that asked.
        `aria-current="step"` is the only thing in the accessibility tree that
        says where the trail has got to — the markers are decorative.
      */}
      <PfProgressSteps data-testid="progress-steps">
        <PfProgressStep>
          <span slot="title">Account</span>
        </PfProgressStep>
        <PfProgressStep status="current">
          <span slot="title">Details</span>
          <span slot="description">Fill in your details.</span>
        </PfProgressStep>
        <PfProgressStep>
          <span slot="title">Confirm</span>
        </PfProgressStep>
      </PfProgressSteps>

      {/*
        The marker grows when something is slotted into it, which is asked in
        JS rather than selected in CSS: `:has(*)` on a wrapper around a slot
        always matches, because the slot is itself a child. The timestamp and
        description have no wrapper at all, so an entry without them has no
        stray space — an unassigned slot generates nothing.
      */}
      <PfTimeline label="Release history" data-testid="timeline">
        <PfTimelineItem tone="success">
          <span slot="title">Deployed</span>
          <span slot="timestamp">2 hours ago</span>
          <span slot="description">Version 1.4.0 went out.</span>
          <PfIcon slot="icon" name="circle-check" aria-hidden="true" />
        </PfTimelineItem>
        <PfTimelineItem>
          <span slot="title">Reviewed</span>
          <span slot="timestamp">Yesterday</span>
        </PfTimelineItem>
        <PfTimelineItem tone="danger">
          <span slot="title">Opened</span>
        </PfTimelineItem>
      </PfTimeline>

      {/*
        3.5 of 5: the fourth star is the same glyph clipped to half its width,
        which is what makes a fraction look like a fraction. The arithmetic is
        core's, so the React RatingStars fills the same star by the same
        amount.
      */}
      <div className="row">
        <PfRatingStars value={3.5} showValue data-testid="rating-stars" />
        <PfRatingBadge value={4.5} reviews={1234} data-testid="rating-badge" />
      </div>

      {/*
        The icon and action boxes are hidden rather than left out when empty,
        because a slot that is not rendered never fires slotchange — content
        added later would stay invisible. The description has no box at all,
        since an unassigned slot generates nothing.
      */}
      <PfEmptyState icon="folder-open" data-testid="empty-state">
        No results
        <span slot="description">Try a different search, or clear the filters.</span>
        <PfButton slot="action" variant="secondary">
          Clear filters
        </PfButton>
      </PfEmptyState>

      {/*
        The headers and the cards share one arrangement: a box that carries
        layout stays in the tree and is hidden when its slot is empty, so
        content added later still fires slotchange, while a slot that carries
        no layout — an eyebrow, a description — has no box at all and
        collapses on its own.

        The page header takes a slotted pf-breadcrumbs rather than a
        breadcrumbs array, which is §2.1 again: each crumb's label is a node.
      */}
      <PfPageHeader data-testid="page-header">
        <PfBreadcrumbs slot="breadcrumbs" label="Page breadcrumb">
          <PfBreadcrumb href="#shop">Shop</PfBreadcrumb>
          <PfBreadcrumb>Orders</PfBreadcrumb>
        </PfBreadcrumbs>
        <span slot="eyebrow">Shop</span>
        Orders
        <span slot="description">Everything bought this month, newest first.</span>
        <span slot="metadata">24 orders · £24,500</span>
        <PfButton slot="actions" variant="secondary">
          Export
        </PfButton>
      </PfPageHeader>

      <PfSectionHeader divider data-testid="section-header">
        <span slot="eyebrow">This month</span>
        Recent activity
        <span slot="description">What has changed since the last report.</span>
        <span slot="metadata">Updated today</span>
        <PfButton slot="actions" variant="ghost">
          Refresh
        </PfButton>
      </PfSectionHeader>

      <PfMetricGrid data-testid="metric-grid">
        <PfMetricCard trend="positive" icon="chart-bar" data-testid="metric-card">
          <span slot="heading">Revenue</span>
          £24,500
          <span slot="trend">12% on last month</span>
          <span slot="description">Since April</span>
          <PfButton slot="action" variant="ghost" size="sm">
            Export
          </PfButton>
        </PfMetricCard>
        <PfMetricCard trend="negative">
          <span slot="heading">Refunds</span>
          £1,200
          <span slot="trend">3% on last month</span>
        </PfMetricCard>
        <PfMetricCard>
          <span slot="heading">Orders</span>
          1,204
        </PfMetricCard>
      </PfMetricGrid>

      <PfSectionFooter data-testid="section-footer">
        Next steps
        <span slot="description">Nothing is blocked.</span>
        <PfButton slot="actions">Save</PfButton>
      </PfSectionFooter>

      {/*
        Four avatars, two shown: the group collapses the rest with a data
        attribute of its own rather than `hidden`, which stays the consumer's.
        The +N chip is a pf-avatar in the shadow root — it needs an avatar's
        shape and ring, and its colours come through the --pf-avatar-*
        properties, which inherit across the boundary.
      */}
      <PfAvatarGroup max={2} total={40} data-testid="avatar-group">
        <PfAvatar name="Ada Lovelace" />
        <PfAvatar name="Grace Hopper" />
        <PfAvatar name="Alan Turing" />
        <PfAvatar name="Katherine Johnson" />
      </PfAvatarGroup>

      {/*
        Toggle buttons, so aria-pressed and one tab stop each — not the roving
        tabindex a tab strip or a toolbar uses. The rounded ends come from
        :host(:first-child) in the child's own sheet, because ::slotted() takes
        no combinator; the group's disabled state is a prop of its own, so
        enabling the group leaves a button disabled on its own alone.
      */}
      <div className="row">
        <PfButtonGroup
          value={range}
          data-testid="button-group"
          onPfChange={(event) => setRange(event.detail.value)}
        >
          <PfButtonGroupItem value="day">Day</PfButtonGroupItem>
          <PfButtonGroupItem value="week" icon="calendar">
            Week
          </PfButtonGroupItem>
          <PfButtonGroupItem value="month" dot>
            Month
          </PfButtonGroupItem>
          <PfButtonGroupItem value="year" disabled>
            Year
          </PfButtonGroupItem>
        </PfButtonGroup>
        <output data-testid="button-group-value">{range}</output>
      </div>

      {/*
        Dismissal waits on Animation.finished rather than a timeout, so the
        event lands when the animation is actually over — and resolves at once
        when nothing animates, which is prefers-reduced-motion and a consumer
        who has not loaded the stylesheet. The React useExitAnimation guesses
        220ms and fires then either way.
      */}
      {cta ? (
        <PfInlineCta
          tone="info"
          icon="circle-info"
          dismissible
          data-testid="inline-cta"
          onPfDismiss={() => setCta(false)}
        >
          Finish setting up your account
          <span slot="description">Two steps left, and they are quick ones.</span>
          <PfButton slot="action" variant="secondary">
            Continue
          </PfButton>
        </PfInlineCta>
      ) : (
        <p data-testid="inline-cta-echo">dismissed</p>
      )}

      {/*
        The table reports a sort rather than performing one: the rows are this
        app's, so it sorts its own data with core's sortRowsBy — the same
        comparison the React Table uses, so the order matches.

        The layout is CSS tables, which is what lets a row be a box and so
        take the stripe and the hover. A grid would need display: contents
        rows, which have no box at all.
      */}
      <PfTable
        striped
        sticky-header
        label="Orders"
        sortKey={sort.key}
        sortDirection={sort.direction}
        data-testid="table"
        onPfSortChange={(event) => setSort(event.detail)}
      >
        <span slot="caption">Orders this month</span>
        <PfTableRow head>
          <PfTableCell sortable sortKey="name">
            Name
          </PfTableCell>
          <PfTableCell sortable sortKey="total" align="right" width="140px">
            Total
          </PfTableCell>
          <PfTableCell>Notes</PfTableCell>
        </PfTableRow>
        {orders.map((order) => (
          <PfTableRow key={order.name}>
            <PfTableCell>{order.name}</PfTableCell>
            <PfTableCell align="right">£{order.total.toFixed(2)}</PfTableCell>
            <PfTableCell>{order.notes ?? '—'}</PfTableCell>
          </PfTableRow>
        ))}
      </PfTable>
      <output data-testid="table-sort">
        {sort.key} {sort.direction}
      </output>

      {/*
        The tree is the tab stop, not the items: a tabindex="0" host slotted
        into another host's shadow tree is skipped by sequential navigation
        when the outer host's tabindex is negative — measured — which is
        exactly a nested item under a roving tabindex. So the keyboard's place
        is an aria-activedescendant IDREF, which resolves because the items are
        the tree's own light-DOM descendants.
      */}
      <PfTreeView
        value={file}
        expanded={openFolders}
        label="Project files"
        data-testid="tree-view"
        onPfChange={(event) => setFile(event.detail.value)}
        onPfExpandedChange={(event) => setOpenFolders(event.detail.value)}
      >
        <PfTreeItem value="src" icon="folder-open">
          <span slot="label">src</span>
          <PfTreeItem value="index.ts">
            <span slot="label">index.ts</span>
            <PfBadge slot="badge" variant="brand">
              new
            </PfBadge>
          </PfTreeItem>
          <PfTreeItem value="components">
            <span slot="label">components</span>
            <PfTreeItem value="Button.tsx">
              <span slot="label">Button.tsx</span>
            </PfTreeItem>
          </PfTreeItem>
        </PfTreeItem>
        <PfTreeItem value="package.json">
          <span slot="label">package.json</span>
        </PfTreeItem>
        <PfTreeItem value="node_modules" disabled>
          <span slot="label">node_modules</span>
        </PfTreeItem>
      </PfTreeView>
      <output data-testid="tree-value">
        {file} / {openFolders || 'none'}
      </output>

      {/*
        The navigation is one `<nav>` landmark in the shadow root, and the
        host is deliberately not a banner: an element cannot know whether it
        is the page's `<header>`, and a second banner landmark is a defect.
        Both items below ask to be the current page; core's rule marks one.
      */}
      <PfHeaderNavigation label="Site navigation" data-testid="header-navigation">
        <span slot="brand">Pitchfork</span>
        <PfNavItem href="#overview" current data-testid="header-nav-current">
          Overview
        </PfNavItem>
        <PfNavItem href="#docs" current data-testid="header-nav-second">
          Docs
        </PfNavItem>
        <PfNavItem href="#pricing" data-testid="header-nav-plain">
          Pricing
        </PfNavItem>
        <PfNavItem href="#archive" disabled data-testid="header-nav-disabled">
          Archive
        </PfNavItem>
        <PfButton slot="actions" variant="secondary">
          Sign in
        </PfButton>
      </PfHeaderNavigation>

      {/*
        The sidebar's items are grouped: a `<ul>` around the sections would be
        a list whose children were not items, so each section owns its own
        list and names it with a same-root IDREF. Both items below ask to be
        the current page, and the resolution runs across the sections rather
        than within one.
      */}
      <PfSidebarNavigation label="Workspace" data-testid="sidebar-navigation">
        <span slot="header">Acme Inc.</span>
        <PfNavSection data-testid="sidebar-section">
          <span slot="title">Main</span>
          <PfNavItem href="#home" current data-testid="sidebar-nav-current">
            <PfIcon slot="icon" name="folder-open" aria-hidden="true" />
            Home
            <PfBadge slot="badge" variant="brand">
              3
            </PfBadge>
          </PfNavItem>
          <PfNavItem href="#reports" data-testid="sidebar-nav-plain">
            <PfIcon slot="icon" name="chart-bar" aria-hidden="true" />
            Reports
          </PfNavItem>
        </PfNavSection>
        <PfNavSection data-testid="sidebar-section-untitled">
          <PfNavItem href="#users" current data-testid="sidebar-nav-second">
            Users
          </PfNavItem>
          <PfNavItem href="#audit" disabled data-testid="sidebar-nav-disabled">
            Audit log
          </PfNavItem>
        </PfNavSection>
        <span slot="footer">v2.1.0</span>
      </PfSidebarNavigation>

      {/*
        The same navigation with nothing slotted into either box: both are
        grid items, so one that draws anyway costs a column and pushes every
        item along.
      */}
      <PfHeaderNavigation label="Sections" data-testid="header-navigation-bare">
        <PfNavItem href="#one">One</PfNavItem>
        <PfNavItem href="#two">Two</PfNavItem>
      </PfHeaderNavigation>

      {/*
        A carousel is a region whose content changes, not a tab list: the
        announcement in its live region is what tells a reader it moved. The
        off-screen slides are inert, so the button inside the next slide is
        not a tab stop nobody can see — measured in the browser, where
        `inert` refuses focus outright.
      */}
      <PfCarousel
        index={slide}
        label="Featured work"
        loop
        data-testid="carousel"
        onPfChange={(event) => setSlide(event.detail.index)}
      >
        <PfCarouselSlide data-testid="carousel-slide-1">
          <PfCard>
            <PfCardHeader>
              <h3>First slide</h3>
            </PfCardHeader>
            <PfCardContent>
              <p>The track steps by one of its own widths per slide.</p>
              <PfButton variant="secondary" data-testid="carousel-slide-1-button">
                Open the first
              </PfButton>
            </PfCardContent>
          </PfCard>
        </PfCarouselSlide>
        <PfCarouselSlide data-testid="carousel-slide-2">
          <PfCard>
            <PfCardHeader>
              <h3>Second slide</h3>
            </PfCardHeader>
            <PfCardContent>
              <p>Each slide names its place, so a reader is never lost.</p>
              <PfButton variant="secondary" data-testid="carousel-slide-2-button">
                Open the second
              </PfButton>
            </PfCardContent>
          </PfCard>
        </PfCarouselSlide>
        <PfCarouselSlide data-testid="carousel-slide-3">
          <PfCard>
            <PfCardHeader>
              <h3>Third slide</h3>
            </PfCardHeader>
            <PfCardContent>
              <p>The dots jump straight to a slide, and mark the one on show.</p>
            </PfCardContent>
          </PfCard>
        </PfCarouselSlide>
      </PfCarousel>
      <output data-testid="carousel-index">{slide}</output>

      {/*
        A calendar heatmap. Its date stepping is core's, which pins every date
        to midday: a day step from midnight across a daylight-saving boundary
        loses or repeats a day, and the range below crosses one.
      */}
      <PfHeatmap data={activity} cellSize={12} cellGap={3} label="Commits" data-testid="heatmap" />

      {/*
        A gauge and a pie. The gauge names what it measures and reports the
        percentage in `aria-valuetext`, where a reader looks for it; the
        React `GaugeChart` puts the percentage in `aria-label`. The pie's
        legend is made of its slices, because a slot renders its content once
        and in one place — a legend built in the shadow root could never
        reach labels that live in the light DOM.
      */}
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center' }}>
        <PfGaugeChart value={73} size={140} strokeWidth={12} label="Disk used" data-testid="gauge">
          <span slot="sub">of 500 GB</span>
        </PfGaugeChart>

        <PfPieChart size={160} label="Traffic sources" data-testid="pie-chart">
          <span slot="center">8.4k</span>
          <PfPieSlice value={1} data-testid="pie-slice-1">
            Direct
          </PfPieSlice>
          <PfPieSlice value={1} data-testid="pie-slice-2">
            Search
          </PfPieSlice>
          <PfPieSlice value={1} data-testid="pie-slice-3">
            Social
          </PfPieSlice>
          <PfPieSlice value={0} data-testid="pie-slice-empty">
            Referral
          </PfPieSlice>
        </PfPieChart>
      </div>

      {/*
        Three sparklines: a still line, a filled area that draws itself in,
        and a flat series — which core centres rather than pinning to an edge,
        because an edge reads as a collapse rather than as "no change".
      */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
        <PfSparkline
          data={[4, 9, 6, 12, 10, 16]}
          label="Weekly signups"
          endDot
          data-testid="sparkline"
        />
        <PfSparkline
          data={[4, 9, 6, 12, 10, 16]}
          variant="area"
          animated
          data-testid="sparkline-area"
        />
        <PfSparkline data={[7, 7, 7, 7]} width={100} height={40} data-testid="sparkline-flat" />
      </div>

      {/*
        A form-associated rich-text field: a contenteditable is not a form
        control in any framework, so the value reaches a form through
        `ElementInternals`. Its toolbar is one tab stop with the arrows moving
        inside, which is the ARIA toolbar pattern; the React editor is six.
      */}
      <PfRichTextEditor
        name="notes"
        label="Notes"
        description="Formatting is kept."
        characterMax={200}
        minHeight={120}
        value={notes}
        data-testid="rich-text-editor"
        onPfChange={(event) => setNotes(event.detail.value)}
      />
      <output data-testid="rich-text-length">{notes.length}</output>

      {/*
        No syntax highlighting, deliberately: `prism-react-renderer` is a React
        renderer with no framework-free equivalent, and an element should not
        make a consumer's bundle choose a highlighter. A consumer who already
        highlights slots the markup in; this keeps the frame, the header, the
        copy button and the announcement.
      */}
      <PfCodeSnippet
        heading="install.sh"
        language="bash"
        showLineNumbers
        maxHeight={160}
        code={'npm install @pitchfork-ui/elements\n\nnpm run build\n'}
        data-testid="code-snippet"
        onPfCopy={(event) => setCopiedCode(event.detail.code)}
      />
      <output data-testid="code-snippet-copied">{copiedCode.length}</output>

      {/*
        A form-associated file picker: the input inside the shadow root
        reaches no surrounding form, so the submission comes from
        `setFormValue` — one entry per file, which is how a native multi-file
        input submits. `accept` filters the picker and nothing else, so the
        element checks a dropped file itself.
      */}
      <PfFileUploader
        name="docs"
        label="Attachments"
        description="Anything the team should see."
        accept=".pdf,image/*"
        maxFiles={3}
        maxFileSize={1024 * 1024}
        files={uploads}
        data-testid="file-uploader"
        onPfChange={(event) => setUploads(event.detail.files)}
      />
      <output data-testid="file-uploader-count">{uploads.length}</output>

      {/*
        The panels are slotted by name rather than taken as the first two
        children: a slot cannot be told to take only the first assigned node,
        so a consumer's third child would be silently ignored the way the
        React `Resizable` ignores it.
      */}
      <PfResizable
        size={split}
        min={20}
        max={80}
        step={5}
        style={{ height: '140px', border: '1px solid var(--pf-resizable-handle-bg)' }}
        data-testid="resizable"
        onPfChange={(event) => setSplit(event.detail.size)}
      >
        <div slot="start" style={{ padding: 'var(--space-3)' }} data-testid="resizable-start">
          The first panel, whose share the separator controls.
        </div>
        <div slot="end" style={{ padding: 'var(--space-3)' }} data-testid="resizable-end">
          The second takes whatever is left.
        </div>
      </PfResizable>
      <output data-testid="resizable-size">{split}</output>

      <PfScrollArea style={{ height: '80px', maxWidth: '280px' }}>
        <p>
          A scroll area is focusable by default, so it can be scrolled with the arrow keys even when
          it holds no focusable child.
        </p>
        <p>Its scrollbar reserves a gutter rather than overlaying this text.</p>
        <p>Third paragraph, to make sure there is something to scroll to.</p>
      </PfScrollArea>
    </main>
  );
}
