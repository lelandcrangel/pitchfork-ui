import { useRef } from 'react';
import { Button, UtilityButton } from '@pitchfork-ui/react';
import { Canvas } from '../components/Canvas';
import { formatHex, oklch } from 'culori';
import {
  generateScale,
  getHarmonyHues,
  suggestPaletteFromBrand,
  SCALE_STOPS,
} from '../utils/colorScale';
import { getContrastRatio, getWCAGLevel, passesAA, type WCAGLevel } from '../utils/contrast';
import type { ThemeState } from '../hooks/useTheme';
import './ColorsView.css';

interface ColorsViewProps {
  theme: ThemeState;
}

const SCALES = [
  { name: 'Brand', prefix: '--color-brand', defaultSeed: '#6366f1' },
  { name: 'Gray', prefix: '--color-gray', defaultSeed: '#64748b' },
  { name: 'Success', prefix: '--color-success', defaultSeed: '#12b76a' },
  { name: 'Warning', prefix: '--color-warning', defaultSeed: '#f79009' },
  { name: 'Danger', prefix: '--color-danger', defaultSeed: '#f04438' },
] as const;

type ScaleName = (typeof SCALES)[number]['name'];

const CONTRAST_PAIRS = [
  {
    name: 'Primary button',
    fg: '--color-base-white',
    bg: '--color-brand-700',
    note: 'White text · action primary',
  },
  {
    name: 'Brand on tint',
    fg: '--color-brand-700',
    bg: '--color-brand-50',
    note: 'Brand-700 on brand-50',
  },
  {
    name: 'Body text',
    fg: '--color-gray-900',
    bg: '--color-base-white',
    note: 'Gray-900 on white',
  },
  {
    name: 'Muted text',
    fg: '--color-gray-500',
    bg: '--color-base-white',
    note: 'Gray-500 on white',
  },
  {
    name: 'Subtle text',
    fg: '--color-gray-600',
    bg: '--color-base-white',
    note: 'Gray-600 on white',
  },
  {
    name: 'Disabled text',
    fg: '--color-gray-400',
    bg: '--color-base-white',
    note: 'Gray-400 on white (expected fail)',
  },
  {
    name: 'Focus ring',
    fg: '--color-brand-500',
    bg: '--color-base-white',
    note: 'Brand-500 on white',
  },
  {
    name: 'Success alert',
    fg: '--color-success-700',
    bg: '--color-success-50',
    note: 'Success-700 on success-50',
  },
  {
    name: 'Warning alert',
    fg: '--color-warning-700',
    bg: '--color-warning-50',
    note: 'Warning-700 on warning-50',
  },
  {
    name: 'Danger alert',
    fg: '--color-danger-700',
    bg: '--color-danger-50',
    note: 'Danger-700 on danger-50',
  },
] as const;

function applyScaleToTheme(prefix: string, seedHex: string, theme: ThemeState) {
  const scale = generateScale(seedHex);
  SCALE_STOPS.forEach((stop) => {
    const color = scale[stop];
    if (color) theme.set(`${prefix}-${stop}`, color);
  });
}

