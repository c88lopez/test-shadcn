/**
 * Client-side application settings (club profile, reservations, notifications,
 * inventory, security). Persisted to localStorage and exposed through a tiny
 * external store so any component can subscribe with `useAppSettings()` and
 * react to live changes. Demo-grade — there is no server sync.
 */

import { useSyncExternalStore } from "react"
import { USER_ROLES } from "@/lib/users"
import type { UserRole } from "@/lib/users"

// --- Types ---

export type TimeFormat = "12h" | "24h"
export type WeekStart = "monday" | "sunday"

export interface GeneralSettings {
  address: string
  phone: string
  email: string
  timezone: string
  timeFormat: TimeFormat
  weekStart: WeekStart
}

export interface NotificationSettings {
  channels: { email: boolean; whatsapp: boolean }
  events: { confirmations: boolean; reminders: boolean; cancellations: boolean }
  reminderOffsets: number[]
  inApp: {
    bookings: boolean
    payments: boolean
    lowStock: boolean
    system: boolean
  }
}

export interface InventorySettings {
  lowStockThreshold: number
}

export interface SecuritySettings {
  defaultRole: UserRole
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireNumber: boolean
  passwordRequireSymbol: boolean
  passwordExpiryDays: number
  sessionTimeoutMinutes: number
}

export interface AppSettings {
  general: GeneralSettings
  notifications: NotificationSettings
  inventory: InventorySettings
  security: SecuritySettings
}

// --- Option lists (for selects) ---

export const TIMEZONES: string[] = [
  "UTC",
  "Europe/Madrid",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo",
]

export const REMINDER_OFFSETS: { hours: number; label: string }[] = [
  { hours: 1, label: "1 hour" },
  { hours: 2, label: "2 hours" },
  { hours: 24, label: "1 day" },
  { hours: 48, label: "2 days" },
]

// --- Defaults ---

export const DEFAULT_APP_SETTINGS: AppSettings = {
  general: {
    address: "",
    phone: "",
    email: "",
    timezone: "Europe/Madrid",
    timeFormat: "24h",
    weekStart: "monday",
  },
  notifications: {
    channels: { email: true, whatsapp: false },
    events: { confirmations: true, reminders: true, cancellations: true },
    reminderOffsets: [24, 1],
    inApp: { bookings: true, payments: true, lowStock: true, system: true },
  },
  inventory: {
    lowStockThreshold: 10,
  },
  security: {
    defaultRole: "Front Desk",
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumber: true,
    passwordRequireSymbol: false,
    passwordExpiryDays: 90,
    sessionTimeoutMinutes: 30,
  },
}

// Settings are scoped per club. Each club's blob lives under
// `app_settings:<clubId>`. The legacy un-scoped key is used as a one-time
// fallback so existing browsers keep their previously saved settings.
const STORAGE_PREFIX = "app_settings"
const LEGACY_STORAGE_KEY = "app_settings"

function storageKey(clubId: string): string {
  return `${STORAGE_PREFIX}:${clubId}`
}

// --- Persistence ---

type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> }

function merge(parsed: DeepPartial<AppSettings> | null): AppSettings {
  const D = DEFAULT_APP_SETTINGS
  return {
    general: { ...D.general, ...parsed?.general },
    notifications: {
      ...D.notifications,
      ...parsed?.notifications,
      channels: {
        ...D.notifications.channels,
        ...parsed?.notifications?.channels,
      },
      events: { ...D.notifications.events, ...parsed?.notifications?.events },
      inApp: { ...D.notifications.inApp, ...parsed?.notifications?.inApp },
      reminderOffsets:
        (parsed?.notifications?.reminderOffsets as number[] | undefined) ??
        D.notifications.reminderOffsets,
    },
    inventory: { ...D.inventory, ...parsed?.inventory },
    security: { ...D.security, ...parsed?.security },
  }
}

// Loads a specific club's settings, falling back to any legacy un-scoped blob
// (pre per-club settings) and finally the defaults.
export function loadAppSettings(clubId: string | null): AppSettings {
  if (typeof window === "undefined" || !clubId) return DEFAULT_APP_SETTINGS
  try {
    const raw =
      localStorage.getItem(storageKey(clubId)) ??
      localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return DEFAULT_APP_SETTINGS
    return merge(JSON.parse(raw) as DeepPartial<AppSettings>)
  } catch {
    return DEFAULT_APP_SETTINGS
  }
}

function persist(clubId: string, settings: AppSettings) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(storageKey(clubId), JSON.stringify(settings))
  } catch {
    /* ignore quota / serialization errors */
  }
}

// --- External store ---

// The club whose settings are currently loaded into the store. Until the active
// club is known (set by the authenticated layout) the store holds defaults.
let activeClubId: string | null = null
let store: AppSettings = DEFAULT_APP_SETTINGS
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAppSettings(): AppSettings {
  return store
}

// Points the store at a club's settings. Called when the active club is known
// or changes (e.g. after switching clubs). No-op when already active.
export function setActiveSettingsClub(clubId: string | null) {
  if (clubId === activeClubId) return
  activeClubId = clubId
  store = loadAppSettings(clubId)
  listeners.forEach((l) => l())
}

export function setAppSettings(next: AppSettings) {
  store = next
  if (activeClubId) persist(activeClubId, next)
  listeners.forEach((l) => l())
}

export function resetAppSettings() {
  setAppSettings(DEFAULT_APP_SETTINGS)
}

export function useAppSettings(): AppSettings {
  return useSyncExternalStore(
    subscribe,
    getAppSettings,
    () => DEFAULT_APP_SETTINGS
  )
}

// --- Helpers ---

/** The single currency symbol used across the app for now. */
export const CURRENCY_SYMBOL = "$"

// Currency is fixed to USD-style "$" for now; clubs will get per-country
// currency support later.
export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** Returns the currency symbol, for compact contexts like chart axes. */
export function getCurrencySymbol(): string {
  return CURRENCY_SYMBOL
}

/** Formats a single "HH:MM" string respecting the 12h/24h preference. */
export function formatTimeString(hhmm: string, timeFormat: TimeFormat): string {
  const [h, m] = hhmm.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
  if (timeFormat === "24h") {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }
  const period = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, "0")} ${period}`
}

/** Formats a "HH:MM – HH:MM" range respecting the 12h/24h preference. */
export function formatTimeRange(range: string, timeFormat: TimeFormat): string {
  const [start, end] = range.split(" – ")
  if (!start || !end) return range
  return `${formatTimeString(start, timeFormat)} – ${formatTimeString(end, timeFormat)}`
}

/** Parses an input value into a number, clamped to [min, max]. */
export function clampNumber(
  value: string,
  min: number,
  max = Number.POSITIVE_INFINITY
): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

/** Formats an "HH:MM" string respecting the configured 12h/24h preference. */
export function formatHour(hour: number, timeFormat: TimeFormat): string {
  if (timeFormat === "24h") return `${String(hour).padStart(2, "0")}:00`
  const period = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12} ${period}`
}

export { USER_ROLES }
export type { UserRole }
