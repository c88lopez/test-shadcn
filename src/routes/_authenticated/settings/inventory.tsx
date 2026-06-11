import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ensurePermission } from "@/lib/route-guards"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  clampNumber,
  DEFAULT_APP_SETTINGS,
  setAppSettings,
  useAppSettings,
} from "@/lib/app-settings"

export const Route = createFileRoute("/_authenticated/settings/inventory")({
  beforeLoad: ({ context }) =>
    ensurePermission(context.user.role, "settings:manage"),
  component: InventorySettingsPage,
})

function InventorySettingsPage() {
  const { t } = useTranslation()
  const settings = useAppSettings()
  const { inventory } = settings

  function setThreshold(value: number) {
    setAppSettings({
      ...settings,
      inventory: { ...inventory, lowStockThreshold: value },
    })
  }

  function reset() {
    setAppSettings({ ...settings, inventory: DEFAULT_APP_SETTINGS.inventory })
    toast.success(t("settings.inventory.resetToast"))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">
            {t("settings.inventory.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("settings.inventory.description")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          {t("common.resetToDefaults")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("settings.inventory.lowStockThreshold.title")}
          </CardTitle>
          <CardDescription>
            {t("settings.inventory.lowStockThreshold.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex max-w-xs flex-col gap-2">
            <Label htmlFor="lowStockThreshold">
              {t("settings.inventory.units")}
            </Label>
            <Input
              id="lowStockThreshold"
              type="number"
              min={0}
              value={inventory.lowStockThreshold}
              onChange={(e) => setThreshold(clampNumber(e.target.value, 0))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
