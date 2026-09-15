// Color utilities to convert hex to HSL/RGB and generate palette shades

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const sanitized = hex.replace('#', '');
  if (sanitized.length === 3) {
    const r = parseInt(sanitized[0] + sanitized[0], 16);
    const g = parseInt(sanitized[1] + sanitized[1], 16);
    const b = parseInt(sanitized[2] + sanitized[2], 16);
    return { r, g, b };
  } else if (sanitized.length === 6) {
    const r = parseInt(sanitized.substring(0, 2), 16);
    const g = parseInt(sanitized.substring(2, 4), 16);
    const b = parseInt(sanitized.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const adjust = (channel: number) => {
    const val = Math.round(channel + (255 - channel) * (percent / 100));
    return Math.min(255, Math.max(0, val));
  };
  const darken = (channel: number) => {
    const val = Math.round(channel * (1 + percent / 100));
    return Math.min(255, Math.max(0, val));
  };

  const r = percent > 0 ? adjust(rgb.r) : darken(rgb.r);
  const g = percent > 0 ? adjust(rgb.g) : darken(rgb.g);
  const b = percent > 0 ? adjust(rgb.b) : darken(rgb.b);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function applyBrandTheme(primaryColor: string) {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', primaryColor);
  root.style.setProperty('--brand-50', adjustBrightness(primaryColor, 92));
  root.style.setProperty('--brand-100', adjustBrightness(primaryColor, 84));
  root.style.setProperty('--brand-200', adjustBrightness(primaryColor, 70));
  root.style.setProperty('--brand-300', adjustBrightness(primaryColor, 50));
  root.style.setProperty('--brand-400', adjustBrightness(primaryColor, 25));
  root.style.setProperty('--brand-500', adjustBrightness(primaryColor, 10));
  root.style.setProperty('--brand-600', primaryColor);
  root.style.setProperty('--brand-700', adjustBrightness(primaryColor, -15));
  root.style.setProperty('--brand-800', adjustBrightness(primaryColor, -30));
  root.style.setProperty('--brand-900', adjustBrightness(primaryColor, -45));
}
