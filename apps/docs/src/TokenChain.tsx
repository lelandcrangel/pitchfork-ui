import { useEffect, useRef, useState } from 'react';

import colorTokens from '../../../packages/tokens/src/tokens/color.json';

/**
 * The Theming page's opening diagram: one colour followed from the palette
 * token, through the semantic alias a consumer overrides, to the component
 * aliases and the elements that read it.
 *
 * Every value on it is read from the page's own computed styles rather than
 * typed in, so it shows the dark-mode value in dark mode and cannot disagree
 * with the stylesheet. The override buttons write the same declarations a
 * reader's `my-theme.css` would, on the same element (`:root`), because that is
 * the only place they work: a `--pf-*` alias declared on `:root` resolves its
 * `var()` there, so an override on any element below it never reaches the
 * alias. The overrides are removed when the page unmounts.
 */

const SEMANTIC = '--color-semantic-action-primary';

/** `{color.brand.700}` → `--color-brand-700`. */
const toVariable = (reference: string) => `--${reference.replace(/[{}]/g, '').replace(/\./g, '-')}`;

/*
 * The token the alias points at differs by mode (brand-700 in light, brand-600
 * in dark), so it is read from the token file rather than written here.
 */
const primary = colorTokens.color.semantic.action.primary;
const TOKENS = {
  light: toVariable(primary.$value),
  dark: toVariable(primary.$extensions['pitchfork.dark']),
};

/** The aliases the elements in the result row read, one each. */
const FEATURED = [
  '--pf-button-primary-bg',
  '--pf-checkbox-checked-bg',
  '--pf-switch-track-checked-bg',
  '--pf-progress-accent',
  '--pf-pagination-active-bg',
];

interface Preset {
  name: string;
  /** The declarations a reader would put on `:root`. Empty for the default. */
  values: Record<string, string>;
}

/** Each a 600–700 shade, so white text on it stays above 4.5:1. */
const PRESETS: Preset[] = [
  { name: 'Default', values: {} },
  {
    name: 'Violet',
    values: {
      [SEMANTIC]: '#7c3aed',
      [`${SEMANTIC}-hover`]: '#6d28d9',
      [`${SEMANTIC}-active`]: '#5b21b6',
      '--color-semantic-border-focus': '#7c3aed',
    },
  },
  {
    name: 'Teal',
    values: {
      [SEMANTIC]: '#0f766e',
      [`${SEMANTIC}-hover`]: '#115e59',
      [`${SEMANTIC}-active`]: '#134e4a',
      '--color-semantic-border-focus': '#0f766e',
    },
  },
  {
    name: 'Rose',
    values: {
      [SEMANTIC]: '#be123c',
      [`${SEMANTIC}-hover`]: '#9f1239',
      [`${SEMANTIC}-active`]: '#881337',
      '--color-semantic-border-focus': '#be123c',
    },
  },
];

const OVERRIDDEN = Array.from(new Set(PRESETS.flatMap((preset) => Object.keys(preset.values))));

const RESULT = `<pf-button variant="primary">Save changes</pf-button>
<pf-checkbox label="Remember me" checked></pf-checkbox>
<pf-switch label="Notifications" checked></pf-switch>
<pf-progress-bar label="Upload" value="64" style="width: 11rem"></pf-progress-bar>
<pf-pagination page="2" total-pages="5"></pf-pagination>`;

/**
 * Every `--pf-*` alias whose declared value names the semantic colour, read
 * from the stylesheets themselves so the count follows `theme.css`.
 */
const aliasesReading = (name: string): string[] => {
  const found = new Set<string>();
  // The name exactly: `-primary` must not also match `-primary-hover`.
  const reads = new RegExp(`var\\(\\s*${name}\\s*[,)]`);
  const visit = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        for (const property of Array.from(rule.style)) {
          if (property.startsWith('--pf-') && reads.test(rule.style.getPropertyValue(property))) {
            found.add(property);
          }
        }
      } else if ('cssRules' in rule) {
        visit((rule as CSSGroupingRule).cssRules);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      visit(sheet.cssRules);
    } catch {
      // A cross-origin sheet cannot be read, and holds none of ours.
    }
  }
  return Array.from(found);
};

