import { useEffect, useRef, useState } from 'react';

// Chrome fires `input` events continuously while dragging inside the color picker.
// Each fires React onChange → setState → re-render → React updates `input.defaultValue`
// → Chrome detects the DOM value attribute changed → closes the picker.
//
// Fix: capture the initial hex in useState at mount so defaultValue never changes.
// The component re-mounts (via `key` on the caller) only when an external batch
// operation replaces the whole scale, at which point the picker is already closed.
function StableColorInput({
  initialHex,
  onChange,
  onClick,
  ariaLabel,
  className,
}: {
  initialHex: string;
  onChange: (hex: string) => void;
  onClick?: React.MouseEventHandler<HTMLInputElement>;
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
      onClick={onClick}
      aria-label={ariaLabel}
    />
  );
}
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Table,
  UtilityButton,
} from '@pitchfork-ui/react';
import type { TableColumn } from '@pitchfork-ui/react';
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
  // Incremented whenever a batch operation changes all scales from the parent level,
  // so ScaleEditor instances re-mount their swatches with the correct defaultValues.
  const [masterRevision, setMasterRevision] = useState(0);

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
    setMasterRevision((r) => r + 1);
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
              Each block previews the <strong>500 stop</strong> of that scale. Click to scroll to
              its editor. The AA / AAA badges test white text on the <strong>700 stop</strong> — the
              shade typically used for primary actions and alert foregrounds.
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
              masterRevision={masterRevision}
            />
          ))}

          <BaseColorsSection theme={theme} />
        </div>
      </div>

      <div className="view-layout__canvas">
        <Canvas sections={['Buttons', 'Badges & Tags', 'Alerts', 'Avatar']}>
          <ContrastPanel theme={theme} />
        </Canvas>
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
            <StableColorInput
              initialHex={safe500}
              onChange={(hex) => applyScaleToTheme(scale.prefix, hex, theme)}
              onClick={(e) => e.stopPropagation()}
              ariaLabel={`${scale.name} seed color`}
              className="palette-block__picker"
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
  masterRevision: number;
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
  masterRevision,
  ref,
}: ScaleEditorProps) {
  const varName = (stop: string) => `${prefix}-${stop}`;
  const seed500 = theme.getValue(varName('500'));
  const [seedHex, setSeedHex] = useState(/^#[0-9a-fA-F]{6}$/.test(seed500) ? seed500 : defaultSeed);
  // Only increments on explicit reset/tint — NOT on handleSeed — so the seed
  // picker's key never changes while the user is actively picking a color.
  const [resetCount, setResetCount] = useState(0);
  const seedPickerKey = `seed-${masterRevision}-${resetCount}`;

  const anyModified = SCALE_STOPS.some((s) => theme.isModified(varName(s)));

  // Detect external resets (resetAll) by watching anyModified go true→false.
  // didExplicitReset guards against double-bumping when resetScale handles it directly.
  const prevAnyModified = useRef(false);
  const didExplicitReset = useRef(false);
  useEffect(() => {
    if (!anyModified && prevAnyModified.current) {
      if (!didExplicitReset.current) {
        setSeedHex(defaultSeed);
        setResetCount((c) => c + 1);
      }
      didExplicitReset.current = false;
    }
    prevAnyModified.current = anyModified;
  }, [anyModified, defaultSeed]);

  function handleSeed(hex: string) {
    setSeedHex(hex);
    applyScaleToTheme(prefix, hex, theme);
    // Intentionally do NOT change seedPickerKey here — the picker stays open.
  }

  function resetScale() {
    SCALE_STOPS.forEach((s) => theme.resetVar(varName(s)));
    setSeedHex(defaultSeed);
    setResetCount((c) => c + 1);
    didExplicitReset.current = true;
  }

  function tintGrayFromBrand() {
    const brandHex = theme.getValue('--color-brand-500');
    const base = oklch(brandHex as string);
    if (!base) return;
    const grayChroma = Math.min((base.c ?? 0.15) * 0.12, 0.022);
    const graySeed =
      formatHex({ mode: 'oklch', l: 0.59, c: grayChroma, h: base.h ?? 0 }) ?? defaultSeed;
    setSeedHex(graySeed);
    applyScaleToTheme(prefix, graySeed, theme);
    setResetCount((c) => c + 1);
  }

  return (
    <div className="scale-editor" ref={ref}>
      <div className="scale-editor__header">
        <span className="scale-editor__name">{name}</span>

        {showTintFromBrand && (
          <Button
            variant="ghost"
            size="sm"
            onClick={tintGrayFromBrand}
            title="Tint gray with brand hue — creates a subtle branded neutral"
            disabled={!brandModified}
          >
            Tint from brand ↗
          </Button>
        )}

        <div
          className="scale-editor__seed"
          title="Seed color — pick any hue to regenerate the scale"
        >
          <div className="scale-editor__seed-swatch" style={{ background: seedHex }} />
          <StableColorInput
            key={seedPickerKey}
            initialHex={seedHex}
            onChange={handleSeed}
            ariaLabel={`${name} seed color`}
            className="scale-editor__seed-picker"
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

      {showHarmony && <HarmonyChips seedHex={seedHex} onApply={handleSeed} />}

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
                <StableColorInput
                  key={resetCount}
                  initialHex={safeHex}
                  onChange={(hex) => theme.set(vn, hex)}
                  ariaLabel={`${name} ${stop}`}
                  className="swatch__picker"
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
      <p className="scale-editor__hint">
        The <strong>color circle</strong> in the header is the seed — pick any hue to auto-generate
        all 10 stops using perceptually even steps. Click any <strong>stop swatch</strong> to
        fine-tune that shade individually. The small <em>Aa</em> badge marks stops that pass AA
        contrast with white or dark text. Modified stops show a blue outline.
        {showTintFromBrand && (
          <>
            {' '}
            <strong>Tint from brand ↗</strong> shifts this gray scale to pick up a subtle warm or
            cool cast from your current brand hue — the button activates once the brand scale has
            been modified.
          </>
        )}
      </p>
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
    <>
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
      <p className="scale-editor__hint">
        Click a chip to preview that hue as your brand color — the entire brand scale regenerates
        instantly. The chips step outward in 30° increments from your current hue.
      </p>
    </>
  );
}

// ── Contrast Panel ───────────────────────────────────────

const CONTRAST_COLUMNS: TableColumn[] = [
  { key: 'preview', header: '', width: 48 },
  { key: 'name', header: 'Pair' },
  { key: 'note', header: 'Colors' },
  { key: 'ratio', header: 'Ratio', align: 'right', width: 72 },
  { key: 'level', header: 'WCAG', align: 'center', width: 72 },
];

function ContrastPanel({ theme }: { theme: ThemeState }) {
  const rows = CONTRAST_PAIRS.map((pair) => {
    const fgHex = theme.getValue(pair.fg);
    const bgHex = theme.getValue(pair.bg);
    const ratio = getContrastRatio(fgHex, bgHex);
    const level = getWCAGLevel(ratio);
    return {
      preview: (
        <div
          className="contrast-preview"
          style={{ background: bgHex, color: fgHex }}
          aria-hidden="true"
        >
          Aa
        </div>
      ),
      name: pair.name,
      note: <span className="contrast-note">{pair.note}</span>,
      ratio: `${ratio.toFixed(1)}:1`,
      level: <WCAGBadge level={level} />,
    };
  });

  return (
    <Card>
      <CardHeader>
        <span className="canvas__section-title">Accessibility — WCAG Contrast</span>
      </CardHeader>
      <CardContent>
        <Table columns={CONTRAST_COLUMNS} rows={rows} dense hoverable={false} />
      </CardContent>
      <CardFooter>
        <span className="contrast-panel__footnote">
          AA requires 4.5:1 (normal text) · 3:1 (large text / UI). AAA requires 7:1.
        </span>
      </CardFooter>
    </Card>
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
      <p className="scale-editor__hint">
        Base White and Base Black are not part of any tonal scale — they are fixed reference points
        that anchor semantic tokens for page backgrounds, body text, and borders. They also serve as
        the reference values in the WCAG contrast table.
      </p>
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
                <StableColorInput
                  key={modified ? 'modified' : 'default'}
                  initialHex={safeHex}
                  onChange={(hex) => theme.set(v, hex)}
                  ariaLabel={label}
                  className="swatch__picker"
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
