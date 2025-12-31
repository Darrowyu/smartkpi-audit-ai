import { AppearanceSettings } from '@/api/users.api';
import { getContrastTextColor, hexToHsl, isLightColor, isValidHex } from '@/utils/color';

export const APPEARANCE_STORAGE_KEY = 'user_appearance';

const THEME_VALUES = ['light', 'dark', 'system'] as const;
const ACCENT_VALUES = ['blue', 'teal', 'purple', 'orange', 'custom'] as const;
const FONT_SIZE_VALUES = ['small', 'medium', 'large'] as const;

const isOneOf = <T extends readonly string[]>(value: unknown, list: T): value is T[number] => (
  typeof value === 'string' && (list as readonly string[]).includes(value)
);

const isAppearanceSettings = (value: unknown): value is AppearanceSettings => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    isOneOf(v.theme, THEME_VALUES)
    && isOneOf(v.accentColor, ACCENT_VALUES)
    && isOneOf(v.fontSize, FONT_SIZE_VALUES)
    && typeof v.compactMode === 'boolean'
    && typeof v.animations === 'boolean'
    && (v.customColor === undefined || typeof v.customColor === 'string')
  );
};

export const readCachedAppearanceSettings = (): AppearanceSettings | null => {
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isAppearanceSettings(parsed)) return parsed;

    if (parsed && typeof parsed === 'object' && 'settings' in parsed) {
      const nested = (parsed as { settings?: unknown }).settings;
      if (isAppearanceSettings(nested)) return nested;
    }

    return null;
  } catch {
    return null;
  }
};

export const isDefaultAppearanceSettings = (settings: AppearanceSettings): boolean => (
  settings.theme === 'light'
  && settings.accentColor === 'blue'
  && settings.fontSize === 'medium'
  && settings.compactMode === false
  && settings.animations === true
);

export const ACCENT_COLOR_MAP = {
  blue: { hex: '#1E4B8E' },
  teal: { hex: '#0D9488' },
  purple: { hex: '#7C3AED' },
  orange: { hex: '#EA580C' },
} satisfies Record<Exclude<AppearanceSettings['accentColor'], 'custom'>, { hex: string }>;

export const FONT_SIZE_MAP = {
  small: '14px',
  medium: '16px',
  large: '18px',
} satisfies Record<AppearanceSettings['fontSize'], string>;

const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';
const PRIMARY_FOREGROUND_LIGHT = '210 40% 98%';
const PRIMARY_FOREGROUND_DARK = '222.2 47.4% 11.2%';

type Hsl = { h: number; s: number; l: number };

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const parseHsl = (hsl: string): Hsl => {
  const [hRaw, sRaw, lRaw] = hsl.trim().split(/\s+/);
  const h = Number(hRaw);
  const s = Number(String(sRaw).replace('%', ''));
  const l = Number(String(lRaw).replace('%', ''));
  return {
    h: Number.isFinite(h) ? h : 0,
    s: Number.isFinite(s) ? s : 0,
    l: Number.isFinite(l) ? l : 0,
  };
};

const formatHsl = (hsl: Hsl): string => `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`;