const css = `
  .pf-chain {
    border: 1px solid var(--color-semantic-border-default);
    border-radius: 12px;
    background: var(--color-semantic-background-default);
    padding: 1.25rem;
    margin: 1.5rem 0 1rem;
    color: var(--color-semantic-text-default);
    font-size: 0.875rem;
    line-height: 1.45;
  }
  .pf-chain__tiers {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: 1fr;
    align-items: stretch;
  }
  .pf-chain__arrow {
    align-self: center;
    justify-self: center;
    color: var(--color-semantic-text-muted);
    font-size: 1.25rem;
    line-height: 1;
    transform: rotate(90deg);
  }
  @media (min-width: 760px) {
    .pf-chain__tiers {
      grid-template-columns: minmax(0, 0.9fr) auto minmax(0, 1.1fr) auto minmax(0, 1.25fr);
    }
    .pf-chain__arrow {
      transform: none;
    }
  }
  .pf-chain__tier {
    background: var(--color-semantic-background-subtle);
    border: 1px solid var(--color-semantic-border-default);
    border-radius: 10px;
    padding: 0.85rem 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .pf-chain__tier--focus {
    border: 2px solid var(${SEMANTIC});
    padding: calc(0.85rem - 1px) calc(0.9rem - 1px);
  }
  .pf-chain__tier--bypassed {
    border-style: dashed;
  }
  /* The note stays at full contrast; only what is no longer read fades. */
  .pf-chain__tier--bypassed .pf-chain__row,
  .pf-chain__arrow--bypassed {
    opacity: 0.4;
  }
  .pf-chain__label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-semantic-text-muted);
    margin: 0;
  }
  .pf-chain__row {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-width: 0;
    transition: opacity 160ms ease;
  }
  .pf-chain__swatch {
    flex: none;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 6px;
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
    transition: background-color 160ms ease;
  }
  .pf-chain__swatch--small {
    width: 0.95rem;
    height: 0.95rem;
    border-radius: 4px;
  }
  .pf-chain__name {
    font-family: var(--pf-code-font-family);
    font-size: 0.78rem;
    overflow-wrap: anywhere;
    min-width: 0;
  }
  .pf-chain__value {
    font-family: var(--pf-code-font-family);
    font-size: 0.72rem;
    color: var(--color-semantic-text-muted);
  }
  .pf-chain__note {
    margin: auto 0 0;
    font-size: 0.8rem;
    color: var(--color-semantic-text-muted);
  }
  .pf-chain__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.35rem;
  }
  /*
   * Storybook's docs sheet colours every li, p and code on the page; its
   * selectors are one class plus :where(), so two classes win here.
   */
  .pf-chain .pf-chain__list > li {
    color: var(--color-semantic-text-default);
    margin: 0;
  }
  .pf-chain .pf-chain__note code {
    background: var(--color-semantic-background-default);
    border: 1px solid var(--color-semantic-border-default);
    color: var(--color-semantic-text-default);
  }
  .pf-chain__more {
    font-size: 0.78rem;
    color: var(--color-semantic-text-muted);
    padding-left: 1.5rem;
  }
  .pf-chain__result {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px dashed var(--color-semantic-border-default);
  }
  .pf-chain__elements {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem 1.5rem;
    margin-top: 0.6rem;
  }
  .pf-chain__try {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px dashed var(--color-semantic-border-default);
    display: grid;
    gap: 0.6rem;
  }
  .pf-chain__presets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .pf-chain__preset {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    border: 1px solid var(--color-semantic-border-default);
    border-radius: 999px;
    background: var(--color-semantic-background-default);
    color: inherit;
    font: inherit;
    font-size: 0.8rem;
    padding: 0.3rem 0.75rem 0.3rem 0.4rem;
    cursor: pointer;
  }
  .pf-chain__preset[aria-pressed='true'] {
    border-color: var(--color-semantic-text-default);
    box-shadow: inset 0 0 0 1px var(--color-semantic-text-default);
  }
  .pf-chain__preset:focus-visible {
    outline: 2px solid var(--color-semantic-border-focus);
    outline-offset: 2px;
  }
  .pf-chain__code {
    font-family: var(--pf-code-font-family);
    font-size: 0.75rem;
    background: var(--color-semantic-background-default);
    border: 1px solid var(--color-semantic-border-default);
    border-radius: 8px;
    padding: 0.6rem 0.75rem;
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
`;

