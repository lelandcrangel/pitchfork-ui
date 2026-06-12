import { Input, UtilityButton } from '@pitchfork-ui/react';
import { useEffect, useRef, useState } from 'react';
import type { ThemeState } from '../hooks/useTheme';
import '../styles/controls.css';
import './TypographyView.css';

interface TypographyViewProps {
  theme: ThemeState;
}

export function TypographyView({ theme }: TypographyViewProps) {
  return (
    <div className="view-layout">
      <div className="view-layout__editor">
        <div className="typography-editor">
          <FontPicker
            label="Sans-serif"
            cssVar="--font-family-sans"
            category="sans"
            theme={theme}
          />
          <FontPicker label="Monospace" cssVar="--font-family-mono" category="mono" theme={theme} />
        </div>
      </div>
      <div className="view-layout__canvas">
        <TypographySpecimen theme={theme} />
      </div>
    </div>
  );
}

// ── Font data ────────────────────────────────────────────

interface FontOption {
  name: string;
  googleId: string | null; // null = system only, no Google Fonts URL
  stack: string;
}

const SANS_FONTS: FontOption[] = [
  { name: 'Geist', googleId: 'Geist', stack: 'Geist, Inter, ui-sans-serif, system-ui, sans-serif' },
  { name: 'Inter', googleId: 'Inter', stack: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  {
    name: 'DM Sans',
    googleId: 'DM+Sans',
    stack: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
  },
  {
    name: 'Plus Jakarta Sans',
    googleId: 'Plus+Jakarta+Sans',
    stack: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
  },
  { name: 'Outfit', googleId: 'Outfit', stack: 'Outfit, ui-sans-serif, system-ui, sans-serif' },
  { name: 'Nunito', googleId: 'Nunito', stack: 'Nunito, ui-sans-serif, system-ui, sans-serif' },
  { name: 'Poppins', googleId: 'Poppins', stack: 'Poppins, ui-sans-serif, system-ui, sans-serif' },
  { name: 'Roboto', googleId: 'Roboto', stack: 'Roboto, ui-sans-serif, system-ui, sans-serif' },
  {
    name: 'Open Sans',
    googleId: 'Open+Sans',
    stack: '"Open Sans", ui-sans-serif, system-ui, sans-serif',
  },
  { name: 'Lato', googleId: 'Lato', stack: 'Lato, ui-sans-serif, system-ui, sans-serif' },
];

const MONO_FONTS: FontOption[] = [
  {
    name: 'JetBrains Mono',
    googleId: 'JetBrains+Mono',
    stack: '"JetBrains Mono", ui-monospace, "Cascadia Code", monospace',
  },
  {
    name: 'Fira Code',
    googleId: 'Fira+Code',
    stack: '"Fira Code", ui-monospace, "Cascadia Code", monospace',
  },
  { name: 'Geist Mono', googleId: 'Geist+Mono', stack: '"Geist Mono", ui-monospace, monospace' },
  {
    name: 'Source Code Pro',
    googleId: 'Source+Code+Pro',
    stack: '"Source Code Pro", ui-monospace, monospace',
  },
  { name: 'Roboto Mono', googleId: 'Roboto+Mono', stack: '"Roboto Mono", ui-monospace, monospace' },
  { name: 'Inconsolata', googleId: 'Inconsolata', stack: 'Inconsolata, ui-monospace, monospace' },
  { name: 'Space Mono', googleId: 'Space+Mono', stack: '"Space Mono", ui-monospace, monospace' },
];

// ── Google Fonts loader ─────────────────────────────────

function googleFontsUrl(googleId: string): string {
  return `https://fonts.googleapis.com/css2?family=${googleId}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap`;
}

async function ensureFontLoaded(name: string, googleId: string | null): Promise<boolean> {
  if (document.fonts.check(`16px "${name}"`)) return true;
  if (!googleId) return false;

  const url = googleFontsUrl(googleId);
  if (!document.querySelector(`link[data-font="${googleId}"]`)) {
    await new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.dataset.font = googleId;
      link.onload = () => resolve();
      link.onerror = () => reject();
      document.head.appendChild(link);
    });
  }

  await document.fonts.ready;
  return document.fonts.check(`16px "${name}"`);
}

// ── FontPicker ───────────────────────────────────────────

type FontStatus = 'system' | 'web' | 'loading' | 'failed';

interface FontPickerProps {
  label: string;
  cssVar: string;
  category: 'sans' | 'mono';
  theme: ThemeState;
}

