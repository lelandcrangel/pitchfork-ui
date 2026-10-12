import {
  PfButton,
  PfCard,
  PfCardContent,
  PfCardHeader,
  PfDropdown,
  PfInput,
  PfMenuItem,
  PfSlider,
  PfUtilityButton,
} from '@pitchfork-ui/elements-react';
import { useState } from 'react';
import type { ThemeState } from '../hooks/useTheme';

function StableColorInput({
  initialHex,
  onChange,
  ariaLabel,
  className,
}: {
  initialHex: string;
  onChange: (hex: string) => void;
  ariaLabel: string;
  className: string;
}) {
  const [stableHex] = useState(initialHex);
  return (
    <input
      type="color"
      className={className}
      defaultValue={stableHex}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
    />
  );
}
import { hexToRgb, parseShadow, rgbToHex, serializeShadow } from '../utils/shadow';
import '../styles/controls.css';
import './ShadowsView.css';

interface ShadowsViewProps {
  theme: ThemeState;
}

const SHADOW_VARS = [
  { label: 'Shadow SM', var: '--shadow-sm', hint: 'Cards, surfaces', mode: 'elevation' as const },
  {
    label: 'Shadow MD',
    var: '--shadow-md',
    hint: 'Dropdowns, popovers',
    mode: 'elevation' as const,
  },
  {
    label: 'Shadow LG',
    var: '--shadow-lg',
    hint: 'Modals, high elevation',
    mode: 'elevation' as const,
  },
  {
    label: 'Focus Ring',
    var: '--shadow-focus',
    hint: 'Keyboard focus indicator',
    mode: 'focus' as const,
  },
] as const;

const DROPDOWN_ITEMS = [
  { label: 'Duplicate', value: 'duplicate' },
  { label: 'Rename', value: 'rename' },
  { label: 'Move to…', value: 'move' },
  { label: 'Delete', value: 'delete', destructive: true },
];

