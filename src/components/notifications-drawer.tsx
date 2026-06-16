import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { IconAlertTriangle, IconBell } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { useAppSettings } from "@/lib/app-settings"
import type { StockItem } from "@/db/schema"

interface Notification {
  id: string
  name: string
  stock: number
  threshold: number
  tone: "warning" | "default"
}

export function NotificationsDrawer({
  stockItems,
}: {
  stockItems: StockItem[]
}) {
  const { t } = useTranslation()
  const { notifications: prefs } = useAppSettings()

  // Low-stock notifications are derived live from each item's own threshold, and
  // only shown when the in-app "Low stock" preference is on.
  const notifications = useMemo<Notification[]>(() => {
    if (!prefs.inApp.lowStock) return []
    return stockItems
      .filter((item) => item.stock <= item.lowStockThreshold)
      .sort((a, b) => a.stock - b.stock)
      .map((item) => ({
        id: `low-stock-${item.id}`,
        name: item.name,
        stock: item.stock,
        threshold: item.lowStockThreshold,
        tone: "warning",
      }))
  }, [prefs.inApp.lowStock, stockItems])

  const count = notifications.length

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-8">
          <IconBell className="size-4" />
          {count > 0 && (
            <span className="absolute top-1 right-1 flex size-2 rounded-full bg-destructive ring-2 ring-background" />
          )}
          <span className="sr-only">
            {t("notifications.title")}
            {count > 0 ? ` (${t("notifications.unread", { count })})` : ""}
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="flex flex-row items-center justify-between">
          <DrawerTitle>{t("notifications.title")}</DrawerTitle>
          {count > 0 && (
            <span className="text-xs text-muted-foreground">
              {t("notifications.new", { count })}
            </span>
          )}
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4">
          {count === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("notifications.empty")}
            </p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <span
                    className={cn(
                      "mt-0.5",
                      n.tone === "warning"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    <IconAlertTriangle className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      {t("notifications.lowStockTitle", { name: n.name })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("notifications.lowStockDescription", {
                        stock: n.stock,
                        threshold: n.threshold,
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
