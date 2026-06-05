/**
 * Client-side UI preferences (theme, accent color, base font size).
 *
 * Preferences are persisted to localStorage and applied by mutating CSS custom
 * properties / the `.dark` class on <html>. Inline styles on the root element
 * win over the stylesheet's `:root`/`.dark` definitions, so the accent applies
 * in both light and dark mode. This is a demo-grade store — no server sync.
 */

export type ThemeMode = "light" | "dark" | "system"
export type FontSizeKey = "sm" | "md" | "lg"

export interface AccentColor {
  key: string
  label: string
  /** Swatch color shown in the picker (any CSS color). */
  swatch: string
  /** OKLCH value applied to --primary. */
  primary: string
  /** OKLCH value applied to --primary-foreground. */
  primaryForeground: string
  /** 5-shade ramp (light → dark) applied to --chart-1..5. */
  chart: [string, string, string, string, string]
}

// A chart ramp keeps the lightness/chroma progression of the default green
// palette and only swaps the hue, so every accent gets a coherent 5-shade set.
function chartRamp(hue: number): [string, string, string, string, string] {
  return [
    `oklch(0.871 0.15 ${hue})`,
    `oklch(0.723 0.219 ${hue})`,
    `oklch(0.627 0.194 ${hue})`,
    `oklch(0.527 0.154 ${hue})`,
    `oklch(0.448 0.119 ${hue})`,
  ]
}

export const ACCENT_COLORS: AccentColor[] = [
  {
    key: "green",
    label: "Green",
    swatch: "oklch(0.527 0.154 150.069)",
    primary: "oklch(0.527 0.154 150.069)",
    primaryForeground: "oklch(0.982 0.018 155.826)",
    chart: [
      "oklch(0.871 0.15 154.449)",
      "oklch(0.723 0.219 149.579)",
      "oklch(0.627 0.194 149.214)",
      "oklch(0.527 0.154 150.069)",
      "oklch(0.448 0.119 151.328)",
    ],
  },
  {
    key: "blue",
    label: "Blue",
    swatch: "oklch(0.546 0.183 262.9)",
    primary: "oklch(0.546 0.183 262.9)",
    primaryForeground: "oklch(0.985 0 0)",
    chart: chartRamp(262.9),
  },
  {
    key: "violet",
    label: "Violet",
    swatch: "oklch(0.541 0.222 293.9)",
    primary: "oklch(0.541 0.222 293.9)",
    primaryForeground: "oklch(0.985 0 0)",
    chart: chartRamp(293.9),
  },
  {
    key: "orange",
    label: "Orange",
    swatch: "oklch(0.646 0.182 50.5)",
    primary: "oklch(0.646 0.182 50.5)",
    primaryForeground: "oklch(0.985 0 0)",
    chart: chartRamp(50.5),
  },
  {
    key: "rose",
    label: "Rose",
    swatch: "oklch(0.586 0.222 17.6)",
    primary: "oklch(0.586 0.222 17.6)",
    primaryForeground: "oklch(0.985 0 0)",
    chart: chartRamp(17.6),
  },
]

export const FONT_SIZES: { key: FontSizeKey; label: string; px: number }[] = [
  { key: "sm", label: "Small", px: 14 },
  { key: "md", label: "Default", px: 16 },
  { key: "lg", label: "Large", px: 18 },
]

export interface UiSettings {
  theme: ThemeMode
  accent: string
  fontSize: FontSizeKey
}

export const DEFAULT_UI_SETTINGS: UiSettings = {
  theme: "light",
  accent: "green",
  fontSize: "md",
}

const STORAGE_KEY = "ui_settings"

export function loadUiSettings(): UiSettings {
  if (typeof window === "undefined") return DEFAULT_UI_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_UI_SETTINGS
    const parsed = JSON.parse(raw) as Partial<UiSettings>
    return { ...DEFAULT_UI_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_UI_SETTINGS
  }
}

export function saveUiSettings(settings: UiSettings) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

function resolveDark(theme: ThemeMode): boolean {
  if (theme === "dark") return true
  if (theme === "light") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

/**
 * Returns a self-contained script (no imports) that applies the persisted UI
 * settings to <html> synchronously, before first paint. Inject it in the
 * document <head> so a full page load starts at the saved theme/accent/size
 * instead of flashing the defaults first. Mirrors `applyUiSettings`; the data
 * (accents/sizes/defaults) is serialized from this module so it stays in sync.
 */
export function getUiSettingsInitScript(): string {
  const accents = ACCENT_COLORS.map((a) => ({
    key: a.key,
    primary: a.primary,
    primaryForeground: a.primaryForeground,
    chart: a.chart,
  }))
  const fonts = FONT_SIZES.map((f) => ({ key: f.key, px: f.px }))
  return `(function(){try{
var KEY=${JSON.stringify(STORAGE_KEY)},D=${JSON.stringify(DEFAULT_UI_SETTINGS)},A=${JSON.stringify(accents)},F=${JSON.stringify(fonts)};
var raw=localStorage.getItem(KEY);
var s=raw?Object.assign({},D,JSON.parse(raw)):D;
var r=document.documentElement;
var dark=s.theme==="dark"||(s.theme==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
r.classList.toggle("dark",dark);
var a=A.filter(function(x){return x.key===s.accent;})[0]||A[0];
r.style.setProperty("--primary",a.primary);
r.style.setProperty("--primary-foreground",a.primaryForeground);
r.style.setProperty("--sidebar-primary",a.primary);
r.style.setProperty("--sidebar-primary-foreground",a.primaryForeground);
r.style.setProperty("--ring",a.primary);
for(var i=0;i<a.chart.length;i++){r.style.setProperty("--chart-"+(i+1),a.chart[i]);}
var f=F.filter(function(x){return x.key===s.fontSize;})[0]||F[1];
r.style.fontSize=f.px+"px";
}catch(e){}})();`
}

export function applyUiSettings(settings: UiSettings) {
  if (typeof window === "undefined") return
  const root = document.documentElement

  root.classList.toggle("dark", resolveDark(settings.theme))

  const accent =
    ACCENT_COLORS.find((a) => a.key === settings.accent) ?? ACCENT_COLORS[0]
  root.style.setProperty("--primary", accent.primary)
  root.style.setProperty("--primary-foreground", accent.primaryForeground)
  root.style.setProperty("--sidebar-primary", accent.primary)
  root.style.setProperty(
    "--sidebar-primary-foreground",
    accent.primaryForeground
  )
  root.style.setProperty("--ring", accent.primary)
  accent.chart.forEach((shade, i) => {
    root.style.setProperty(`--chart-${i + 1}`, shade)
  })

  const fontSize =
    FONT_SIZES.find((f) => f.key === settings.fontSize) ?? FONT_SIZES[1]
  root.style.fontSize = `${fontSize.px}px`
}
