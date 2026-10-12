import {
  PfButton,
  PfCard,
  PfCardContent,
  PfCardHeader,
  PfInput,
  PfLoadingDots,
  PfLoadingSpinner,
  PfAccordion,
  PfAccordionItem,
  PfModal,
  PfModalBody,
  PfModalHeader,
  PfOption,
  PfSelect,
  PfSlider,
  PfSwitch,
  PfTooltip,
  PfUtilityButton,
} from '@pitchfork-ui/elements-react';
import { useState } from 'react';
import type { ThemeState } from '../hooks/useTheme';
import '../styles/controls.css';
import './MotionView.css';

interface MotionViewProps {
  theme: ThemeState;
}

export function MotionView({ theme }: MotionViewProps) {
  return (
    <div className="view-layout">
      <div className="view-layout__editor">
        <div className="motion-editor">
          <div className="editor-section">
            <div className="editor-section__label">Duration</div>
            <DurationControl label="Fast" cssVar="--duration-fast" theme={theme} max={500} />
            <DurationControl
              label="Moderate"
              cssVar="--duration-moderate"
              theme={theme}
              max={600}
            />
            <DurationControl label="Slow" cssVar="--duration-slow" theme={theme} max={1000} />
          </div>
          <div className="editor-section">
            <div className="editor-section__label">Easing</div>
            <EasingControl
              label="Standard"
              cssVar="--easing-standard"
              theme={theme}
              description="For elements transitioning between states on screen — switches, tabs, color changes. Accelerates out of the initial state and decelerates into the final one."
            />
            <EasingControl
              label="Decelerate"
              cssVar="--easing-decelerate"
              theme={theme}
              description="For elements entering the viewport — dropdowns, tooltips, and modals appearing. The element decelerates as it arrives, giving a sense of landing."
            />
            <EasingControl
              label="Accelerate"
              cssVar="--easing-accelerate"
              theme={theme}
              description="For elements leaving the viewport — menus closing, modals dismissing. The element accelerates as it departs, giving a sense of lifting away."
            />
          </div>
        </div>
        <div className="motion-preview-section">
          <div className="editor-section__label">Preview</div>
          <MotionPreview theme={theme} />
        </div>
      </div>
      <div className="view-layout__canvas">
        <MotionCanvas />
      </div>
    </div>
  );
}

interface ControlProps {
  label: string;
  cssVar: string;
  theme: ThemeState;
  max?: number;
  description?: string;
}

function DurationControl({ label, cssVar, theme, max = 600 }: ControlProps) {
  const value = theme.getValue(cssVar);
  const ms = parseMs(value);
  const modified = theme.isModified(cssVar);

  return (
    <div className={`control ${modified ? 'control--modified' : ''}`}>
      <div className="control__row">
        <label className="control__label">{label}</label>
        <span className="control__value">{ms}ms</span>
        {modified && (
          <PfUtilityButton
            size="sm"
            onClick={() => theme.resetVar(cssVar)}
            label={`Reset ${label}`}
          >
            ↺
          </PfUtilityButton>
        )}
      </div>
      <PfSlider
        min={0}
        max={max}
        step={10}
        value={ms}
        onPfInput={(event) => theme.set(cssVar, `${event.detail.value}ms`)}
        aria-label={label}
      />
    </div>
  );
}

