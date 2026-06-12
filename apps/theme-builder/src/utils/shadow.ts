export interface ShadowParts {
  x: number;
  y: number;
  blur: number;
  spread: number;
  r: number;
  g: number;
  b: number;
  opacity: number;
}

export function parseShadow(value: string): ShadowParts | null {
  const trimmed = value.trim();
  const rgbIndex = trimmed.indexOf('rgb(');
  if (rgbIndex === -1) return null;

  const lengthStr = trimmed.slice(0, rgbIndex).trim();
  const rgbStr = trimmed.slice(rgbIndex + 4);

  const lengths = lengthStr.split(/\s+/).map((t) => parseFloat(t));
  if (lengths.length < 3 || lengths.some(isNaN)) return null;

  const [x, y, blur, spread = 0] = lengths;

  const rgbMatch = rgbStr.match(/^([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\/\s*([\d.]+)/);
  if (!rgbMatch) return null;

  return {
    x,
    y,
    blur,
    spread,
    r: Math.round(parseFloat(rgbMatch[1])),
    g: Math.round(parseFloat(rgbMatch[2])),
    b: Math.round(parseFloat(rgbMatch[3])),
    opacity: parseFloat(rgbMatch[4]),
  };
}

export function serializeShadow(p: ShadowParts): string {
  const x = p.x === 0 ? '0' : `${p.x}px`;
  const y = p.y === 0 ? '0' : `${p.y}px`;
  const spread = p.spread !== 0 ? ` ${p.spread}px` : '';
  return `${x} ${y}px ${p.blur}px${spread} rgb(${p.r} ${p.g} ${p.b} / ${p.opacity.toFixed(2)})`;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}
