import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  IconCheck,
  IconDeviceDesktop,
  IconMoon,
  IconSun,
} from "@tabler/icons-react"
import type { Icon } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  ACCENT_COLORS,
  applyUiSettings,
  DEFAULT_UI_SETTINGS,
  FONT_SIZES,
  loadUiSettings,
  saveUiSettings,
} from "@/lib/ui-settings"
import type { ThemeMode, UiSettings } from "@/lib/ui-settings"

export const Route = createFileRoute("/_authenticated/settings/ui")({
  component: UiSettingsPage,
})

const themeOptions: { value: ThemeMode; label: string; icon: Icon }[] = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "system", label: "System", icon: IconDeviceDesktop },
]

function UiSettingsPage() {
  const [settings, setSettings] = useState<UiSettings>(() => loadUiSettings())

  function update(partial: Partial<UiSettings>) {
    const next = { ...settings, ...partial }
    setSettings(next)
    saveUiSettings(next)
    applyUiSettings(next)
  }

  function resetDefaults() {
    setSettings(DEFAULT_UI_SETTINGS)
    saveUiSettings(DEFAULT_UI_SETTINGS)
    applyUiSettings(DEFAULT_UI_SETTINGS)
    toast.success("Appearance reset to defaults")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">UI</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Customize the theme, accent color and text size.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={resetDefaults}>
          Reset to defaults
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose light, dark, or match your operating system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            {themeOptions.map((opt) => {
              const active = settings.theme === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ theme: opt.value })}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-muted",
                    active
                      ? "border-primary ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "border-border"
                  )}
                >
                  <opt.icon className="size-5" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accent color</CardTitle>
          <CardDescription>
            Used for primary buttons, highlights and active states.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((color) => {
              const active = settings.accent === color.key
              return (
                <button
                  key={color.key}
                  type="button"
                  title={color.label}
                  aria-label={color.label}
                  onClick={() => update({ accent: color.key })}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full transition-transform hover:scale-105",
                    active &&
                      "ring-2 ring-ring ring-offset-2 ring-offset-background"
                  )}
                  style={{ backgroundColor: color.swatch }}
                >
                  {active && (
                    <IconCheck className="size-5 text-white" stroke={3} />
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Font size</CardTitle>
          <CardDescription>
            Scales text and spacing across the whole app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            {FONT_SIZES.map((size) => {
              const active = settings.fontSize === size.key
              return (
                <button
                  key={size.key}
                  type="button"
                  onClick={() => update({ fontSize: size.key })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-4 transition-colors hover:bg-muted",
                    active
                      ? "border-primary ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "border-border"
                  )}
                >
                  <span className="font-semibold" style={{ fontSize: size.px }}>
                    A
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {size.label}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