export const TokenChain = () => {
  const root = useRef<HTMLDivElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const [preset, setPreset] = useState(PRESETS[0]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [aliasCount, setAliasCount] = useState(0);
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const TOKEN = TOKENS[mode];

  /* Read every value the diagram shows from what the browser computed. */
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const read = () => {
      const style = getComputedStyle(element);
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      setMode(dark ? 'dark' : 'light');
      const next: Record<string, string> = {};
      for (const name of [TOKENS.light, TOKENS.dark, SEMANTIC, ...FEATURED]) {
        next[name] = style.getPropertyValue(name).trim();
      }
      setValues(next);
    };
    read();
    setAliasCount(aliasesReading(SEMANTIC).length);
    // The theme toolbar flips `data-theme`; an override writes `style`.
    const observer = new MutationObserver(() => requestAnimationFrame(read));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style'],
    });
    return () => observer.disconnect();
  }, []);

  /* Markup through the browser's parser, as on every element page. */
  useEffect(() => {
    if (result.current) result.current.innerHTML = RESULT;
  }, []);

  /* Apply the chosen override where a reader's stylesheet would: `:root`. */
  useEffect(() => {
    const { style } = document.documentElement;
    for (const name of OVERRIDDEN) style.removeProperty(name);
    for (const [name, value] of Object.entries(preset.values)) style.setProperty(name, value);
  }, [preset]);

  useEffect(
    () => () => {
      for (const name of OVERRIDDEN) document.documentElement.style.removeProperty(name);
    },
    [],
  );

  const overridden = Object.keys(preset.values).length > 0;
  const more = Math.max(aliasCount - FEATURED.length, 0);
  const declaration = overridden
    ? `:root {\n${Object.entries(preset.values)
        .map(([name, value]) => `  ${name}: ${value};`)
        .join('\n')}\n}`
    : `/* No override: ${SEMANTIC} points at ${TOKEN}. */`;

  return (
    <div className="pf-chain" ref={root}>
      <style>{css}</style>

      <div className="pf-chain__tiers">
        <section
          className={`pf-chain__tier${overridden ? ' pf-chain__tier--bypassed' : ''}`}
          aria-label="Token"
        >
          <p className="pf-chain__label">1 · Token</p>
          <div className="pf-chain__row">
            <span className="pf-chain__swatch" style={{ background: values[TOKEN] }} />
            <span>
              <span className="pf-chain__name">{TOKEN}</span>
              <br />
              <span className="pf-chain__value">{values[TOKEN]}</span>
            </span>
          </div>
          <p className="pf-chain__note">
            {overridden
              ? 'Unchanged, and no longer read by the alias.'
              : 'A fixed value from the palette. Never overridden.'}
          </p>
        </section>

        <span
          className={`pf-chain__arrow${overridden ? ' pf-chain__arrow--bypassed' : ''}`}
          aria-hidden="true"
        >
          →
        </span>

        <section className="pf-chain__tier pf-chain__tier--focus" aria-label="Semantic alias">
          <p className="pf-chain__label">2 · Semantic alias · override this</p>
          <div className="pf-chain__row">
            <span className="pf-chain__swatch" style={{ background: values[SEMANTIC] }} />
            <span>
              <span className="pf-chain__name">{SEMANTIC}</span>
              <br />
              <span className="pf-chain__value">
                {overridden ? `${values[SEMANTIC]} · your value` : `var(${TOKEN})`}
              </span>
            </span>
          </div>
          <p className="pf-chain__note">
            What the colour is for. One declaration on <code>:root</code> changes it everywhere.
          </p>
        </section>

        <span className="pf-chain__arrow" aria-hidden="true">
          →
        </span>

        <section className="pf-chain__tier" aria-label="Component aliases">
          <p className="pf-chain__label">3 · Component aliases</p>
          <ul className="pf-chain__list">
            {FEATURED.map((name) => (
              <li className="pf-chain__row" key={name}>
                <span
                  className="pf-chain__swatch pf-chain__swatch--small"
                  style={{ background: values[name] }}
                />
                <span className="pf-chain__name">{name}</span>
              </li>
            ))}
          </ul>
          {more > 0 && <span className="pf-chain__more">and {more} more</span>}
        </section>
      </div>

      <div className="pf-chain__result">
        <p className="pf-chain__label">Elements reading them</p>
        <div className="pf-chain__elements" ref={result} />
      </div>

      <div className="pf-chain__try">
        <p className="pf-chain__label">Try an override</p>
        <div className="pf-chain__presets" role="group" aria-label="Primary colour">
          {PRESETS.map((option) => (
            <button
              key={option.name}
              type="button"
              className="pf-chain__preset"
              aria-pressed={option === preset}
              onClick={() => setPreset(option)}
            >
              <span
                className="pf-chain__swatch pf-chain__swatch--small"
                style={{
                  background: option.values[SEMANTIC] ?? `var(${TOKEN})`,
                }}
              />
              {option.name}
            </button>
          ))}
        </div>
        <pre className="pf-chain__code">{declaration}</pre>
      </div>
    </div>
  );
};
