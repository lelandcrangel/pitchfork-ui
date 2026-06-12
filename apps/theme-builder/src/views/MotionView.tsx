import {
  Accordion,
  Button,
  LoadingDots,
  LoadingSpinner,
  Input,
  Modal,
  Select,
  Slider,
  Switch,
  Tooltip,
  UtilityButton,
} from '@pitchfork-ui/react';
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
            <EasingControl label="Standard" cssVar="--easing-standard" theme={theme} />
            <EasingControl label="Decelerate" cssVar="--easing-decelerate" theme={theme} />
            <EasingControl label="Accelerate" cssVar="--easing-accelerate" theme={theme} />
          </div>
          <div className="motion-preview-section">
            <div className="editor-section__label">Preview</div>
            <MotionPreview theme={theme} />
          </div>
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
          <UtilityButton
            size="sm"
            onClick={() => theme.resetVar(cssVar)}
            aria-label={`Reset ${label}`}
          >
            ↺
          </UtilityButton>
        )}
      </div>
      <Slider
        min={0}
        max={max}
        step={10}
        value={ms}
        onValueChange={(n) => theme.set(cssVar, `${n}ms`)}
        aria-label={label}
      />
    </div>
  );
}

function EasingControl({ label, cssVar, theme }: ControlProps) {
  const value = theme.getValue(cssVar);
  const modified = theme.isModified(cssVar);

  return (
    <div className={`control ${modified ? 'control--modified' : ''}`}>
      <div className="control__row">
        <label className="control__label">{label}</label>
        {modified && (
          <UtilityButton
            size="sm"
            onClick={() => theme.resetVar(cssVar)}
            aria-label={`Reset ${label}`}
          >
            ↺
          </UtilityButton>
        )}
      </div>
      <div className="control__text-wrap">
        <Input
          value={value}
          aria-label={label}
          onChange={(e) => theme.set(cssVar, e.target.value)}
          spellCheck={false}
        />
      </div>
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
  const [accordionValue, setAccordionValue] = useState<string[]>(['why-motion']);
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
        <section className="motion-canvas__section">
          <header className="motion-canvas__section-header">
            <span className="motion-canvas__section-title">Continuous</span>
            <code className="motion-canvas__token-badge">keyframe animation</code>
          </header>
          <div className="motion-canvas__card">
            <div className="motion-canvas__row">
              <div className="motion-canvas__item">
                <span className="motion-canvas__item-label">Spinner</span>
                <LoadingSpinner size={24} />
              </div>
              <div className="motion-canvas__item">
                <span className="motion-canvas__item-label">Dots</span>
                <LoadingDots />
              </div>
            </div>
          </div>
        </section>

        {/* Switch — fast */}
        <section className="motion-canvas__section">
          <header className="motion-canvas__section-header">
            <span className="motion-canvas__section-title">Toggle</span>
            <code className="motion-canvas__token-badge">--duration-fast + --easing-standard</code>
          </header>
          <div className="motion-canvas__card motion-canvas__card--col">
            <Switch
              label="Enable notifications"
              checked={switches.notifications}
              onChange={(e) => setSwitches((s) => ({ ...s, notifications: e.target.checked }))}
            />
            <Switch
              label="Auto-save drafts"
              checked={switches.autosave}
              onChange={(e) => setSwitches((s) => ({ ...s, autosave: e.target.checked }))}
            />
            <Switch
              label="Reduce animations"
              checked={switches.animations}
              onChange={(e) => setSwitches((s) => ({ ...s, animations: e.target.checked }))}
            />
          </div>
        </section>

        {/* Accordion — moderate */}
        <section className="motion-canvas__section">
          <header className="motion-canvas__section-header">
            <span className="motion-canvas__section-title">Expand / collapse</span>
            <code className="motion-canvas__token-badge">
              --duration-moderate + --easing-standard
            </code>
          </header>
          <div className="motion-canvas__card motion-canvas__card--flush">
            <Accordion
              items={ACCORDION_ITEMS}
              type="single"
              value={accordionValue}
              onValueChange={setAccordionValue}
            />
          </div>
        </section>

        {/* Select — enter animation */}
        <section className="motion-canvas__section">
          <header className="motion-canvas__section-header">
            <span className="motion-canvas__section-title">Dropdown enter</span>
            <code className="motion-canvas__token-badge">
              --duration-fast + --easing-decelerate
            </code>
          </header>
          <div className="motion-canvas__card">
            <Select
              label="Component"
              options={SELECT_OPTIONS}
              value={selectedComponent}
              onValueChange={setSelectedComponent}
              placeholder="Open to see enter animation"
            />
          </div>
        </section>

        {/* Tooltip + Modal — overlay enter/exit */}
        <section className="motion-canvas__section">
          <header className="motion-canvas__section-header">
            <span className="motion-canvas__section-title">Overlay enter / exit</span>
            <code className="motion-canvas__token-badge">
              --pf-transition-enter / --pf-transition-exit
            </code>
          </header>
          <div className="motion-canvas__card">
            <div className="motion-canvas__row motion-canvas__row--wrap">
              <Tooltip content="Appears with --duration-fast + --easing-decelerate" placement="top">
                <Button variant="secondary">Hover for tooltip</Button>
              </Tooltip>
              <Button variant="secondary" onClick={() => setModalOpen(true)}>
                Open modal
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Modal open={modalOpen} onOpenChange={setModalOpen} title="Motion in action">
        <p
          style={{
            margin: 0,
            color: 'var(--color-semantic-text-muted)',
            fontSize: '14px',
            lineHeight: 1.6,
          }}
        >
          This modal entered with <code>--duration-moderate</code> +{' '}
          <code>--easing-decelerate</code>
          &nbsp;and will exit with <code>--duration-fast</code> + <code>--easing-accelerate</code>.
          Try adjusting the sliders on the left, then close and reopen.
        </p>
      </Modal>
    </div>
  );
}

function parseMs(value: string): number {
  if (value.endsWith('ms')) return parseInt(value, 10) || 0;
  if (value.endsWith('s')) return Math.round(parseFloat(value) * 1000);
  return 0;
}
