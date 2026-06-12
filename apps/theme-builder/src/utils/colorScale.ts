import { formatHex, oklch } from 'culori';

export const SCALE_STOPS = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
] as const;
export type ScaleStop = (typeof SCALE_STOPS)[number];

const LIGHTNESS: Record<string, number> = {
  '50': 0.975,
  '100': 0.942,
  '200': 0.882,
  '300': 0.8,
  '400': 0.7,
  '500': 0.59,
  '600': 0.49,
  '700': 0.4,
  '800': 0.32,
  '900': 0.25,
};

const CHROMA_FACTOR: Record<string, number> = {
  '50': 0.06,
  '100': 0.12,
  '200': 0.28,
  '300': 0.52,
  '400': 0.78,
  '500': 1.0,
  '600': 0.94,
  '700': 0.84,
  '800': 0.72,
  '900': 0.6,
};

export function generateScale(seedHex: string): Record<string, string> {
  const base = oklch(seedHex as string);
  if (!base) return {};

  const chroma = base.c ?? 0.12;
  const hue = base.h ?? 0;

  return Object.fromEntries(
    SCALE_STOPS.map((stop) => [
      stop,
      formatHex({ mode: 'oklch', l: LIGHTNESS[stop], c: chroma * CHROMA_FACTOR[stop], h: hue }) ??
        '#000000',
    ]),
  );
}

export function getHarmonyHues(seedHex: string): string[] {
  const base = oklch(seedHex as string);
  if (!base) return [];
  const hue = base.h ?? 0;
  const chroma = base.c ?? 0.15;
  const l = base.l ?? 0.59;

  const offsets = [-90, -60, -30, 0, 30, 60, 90];
  return offsets.map((offset) => {
    const h = (hue + offset + 360) % 360;
    return formatHex({ mode: 'oklch', l, c: chroma, h }) ?? '#000000';
  });
}

export function getSeedHex(seedHex: string): string {
  const base = oklch(seedHex as string);
  if (!base) return seedHex;
  return formatHex({ mode: 'oklch', l: 0.59, c: base.c ?? 0.15, h: base.h ?? 0 }) ?? seedHex;
}

// Semantic hue targets for status scales (kept visually meaningful)
const STATUS_HUES = {
  success: 143,
  warning: 74,
  danger: 22,
} as const;

export function suggestPaletteFromBrand(brandHex: string): Record<string, Record<string, string>> {
  const base = oklch(brandHex as string);
  if (!base) return {};

  const brandHue = base.h ?? 0;
  const brandChroma = base.c ?? 0.15;

  // Gray: same hue as brand, very low chroma — creates "branded neutral"
  const grayChroma = Math.min(brandChroma * 0.12, 0.022);
  const graySeed = formatHex({ mode: 'oklch', l: 0.59, c: grayChroma, h: brandHue }) ?? '#64748b';

  // Status colors: keep semantic hues, scale chroma to match brand vibrancy
  const vibrancy = Math.max(0.8, Math.min(1.2, brandChroma / 0.15));
  const successSeed =
    formatHex({
      mode: 'oklch',
      l: 0.6,
      c: Math.min(0.18 * vibrancy, 0.22),
      h: STATUS_HUES.success,
    }) ?? '#12b76a';
  const warningSeed =
    formatHex({
      mode: 'oklch',
      l: 0.78,
      c: Math.min(0.16 * vibrancy, 0.2),
      h: STATUS_HUES.warning,
    }) ?? '#f79009';
  const dangerSeed =
    formatHex({
      mode: 'oklch',
      l: 0.56,
      c: Math.min(0.22 * vibrancy, 0.26),
      h: STATUS_HUES.danger,
    }) ?? '#f04438';

  return {
    '--color-gray': generateScale(graySeed),
    '--color-success': generateScale(successSeed),
    '--color-warning': generateScale(warningSeed),
    '--color-danger': generateScale(dangerSeed),
  };
}
