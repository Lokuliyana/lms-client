/**
 * Color manipulation utilities for dynamic LMS branding and white-label theming.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex?: string): RgbColor | null {
  if (!hex) return null;
  let c = hex.trim().replace(/^#/, "");
  if (c.length === 3) {
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  }
  if (c.length !== 6) return null;
  const num = parseInt(c, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getContrastForeground(hex?: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#ffffff";
  // W3C relative luminance perception formula
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 165 ? "#0f172a" : "#ffffff";
}

export function adjustHexBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, Math.max(0, Math.round(rgb.r + (255 * percent) / 100)));
  const g = Math.min(255, Math.max(0, Math.round(rgb.g + (255 * percent) / 100)));
  const b = Math.min(255, Math.max(0, Math.round(rgb.b + (255 * percent) / 100)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function applyThemeTokensToDOM(primaryHex?: string, accentHex?: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  if (primaryHex && primaryHex.trim()) {
    const cleanPrimary = primaryHex.trim();
    root.style.setProperty("--primary", cleanPrimary);
    root.style.setProperty("--primary-color", cleanPrimary);
    const pRgb = hexToRgb(cleanPrimary);
    if (pRgb) {
      root.style.setProperty("--primary-rgb", `${pRgb.r} ${pRgb.g} ${pRgb.b}`);
      root.style.setProperty(
        "--primary-hover",
        adjustHexBrightness(cleanPrimary, -12)
      );
      root.style.setProperty("--ring", cleanPrimary);
    }
    root.style.setProperty(
      "--primary-foreground",
      getContrastForeground(cleanPrimary)
    );
  }

  if (accentHex && accentHex.trim()) {
    const cleanAccent = accentHex.trim();
    root.style.setProperty("--accent", cleanAccent);
    root.style.setProperty("--accent-color", cleanAccent);
    const aRgb = hexToRgb(cleanAccent);
    if (aRgb) {
      root.style.setProperty("--accent-rgb", `${aRgb.r} ${aRgb.g} ${aRgb.b}`);
    }
    root.style.setProperty(
      "--accent-foreground",
      getContrastForeground(cleanAccent)
    );
  }
}
