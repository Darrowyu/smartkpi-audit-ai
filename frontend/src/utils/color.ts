/** HEX 颜色转 HSL 格式 (Tailwind 使用) */
export function hexToHsl(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** 生成深色变体 (用于 hover 状态) */
export function darkenColor(hex: string, percent: number = 15): string {
  hex = hex.replace('#', '');
  const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - Math.round(255 * percent / 100));
  const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - Math.round(255 * percent / 100));
  const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - Math.round(255 * percent / 100));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** 生成浅色变体 (用于 secondary) */
export function lightenColor(hex: string, percent: number = 20): string {
  hex = hex.replace('#', '');
  const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + Math.round(255 * percent / 100));
  const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + Math.round(255 * percent / 100));
  const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + Math.round(255 * percent / 100));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** 验证 HEX 颜色格式 */
export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

/** 计算颜色亮度 (0-255)，用于判断是浅色还是深色 */
export function getLuminance(hex: string): number {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000; // YIQ 公式
}

/** 判断颜色是否为浅色 (亮度 > 128) */
export function isLightColor(hex: string): boolean {
  return getLuminance(hex) > 128;
}

/** 获取适合的文字颜色 (浅色背景用深色文字，深色背景用浅色文字) */
export function getContrastTextColor(bgHex: string): string {
  return isLightColor(bgHex) ? '#1e293b' : '#ffffff';
}
