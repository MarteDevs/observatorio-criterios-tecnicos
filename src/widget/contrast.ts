// Utilidad WCAG 2.1 sin dependencias, para el chequeo de contraste del widget
// embebible (RF-14: si el estilo heredado o personalizado no es legible, se
// vuelve al estilo por defecto).

type Rgb = [number, number, number];

export function parseCssColor(input: string | null | undefined): Rgb | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();

  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(s);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16)
      ];
    }
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }

  const rgbMatch = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(s);
  if (rgbMatch) {
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  }

  return null;
}

function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.04045 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** true si el par texto/fondo cumple WCAG 2.1 AA para texto normal (4.5:1). */
export function isReadablePair(textColor: string | null | undefined, bgColor: string | null | undefined): boolean {
  const text = parseCssColor(textColor);
  const bg = parseCssColor(bgColor);
  if (!text || !bg) return false;
  return contrastRatio(text, bg) >= 4.5;
}
