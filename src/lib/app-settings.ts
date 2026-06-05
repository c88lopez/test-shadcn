/**
 * Client-side application settings (club profile, reservations, notifications,
 * inventory, security). Persisted to localStorage and exposed through a tiny
 * external store so any component can subscribe with `useAppSettings()` and
 * react to live changes. Demo-grade — there is no server sync.
 */

import { useSyncExternalStore } from "react"
import { USER_ROLES } from "@/components/new-user-drawer"
import type { UserRole } from "@/components/new-user-drawer"

// --- Types ---

export type TimeFormat = "12h" | "24h"
export type WeekStart = "monday" | "sunday"

export interface GeneralSettings {
  clubName: string
  clubInitials: string
  address: string
  phone: string
  email: string
  timezone: string
  currency: string
  locale: string
  timeFormat: TimeFormat
  weekStart: WeekStart
}

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"

export interface DayHours {
  open: string
  close: string
  closed: boolean
}

export type CourtType = "indoor" | "outdoor"

export interface Court {
  id: number
  name: string
  type: CourtType
  active: boolean
}

export interface ReservationSettings {
  hours: Record<Weekday, DayHours>
  courts: Court[]
  slotDuration: number
  defaultBookingLength: number
  minAdvanceHours: number
  maxAdvanceDays: number
  cancellationCutoffHours: number
  maxConcurrentPerPlayer: number
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
  reservations: ReservationSettings
  notifications: NotificationSettings
  inventory: InventorySettings
  security: SecuritySettings
}

// --- Option lists (for selects) ---

export const CURRENCIES: { code: string; label: string }[] = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "ARS", label: "Argentine Peso ($)" },
  { code: "MXN", label: "Mexican Peso ($)" },
  { code: "BRL", label: "Brazilian Real (R$)" },
]

export const LOCALES: { code: string; label: string }[] = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Spanish (Spain)" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "pt-BR", label: "Portuguese (Brazil)" },
  { code: "it-IT", label: "Italian" },
]

export const TIMEZONES: string[] = [
  "UTC",
  "Europe/Madrid",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo",
]

export const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
]

export const REMINDER_OFFSETS: { hours: number; label: string }[] = [
  { hours: 1, label: "1 hour" },
  { hours: 2, label: "2 hours" },
  { hours: 24, label: "1 day" },
  { hours: 48, label: "2 days" },
]

export const SLOT_DURATIONS = [30, 60, 90] as const

// Maps JS Date.getDay() (0 = Sunday) to our weekday keys.
const DAY_INDEX_TO_KEY: Weekday[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
]

// --- Defaults ---

function defaultHours(): Record<Weekday, DayHours> {
  const entries = WEEKDAYS.map((d) => [
    d.key,
    { open: "08:00", close: "23:00", closed: d.key === "sun" },
  ])
  return Object.fromEntries(entries) as Record<Weekday, DayHours>
}

function defaultCourts(): Court[] {
  return Array.from(
    { length: 6 },
    (_, i): Court => ({
      id: i + 1,
      name: `Court ${i + 1}`,
      type: "indoor",
      active: true,
    })
  )
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  general: {
    clubName: "GQG",
    clubInitials: "GQ",
    address: "",
    phone: "",
    email: "",
    timezone: "Europe/Madrid",
    currency: "EUR",
    locale: "es-ES",
    timeFormat: "24h",
    weekStart: "monday",
  },
  reservations: {
    hours: defaultHours(),
    courts: defaultCourts(),
    slotDuration: 60,
    defaultBookingLength: 90,
    minAdvanceHours: 1,
    maxAdvanceDays: 30,
    cancellationCutoffHours: 24,
    maxConcurrentPerPlayer: 2,
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

const STORAGE_KEY = "app_settings"

// --- Persistence ---

type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> }

function merge(parsed: DeepPartial<AppSettings> | null): AppSettings {
  const D = DEFAULT_APP_SETTINGS
  const parsedHours = parsed?.reservations?.hours
  const hours = Object.fromEntries(
    WEEKDAYS.map((d) => [
      d.key,
      { ...D.reservations.hours[d.key], ...parsedHours?.[d.key] },
    ])
  ) as Record<Weekday, DayHours>
  return {
    general: { ...D.general, ...parsed?.general },
    reservations: {
      ...D.reservations,
      ...parsed?.reservations,
      hours,
      courts:
        (parsed?.reservations?.courts as Court[] | undefined) ??
        D.reservations.courts,
    },
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

export function loadAppSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_APP_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_APP_SETTINGS
    return merge(JSON.parse(raw) as DeepPartial<AppSettings>)
  } catch {
    return DEFAULT_APP_SETTINGS
  }
}

function persist(settings: AppSettings) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* ignore quota / serialization errors */
  }
}

// --- External store ---

let store: AppSettings = loadAppSettings()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAppSettings(): AppSettings {
  return store
}

export function setAppSettings(next: AppSettings) {
  store = next
  persist(next)
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

export function formatCurrency(
  amount: number,
  general: GeneralSettings
): string {
  try {
    return new Intl.NumberFormat(general.locale, {
      style: "currency",
      currency: general.currency,
    }).format(amount)
  } catch {
    return `${general.currency} ${amount.toFixed(2)}`
  }
}

export function todayHours(reservations: ReservationSettings): DayHours {
  const key = DAY_INDEX_TO_KEY[new Date().getDay()]
  return reservations.hours[key]
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