export function ColorsView({ theme }: ColorsViewProps) {
  const scaleRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function scrollToScale(name: ScaleName) {
    scaleRefs.current[name]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleGeneratePalette() {
    const brandSeed = theme.getValue('--color-brand-500');
    const suggestions = suggestPaletteFromBrand(brandSeed);
    Object.entries(suggestions).forEach(([prefix, scale]) => {
      Object.entries(scale).forEach(([stop, color]) => {
        theme.set(`${prefix}-${stop}`, color);
      });
    });
  }

  const brandModified = SCALE_STOPS.some((s) => theme.isModified(`--color-brand-${s}`));

  return (
    <div className="view-layout">
      <div className="view-layout__editor">
        <div className="colors-editor">
          {/* Palette strip */}
          <div className="palette-section">
            <div className="palette-section__header">
              <span className="palette-section__label">Palette</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleGeneratePalette}
                title="Derive gray and status scales from the current brand color"
              >
                Generate from brand
              </Button>
            </div>
            <PaletteStrip theme={theme} onScaleClick={scrollToScale} />
            <p className="palette-section__hint">
              Click a swatch to jump to that scale. Badges show WCAG contrast of white text on the
              700 stop.
            </p>
          </div>

          {/* Scale editors */}
          {SCALES.map((scale) => (
            <ScaleEditor
              key={scale.name}
              ref={(el) => {
                scaleRefs.current[scale.name] = el;
              }}
              name={scale.name}
              prefix={scale.prefix}
              defaultSeed={scale.defaultSeed}
              theme={theme}
              showHarmony={scale.name === 'Brand'}
              showTintFromBrand={scale.name === 'Gray'}
              brandModified={brandModified}
            />
          ))}

          <BaseColorsSection theme={theme} />
        </div>
      </div>

      <div className="view-layout__canvas">
        <Canvas sections={['Buttons', 'Badges & Tags', 'Alerts', 'Avatar']} />
        <ContrastPanel theme={theme} />
      </div>
    </div>
  );
}

// ── Palette Strip ───────────────────────────────────────

interface PaletteStripProps {
  theme: ThemeState;
  onScaleClick: (name: ScaleName) => void;
}

