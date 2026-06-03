import { IconBell } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

const notifications: {
  id: number
  title: string
  description: string
  read: boolean
}[] = []

export function NotificationsDrawer() {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <IconBell className="size-4" />
          <span className="sr-only">Notifications</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="flex flex-row items-center justify-between">
          <DrawerTitle>Notifications</DrawerTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
          >
            Read all
          </Button>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No notifications
            </p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li key={n.id} className="rounded-md border p-3">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {n.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
