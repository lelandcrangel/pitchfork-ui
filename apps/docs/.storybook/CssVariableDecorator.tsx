import { type CSSProperties, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@pitchfork-ui/react';
import { createPortal } from 'react-dom';
import colorTokens from '../../../packages/tokens/src/tokens/color.json';
import sizeTokens from '../../../packages/tokens/src/tokens/size.json';
import shadowTokens from '../../../packages/tokens/src/tokens/shadow.json';

type CssVariableScope = string;

interface CssVariableControl {
  name: string;
  label: string;
  defaultValue: string;
  type?: 'color' | 'radius' | 'shadow' | 'space' | 'text';
  scopes: CssVariableScope[];
  variants?: string[];
}

interface ColorOption {
  label: string;
  value: string;
  swatch: string;
}

interface TokenOption {
  label: string;
  value: string;
}

// ─── Token-driven options (auto-generated from token JSON) ──────────────────

function flattenColorTokens(node: Record<string, unknown>, path: string[] = []): ColorOption[] {
  if (!node || typeof node !== 'object') return [];
  if ('$value' in node) {
    // path is e.g. ['color', 'base', 'white'] → cssVar = var(--color-base-white)
    const cssVar = `var(--${path.join('-')})`;
    const label = path
      .slice(1) // drop the leading 'color' segment
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
    return [{ label, value: cssVar, swatch: cssVar }];
  }
  return Object.entries(node).flatMap(([key, value]) =>
    flattenColorTokens(value as Record<string, unknown>, [...path, key]),
  );
}

const COLOR_OPTIONS: ColorOption[] = flattenColorTokens(
  colorTokens as unknown as Record<string, unknown>,
);

const TOKEN_OPTIONS: Record<'radius' | 'shadow' | 'space', TokenOption[]> = {
  radius: Object.entries((sizeTokens as { radius: Record<string, { $value: string }> }).radius).map(
    ([key, token]) => ({
      label: `radius-${key} (${token.$value})`,
      value: `var(--radius-${key})`,
    }),
  ),
  shadow: Object.entries(
    (shadowTokens as { shadow: Record<string, { $value: string }> }).shadow,
  ).map(([key]) => ({
    label: `shadow-${key}`,
    value: `var(--shadow-${key})`,
  })),
  space: Object.entries((sizeTokens as { space: Record<string, { $value: string }> }).space).map(
    ([key, token]) => ({
      label: `space-${key} (${token.$value})`,
      value: `var(--space-${key})`,
    }),
  ),
};

// ─── Auto-extract controls from component CSS ────────────────────────────────

const cssFiles = import.meta.glob<string>('../../../packages/react/src/components/**/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function getVarType(varName: string): 'color' | 'radius' | 'shadow' | 'space' {
  if (varName.includes('-shadow') || varName.includes('-elevation-')) return 'shadow';
  if (varName.includes('-radius')) return 'radius';
  if (
    varName.includes('-height') ||
    varName.includes('-width') ||
    varName.includes('-size') ||
    varName.includes('-space') ||
    varName.includes('-gap') ||
    varName.includes('-padding')
  )
    return 'space';
  return 'color';
}

function generateVarLabel(varName: string, scope: string): string {
  const prefix = `--pf-${scope}-`;
  const rest = varName.startsWith(prefix) ? varName.slice(prefix.length) : varName;
  return rest
    .replace(/^color-semantic-/, '')
    .replace(/^color-/, '')
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function extractControlsFromCss(cssContent: string, scope: string): CssVariableControl[] {
  const seen = new Set<string>();
  const controls: CssVariableControl[] = [];
  // Match var(--pf-X) with or without a fallback value
  const re = /var\((--pf-[a-z][a-z0-9-]*)(?:,\s*([^,)][^)]*(?:\([^)]*\)[^)]*)?))?\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(cssContent)) !== null) {
    const [, varName, rawFallback] = match;
    if (seen.has(varName)) continue;
    seen.add(varName);
    controls.push({
      name: varName,
      label: generateVarLabel(varName, scope),
      defaultValue: rawFallback?.trim() ?? '',
      type: getVarType(varName),
      scopes: [scope],
    });
  }
  return controls;
}