const EASING_PRESETS = [
  { label: 'In-Out', value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  { label: 'Ease Out', value: 'cubic-bezier(0, 0, 0.2, 1)' },
  { label: 'Ease In', value: 'cubic-bezier(0.4, 0, 1, 1)' },
  { label: 'Spring', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  { label: 'Linear', value: 'linear' },
];

function EasingCurve({ value }: { value: string }) {
  const NAMED: Record<string, [number, number, number, number]> = {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    'ease-in': [0.42, 0, 1, 1],
    'ease-out': [0, 0, 0.58, 1],
    'ease-in-out': [0.42, 0, 0.58, 1],
  };
  let x1 = 0.4,
    y1 = 0,
    x2 = 0.2,
    y2 = 1;
  if (NAMED[value]) {
    [x1, y1, x2, y2] = NAMED[value];
  } else {
    const m = value.match(
      /cubic-bezier\(\s*([\d.]+)\s*,\s*([\d.-]+)\s*,\s*([\d.]+)\s*,\s*([\d.-]+)\s*\)/,
    );
    if (m) {
      x1 = parseFloat(m[1]);
      y1 = parseFloat(m[2]);
      x2 = parseFloat(m[3]);
      y2 = parseFloat(m[4]);
    }
  }
  const W = 44,
    H = 32,
    pad = 5;
  const w = W - pad * 2,
    h = H - pad * 2;
  const path = `M ${pad} ${H - pad} C ${pad + x1 * w} ${H - pad - y1 * h} ${pad + x2 * w} ${H - pad - y2 * h} ${W - pad} ${pad}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="easing-curve" aria-hidden>
      <line
        x1={pad}
        y1={H - pad}
        x2={W - pad}
        y2={pad}
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.3"
      />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EasingControl({ label, cssVar, theme, description }: ControlProps) {
  const value = theme.getValue(cssVar);
  const modified = theme.isModified(cssVar);

  return (
    <div className={`control ${modified ? 'control--modified' : ''}`}>
      <div className="control__row">
        <label className="control__label">{label}</label>
        {modified && (
          <PfUtilityButton
            size="sm"
            onClick={() => theme.resetVar(cssVar)}
            label={`Reset ${label}`}
          >
            ↺
          </PfUtilityButton>
        )}
      </div>
      <div className="easing-chips">
        {EASING_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={`easing-chip ${value === p.value ? 'easing-chip--active' : ''}`}
            onClick={() => theme.set(cssVar, p.value)}
            title={p.value}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="easing-value-row">
        <EasingCurve value={value} />
        <div className="easing-input-wrap">
          <PfInput
            value={value}
            aria-label={`${label} easing value`}
            onPfInput={(event) => theme.set(cssVar, event.detail.value)}
          />
        </div>
      </div>
      {description && <p className="easing-description">{description}</p>}
    </div>
  );
}

function MotionPreview({ theme }: { theme: ThemeState }) {
  const fast = theme.getValue('--duration-fast');
  const moderate = theme.getValue('--duration-moderate');
  const slow = theme.getValue('--duration-slow');
  const easing = theme.getValue('--easing-standard');

  return (
    <div className="motion-preview">
      {[
        { label: 'Fast', duration: fast },
        { label: 'Moderate', duration: moderate },
        { label: 'Slow', duration: slow },
      ].map(({ label, duration }) => (
        <div key={label} className="motion-preview__row">
          <span className="motion-preview__label">{label}</span>
          <div className="motion-preview__track">
            <div
              className="motion-preview__dot"
              style={{
                animationDuration: duration,
                animationTimingFunction: easing,
              }}
            />
          </div>
          <span className="motion-preview__value">{duration}</span>
        </div>
      ))}
    </div>
  );
}

const ACCORDION_ITEMS = [
  {
    value: 'why-motion',
    title: 'Why does motion matter?',
    content:
      'Animation provides feedback, guides attention, and makes interactions feel responsive. Duration and easing together determine how natural a transition feels.',
  },
  {
    value: 'duration',
    title: 'Choosing the right duration',
    content:
      'Fast transitions (80–120 ms) suit micro-interactions like toggles. Moderate durations (150–250 ms) suit expanding panels and overlays. Slow transitions risk feeling sluggish.',
  },
  {
    value: 'easing',
    title: 'Standard vs decelerate easing',
    content:
      'Standard easing (ease-in-out) works for elements that stay on screen. Decelerate (ease-out) is ideal for elements entering the viewport — they slow to a stop naturally.',
  },
];

const SELECT_OPTIONS = [
  { value: 'accordion', label: 'Accordion' },
  { value: 'modal', label: 'Modal' },
  { value: 'tooltip', label: 'Tooltip' },
  { value: 'select', label: 'Select' },
  { value: 'combobox', label: 'Combobox' },
];

function MotionCanvas() {
  // One string, not an array: `pf-accordion`'s `value` is the open item.
  const [accordionValue, setAccordionValue] = useState('why-motion');
  const [switches, setSwitches] = useState({
    notifications: true,
    autosave: false,
    animations: true,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string>('');

  return (
    <div className="motion-canvas">
      <div className="motion-canvas__grid">
        {/* Always animating */}
        <PfCard>
          <PfCardHeader>
            <div className="motion-canvas__section-header">
              <span className="motion-canvas__section-title">Continuous</span>
              <code className="motion-canvas__token-badge">keyframe animation</code>
            </div>
          </PfCardHeader>
          <PfCardContent>
            <div className="motion-canvas__row">
              <div className="motion-canvas__item">
                <span className="motion-canvas__item-label">Spinner</span>
                <PfLoadingSpinner size={24} />
              </div>
              <div className="motion-canvas__item">
                <span className="motion-canvas__item-label">Dots</span>
                <PfLoadingDots />
              </div>
            </div>
          </PfCardContent>
        </PfCard>

        {/* Switch — fast */}
        <PfCard>
          <PfCardHeader>
            <div className="motion-canvas__section-header">
              <span className="motion-canvas__section-title">Toggle</span>
              <code className="motion-canvas__token-badge">
                --duration-fast + --easing-standard
              </code>
            </div>
          </PfCardHeader>
          <PfCardContent style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PfSwitch
              label="Enable notifications"
              checked={switches.notifications}
              onPfChange={(event) =>
                setSwitches((s) => ({ ...s, notifications: event.detail.checked }))
              }
            />
            <PfSwitch
              label="Auto-save drafts"
              checked={switches.autosave}
              onPfChange={(event) => setSwitches((s) => ({ ...s, autosave: event.detail.checked }))}
            />
            <PfSwitch
              label="Reduce animations"
              checked={switches.animations}
              onPfChange={(event) =>
                setSwitches((s) => ({ ...s, animations: event.detail.checked }))
              }
            />
          </PfCardContent>
        </PfCard>

        {/* Accordion — moderate */}
        <PfCard>
          <PfCardHeader>
            <div className="motion-canvas__section-header">
              <span className="motion-canvas__section-title">Expand / collapse</span>
              <code className="motion-canvas__token-badge">
                --duration-moderate + --easing-standard
              </code>
            </div>
          </PfCardHeader>
          {/*
            The React `Accordion` took an `items` array and a `string[]` value
            even in single mode. `pf-accordion` takes `pf-accordion-item`
            children, its `value` is the one open item's value, and its
            `pfChange` detail carries both -- `value` for single mode and
            `values` for multiple -- so the two modes read the same event.
          */}
          <PfAccordion
            type="single"
            value={accordionValue}
            onPfChange={(event) => setAccordionValue(event.detail.value)}
          >
            {ACCORDION_ITEMS.map((item) => (
              <PfAccordionItem key={item.value} value={item.value}>
                <span slot="title">{item.title}</span>
                {item.content}
              </PfAccordionItem>
            ))}
          </PfAccordion>
        </PfCard>

        {/* Select — enter animation */}
        <PfCard>
          <PfCardHeader>
            <div className="motion-canvas__section-header">
              <span className="motion-canvas__section-title">Dropdown enter</span>
              <code className="motion-canvas__token-badge">
                --duration-fast + --easing-decelerate
              </code>
            </div>
          </PfCardHeader>
          <PfCardContent>
            <PfSelect
              label="Component"
              value={selectedComponent}
              onPfChange={(event) => setSelectedComponent(event.detail.value)}
              placeholder="Open to see enter animation"
            >
              {SELECT_OPTIONS.map((option) => (
                <PfOption key={option.value} value={option.value}>
                  {option.label}
                </PfOption>
              ))}
            </PfSelect>
          </PfCardContent>
        </PfCard>

        {/* Tooltip + Modal — overlay enter/exit */}
        <PfCard>
          <PfCardHeader>
            <div className="motion-canvas__section-header">
              <span className="motion-canvas__section-title">Overlay enter / exit</span>
              <code className="motion-canvas__token-badge">
                --pf-transition-enter / --pf-transition-exit
              </code>
            </div>
          </PfCardHeader>
          <PfCardContent>
            <div className="motion-canvas__row motion-canvas__row--wrap">
              {/*
                `content` was a prop; it is the `content` slot here. The
                trigger stays the default slot, so the nesting is unchanged.
              */}
              <PfTooltip placement="top">
                <PfButton variant="secondary">Hover for tooltip</PfButton>
                <span slot="content">Appears with --duration-fast + --easing-decelerate</span>
              </PfTooltip>
              <PfButton variant="secondary" onClick={() => setModalOpen(true)}>
                Open modal
              </PfButton>
            </div>
          </PfCardContent>
        </PfCard>
      </div>

      <PfModal
        open={modalOpen}
        label="Motion in action"
        onPfOpenChange={(event) => setModalOpen(event.detail.open)}
      >
        <PfModalHeader>
          <strong>Motion in action</strong>
        </PfModalHeader>
        <PfModalBody>
          <p className="motion-canvas__modal-text">
            This modal entered with <code>--duration-moderate</code> +{' '}
            <code>--easing-decelerate</code>
            &nbsp;and will exit with <code>--duration-fast</code> + <code>--easing-accelerate</code>
            . Try adjusting the sliders on the left, then close and reopen.
          </p>
        </PfModalBody>
      </PfModal>
    </div>
  );
}

function parseMs(value: string): number {
  if (value.endsWith('ms')) return parseInt(value, 10) || 0;
  if (value.endsWith('s')) return Math.round(parseFloat(value) * 1000);
  return 0;
}
