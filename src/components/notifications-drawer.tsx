import { useMemo } from "react"
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
  title: string
  description: string
  tone: "warning" | "default"
}

export function NotificationsDrawer({
  stockItems,
}: {
  stockItems: StockItem[]
}) {
  const { inventory, notifications: prefs } = useAppSettings()

  // Low-stock notifications are derived live from inventory + the configured
  // threshold, and only shown when the in-app "Low stock" preference is on.
  const notifications = useMemo<Notification[]>(() => {
    if (!prefs.inApp.lowStock) return []
    return stockItems
      .filter((item) => item.stock <= inventory.lowStockThreshold)
      .sort((a, b) => a.stock - b.stock)
      .map((item) => ({
        id: `low-stock-${item.id}`,
        title: `Low stock: ${item.name}`,
        description: `Only ${item.stock} left (threshold ${inventory.lowStockThreshold}).`,
        tone: "warning",
      }))
  }, [inventory.lowStockThreshold, prefs.inApp.lowStock, stockItems])

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
            Notifications{count > 0 ? ` (${count} unread)` : ""}
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="flex flex-row items-center justify-between">
          <DrawerTitle>Notifications</DrawerTitle>
          {count > 0 && (
            <span className="text-xs text-muted-foreground">{count} new</span>
          )}
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4">
          {count === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No notifications
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
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {n.description}
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