const hslToHex = (hsl: Hsl): string => {
  const h = ((hsl.h % 360) + 360) % 360;
  const s = clamp(hsl.s, 0, 100) / 100;
  const l = clamp(hsl.l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (h < 60) {
    r1 = c; g1 = x; b1 = 0;
  } else if (h < 120) {
    r1 = x; g1 = c; b1 = 0;
  } else if (h < 180) {
    r1 = 0; g1 = c; b1 = x;
  } else if (h < 240) {
    r1 = 0; g1 = x; b1 = c;
  } else if (h < 300) {
    r1 = x; g1 = 0; b1 = c;
  } else {
    r1 = c; g1 = 0; b1 = x;
  }

  const to255 = (v: number): number => Math.round((v + m) * 255);
  const r = clamp(to255(r1), 0, 255);
  const g = clamp(to255(g1), 0, 255);
  const b = clamp(to255(b1), 0, 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
};

const tuneAccentForTheme = (base: Hsl, isDark: boolean): Hsl => {
  if (!isDark) return base;

  const sBoost = base.s < 50 ? 22 : base.s < 70 ? 14 : 8;
  const lBoost = base.l < 45 ? 30 : base.l < 60 ? 22 : 14;

  return {
    h: base.h,
    s: clamp(base.s + sBoost, 45, 95),
    l: clamp(base.l + lBoost, 55, 75),
  };
};

const resolveAccentHex = (settings: AppearanceSettings): { hex: string; dataAccent: string } => {
  if (settings.accentColor === 'custom' && settings.customColor && isValidHex(settings.customColor)) {
    return { hex: settings.customColor, dataAccent: 'custom' };
  }

  if (settings.accentColor !== 'custom') {
    return { hex: ACCENT_COLOR_MAP[settings.accentColor].hex, dataAccent: settings.accentColor };
  }

  return { hex: ACCENT_COLOR_MAP.blue.hex, dataAccent: 'blue' };
};

let systemMql: MediaQueryList | null = null;
let systemHandler: ((e: MediaQueryListEvent) => void) | null = null;
let lastSettings: AppearanceSettings | null = null;

const detachSystemListener = () => {
  if (!systemMql || !systemHandler) return;
  if (typeof systemMql.removeEventListener === 'function') systemMql.removeEventListener('change', systemHandler);
  else systemMql.removeListener(systemHandler);
  systemHandler = null;
};

const syncSystemListener = (settings: AppearanceSettings) => {
  if (settings.theme !== 'system') {
    detachSystemListener();
    return;
  }
  if (!systemMql) systemMql = window.matchMedia(SYSTEM_DARK_QUERY);
  if (systemHandler) return;

  systemHandler = () => {
    if (lastSettings?.theme !== 'system') return;
    applyAppearanceSettings(lastSettings);
  };

  if (typeof systemMql.addEventListener === 'function') systemMql.addEventListener('change', systemHandler);
  else systemMql.addListener(systemHandler);
};

export const applyAppearanceSettings = (settings: AppearanceSettings): void => {
  lastSettings = settings;

  const root = document.documentElement;
  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia(SYSTEM_DARK_QUERY).matches);
  root.classList.toggle('dark', isDark);
  syncSystemListener(settings);

  const { hex: baseHex, dataAccent } = resolveAccentHex(settings);
  const baseHsl = parseHsl(hexToHsl(baseHex));
  const tunedHsl = tuneAccentForTheme(baseHsl, isDark);
  const tunedHex = isDark ? hslToHex(tunedHsl) : baseHex;

  const primaryForeground = isLightColor(tunedHex) ? PRIMARY_FOREGROUND_DARK : PRIMARY_FOREGROUND_LIGHT;
  const brandText = getContrastTextColor(tunedHex);
  const brandTextMuted = brandText === '#ffffff' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 41, 59, 0.7)';

  const secondaryHsl = {
    ...tunedHsl,
    l: clamp(isLightColor(tunedHex) ? tunedHsl.l - 18 : tunedHsl.l + 25, 10, 92),
  };
  const brandSecondary = hslToHex(secondaryHsl);
  const brandDark = hslToHex({ ...tunedHsl, l: clamp(tunedHsl.l - 12, 8, 85) });
  const brandDarkHover = hslToHex({ ...tunedHsl, l: clamp(tunedHsl.l - 18, 5, 80) });

  root.style.setProperty('--accent-color', baseHex);
  root.style.setProperty('--primary', formatHsl(tunedHsl));
  root.style.setProperty('--primary-foreground', primaryForeground);
  root.style.setProperty('--ring', formatHsl(tunedHsl));
  root.setAttribute('data-accent', dataAccent);

  root.style.setProperty('--brand-primary', tunedHex);
  root.style.setProperty('--brand-secondary', brandSecondary);
  root.style.setProperty('--brand-dark', brandDark);
  root.style.setProperty('--brand-dark-hover', brandDarkHover);
  root.style.setProperty('--brand-text', brandText);
  root.style.setProperty('--brand-text-muted', brandTextMuted);

  root.style.setProperty('--base-font-size', FONT_SIZE_MAP[settings.fontSize]);
  root.classList.toggle('compact', settings.compactMode);
  root.classList.toggle('no-animations', !settings.animations);

  if (isDark) {
    root.style.setProperty('--nav-bg', '#0F172A');
    root.style.setProperty('--nav-active', '#1E293B');
    root.style.setProperty('--nav-border', '#1E293B');
    root.style.setProperty('--nav-text', '#F8FAFC');
    root.style.setProperty('--nav-text-muted', 'rgba(248, 250, 252, 0.7)');
    root.style.setProperty('--nav-accent', tunedHex);
  } else {
    root.style.setProperty('--nav-bg', tunedHex);
    root.style.setProperty('--nav-active', brandDark);
    root.style.setProperty('--nav-border', brandDark);
    root.style.setProperty('--nav-text', brandText);
    root.style.setProperty('--nav-text-muted', brandTextMuted);
    root.style.setProperty('--nav-accent', brandSecondary);
  }

  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(settings));
  } catch {}
};
