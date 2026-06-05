import { createFileRoute } from "@tanstack/react-router"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
  DEFAULT_APP_SETTINGS,
  setAppSettings,
  useAppSettings,
} from "@/lib/app-settings"

export const Route = createFileRoute("/_authenticated/settings/inventory")({
  component: InventorySettingsPage,
})

function InventorySettingsPage() {
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
    toast.success("Inventory settings reset to defaults")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Inventory</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Stock thresholds and alerts.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Reset to defaults
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Low-stock threshold</CardTitle>
          <CardDescription>
            Items at or below this quantity are highlighted on the Stock page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex max-w-xs flex-col gap-2">
            <Label htmlFor="lowStockThreshold">Units</Label>
            <Input
              id="lowStockThreshold"
              type="number"
              min={0}
              value={inventory.lowStockThreshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