function FontPicker({ label, cssVar, category, theme }: FontPickerProps) {
  const fonts = category === 'sans' ? SANS_FONTS : MONO_FONTS;
  const currentStack = theme.getValue(cssVar);
  const currentName = currentStack.split(',')[0].trim().replace(/['"]/g, '');
  const modified = theme.isModified(cssVar);

  // Per-font status: system | web | loading | failed
  const [statuses, setStatuses] = useState<Record<string, FontStatus>>(() => {
    const map: Record<string, FontStatus> = {};
    fonts.forEach((f) => {
      map[f.name] = document.fonts.check(`16px "${f.name}"`) ? 'system' : 'web';
    });
    return map;
  });

  // Refresh system detection once fonts are ready (handles async font enumeration)
  useEffect(() => {
    document.fonts.ready.then(() => {
      setStatuses((prev) => {
        const next = { ...prev };
        fonts.forEach((f) => {
          if (next[f.name] === 'web' && document.fonts.check(`16px "${f.name}"`)) {
            next[f.name] = 'system';
          }
        });
        return next;
      });
    });
  }, [fonts]);

  const [customStack, setCustomStack] = useState('');
  const customRef = useRef<HTMLInputElement>(null);

  const handleSelect = async (font: FontOption) => {
    const current = statuses[font.name];
    if (current === 'system') {
      theme.set(cssVar, font.stack);
      return;
    }
    if (current === 'loading') return;

    setStatuses((prev) => ({ ...prev, [font.name]: 'loading' }));
    try {
      const ok = await ensureFontLoaded(font.name, font.googleId);
      setStatuses((prev) => ({ ...prev, [font.name]: ok ? 'system' : 'failed' }));
      if (ok) theme.set(cssVar, font.stack);
    } catch {
      setStatuses((prev) => ({ ...prev, [font.name]: 'failed' }));
    }
  };

  const handleCustomSubmit = () => {
    const val = customStack.trim();
    if (val) {
      theme.set(cssVar, val);
      setCustomStack('');
    }
  };

  const sampleText = category === 'sans' ? 'The quick brown fox' : '0Oo {}()=>';

  return (
    <div className="font-section">
      <div className="font-section__header">
        <div className="editor-section__label" style={{ margin: 0 }}>
          {label}
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

      <div className="font-picker" role="listbox" aria-label={`${label} font`}>
        {fonts.map((font) => {
          const status = statuses[font.name];
          const isActive = currentName === font.name;
          const isAvailable = status === 'system';

          return (
            <button
              key={font.name}
              role="option"
              aria-selected={isActive}
              className={`font-option ${isActive ? 'font-option--active' : ''} ${status === 'failed' ? 'font-option--failed' : ''}`}
              onClick={() => handleSelect(font)}
              disabled={status === 'loading'}
            >
              <span
                className="font-option__name"
                style={isAvailable ? { fontFamily: font.stack } : undefined}
              >
                {font.name}
              </span>
              <span
                className="font-option__sample"
                style={isAvailable ? { fontFamily: font.stack } : undefined}
              >
                {isAvailable ? sampleText : '—'}
              </span>
              <span className={`font-option__badge font-option__badge--${status}`}>
                {status === 'system' && 'System'}
                {status === 'web' && 'Web ↓'}
                {status === 'loading' && '…'}
                {status === 'failed' && 'Failed'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="font-custom">
        <p className="font-custom__note">
          Custom font stack — type any font installed on your system, or paste a font-family string.
        </p>
        <div className="font-custom__row">
          <Input
            ref={customRef}
            value={customStack}
            placeholder={currentStack}
            aria-label="Custom font stack"
            spellCheck={false}
            onChange={(e) => setCustomStack(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
          />
          <button
            className="font-custom__apply"
            onClick={handleCustomSubmit}
            disabled={!customStack.trim()}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Type specimen ────────────────────────────────────────

function TypographySpecimen({ theme }: { theme: ThemeState }) {
  const sans = theme.getValue('--font-family-sans');
  const mono = theme.getValue('--font-family-mono');
  const sansName = sans.split(',')[0].trim().replace(/['"]/g, '');
  const monoName = mono.split(',')[0].trim().replace(/['"]/g, '');

  return (
    <div className="type-specimen">
      <div className="type-specimen__section" style={{ fontFamily: sans }}>
        <p className="type-specimen__label">Sans — {sansName}</p>
        <p className="type-specimen__display">The quick brown fox</p>
        <p className="type-specimen__heading">Jumps over the lazy dog</p>
        <p className="type-specimen__body">
          A design system is a collection of reusable components, guided by clear standards, that
          can be assembled to build any number of applications.
        </p>
        <p className="type-specimen__weights">
          <span style={{ fontWeight: 300 }}>Light</span>
          <span style={{ fontWeight: 400 }}>Regular</span>
          <span style={{ fontWeight: 500 }}>Medium</span>
          <span style={{ fontWeight: 600 }}>Semibold</span>
          <span style={{ fontWeight: 700 }}>Bold</span>
        </p>
        <p className="type-specimen__small">
          Label · Helper text · Caption — 11px / 12px / 14px / 16px / 20px
        </p>
      </div>

      <div className="type-specimen__divider" />

      <div className="type-specimen__section" style={{ fontFamily: mono }}>
        <p className="type-specimen__label">Mono — {monoName}</p>
        <p className="type-specimen__code">{'const theme = { brand: "#6366f1" };'}</p>
        <p className="type-specimen__code">{'--color-brand-500: oklch(59% 0.204 277);'}</p>
        <p className="type-specimen__code">{'0 O o 1 l I { } ( ) [ ] = > =>'}</p>
      </div>
    </div>
  );
}
