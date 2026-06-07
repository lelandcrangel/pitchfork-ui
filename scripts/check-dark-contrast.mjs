/**
 * WCAG contrast ratio checker for dark mode token pairs.
 * Resolves the CSS variable chain from theme.css dark block and reports failures.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ─── Load raw token hex values ────────────────────────────────────────────────

const colorTokens = JSON.parse(
  readFileSync(resolve(root, 'packages/tokens/src/tokens/color.json'), 'utf8'),
);

function flattenTokens(node, path = []) {
  if (node && typeof node === 'object' && '$value' in node) {
    return { [path.join('-')]: node.$value };
  }
  return Object.entries(node ?? {}).reduce((acc, [key, val]) => {
    return { ...acc, ...flattenTokens(val, [...path, key]) };
  }, {});
}

const TOKEN_HEX = flattenTokens(colorTokens);

// ─── Dark mode token aliases (mirrored from theme.css [data-theme='dark']) ───

const DARK_SEMANTIC = {
  'color-semantic-background-default': 'color-gray-900',
  'color-semantic-background-subtle': 'color-gray-700',
  'color-semantic-background-raised': 'color-gray-800',
  'color-semantic-background-disabled': 'color-gray-800',
  'color-semantic-text-default': 'color-gray-50',
  'color-semantic-text-muted': 'color-gray-300',
  'color-semantic-text-subtle': 'color-gray-200',
  'color-semantic-text-inverse': 'color-gray-900',
  'color-semantic-text-disabled': 'color-gray-500',
  'color-semantic-border-default': 'color-gray-700',
  'color-semantic-border-strong': 'color-gray-500',
  'color-semantic-border-muted': 'color-gray-800',
  'color-semantic-border-focus': 'color-brand-400',
  'color-semantic-action-primary': 'color-brand-600',
  'color-semantic-action-primary-hover': 'color-brand-700',
  'color-semantic-action-primary-text': 'color-base-white',
  'color-semantic-action-secondary': 'color-gray-800',
  'color-semantic-action-secondary-hover': 'color-gray-700',
  'color-semantic-action-secondary-text': 'color-gray-50',
  'color-semantic-status-success-background': 'color-success-900',
  'color-semantic-status-success-border': 'color-success-700',
  'color-semantic-status-success-foreground': 'color-success-300',
  'color-semantic-status-warning-background': 'color-warning-900',
  'color-semantic-status-warning-border': 'color-warning-700',
  'color-semantic-status-warning-foreground': 'color-warning-300',
  'color-semantic-status-danger-background': 'color-danger-900',
  'color-semantic-status-danger-border': 'color-danger-600',
  'color-semantic-status-danger-foreground': 'color-danger-300',
};

function resolveHex(token) {
  const resolved = DARK_SEMANTIC[token] ?? token;
  const hex = TOKEN_HEX[resolved];
  if (!hex) return null;
  return hex;
}

// ─── WCAG contrast calculation ────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function linearize(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── Pairs to check ───────────────────────────────────────────────────────────
// [label, foreground-token, background-token, required-ratio, type]
// type: 'text' (4.5:1 AA) | 'large' (3:1 AA large text) | 'ui' (3:1 non-text contrast)

const PAIRS = [
  // Text on default background
  [
    'Default text on bg',
    'color-semantic-text-default',
    'color-semantic-background-default',
    4.5,
    'text',
  ],
  [
    'Muted text on bg',
    'color-semantic-text-muted',
    'color-semantic-background-default',
    4.5,
    'text',
  ],
  [
    'Subtle text on bg',
    'color-semantic-text-subtle',
    'color-semantic-background-default',
    4.5,
    'text',
  ],
  [
    'Disabled text on bg',
    'color-semantic-text-disabled',
    'color-semantic-background-default',
    3.0,
    'large',
  ],

  // Text on raised/subtle backgrounds
  [
    'Default text on raised',
    'color-semantic-text-default',
    'color-semantic-background-raised',
    4.5,
    'text',
  ],
  [
    'Default text on subtle',
    'color-semantic-text-default',
    'color-semantic-background-subtle',
    4.5,
    'text',
  ],
  [
    'Muted text on subtle',
    'color-semantic-text-muted',
    'color-semantic-background-subtle',
    4.5,
    'text',
  ],

  // Primary action button
  [
    'Primary btn text on primary bg',
    'color-semantic-action-primary-text',
    'color-semantic-action-primary',
    4.5,
    'text',
  ],
  [
    'Primary btn text on hover bg',
    'color-semantic-action-primary-text',
    'color-semantic-action-primary-hover',
    4.5,
    'text',
  ],

  // Secondary action
  [
    'Secondary btn text on secondary bg',
    'color-semantic-action-secondary-text',
    'color-semantic-action-secondary',
    4.5,
    'text',
  ],

  // Borders against backgrounds (UI component contrast — 3:1)
  [
    'Border-default on bg-default',
    'color-semantic-border-default',
    'color-semantic-background-default',
    3.0,
    'ui',
  ],
  [
    'Border-default on bg-raised',
    'color-semantic-border-default',
    'color-semantic-background-raised',
    3.0,
    'ui',
  ],
  [
    'Border-strong on bg-default',
    'color-semantic-border-strong',
    'color-semantic-background-default',
    3.0,
    'ui',
  ],

  // Status — success
  [
    'Success foreground on success bg',
    'color-semantic-status-success-foreground',
    'color-semantic-status-success-background',
    4.5,
    'text',
  ],
  [
    'Success border on success bg',
    'color-semantic-status-success-border',
    'color-semantic-status-success-background',
    3.0,
    'ui',
  ],
  [
    'Success border on default bg',
    'color-semantic-status-success-border',
    'color-semantic-background-default',
    3.0,
    'ui',
  ],

  // Status — warning
  [
    'Warning foreground on warning bg',
    'color-semantic-status-warning-foreground',
    'color-semantic-status-warning-background',
    4.5,
    'text',
  ],
  [
    'Warning border on warning bg',
    'color-semantic-status-warning-border',
    'color-semantic-status-warning-background',
    3.0,
    'ui',
  ],
  [
    'Warning border on default bg',
    'color-semantic-status-warning-border',
    'color-semantic-background-default',
    3.0,
    'ui',
  ],

  // Status — danger
  [
    'Danger foreground on danger bg',
    'color-semantic-status-danger-foreground',
    'color-semantic-status-danger-background',
    4.5,
    'text',
  ],
  [
    'Danger border on danger bg',
    'color-semantic-status-danger-border',
    'color-semantic-status-danger-background',
    3.0,
    'ui',
  ],
  [
    'Danger border on default bg',
    'color-semantic-status-danger-border',
    'color-semantic-background-default',
    3.0,
    'ui',
  ],
];

// ─── Run checks ───────────────────────────────────────────────────────────────

let pass = 0;
let fail = 0;
const failures = [];

for (const [label, fgToken, bgToken, required, type] of PAIRS) {
  const fgHex = resolveHex(fgToken);
  const bgHex = resolveHex(bgToken);

  if (!fgHex || !bgHex) {
    console.warn(`  ⚠  Could not resolve: ${label} (fg=${fgToken}, bg=${bgToken})`);
    continue;
  }

  const ratio = contrast(fgHex, bgHex);
  const ok = ratio >= required;

  if (ok) {
    pass++;
  } else {
    fail++;
    failures.push({ label, fgHex, bgHex, ratio, required, type });
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

console.log('\n── Dark mode WCAG contrast audit ──────────────────────────────\n');

if (failures.length === 0) {
  console.log(`  ✅  All ${pass} pairs pass WCAG AA.\n`);
} else {
  console.log(`  ✅  ${pass} pairs pass`);
  console.log(`  ❌  ${fail} pairs fail\n`);

  for (const { label, fgHex, bgHex, ratio, required, type } of failures) {
    const tag =
      type === 'text'
        ? 'normal text 4.5:1'
        : type === 'large'
          ? 'large text 3:1'
          : 'UI component 3:1';
    console.log(`  ❌  ${label}`);
    console.log(
      `      ${fgHex} on ${bgHex}  →  ${ratio.toFixed(2)}:1  (need ${required}:1 — ${tag})`,
    );
  }
}

console.log('────────────────────────────────────────────────────────────────\n');
