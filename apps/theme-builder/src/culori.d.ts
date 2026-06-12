declare module 'culori' {
  interface OklchColor {
    mode: 'oklch';
    l: number;
    c: number;
    h: number;
  }

  type Color = OklchColor | { mode: string; [key: string]: unknown };

  export function formatHex(color: Color | null | undefined): string | undefined;
  export function oklch(color: string | Color): OklchColor | undefined;
  export function interpolate(colors: Color[], mode?: string): (t: number) => Color;
}