function PaletteStrip({ theme, onScaleClick }: PaletteStripProps) {
  return (
    <div className="palette-strip">
      {SCALES.map((scale) => {
        const hex500 = theme.getValue(`${scale.prefix}-500`);
        const hex700 = theme.getValue(`${scale.prefix}-700`);
        const safe500 = /^#[0-9a-fA-F]{6}$/.test(hex500) ? hex500 : scale.defaultSeed;
        const isLight = isColorLight(hex500);

        // Contrast: white text on the 700 (the primary action level)
        const whiteOn700 = getContrastRatio(hex700, '#ffffff');
        const level700 = getWCAGLevel(whiteOn700);

        return (
          <div
            key={scale.name}
            className="palette-block"
            style={{ background: hex500 }}
            onClick={() => onScaleClick(scale.name)}
            role="button"
            tabIndex={0}
            aria-label={`${scale.name} ${hex500}. Click to jump to editor.`}
            onKeyDown={(e) => e.key === 'Enter' && onScaleClick(scale.name)}
          >
            <input
              type="color"
              className="palette-block__picker"
              value={safe500}
              onChange={(e) => applyScaleToTheme(scale.prefix, e.target.value, theme)}
              aria-label={`${scale.name} seed color`}
              onClick={(e) => e.stopPropagation()}
            />
            <div
              className={`wcag-badge wcag-badge--${level700} palette-block__badge`}
              title={`White on ${scale.name}-700: ${whiteOn700.toFixed(1)}:1`}
            >
              {level700 === 'fail' ? '✗' : level700 === 'AA-large' ? '~AA' : level700}
            </div>
            <div
              className={`palette-block__footer ${isLight ? 'palette-block__footer--dark' : ''}`}
            >
              <span className="palette-block__name">{scale.name}</span>
              <span className="palette-block__hex">{hex500.toUpperCase()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function isColorLight(hex: string): boolean {
  const c = oklch(hex as string);
  return c ? c.l > 0.65 : false;
}

// ── Scale Editor ────────────────────────────────────────

interface ScaleEditorProps {
  name: string;
  prefix: string;
  defaultSeed: string;
  theme: ThemeState;
  showHarmony?: boolean;
  showTintFromBrand?: boolean;
  brandModified?: boolean;
  ref: React.Ref<HTMLDivElement>;
}

const ScaleEditor = function ScaleEditor({
  name,
  prefix,
  defaultSeed,
  theme,
  showHarmony,
  showTintFromBrand,
  brandModified,
  ref,
}: ScaleEditorProps) {
  const varName = (stop: string) => `${prefix}-${stop}`;
  const seed500 = theme.getValue(varName('500'));
  const safeSeed = /^#[0-9a-fA-F]{6}$/.test(seed500) ? seed500 : defaultSeed;
  const anyModified = SCALE_STOPS.some((s) => theme.isModified(varName(s)));

  function handleSeed(hex: string) {
    applyScaleToTheme(prefix, hex, theme);
  }

  function resetScale() {
    SCALE_STOPS.forEach((s) => theme.resetVar(varName(s)));
  }

  function tintGrayFromBrand() {
    const brandHex = theme.getValue('--color-brand-500');
    const base = oklch(brandHex as string);
    if (!base) return;
    const grayChroma = Math.min((base.c ?? 0.15) * 0.12, 0.022);
    const graySeed =
      formatHex({ mode: 'oklch', l: 0.59, c: grayChroma, h: base.h ?? 0 }) ?? defaultSeed;
    applyScaleToTheme(prefix, graySeed, theme);
  }

  return (
    <div className="scale-editor" ref={ref}>
      <div className="scale-editor__header">
        <span className="scale-editor__name">{name}</span>

        {showTintFromBrand && (
          <button
            className="scale-editor__tint-btn"
            onClick={tintGrayFromBrand}
            title="Tint gray with brand hue — creates a subtle branded neutral"
            disabled={!brandModified}
          >
            Tint from brand ↗
          </button>
        )}

        <div
          className="scale-editor__seed"
          title="Seed color — pick any hue to regenerate the scale"
        >
          <div className="scale-editor__seed-swatch" style={{ background: safeSeed }} />
          <input
            type="color"
            className="scale-editor__seed-picker"
            value={safeSeed}
            onChange={(e) => handleSeed(e.target.value)}
            aria-label={`${name} seed color`}
          />
        </div>

        {anyModified && (
          <UtilityButton
            size="sm"
            onClick={resetScale}
            aria-label={`Reset ${name} scale`}
            title="Reset all stops"
          >
            ↺
          </UtilityButton>
        )}
      </div>

      {showHarmony && <HarmonyChips seedHex={safeSeed} onApply={handleSeed} />}

      <div className="scale-editor__swatches">
        {SCALE_STOPS.map((stop) => {
          const vn = varName(stop);
          const value = theme.getValue(vn);
          const safeHex = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
          const modified = theme.isModified(vn);

          const whiteContrast = getContrastRatio(value, '#ffffff');
          const darkContrast = getContrastRatio(value, '#0f172a');
          const showWhiteAa = passesAA(whiteContrast);
          const showDarkAa = !showWhiteAa && passesAA(darkContrast);

          return (
            <div key={stop} className={`swatch ${modified ? 'swatch--modified' : ''}`}>
              <div
                className="swatch__color"
                style={{ background: value }}
                title={`${stop}: ${value.toUpperCase()} | White ${whiteContrast.toFixed(1)}:1 · Dark ${darkContrast.toFixed(1)}:1`}
              >
                <input
                  type="color"
                  className="swatch__picker"
                  value={safeHex}
                  onChange={(e) => theme.set(vn, e.target.value)}
                  aria-label={`${name} ${stop}`}
                />
                {showWhiteAa && (
                  <span className="swatch__aa swatch__aa--white" aria-hidden="true">
                    Aa
                  </span>
                )}
                {showDarkAa && (
                  <span className="swatch__aa swatch__aa--dark" aria-hidden="true">
                    Aa
                  </span>
                )}
              </div>
              <span className="swatch__stop">{stop}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Harmony Chips ────────────────────────────────────────

function HarmonyChips({ seedHex, onApply }: { seedHex: string; onApply: (hex: string) => void }) {
  const hues = getHarmonyHues(seedHex);
  const labels = ['-90°', '-60°', '-30°', 'Current', '+30°', '+60°', '+90°'];
  const base = oklch(seedHex as string);
  const baseHue = base?.h ?? 0;

  return (
    <div className="harmony-chips">
      <span className="harmony-chips__label">Harmonics</span>
      <div className="harmony-chips__row">
        {hues.map((hex, i) => {
          const chipBase = oklch(hex as string);
          const chipHue = chipBase?.h ?? 0;
          const isActive = Math.abs(chipHue - baseHue) < 5;
          return (
            <button
              key={i}
              className={`harmony-chip ${isActive ? 'harmony-chip--active' : ''}`}
              style={{ background: hex }}
              onClick={() => onApply(hex)}
              title={labels[i]}
              aria-label={`Apply ${labels[i]} hue`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Contrast Panel ───────────────────────────────────────

function ContrastPanel({ theme }: { theme: ThemeState }) {
  return (
    <div className="contrast-panel">
      <div className="contrast-panel__header">
        <span className="contrast-panel__title">Accessibility — WCAG Contrast</span>
        <span className="contrast-panel__legend">
          <span className="wcag-badge wcag-badge--AAA">AAA</span>
          <span className="wcag-badge wcag-badge--AA">AA</span>
          <span className="wcag-badge wcag-badge--AA-large">~AA</span>
          <span className="wcag-badge wcag-badge--fail">Fail</span>
        </span>
      </div>

      <div className="contrast-grid">
        {CONTRAST_PAIRS.map((pair) => {
          const fgHex = theme.getValue(pair.fg);
          const bgHex = theme.getValue(pair.bg);
          const ratio = getContrastRatio(fgHex, bgHex);
          const level = getWCAGLevel(ratio);

          return (
            <div
              key={pair.name}
              className={`contrast-row ${level === 'fail' ? 'contrast-row--fail' : ''}`}
            >
              <div
                className="contrast-preview"
                style={{ background: bgHex, color: fgHex }}
                aria-hidden="true"
              >
                Aa
              </div>
              <div className="contrast-info">
                <span className="contrast-name">{pair.name}</span>
                <span className="contrast-note">{pair.note}</span>
              </div>
              <div className="contrast-ratio" title={`${ratio.toFixed(2)}:1`}>
                {ratio.toFixed(1)}:1
              </div>
              <div className={`wcag-badge wcag-badge--${level}`}>
                {level === 'fail' ? 'Fail' : level === 'AA-large' ? '~AA' : level}
              </div>
            </div>
          );
        })}
      </div>

      <p className="contrast-panel__footnote">
        AA requires 4.5:1 (normal text) · 3:1 (large text / UI). AAA requires 7:1.
      </p>
    </div>
  );
}

// ── Base Colors ──────────────────────────────────────────

function BaseColorsSection({ theme }: { theme: ThemeState }) {
  const colors = [
    { label: 'Base White', var: '--color-base-white', defaultHex: '#ffffff' },
    { label: 'Base Black', var: '--color-base-black', defaultHex: '#0b0b0f' },
  ];

  return (
    <div className="scale-editor">
      <div className="scale-editor__header">
        <span className="scale-editor__name">Base</span>
      </div>
      <div className="base-colors">
        {colors.map(({ label, var: v, defaultHex }) => {
          const value = theme.getValue(v);
          const safeHex = /^#[0-9a-fA-F]{6}$/.test(value) ? value : defaultHex;
          const modified = theme.isModified(v);
          return (
            <div key={v} className="base-color">
              <div
                className="base-color__swatch"
                style={{ background: value }}
                title={`${v}: ${value}`}
              >
                <input
                  type="color"
                  className="swatch__picker"
                  value={safeHex}
                  onChange={(e) => theme.set(v, e.target.value)}
                  aria-label={label}
                />
              </div>
              <span className="base-color__label">{label}</span>
              {modified && (
                <UtilityButton
                  size="sm"
                  onClick={() => theme.resetVar(v)}
                  aria-label={`Reset ${label}`}
                >
                  ↺
                </UtilityButton>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── WCAG Badge ───────────────────────────────────────────

export function WCAGBadge({ level }: { level: WCAGLevel }) {
  const label = level === 'fail' ? 'Fail' : level === 'AA-large' ? '~AA' : level;
  return <span className={`wcag-badge wcag-badge--${level}`}>{label}</span>;
}