function scopeFromPath(path: string): string {
  const match = path.match(/components\/([^/]+)\//);
  return match ? match[1].toLowerCase() : '';
}

function buildGeneratedControls(existingScopes: Set<string>): CssVariableControl[] {
  const byScope: Record<string, CssVariableControl[]> = {};
  for (const [path, content] of Object.entries(cssFiles)) {
    const scope = scopeFromPath(path);
    if (!scope || existingScopes.has(scope)) continue;
    byScope[scope] ??= [];
    byScope[scope].push(...extractControlsFromCss(content, scope));
  }
  // De-duplicate within each scope
  return Object.entries(byScope).flatMap(([, controls]) => {
    const seen = new Set<string>();
    return controls.filter((c) => {
      if (seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    });
  });
}

const CSS_VARIABLE_CONTROLS: CssVariableControl[] = [
  // Icon color variable
  {
    name: '--pf-icon-color',
    label: 'Icon color',
    defaultValue: 'currentColor',
    type: 'color',
    scopes: ['icon'],
  },

  // CreditCard variables
  {
    name: '--pf-credit-card-border',
    label: 'Card border',
    defaultValue: 'color-mix(in srgb, var(--color-base-white) 25%, transparent)',
    type: 'color',
    scopes: ['creditcard'],
  },
  {
    name: '--pf-credit-card-glare',
    label: 'Card glare highlight',
    defaultValue: 'color-mix(in srgb, var(--color-base-white) 22%, transparent)',
    type: 'color',
    scopes: ['creditcard'],
  },
  {
    name: '--pf-credit-card-generic-gradient',
    label: 'Generic card background',
    defaultValue:
      'linear-gradient(135deg, var(--color-gray-800), var(--color-gray-900) 55%, var(--color-gray-700))',
    type: 'color',
    scopes: ['creditcard'],
  },
  {
    name: '--pf-credit-card-visa-gradient',
    label: 'Visa card background',
    defaultValue:
      'linear-gradient(135deg, var(--color-brand-700), var(--color-brand-900) 55%, var(--color-brand-700))',
    type: 'color',
    scopes: ['creditcard'],
  },
  {
    name: '--pf-credit-card-mastercard-gradient',
    label: 'Mastercard background',
    defaultValue:
      'linear-gradient(135deg, var(--color-warning-600), var(--color-warning-800) 55%, var(--color-danger-500))',
    type: 'color',
    scopes: ['creditcard'],
  },
  {
    name: '--pf-credit-card-amex-gradient',
    label: 'Amex card background',
    defaultValue:
      'linear-gradient(135deg, var(--color-success-700), var(--color-success-800) 55%, var(--color-gray-800))',
    type: 'color',
    scopes: ['creditcard'],
  },
  {
    name: '--pf-credit-card-chip-gradient',
    label: 'Chip background',
    defaultValue: 'linear-gradient(135deg, var(--color-gray-50), var(--color-gray-300))',
    type: 'color',
    scopes: ['creditcard'],
  },
  {
    name: '--radius-lg',
    label: 'Card border radius',
    defaultValue: 'var(--radius-lg)',
    type: 'radius',
    scopes: ['creditcard'],
  },
  {
    name: '--shadow-md',
    label: 'Card shadow',
    defaultValue: '0 4px 24px 0 rgb(16 30 54 / 8%)',
    type: 'shadow',
    scopes: ['creditcard'],
  },
  {
    name: '--space-4',
    label: 'Card padding',
    defaultValue: '16px',
    type: 'space',
    scopes: ['creditcard'],
  },
  {
    name: '--pf-credit-card-text-color',
    label: 'Text color',
    defaultValue: 'var(--color-base-white)',
    type: 'color',
    scopes: ['creditcard'],
  },
  // Dropdown variables
  {
    name: '--pf-dropdown-button-secondary-bg',
    label: 'Trigger background',
    defaultValue: 'var(--pf-button-secondary-bg)',
    type: 'color',
    scopes: ['dropdown'],
  },
  {
    name: '--pf-dropdown-button-secondary-bg-hover',
    label: 'Trigger background (hover)',
    defaultValue: 'var(--pf-button-secondary-bg-hover)',
    type: 'color',
    scopes: ['dropdown'],
  },
  {
    name: '--pf-dropdown-button-secondary-border',
    label: 'Trigger border',
    defaultValue: 'var(--pf-button-secondary-border)',
    type: 'color',
    scopes: ['dropdown'],
  },
  {
    name: '--pf-dropdown-button-secondary-border-hover',
    label: 'Trigger border (hover)',
    defaultValue: 'var(--pf-button-secondary-border-hover)',
    type: 'color',
    scopes: ['dropdown'],
  },
  {
    name: '--pf-dropdown-button-secondary-text',
    label: 'Trigger text color',
    defaultValue: 'var(--pf-button-secondary-text)',
    type: 'color',
    scopes: ['dropdown'],
  },
  {
    name: '--pf-dropdown-surface-bg',
    label: 'Menu background',
    defaultValue: 'var(--pf-surface-bg)',
    type: 'color',
    scopes: ['dropdown'],
  },
  {
    name: '--pf-dropdown-surface-border',
    label: 'Menu border',
    defaultValue: 'var(--pf-surface-border)',
    type: 'color',
    scopes: ['dropdown'],
  },
  {
    name: '--pf-dropdown-surface-subtle',
    label: 'Menu item hover',
    defaultValue: 'var(--pf-surface-subtle)',
    type: 'color',
    scopes: ['dropdown'],
  },
  {
    name: '--pf-dropdown-text',
    label: 'Menu text color',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['dropdown'],
  },
  {
    name: '--pf-dropdown-text-muted',
    label: 'Menu text color (muted)',
    defaultValue: 'var(--color-semantic-text-muted)',
    type: 'color',
    scopes: ['dropdown'],
  },
  {
    name: '--pf-dropdown-text-danger',
    label: 'Destructive item color',
    defaultValue: 'var(--color-semantic-status-danger-foreground)',
    type: 'color',
    scopes: ['dropdown'],
  },
  {
    name: '--pf-dropdown-icon-danger',
    label: 'Destructive icon color',
    defaultValue: 'var(--color-danger-500)',
    type: 'color',
    scopes: ['dropdown'],
  },
  {
    name: '--radius-md',
    label: 'Menu/trigger border radius',
    defaultValue: 'var(--radius-md)',
    type: 'radius',
    scopes: ['dropdown'],
  },
  {
    name: '--radius-sm',
    label: 'Menu item border radius',
    defaultValue: 'var(--radius-sm)',
    type: 'radius',
    scopes: ['dropdown'],
  },
  {
    name: '--shadow-md',
    label: 'Menu shadow',
    defaultValue: 'var(--shadow-md)',
    type: 'shadow',
    scopes: ['dropdown'],
  },
  // Card variables
  {
    name: '--pf-card-background',
    label: 'Card background',
    defaultValue: 'var(--color-semantic-background-default)',
    type: 'color',
    scopes: ['card'],
  },
  {
    name: '--pf-card-border',
    label: 'Card border',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['card'],
  },
  {
    name: '--pf-card-radius',
    label: 'Card border radius',
    defaultValue: 'var(--radius-lg)',
    type: 'radius',
    scopes: ['card'],
  },
  {
    name: '--pf-card-shadow',
    label: 'Card shadow',
    defaultValue: 'var(--shadow-sm)',
    type: 'shadow',
    scopes: ['card'],
  },
  {
    name: '--pf-card-section-padding',
    label: 'Card section padding',
    defaultValue: 'var(--space-4)',
    type: 'space',
    scopes: ['card'],
  },
  {
    name: '--pf-card-header-border',
    label: 'Card header border',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['card'],
  },
  {
    name: '--pf-card-footer-border',
    label: 'Card footer border',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['card'],
  },
  // Carousel variables
  {
    name: '--pf-carousel-bg',
    label: 'Carousel background',
    defaultValue: 'var(--color-semantic-background-default)',
    type: 'color',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-border',
    label: 'Carousel border',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-radius',
    label: 'Carousel border radius',
    defaultValue: 'var(--radius-md)',
    type: 'radius',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-gap',
    label: 'Carousel gap',
    defaultValue: 'var(--space-3)',
    type: 'space',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-padding',
    label: 'Carousel padding',
    defaultValue: 'var(--space-3)',
    type: 'space',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-viewport-bg',
    label: 'Carousel viewport background',
    defaultValue: 'var(--color-semantic-background-subtle)',
    type: 'color',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-viewport-radius',
    label: 'Carousel viewport radius',
    defaultValue: 'var(--radius-sm)',
    type: 'radius',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-transition-duration',
    label: 'Carousel slide transition',
    defaultValue: '180ms',
    type: 'text',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-slide-background',
    label: 'Carousel slide background',
    defaultValue: 'transparent',
    type: 'color',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-slide-text',
    label: 'Carousel slide text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-slide-muted-text',
    label: 'Carousel slide muted text',
    defaultValue: 'var(--color-semantic-text-muted)',
    type: 'color',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-slide-border',
    label: 'Carousel slide border',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-slide-padding',
    label: 'Carousel slide padding',
    defaultValue: 'var(--space-0)',
    type: 'space',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-empty-text',
    label: 'Carousel empty text',
    defaultValue: 'var(--color-semantic-text-muted)',
    type: 'color',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-empty-font-size',
    label: 'Carousel empty font size',
    defaultValue: 'var(--font-size-sm)',
    type: 'text',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-empty-min-height',
    label: 'Carousel empty min height',
    defaultValue: '180px',
    type: 'text',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-empty-padding',
    label: 'Carousel empty padding',
    defaultValue: 'var(--space-4)',
    type: 'space',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-controls-gap',
    label: 'Carousel controls gap',
    defaultValue: 'var(--space-2)',
    type: 'space',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-nav-text',
    label: 'Carousel nav text',
    defaultValue: 'var(--color-semantic-text-muted)',
    type: 'color',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-nav-hover-bg',
    label: 'Carousel nav hover background',
    defaultValue: 'var(--color-semantic-background-subtle)',
    type: 'color',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-nav-hover-text',
    label: 'Carousel nav hover text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-nav-radius',
    label: 'Carousel nav radius',
    defaultValue: 'var(--radius-sm)',
    type: 'radius',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-nav-size',
    label: 'Carousel nav size',
    defaultValue: '28px',
    type: 'text',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-nav-font-size',
    label: 'Carousel nav font size',
    defaultValue: '14px',
    type: 'text',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-disabled-opacity',
    label: 'Carousel disabled opacity',
    defaultValue: '0.45',
    type: 'text',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-indicator-bg',
    label: 'Carousel indicator background',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-indicator-active-bg',
    label: 'Carousel active indicator',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-indicator-gap',
    label: 'Carousel indicator gap',
    defaultValue: 'var(--space-1)',
    type: 'space',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-indicator-size',
    label: 'Carousel indicator size',
    defaultValue: '8px',
    type: 'text',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-indicator-active-width',
    label: 'Carousel active indicator width',
    defaultValue: '20px',
    type: 'text',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-indicator-radius',
    label: 'Carousel indicator radius',
    defaultValue: 'var(--radius-full)',
    type: 'radius',
    scopes: ['carousel'],
  },
  {
    name: '--pf-carousel-indicator-transition-duration',
    label: 'Carousel indicator transition',
    defaultValue: '120ms',
    type: 'text',
    scopes: ['carousel'],
  },
  {
    name: '--pf-button-primary-bg',
    label: 'Button primary bg',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['button'],
    variants: ['primary'],
  },
  {
    name: '--pf-button-primary-bg-hover',
    label: 'Button primary hover bg',
    defaultValue: 'var(--color-semantic-action-primary-hover)',
    type: 'color',
    scopes: ['button'],
    variants: ['primary'],
  },
  {
    name: '--pf-button-primary-text',
    label: 'Button primary text',
    defaultValue: 'var(--color-semantic-action-primary-text)',
    type: 'color',
    scopes: ['button'],
    variants: ['primary'],
  },
  {
    name: '--pf-button-secondary-bg',
    label: 'Button secondary bg',
    defaultValue: 'var(--color-semantic-background-default)',
    type: 'color',
    scopes: ['button'],
    variants: ['secondary'],
  },
  {
    name: '--pf-button-secondary-border',
    label: 'Button secondary border',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['button'],
    variants: ['secondary'],
  },
  {
    name: '--pf-button-secondary-text',
    label: 'Button secondary text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['button'],
    variants: ['secondary'],
  },
  {
    name: '--pf-button-ghost-text',
    label: 'Button ghost text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['button'],
    variants: ['ghost'],
  },
  {
    name: '--pf-button-ghost-bg-hover',
    label: 'Button ghost hover bg',
    defaultValue: 'var(--color-semantic-background-subtle)',
    type: 'color',
    scopes: ['button'],
    variants: ['ghost'],
  },
  {
    name: '--pf-checkbox-checked-bg',
    label: 'Checkbox checked background',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['checkbox'],
  },
  {
    name: '--pf-checkbox-check-color',
    label: 'Checkbox check color',
    defaultValue: 'var(--color-semantic-action-primary-text)',
    type: 'color',
    scopes: ['checkbox'],
  },
  {
    name: '--pf-checkbox-label-text',
    label: 'Checkbox label text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['checkbox'],
  },
  {
    name: '--pf-code-snippet-bg',
    label: 'CodeSnippet background',
    defaultValue: 'var(--color-gray-900)',
    type: 'color',
    scopes: ['codesnippet'],
  },
  {
    name: '--pf-code-snippet-text',
    label: 'CodeSnippet text',
    defaultValue: 'var(--color-gray-100)',
    type: 'color',
    scopes: ['codesnippet'],
  },
  {
    name: '--pf-code-snippet-border',
    label: 'CodeSnippet border',
    defaultValue: 'color-mix(in srgb, var(--pf-code-snippet-bg) 82%, var(--color-base-white))',
    type: 'color',
    scopes: ['codesnippet'],
  },
  {
    name: '--pf-code-snippet-header-bg',
    label: 'CodeSnippet header background',
    defaultValue: 'color-mix(in srgb, var(--pf-code-snippet-bg) 78%, var(--color-base-white))',
    type: 'color',
    scopes: ['codesnippet'],
  },
  {
    name: '--pf-code-snippet-header-border',
    label: 'CodeSnippet header border',
    defaultValue: 'color-mix(in srgb, var(--pf-code-snippet-bg) 65%, var(--color-base-white))',
    type: 'color',
    scopes: ['codesnippet'],
  },
  {
    name: '--pf-code-snippet-title',
    label: 'CodeSnippet title',
    defaultValue: 'var(--color-base-white)',
    type: 'color',
    scopes: ['codesnippet'],
  },
  {
    name: '--pf-code-snippet-language',
    label: 'CodeSnippet language',
    defaultValue: 'var(--color-gray-300)',
    type: 'color',
    scopes: ['codesnippet'],
  },
  {
    name: '--pf-code-snippet-copy-bg',
    label: 'CodeSnippet copy background',
    defaultValue: 'color-mix(in srgb, var(--pf-code-snippet-bg) 70%, var(--color-base-white))',
    type: 'color',
    scopes: ['codesnippet'],
  },
  {
    name: '--pf-code-snippet-copy-border',
    label: 'CodeSnippet copy border',
    defaultValue: 'color-mix(in srgb, var(--pf-code-snippet-bg) 55%, var(--color-base-white))',
    type: 'color',
    scopes: ['codesnippet'],
  },
  {
    name: '--pf-code-snippet-copy-text',
    label: 'CodeSnippet copy text',
    defaultValue: 'var(--color-gray-100)',
    type: 'color',
    scopes: ['codesnippet'],
  },
  {
    name: '--pf-code-snippet-copy-hover-bg',
    label: 'CodeSnippet copy hover background',
    defaultValue: 'color-mix(in srgb, var(--pf-code-snippet-bg) 58%, var(--color-base-white))',
    type: 'color',
    scopes: ['codesnippet'],
  },
  {
    name: '--pf-code-snippet-line-number',
    label: 'CodeSnippet line number',
    defaultValue: 'var(--color-gray-400)',
    type: 'color',
    scopes: ['codesnippet'],
  },
  {
    name: '--pf-radio-checked-color',
    label: 'Radio checked color',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['radio'],
  },
  {
    name: '--pf-radio-label-text',
    label: 'Radio label text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['radio'],
  },
  {
    name: '--pf-switch-track-bg',
    label: 'Switch track bg',
    defaultValue: 'var(--color-gray-300)',
    type: 'color',
    scopes: ['switch'],
  },
  {
    name: '--pf-switch-track-checked-bg',
    label: 'Switch checked track bg',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['switch'],
  },
  {
    name: '--pf-switch-thumb-bg',
    label: 'Switch thumb bg',
    defaultValue: 'var(--color-base-white)',
    type: 'color',
    scopes: ['switch'],
  },
  {
    name: '--pf-switch-label-text',
    label: 'Switch label text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['switch'],
  },
  {
    name: '--pf-avatar-bg',
    label: 'Avatar background',
    defaultValue: 'var(--pf-surface-subtle)',
    type: 'color',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-border',
    label: 'Avatar border',
    defaultValue: 'var(--pf-surface-border)',
    type: 'color',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-text',
    label: 'Avatar text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-status-border',
    label: 'Avatar status border',
    defaultValue: 'var(--pf-surface-bg)',
    type: 'color',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-status-size',
    label: 'Avatar status size',
    defaultValue: '10px',
    type: 'text',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-status-offset',
    label: 'Avatar status offset',
    defaultValue: '-2px',
    type: 'text',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-status-online',
    label: 'Avatar status online',
    defaultValue: 'var(--color-semantic-status-success-bright)',
    type: 'color',
    scopes: ['avatar'],
  },
  // ButtonGroup variables
  {
    name: '--pf-buttongroup-bg',
    label: 'ButtonGroup background',
    defaultValue: 'var(--color-semantic-background-default)',
    type: 'color',
    scopes: ['buttongroup'],
  },
  {
    name: '--pf-buttongroup-bg-subtle',
    label: 'ButtonGroup background subtle',
    defaultValue: 'var(--color-semantic-background-subtle)',
    type: 'color',
    scopes: ['buttongroup'],
  },
  {
    name: '--pf-buttongroup-border',
    label: 'ButtonGroup border',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['buttongroup'],
  },
  {
    name: '--pf-buttongroup-text',
    label: 'ButtonGroup text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['buttongroup'],
  },
  {
    name: '--pf-buttongroup-action-primary',
    label: 'ButtonGroup selected background',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['buttongroup'],
  },
  {
    name: '--pf-buttongroup-action-primary-hover',
    label: 'ButtonGroup selected hover background',
    defaultValue: 'var(--color-semantic-action-primary-hover)',
    type: 'color',
    scopes: ['buttongroup'],
  },
  {
    name: '--pf-buttongroup-action-primary-text',
    label: 'ButtonGroup selected text',
    defaultValue: 'var(--color-semantic-action-primary-text)',
    type: 'color',
    scopes: ['buttongroup'],
  },
  {
    name: '--pf-avatar-status-away',
    label: 'Avatar status away',
    defaultValue: 'var(--color-semantic-status-warning-bright)',
    type: 'color',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-status-busy',
    label: 'Avatar status busy',
    defaultValue: 'var(--color-semantic-status-danger-bright)',
    type: 'color',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-status-offline',
    label: 'Avatar status offline',
    defaultValue: 'var(--color-semantic-text-muted)',
    type: 'color',
    scopes: ['avatar'],
  },
  {
    name: '--pf-input-border',
    label: 'Input border',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['input', 'select'],
  },
  {
    name: '--pf-input-text',
    label: 'Input text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['input', 'select'],
  },
  {
    name: '--pf-select-option-active-bg',
    label: 'Select active option bg',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['select'],
  },
  {
    name: '--pf-select-option-active-text',
    label: 'Select active option text',
    defaultValue: 'var(--color-semantic-action-primary-text)',
    type: 'color',
    scopes: ['select'],
  },
  {
    name: '--pf-command-bg',
    label: 'Command palette bg',
    defaultValue: 'var(--pf-surface-bg)',
    type: 'color',
    scopes: ['command'],
  },
  {
    name: '--pf-command-item-active-bg',
    label: 'Command active item bg',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['command'],
  },
  {
    name: '--pf-command-item-active-text',
    label: 'Command active item text',
    defaultValue: 'var(--color-semantic-action-primary-text)',
    type: 'color',
    scopes: ['command'],
  },
  {
    name: '--pf-timeline-default-border',
    label: 'Timeline default marker border',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['timeline'],
  },
  {
    name: '--pf-timeline-connector',
    label: 'Timeline connector line',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['timeline'],
  },
  {
    name: '--pf-timeline-title',
    label: 'Timeline title text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['timeline'],
  },
  {
    name: '--pf-taginput-border',
    label: 'Tag input border',
    defaultValue: 'var(--pf-input-border)',
    type: 'color',
    scopes: ['taginput'],
  },
  {
    name: '--pf-taginput-focus-border',
    label: 'Tag input focus border',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['taginput'],
  },
  {
    name: '--pf-toolbar-bg',
    label: 'Toolbar background',
    defaultValue: 'var(--color-semantic-background-default)',
    type: 'color',
    scopes: ['toolbar'],
  },
  {
    name: '--pf-toolbar-border',
    label: 'Toolbar border',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['toolbar'],
  },
  {
    name: '--pf-toolbar-separator',
    label: 'Toolbar separator',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['toolbar'],
  },
  {
    name: '--pf-scrollarea-thumb',
    label: 'Scroll area thumb',
    defaultValue: 'var(--color-semantic-border-strong)',
    type: 'color',
    scopes: ['scrollarea'],
  },
  {
    name: '--pf-scrollarea-thumb-hover',
    label: 'Scroll area thumb hover',
    defaultValue: 'var(--color-semantic-text-muted)',
    type: 'color',
    scopes: ['scrollarea'],
  },
  {
    name: '--pf-timepicker-border',
    label: 'Time picker border',
    defaultValue: 'var(--pf-input-border)',
    type: 'color',
    scopes: ['timepicker'],
  },
  {
    name: '--pf-timepicker-menu-bg',
    label: 'Time picker panel bg',
    defaultValue: 'var(--pf-surface-bg)',
    type: 'color',
    scopes: ['timepicker'],
  },
  {
    name: '--pf-timepicker-option-active-bg',
    label: 'Time picker selected option bg',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['timepicker'],
  },
  {
    name: '--pf-timepicker-option-active-text',
    label: 'Time picker selected option text',
    defaultValue: 'var(--color-semantic-action-primary-text)',
    type: 'color',
    scopes: ['timepicker'],
  },
  {
    name: '--pf-collapsible-border',
    label: 'Collapsible border',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['collapsible'],
  },
  {
    name: '--pf-collapsible-trigger-hover-bg',
    label: 'Collapsible trigger hover bg',
    defaultValue: 'var(--color-semantic-background-subtle)',
    type: 'color',
    scopes: ['collapsible'],
  },
  {
    name: '--pf-collapsible-content-text',
    label: 'Collapsible content text',
    defaultValue: 'var(--color-semantic-text-muted)',
    type: 'color',
    scopes: ['collapsible'],
  },
  {
    name: '--pf-combobox-border',
    label: 'Combobox border',
    defaultValue: 'var(--pf-input-border)',
    type: 'color',
    scopes: ['combobox'],
  },
  {
    name: '--pf-combobox-text',
    label: 'Combobox text',
    defaultValue: 'var(--pf-input-text)',
    type: 'color',
    scopes: ['combobox'],
  },
  {
    name: '--pf-combobox-menu-bg',
    label: 'Combobox menu bg',
    defaultValue: 'var(--pf-surface-bg)',
    type: 'color',
    scopes: ['combobox'],
  },
  {
    name: '--pf-combobox-option-active-bg',
    label: 'Combobox active option bg',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['combobox'],
  },
  {
    name: '--pf-combobox-option-active-text',
    label: 'Combobox active option text',
    defaultValue: 'var(--color-semantic-action-primary-text)',
    type: 'color',
    scopes: ['combobox'],
  },
  {
    name: '--pf-numberinput-border',
    label: 'Number input border',
    defaultValue: 'var(--pf-input-border)',
    type: 'color',
    scopes: ['numberinput'],
  },
  {
    name: '--pf-numberinput-text',
    label: 'Number input text',
    defaultValue: 'var(--pf-input-text)',
    type: 'color',
    scopes: ['numberinput'],
  },
  {
    name: '--pf-numberinput-step-bg',
    label: 'Number input stepper bg',
    defaultValue: 'var(--color-semantic-background-subtle)',
    type: 'color',
    scopes: ['numberinput'],
  },
  {
    name: '--pf-numberinput-step-hover-bg',
    label: 'Number input stepper hover bg',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['numberinput'],
  },
  {
    name: '--pf-numberinput-step-hover-text',
    label: 'Number input stepper hover text',
    defaultValue: 'var(--color-semantic-action-primary-text)',
    type: 'color',
    scopes: ['numberinput'],
  },
  {
    name: '--pf-daterange-border',
    label: 'Date range border',
    defaultValue: 'var(--pf-datepicker-border)',
    type: 'color',
    scopes: ['daterange'],
  },
  {
    name: '--pf-daterange-text',
    label: 'Date range text',
    defaultValue: 'var(--pf-datepicker-text)',
    type: 'color',
    scopes: ['daterange'],
  },
  {
    name: '--pf-daterange-range-bg',
    label: 'Date range highlight bg',
    defaultValue: 'var(--color-brand-100)',
    type: 'color',
    scopes: ['daterange'],
  },
  {
    name: '--pf-daterange-range-text',
    label: 'Date range highlight text',
    defaultValue: 'var(--color-brand-800)',
    type: 'color',
    scopes: ['daterange'],
  },
  {
    name: '--pf-breadcrumbs-link-color',
    label: 'Breadcrumbs link color',
    defaultValue: 'var(--color-semantic-text-muted)',
    type: 'color',
    scopes: ['breadcrumbs'],
  },
  {
    name: '--pf-breadcrumbs-link-hover-color',
    label: 'Breadcrumbs link hover color',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['breadcrumbs'],
  },
  {
    name: '--pf-breadcrumbs-link-current-color',
    label: 'Breadcrumbs current link color',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['breadcrumbs'],
  },
  {
    name: '--pf-breadcrumbs-separator-color',
    label: 'Breadcrumbs separator color',
    defaultValue: 'var(--color-semantic-text-muted)',
    type: 'color',
    scopes: ['breadcrumbs'],
  },
  {
    name: '--pf-badge-neutral-background',
    label: 'Badge neutral background',
    defaultValue: 'var(--color-gray-100)',
    type: 'color',
    scopes: ['badge'],
    variants: ['neutral'],
  },
  {
    name: '--pf-badge-neutral-foreground',
    label: 'Badge neutral foreground',
    defaultValue: 'var(--color-gray-700)',
    type: 'color',
    scopes: ['badge'],
    variants: ['neutral'],
  },
  {
    name: '--pf-badge-brand-background',
    label: 'Badge brand background',
    defaultValue: 'var(--color-brand-100)',
    type: 'color',
    scopes: ['badge'],
    variants: ['brand'],
  },
  {
    name: '--pf-badge-brand-foreground',
    label: 'Badge brand foreground',
    defaultValue: 'var(--color-brand-700)',
    type: 'color',
    scopes: ['badge'],
    variants: ['brand'],
  },
  {
    name: '--pf-badge-success-background',
    label: 'Badge success background',
    defaultValue: 'var(--color-semantic-status-success-background)',
    type: 'color',
    scopes: ['badge'],
    variants: ['success'],
  },
  {
    name: '--pf-badge-success-foreground',
    label: 'Badge success foreground',
    defaultValue: 'var(--color-semantic-status-success-foreground)',
    type: 'color',
    scopes: ['badge'],
    variants: ['success'],
  },
  {
    name: '--pf-badge-warning-background',
    label: 'Badge warning background',
    defaultValue: 'var(--color-semantic-status-warning-background)',
    type: 'color',
    scopes: ['badge'],
    variants: ['warning'],
  },
  {
    name: '--pf-badge-warning-foreground',
    label: 'Badge warning foreground',
    defaultValue: 'var(--color-semantic-status-warning-foreground)',
    type: 'color',
    scopes: ['badge'],
    variants: ['warning'],
  },
  {
    name: '--pf-badgegroup-gray-100',
    label: 'Badge Group gray badge background',
    defaultValue: 'var(--color-gray-100)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['gray'],
  },
  {
    name: '--pf-badgegroup-gray-200',
    label: 'Badge Group gray border',
    defaultValue: 'var(--color-gray-200)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['gray'],
  },
  {
    name: '--pf-badgegroup-gray-700',
    label: 'Badge Group gray foreground',
    defaultValue: 'var(--color-gray-700)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['gray'],
  },
  {
    name: '--pf-badgegroup-brand-100',
    label: 'Badge Group brand badge background',
    defaultValue: 'var(--color-brand-100)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['brand'],
  },
  {
    name: '--pf-badgegroup-brand-300',
    label: 'Badge Group brand border',
    defaultValue: 'var(--color-brand-300)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['brand'],
  },
  {
    name: '--pf-badgegroup-brand-700',
    label: 'Badge Group brand foreground',
    defaultValue: 'var(--color-brand-700)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['brand'],
  },
  {
    name: '--pf-badgegroup-semantic-status-success-background',
    label: 'Badge Group success background',
    defaultValue: 'var(--color-semantic-status-success-background)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['success'],
  },
  {
    name: '--pf-badgegroup-semantic-status-success-border',
    label: 'Badge Group success border',
    defaultValue: 'var(--color-semantic-status-success-border)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['success'],
  },
  {
    name: '--pf-badgegroup-semantic-status-success-foreground',
    label: 'Badge Group success foreground',
    defaultValue: 'var(--color-semantic-status-success-foreground)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['success'],
  },
  {
    name: '--pf-badgegroup-semantic-status-warning-background',
    label: 'Badge Group warning background',
    defaultValue: 'var(--color-semantic-status-warning-background)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['warning'],
  },
  {
    name: '--pf-badgegroup-semantic-status-warning-border',
    label: 'Badge Group warning border',
    defaultValue: 'var(--color-semantic-status-warning-border)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['warning'],
  },
  {
    name: '--pf-badgegroup-semantic-status-warning-foreground',
    label: 'Badge Group warning foreground',
    defaultValue: 'var(--color-semantic-status-warning-foreground)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['warning'],
  },
  {
    name: '--pf-badgegroup-semantic-status-danger-background',
    label: 'Badge Group error background',
    defaultValue: 'var(--color-semantic-status-danger-background)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['error'],
  },
  {
    name: '--pf-badgegroup-semantic-status-danger-border',
    label: 'Badge Group error border',
    defaultValue: 'var(--color-semantic-status-danger-border)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['error'],
  },
  {
    name: '--pf-badgegroup-semantic-status-danger-foreground',
    label: 'Badge Group error foreground',
    defaultValue: 'var(--color-semantic-status-danger-foreground)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['error'],
  },
  {
    name: '--pf-badgegroup-surface-bg',
    label: 'Badge Group pill text background',
    defaultValue: 'var(--pf-surface-bg)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['pill'],
  },
  {
    name: '--pf-badgegroup-surface-subtle',
    label: 'Badge Group modern text background',
    defaultValue: 'var(--pf-surface-subtle)',
    type: 'color',
    scopes: ['badgegroup'],
    variants: ['modern'],
  },
  {
    name: '--pf-alert-info-background',
    label: 'Alert info background',
    defaultValue: 'var(--color-brand-50)',
    type: 'color',
    scopes: ['alert'],
    variants: ['info'],
  },
  {
    name: '--pf-alert-info-border',
    label: 'Alert info border',
    defaultValue: 'var(--color-brand-300)',
    type: 'color',
    scopes: ['alert'],
    variants: ['info'],
  },
  {
    name: '--pf-alert-info-foreground',
    label: 'Alert info foreground',
    defaultValue: 'var(--color-brand-800)',
    type: 'color',
    scopes: ['alert'],
    variants: ['info'],
  },
  {
    name: '--pf-alert-success-background',
    label: 'Alert success background',
    defaultValue: 'var(--color-semantic-status-success-background)',
    type: 'color',
    scopes: ['alert'],
    variants: ['success'],
  },
  {
    name: '--pf-alert-success-border',
    label: 'Alert success border',
    defaultValue: 'var(--color-semantic-status-success-border)',
    type: 'color',
    scopes: ['alert'],
    variants: ['success'],
  },
  {
    name: '--pf-alert-success-foreground',
    label: 'Alert success foreground',
    defaultValue: 'var(--color-semantic-status-success-foreground)',
    type: 'color',
    scopes: ['alert'],
    variants: ['success'],
  },
  {
    name: '--pf-alert-warning-background',
    label: 'Alert warning background',
    defaultValue: 'var(--color-semantic-status-warning-background)',
    type: 'color',
    scopes: ['alert'],
    variants: ['warning'],
  },
  {
    name: '--pf-alert-warning-border',
    label: 'Alert warning border',
    defaultValue: 'var(--color-semantic-status-warning-border)',
    type: 'color',
    scopes: ['alert'],
    variants: ['warning'],
  },
  {
    name: '--pf-alert-warning-foreground',
    label: 'Alert warning foreground',
    defaultValue: 'var(--color-semantic-status-warning-foreground)',
    type: 'color',
    scopes: ['alert'],
    variants: ['warning'],
  },
  {
    name: '--pf-alert-danger-background',
    label: 'Alert danger background',
    defaultValue: 'var(--color-semantic-status-danger-background)',
    type: 'color',
    scopes: ['alert'],
    variants: ['danger'],
  },
  {
    name: '--pf-alert-danger-border',
    label: 'Alert danger border',
    defaultValue: 'var(--color-semantic-status-danger-border)',
    type: 'color',
    scopes: ['alert'],
    variants: ['danger'],
  },
  {
    name: '--pf-alert-danger-foreground',
    label: 'Alert danger foreground',
    defaultValue: 'var(--color-semantic-status-danger-foreground)',
    type: 'color',
    scopes: ['alert'],
    variants: ['danger'],
  },
  {
    name: '--pf-notification-info-bg',
    label: 'Notification info background',
    defaultValue: 'var(--color-brand-50)',
    type: 'color',
    scopes: ['notification'],
    variants: ['info'],
  },
  {
    name: '--pf-notification-info-border',
    label: 'Notification info border',
    defaultValue: 'var(--color-brand-300)',
    type: 'color',
    scopes: ['notification'],
    variants: ['info'],
  },
  {
    name: '--pf-notification-info-title',
    label: 'Notification info foreground',
    defaultValue: 'var(--color-brand-800)',
    type: 'color',
    scopes: ['notification'],
    variants: ['info'],
  },
  {
    name: '--pf-notification-success-bg',
    label: 'Notification success background',
    defaultValue: 'var(--color-semantic-status-success-background)',
    type: 'color',
    scopes: ['notification'],
    variants: ['success'],
  },
  {
    name: '--pf-notification-success-border',
    label: 'Notification success border',
    defaultValue: 'var(--color-semantic-status-success-border)',
    type: 'color',
    scopes: ['notification'],
    variants: ['success'],
  },
  {
    name: '--pf-notification-warning-bg',
    label: 'Notification warning background',
    defaultValue: 'var(--color-semantic-status-warning-background)',
    type: 'color',
    scopes: ['notification'],
    variants: ['warning'],
  },
  {
    name: '--pf-notification-warning-border',
    label: 'Notification warning border',
    defaultValue: 'var(--color-semantic-status-warning-border)',
    type: 'color',
    scopes: ['notification'],
    variants: ['warning'],
  },
  {
    name: '--pf-notification-danger-bg',
    label: 'Notification danger background',
    defaultValue: 'var(--color-semantic-status-danger-background)',
    type: 'color',
    scopes: ['notification'],
    variants: ['danger'],
  },
  {
    name: '--pf-notification-danger-border',
    label: 'Notification danger border',
    defaultValue: 'var(--color-semantic-status-danger-border)',
    type: 'color',
    scopes: ['notification'],
    variants: ['danger'],
  },
  {
    name: '--pf-inline-cta-bg',
    label: 'InlineCTA background',
    defaultValue: 'var(--color-semantic-background-default)',
    type: 'color',
    scopes: ['inlinecta'],
  },
  {
    name: '--pf-inline-cta-border',
    label: 'InlineCTA border',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['inlinecta'],
  },
  {
    name: '--pf-inline-cta-text',
    label: 'InlineCTA text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['inlinecta'],
  },
  {
    name: '--pf-inline-cta-text-muted',
    label: 'InlineCTA muted text',
    defaultValue: 'var(--color-semantic-text-muted)',
    type: 'color',
    scopes: ['inlinecta'],
  },
  {
    name: '--pf-inline-cta-info-bg',
    label: 'InlineCTA info background',
    defaultValue: 'var(--color-brand-50)',
    type: 'color',
    scopes: ['inlinecta'],
    variants: ['info'],
  },
  {
    name: '--pf-inline-cta-info-border',
    label: 'InlineCTA info border',
    defaultValue: 'var(--color-brand-300)',
    type: 'color',
    scopes: ['inlinecta'],
    variants: ['info'],
  },
  {
    name: '--pf-inline-cta-success-bg',
    label: 'InlineCTA success background',
    defaultValue: 'var(--color-semantic-status-success-background)',
    type: 'color',
    scopes: ['inlinecta'],
    variants: ['success'],
  },
  {
    name: '--pf-inline-cta-success-border',
    label: 'InlineCTA success border',
    defaultValue: 'var(--color-semantic-status-success-border)',
    type: 'color',
    scopes: ['inlinecta'],
    variants: ['success'],
  },
  {
    name: '--pf-inline-cta-warning-bg',
    label: 'InlineCTA warning background',
    defaultValue: 'var(--color-semantic-status-warning-background)',
    type: 'color',
    scopes: ['inlinecta'],
    variants: ['warning'],
  },
  {
    name: '--pf-inline-cta-warning-border',
    label: 'InlineCTA warning border',
    defaultValue: 'var(--color-semantic-status-warning-border)',
    type: 'color',
    scopes: ['inlinecta'],
    variants: ['warning'],
  },
  {
    name: '--color-brand-100',
    label: 'Brand 100',
    defaultValue: 'var(--color-brand-100)',
    type: 'color',
    scopes: ['badge', 'tag', 'utility'],
    variants: ['info', 'brand'],
  },
  {
    name: '--color-brand-200',
    label: 'Brand 200',
    defaultValue: 'var(--color-brand-200)',
    type: 'color',
    scopes: ['utility'],
    variants: ['brand'],
  },
  {
    name: '--color-brand-300',
    label: 'Alert info border (brand-300)',
    defaultValue: 'var(--color-brand-300)',
    type: 'color',
    scopes: ['utility'],
    variants: ['info', 'brand'],
  },
  {
    name: '--color-brand-700',
    label: 'Brand 700',
    defaultValue: 'var(--color-brand-700)',
    type: 'color',
    scopes: ['badge', 'tag', 'utility'],
    variants: ['info', 'brand'],
  },
  {
    name: '--color-brand-800',
    label: 'Brand 800',
    defaultValue: 'var(--color-brand-800)',
    type: 'color',
    scopes: [],
    variants: ['info'],
  },
  {
    name: '--color-gray-100',
    label: 'Gray 100',
    defaultValue: 'var(--color-gray-100)',
    type: 'color',
    scopes: ['badge', 'tag'],
    variants: ['neutral'],
  },
  {
    name: '--color-gray-700',
    label: 'Gray 700',
    defaultValue: 'var(--color-gray-700)',
    type: 'color',
    scopes: ['badge', 'tag'],
    variants: ['neutral'],
  },
  {
    name: '--color-semantic-status-success-background',
    label: 'Success background',
    defaultValue: 'var(--color-semantic-status-success-background)',
    type: 'color',
    scopes: ['badge', 'tag'],
    variants: ['success'],
  },
  {
    name: '--color-semantic-status-success-border',
    label: 'Success border',
    defaultValue: 'var(--color-semantic-status-success-border)',
    type: 'color',
    scopes: [],
    variants: ['success'],
  },
  {
    name: '--color-semantic-status-success-foreground',
    label: 'Success foreground',
    defaultValue: 'var(--color-semantic-status-success-foreground)',
    type: 'color',
    scopes: ['badge', 'tag'],
    variants: ['success'],
  },
  {
    name: '--color-semantic-status-warning-background',
    label: 'Warning background',
    defaultValue: 'var(--color-semantic-status-warning-background)',
    type: 'color',
    scopes: ['badge', 'tag'],
    variants: ['warning'],
  },
  {
    name: '--color-semantic-status-warning-border',
    label: 'Warning border',
    defaultValue: 'var(--color-semantic-status-warning-border)',
    type: 'color',
    scopes: [],
    variants: ['warning'],
  },
  {
    name: '--color-semantic-status-warning-foreground',
    label: 'Warning foreground',
    defaultValue: 'var(--color-semantic-status-warning-foreground)',
    type: 'color',
    scopes: ['badge', 'tag'],
    variants: ['warning'],
  },
  {
    name: '--color-semantic-status-danger-background',
    label: 'Danger background',
    defaultValue: 'var(--color-semantic-status-danger-background)',
    type: 'color',
    scopes: ['utility'],
    variants: ['danger'],
  },
  {
    name: '--color-semantic-status-danger-border',
    label: 'Danger border',
    defaultValue: 'var(--color-semantic-status-danger-border)',
    type: 'color',
    scopes: ['utility'],
    variants: ['danger'],
  },
  {
    name: '--color-semantic-status-danger-foreground',
    label: 'Danger foreground',
    defaultValue: 'var(--color-semantic-status-danger-foreground)',
    type: 'color',
    scopes: ['utility'],
    variants: ['danger'],
  },
  {
    name: '--color-danger-100',
    label: 'Danger 100',
    defaultValue: 'var(--color-danger-100)',
    type: 'color',
    scopes: ['utility'],
    variants: ['danger'],
  },
];

function CssVariableController({
  children,
  controls,
}: {
  children: ReactNode;
  controls: CssVariableControl[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const controlNames = controls.map((control) => control.name);
  const scopedVars = Object.fromEntries(
    Object.entries(values).filter(([, value]) => value && value.trim().length > 0),
  );
  const updateControlValue = (name: string, defaultValue: string, nextValue: string) => {
    setValues((current) => {
      if (nextValue === defaultValue) {
        const next = { ...current };
        delete next[name];
        return next;
      }

      return {
        ...current,
        [name]: nextValue,
      };
    });
  };

  // No longer apply variables to :root. Only apply to wrapper div for local scoping.
  // Also set variables on :root for global scope (Storybook workaround)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      for (const [key, value] of Object.entries(scopedVars)) {
        root.style.setProperty(key, value);
      }
      // Remove any variables that are no longer set
      for (const name of controlNames) {
        if (!(name in scopedVars)) {
          root.style.removeProperty(name);
        }
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        for (const key of Object.keys(scopedVars)) {
          root.style.removeProperty(key);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(scopedVars), controlNames.join('|')]);

  return (
    <>
      <div className="css-var-scope" style={scopedVars as CSSProperties}>
        {children}
      </div>

      {typeof document !== 'undefined'
        ? createPortal(
            <div
              style={{
                position: 'fixed',
                right: '16px',
                bottom: '16px',
                zIndex: 200,
                width: isOpen ? '320px' : 'auto',
                ...(isOpen
                  ? {
                      maxHeight: '60vh',
                      overflow: 'auto',
                      borderRadius: '10px',
                      border: '1px solid var(--color-semantic-border-default)',
                      background: 'var(--color-semantic-background-default)',
                      boxShadow: 'var(--pf-elevation-popover-shadow)',
                      padding: '12px',
                    }
                  : {}),
              }}
            >
              {isOpen ? (
                <div>
                  <div
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                    }}
                  >
                    <strong style={{ fontSize: '13px' }}>CSS Variable Controls</strong>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                      }}
                      style={{
                        border: 0,
                        background: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--color-semantic-text-default)',
                        fontSize: '12px',
                      }}
                    >
                      Close
                    </button>
                  </div>

                  <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                    <legend className="pf-sr-only">Global CSS variable controls</legend>
                    {controls.map((control) => {
                      const inputId = `global-css-var-${control.name.replace(/[^a-z0-9-]/gi, '-')}`;
                      return (
                        <div
                          key={control.name}
                          style={{
                            display: 'grid',
                            gap: '4px',
                            marginBottom: '10px',
                          }}
                        >
                          <label htmlFor={inputId} style={{ fontSize: '12px' }}>
                            {control.label}
                          </label>
                          <code
                            style={{
                              fontSize: '11px',
                              color: 'var(--color-semantic-text-muted)',
                            }}
                          >
                            {control.name}
                          </code>
                          {control.type === 'color' ? (
                            <ColorSelect
                              id={inputId}
                              value={values[control.name] ?? control.defaultValue}
                              onChange={(nextValue) => {
                                updateControlValue(control.name, control.defaultValue, nextValue);
                              }}
                            />
                          ) : control.type === 'radius' ||
                            control.type === 'shadow' ||
                            control.type === 'space' ? (
                            <TokenSelect
                              id={inputId}
                              options={TOKEN_OPTIONS[control.type]}
                              value={values[control.name] ?? control.defaultValue}
                              onChange={(nextValue) => {
                                updateControlValue(control.name, control.defaultValue, nextValue);
                              }}
                            />
                          ) : (
                            <input
                              id={inputId}
                              type="text"
                              value={values[control.name] ?? control.defaultValue}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                updateControlValue(control.name, control.defaultValue, nextValue);
                              }}
                              style={{
                                minHeight: '32px',
                                border: '1px solid var(--color-semantic-border-default)',
                                borderRadius: '6px',
                                padding: '0 8px',
                                fontFamily: 'var(--font-family-mono)',
                                fontSize: '12px',
                                color: 'var(--color-semantic-text-default)',
                                background: 'var(--color-semantic-background-default)',
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </fieldset>

                  <button
                    type="button"
                    onClick={() => {
                      setValues({});
                    }}
                    style={{
                      width: '100%',
                      minHeight: '34px',
                      border: '1px solid var(--color-semantic-border-default)',
                      borderRadius: '6px',
                      background: 'var(--color-semantic-background-subtle)',
                      color: 'var(--color-semantic-text-default)',
                      cursor: 'pointer',
                    }}
                  >
                    Reset defaults
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(true);
                  }}
                  style={{
                    minHeight: '34px',
                    border: '1px solid var(--color-semantic-border-default)',
                    borderRadius: '8px',
                    background: 'var(--color-semantic-background-default)',
                    color: 'var(--color-semantic-text-default)',
                    cursor: 'pointer',
                    padding: '0 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    boxShadow: 'var(--pf-elevation-popover-shadow)',
                  }}
                >
                  CSS Variables
                </button>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function TokenSelect({
  id,
  options,
  value,
  onChange,
}: {
  id: string;
  options: TokenOption[];
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((option) => option.value === value) ?? {
    label: value,
    value,
  };

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        id={id}
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: '8px',
          minHeight: '32px',
          width: '100%',
          border: '1px solid var(--color-semantic-border-default)',
          borderRadius: '6px',
          padding: '0 8px',
          fontSize: '12px',
          color: 'var(--color-semantic-text-default)',
          background: 'var(--color-semantic-background-default)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ flexGrow: 1 }}>{selectedOption.label}</span>
        <Icon
          name="chevron-down"
          aria-hidden
          style={{
            color: 'var(--color-semantic-text-muted)',
            fontSize: '16px',
          }}
        />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          aria-label="Token options"
          style={{
            position: 'absolute',
            zIndex: 20,
            left: 0,
            right: 0,
            marginTop: '4px',
            maxHeight: '180px',
            overflow: 'auto',
            border: '1px solid var(--color-semantic-border-default)',
            borderRadius: '8px',
            background: 'var(--color-semantic-background-default)',
            boxShadow: 'var(--pf-elevation-popover-shadow)',
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={{
                alignItems: 'center',
                display: 'flex',
                gap: '8px',
                width: '100%',
                border: 0,
                borderBottom: '1px solid var(--color-semantic-border-default)',
                background:
                  option.value === value
                    ? 'var(--color-semantic-background-subtle)'
                    : 'var(--color-semantic-background-default)',
                color: 'var(--color-semantic-text-default)',
                cursor: 'pointer',
                padding: '7px 8px',
                fontSize: '12px',
              }}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ColorSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = COLOR_OPTIONS.find((option) => option.value === value) ?? {
    label: value,
    value,
    swatch: value,
  };

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        id={id}
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: '8px',
          minHeight: '32px',
          width: '100%',
          border: '1px solid var(--color-semantic-border-default)',
          borderRadius: '6px',
          padding: '0 8px',
          fontSize: '12px',
          color: 'var(--color-semantic-text-default)',
          background: 'var(--color-semantic-background-default)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          aria-hidden
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '999px',
            border: '1px solid var(--color-semantic-border-default)',
            background: selectedOption.swatch,
            flexShrink: 0,
          }}
        />
        <span style={{ flexGrow: 1 }}>{selectedOption.label}</span>
        <Icon
          name="chevron-down"
          aria-hidden
          style={{
            color: 'var(--color-semantic-text-muted)',
            fontSize: '16px',
          }}
        />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          aria-label="Color options"
          style={{
            position: 'absolute',
            zIndex: 20,
            left: 0,
            right: 0,
            marginTop: '4px',
            maxHeight: '180px',
            overflow: 'auto',
            border: '1px solid var(--color-semantic-border-default)',
            borderRadius: '8px',
            background: 'var(--color-semantic-background-default)',
            boxShadow: 'var(--pf-elevation-popover-shadow)',
          }}
        >
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={{
                alignItems: 'center',
                display: 'flex',
                gap: '8px',
                width: '100%',
                border: 0,
                borderBottom: '1px solid var(--color-semantic-border-default)',
                background:
                  option.value === value
                    ? 'var(--color-semantic-background-subtle)'
                    : 'var(--color-semantic-background-default)',
                color: 'var(--color-semantic-text-default)',
                cursor: 'pointer',
                padding: '7px 8px',
                fontSize: '12px',
                textAlign: 'left',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '999px',
                  border: '1px solid var(--color-semantic-border-default)',
                  background: option.swatch,
                  flexShrink: 0,
                }}
              />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const scopeByStoryTitle: Record<string, CssVariableScope[]> = {
  // existing curated scopes
  'Components/Modals': ['modal'],
  'Components/Metrics': ['metrics'],
  'Components/Loading Indicators': ['loadingindicators'],
  'Components/Credit Card': ['creditcard'],
  'Components/Button': ['button'],
  'Components/Card': ['card'],
  'Components/ContentDivider': ['contentdivider'],
  'Components/Carousel': ['carousel'],
  'Components/Button Group': ['buttongroup'],
  'Components/Breadcrumbs': ['breadcrumbs'],
  'Components/Input': ['input'],
  'Components/Dropdown': ['dropdown'],
  'Components/FileUploader': ['fileuploader'],
  'Components/ScrollArea': ['scrollarea'],
  'Components/Select': ['select'],
  'Components/TimePicker': ['timepicker'],
  'Components/Toolbar': ['toolbar'],
  'Components/TagInput': ['taginput'],
  'Components/Timeline': ['timeline'],
  'Components/CommandPalette': ['command'],
  'Components/Collapsible': ['collapsible'],
  'Components/Combobox': ['combobox'],
  'Components/NumberInput': ['numberinput'],
  'Components/DateRangePicker': ['daterange'],
  'Components/Checkbox': ['checkbox'],
  'Components/CodeSnippet': ['codesnippet'],
  'Components/RadioButton': ['radio'],
  'Components/Switch': ['switch'],
  'Components/Avatar': ['avatar'],
  'Components/Alert': ['alert'],
  'Components/Notifications': ['notification'],
  'Components/InlineCTA': ['inlinecta'],
  'Components/Badge': ['badge'],
  'Components/BadgeGroup': ['badgegroup'],
  'Components/Badge Group': ['badgegroup'],
  'Components/Tag': ['tag'],
  'Components/Utility Button': ['utilitybutton'],
  'Components/Calendar': ['calendar'],
  'Components/DatePicker': ['datepicker'],
  'Components/Icon': ['icon'],
  'Components/HeaderNavigation': ['headernavigation'],
  // auto-extracted scopes for remaining components
  'Components/Multi Select': ['multiselect'],
  'Components/Page Headers': ['pageheader'],
  'Components/Paginations': ['pagination'],
  'Components/Pie Charts': ['piechart'],
  'Components/Progress Indicators': ['progressindicators'],
  'Components/Progress Steps': ['progresssteps'],
  'Components/Radar Charts': ['radarchart'],
  'Components/Radio Buttons': ['radiobutton'],
  'Components/Radio Groups': ['radiogroup'],
  'Components/Rich Text Editor': ['richtexteditor'],
  'Components/Section Footers': ['sectionfooter'],
  'Components/Section Headers': ['sectionheader'],
  'Components/Sidebar Navigations': ['sidebarnavigation'],
  'Components/Slideout Menus': ['slideoutmenu'],
  'Components/Slider': ['slider'],
  'Components/Tables': ['table'],
  'Components/Tabs': ['tabs'],
  'Components/Textarea': ['textarea'],
  'Components/Tooltip': ['tooltip'],
  'Components/Tree Views': ['treeview'],
  'Components/Video Player': ['videoplayer'],
  'Components/Line & Bar Charts': ['linebarcharts'],
  'Components/Area Chart': ['linebarcharts'],
  'Components/Rating': ['rating'],
  'Components/EmptyState': ['emptystate'],
  'Components/Accordion': ['accordion'],
  'Components/Avatar Group': ['avatargroup'],
  'Components/Popover': ['popover'],
  'Components/Gauge Chart': ['gaugechart'],
  'Components/Heatmap': ['heatmap'],
  'Components/Kbd': ['kbd'],
  'Components/Sparkline': ['sparkline'],
};

// Build generated controls for scopes not covered by hand-crafted CSS_VARIABLE_CONTROLS
const handCraftedScopes = new Set(CSS_VARIABLE_CONTROLS.flatMap((c) => c.scopes));
const GENERATED_CONTROLS = buildGeneratedControls(handCraftedScopes);
const ALL_CONTROLS = [...CSS_VARIABLE_CONTROLS, ...GENERATED_CONTROLS];

export function withCssVariableControls(
  Story: () => ReactNode,
  context: {
    viewMode?: string;
    name?: string;
    title?: string;
    id?: string;
    args?: {
      variant?: string;
      color?: string;
      appearance?: string;
      tone?: string;
    };
  },
) {
  const isInteractiveStory =
    context.viewMode === 'story' &&
    ((typeof context.name === 'string' && context.name.toLowerCase().startsWith('interactive')) ||
      (typeof context.id === 'string' && context.id.toLowerCase().includes('--interactive')));
  const isComponentStory = Boolean(context.title?.startsWith('Components/'));
  const mappedScopes = context.title ? (scopeByStoryTitle[context.title] ?? []) : [];
  const activeScopes: CssVariableScope[] = mappedScopes;
  const activeVariants = [
    context.args?.variant,
    context.args?.color,
    context.args?.appearance,
    context.args?.tone,
  ].filter((value): value is string => typeof value === 'string');

  const controls = ALL_CONTROLS.filter(
    (control) =>
      control.scopes.some((scope) => activeScopes.includes(scope)) &&
      (!control.variants ||
        activeVariants.some((activeVariant) => control.variants?.includes(activeVariant))),
  );

  if (!isInteractiveStory || !isComponentStory || controls.length === 0) {
    return <Story />;
  }

  return (
    <CssVariableController controls={controls}>
      <Story />
    </CssVariableController>
  );
}
