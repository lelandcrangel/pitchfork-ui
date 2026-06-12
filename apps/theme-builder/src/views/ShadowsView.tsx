import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Dropdown,
  Slider,
  UtilityButton,
} from '@pitchfork-ui/react';
import type { ThemeState } from '../hooks/useTheme';
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
          <UtilityButton
            size="sm"
            onClick={() => theme.resetVar(cssVar)}
            aria-label={`Reset ${label}`}
          >
            ↺
          </UtilityButton>
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
              <input
                type="color"
                className="shadow-control__color-picker"
                value={rgbToHex(parts.r, parts.g, parts.b)}
                aria-label={`${label} color`}
                onChange={(e) => {
                  const { r, g, b } = hexToRgb(e.target.value);
                  update({ r, g, b });
                }}
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
      <Slider min={min} max={max} value={value} onValueChange={onChange} aria-label={label} />
    </div>
  );
}

function ShadowCanvas() {
  return (
    <div className="shadow-canvas">
      <div className="shadow-canvas__grid">
        {/* Elevation scale */}
        <section className="shadow-canvas__section">
          <header className="shadow-canvas__section-header">
            <span className="shadow-canvas__section-title">Elevation scale</span>
            <code className="shadow-canvas__token-badge">Visual depth hierarchy</code>
          </header>
          <div className="shadow-canvas__card">
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
          </div>
        </section>

        {/* Card — shadow-sm */}
        <section className="shadow-canvas__section">
          <header className="shadow-canvas__section-header">
            <span className="shadow-canvas__section-title">Card</span>
            <code className="shadow-canvas__token-badge">--shadow-sm</code>
          </header>
          <Card>
            <CardHeader>
              <strong>Design tokens</strong>
            </CardHeader>
            <CardContent>
              <p className="shadow-canvas__card-text">
                Cards use <code>--shadow-sm</code> to sit just above the page surface. Drag the Y
                offset and blur sliders to change how cards lift off the background.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Dropdown — shadow-md */}
        <section className="shadow-canvas__section">
          <header className="shadow-canvas__section-header">
            <span className="shadow-canvas__section-title">Dropdown</span>
            <code className="shadow-canvas__token-badge">--shadow-md</code>
          </header>
          <div className="shadow-canvas__card">
            <p className="shadow-canvas__card-text">
              Dropdown menus use <code>--shadow-md</code> to float above the page. Open it to see
              the shadow in context.
            </p>
            <Dropdown label="Actions" items={DROPDOWN_ITEMS} />
          </div>
        </section>

        {/* Focus ring — shadow-focus */}
        <section className="shadow-canvas__section">
          <header className="shadow-canvas__section-header">
            <span className="shadow-canvas__section-title">Focus ring</span>
            <code className="shadow-canvas__token-badge">--shadow-focus</code>
          </header>
          <div className="shadow-canvas__card shadow-canvas__card--focus-demo">
            <p className="shadow-canvas__card-text">
              <code>--shadow-focus</code> defines the focus halo spread and opacity. Tab into these
              controls to see the token live.
            </p>
            <div className="shadow-canvas__focus-row">
              <Button>Primary button</Button>
              <Button variant="secondary">Secondary</Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