export function ShadowsView({ theme }: ShadowsViewProps) {
  return (
    <div className="view-layout">
      <div className="view-layout__editor">
        <div className="shadows-editor">
          <div className="editor-section">
            <div className="editor-section__label">Box Shadows</div>
            {SHADOW_VARS.map((s) => (
              <ShadowControl
                key={s.var}
                label={s.label}
                hint={s.hint}
                cssVar={s.var}
                mode={s.mode}
                theme={theme}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="view-layout__canvas">
        <ShadowCanvas />
      </div>
    </div>
  );
}

interface ShadowControlProps {
  label: string;
  hint: string;
  cssVar: string;
  mode: 'elevation' | 'focus';
  theme: ThemeState;
}

function ShadowControl({ label, hint, cssVar, mode, theme }: ShadowControlProps) {
  const value = theme.getValue(cssVar);
  const parts = parseShadow(value);
  const modified = theme.isModified(cssVar);

  const update = (patch: Partial<typeof parts>) => {
    if (!parts) return;
    theme.set(cssVar, serializeShadow({ ...parts, ...patch }));
  };

  const handleReset = () => {
    theme.resetVar(cssVar);
  };

  return (
    <div className={`shadow-control ${modified ? 'shadow-control--modified' : ''}`}>
      <div className="shadow-control__header">
        <div className="shadow-control__preview-wrap">
          <div className="shadow-control__preview" style={{ boxShadow: value }} />
        </div>
        <div className="shadow-control__meta">
          <span className="shadow-control__label">{label}</span>
          <span className="shadow-control__hint">{hint}</span>
        </div>
        {modified && (
          <PfUtilityButton size="sm" onClick={handleReset} label={`Reset ${label}`}>
            ↺
          </PfUtilityButton>
        )}
      </div>

      {parts ? (
        <div className="shadow-control__sliders">
          {mode === 'elevation' && (
            <>
              <SliderRow
                label="Y offset"
                value={parts.y}
                min={0}
                max={48}
                unit="px"
                onChange={(y) => update({ y })}
              />
              <SliderRow
                label="Blur"
                value={parts.blur}
                min={0}
                max={80}
                unit="px"
                onChange={(blur) => update({ blur })}
              />
            </>
          )}

          {mode === 'focus' && (
            <SliderRow
              label="Spread"
              value={parts.spread}
              min={0}
              max={12}
              unit="px"
              onChange={(spread) => update({ spread })}
            />
          )}

          <SliderRow
            label="Opacity"
            value={Math.round(parts.opacity * 100)}
            min={0}
            max={60}
            unit="%"
            onChange={(v) => update({ opacity: v / 100 })}
          />

          <div className="shadow-control__color-row">
            <span className="shadow-control__color-label">Color</span>
            <div className="shadow-control__color-swatch-wrap">
              <div
                className="shadow-control__color-swatch"
                style={{ background: rgbToHex(parts.r, parts.g, parts.b) }}
              />
              <StableColorInput
                initialHex={rgbToHex(parts.r, parts.g, parts.b)}
                onChange={(hex) => {
                  const { r, g, b } = hexToRgb(hex);
                  update({ r, g, b });
                }}
                ariaLabel={`${label} color`}
                className="shadow-control__color-picker"
              />
            </div>
            <span className="shadow-control__color-hex">
              {rgbToHex(parts.r, parts.g, parts.b).toUpperCase()}
            </span>
          </div>
        </div>
      ) : (
        <p className="shadow-control__unparseable">
          Value couldn't be parsed — edit directly in the raw value field.
        </p>
      )}
    </div>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, min, max, unit, onChange }: SliderRowProps) {
  return (
    <div className="control">
      <div className="control__row">
        <span className="control__label">{label}</span>
        <span className="control__value">
          {value}
          {unit}
        </span>
      </div>
      {/*
        `pfInput` rather than `pfChange`: the React `Slider`'s `onValueChange`
        fired on every move, and `pfChange` is the commit at the end of a drag.
        Both exist on the element; this control redraws a live preview, so it
        wants the stream.
      */}
      <PfSlider
        min={min}
        max={max}
        value={value}
        onPfInput={(event) => onChange(event.detail.value)}
        aria-label={label}
      />
    </div>
  );
}

function ShadowCanvas() {
  return (
    <div className="shadow-canvas">
      <div className="shadow-canvas__grid">
        {/* Elevation scale */}
        <PfCard>
          <PfCardHeader>
            <div className="shadow-canvas__section-header">
              <span className="shadow-canvas__section-title">Elevation scale</span>
              <code className="shadow-canvas__token-badge">Visual depth hierarchy</code>
            </div>
          </PfCardHeader>
          <PfCardContent>
            <div className="shadow-canvas__elevation-row">
              {(
                [
                  { token: '--shadow-sm', label: 'SM', desc: 'Cards, surfaces' },
                  { token: '--shadow-md', label: 'MD', desc: 'Dropdowns, popovers' },
                  { token: '--shadow-lg', label: 'LG', desc: 'Modals, overlays' },
                ] as const
              ).map(({ token, desc }) => (
                <div key={token} className="shadow-canvas__elevation-item">
                  <div className="shadow-canvas__tile" style={{ boxShadow: `var(${token})` }} />
                  <code className="shadow-canvas__tile-token">{token}</code>
                  <span className="shadow-canvas__tile-desc">{desc}</span>
                </div>
              ))}
            </div>
          </PfCardContent>
        </PfCard>

        {/* Card — shadow-sm */}
        <PfCard>
          <PfCardHeader>
            <div className="shadow-canvas__section-header">
              <span className="shadow-canvas__section-title">PfCard</span>
              <code className="shadow-canvas__token-badge">--shadow-sm</code>
            </div>
          </PfCardHeader>
          <PfCardContent>
            <PfCard>
              <PfCardHeader>
                <strong>Design tokens</strong>
              </PfCardHeader>
              <PfCardContent>
                <p className="shadow-canvas__card-text">
                  Cards use <code>--shadow-sm</code> to sit just above the page surface. Drag the Y
                  offset and blur sliders to change how cards lift off the background.
                </p>
              </PfCardContent>
            </PfCard>
          </PfCardContent>
        </PfCard>

        {/* Dropdown — shadow-md */}
        <PfCard>
          <PfCardHeader>
            <div className="shadow-canvas__section-header">
              <span className="shadow-canvas__section-title">Dropdown</span>
              <code className="shadow-canvas__token-badge">--shadow-md</code>
            </div>
          </PfCardHeader>
          <PfCardContent style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p className="shadow-canvas__card-text">
              Dropdown menus use <code>--shadow-md</code> to float above the page. Open it to see
              the shadow in context.
            </p>
            {/*
              The React `Dropdown` took an `items` array. `pf-dropdown` takes
              its trigger as the default slot and its menu as the `menu` slot,
              with one `pf-menu-item` per entry -- the consumer loops.
            */}
            <PfDropdown label="Actions" onPfSelect={() => {}}>
              <PfButton variant="secondary">Actions</PfButton>
              <div slot="menu">
                {DROPDOWN_ITEMS.map((item) => (
                  <PfMenuItem key={item.value} value={item.value} destructive={item.destructive}>
                    {item.label}
                  </PfMenuItem>
                ))}
              </div>
            </PfDropdown>
          </PfCardContent>
        </PfCard>

        {/* Focus ring — shadow-focus */}
        <PfCard>
          <PfCardHeader>
            <div className="shadow-canvas__section-header">
              <span className="shadow-canvas__section-title">Focus ring</span>
              <code className="shadow-canvas__token-badge">--shadow-focus</code>
            </div>
          </PfCardHeader>
          <PfCardContent style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p className="shadow-canvas__card-text">
              <code>--shadow-focus</code> is the keyboard focus indicator applied to all interactive
              elements. Adjust spread, opacity, and color in the sidebar to see changes here in real
              time.
            </p>
            <div className="shadow-canvas__focus-row">
              <PfButton className="shadow-canvas__focus-demo">Primary</PfButton>
              <PfButton variant="secondary" className="shadow-canvas__focus-demo">
                Secondary
              </PfButton>
              <PfButton variant="ghost" className="shadow-canvas__focus-demo">
                Ghost
              </PfButton>
            </div>
            <div className="shadow-canvas__focus-row">
              <PfInput
                label="Email address"
                placeholder="you@example.com"
                className="shadow-canvas__focus-demo-input"
              />
            </div>
          </PfCardContent>
        </PfCard>
      </div>
    </div>
  );
}
