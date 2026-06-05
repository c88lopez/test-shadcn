import { useEffect, useMemo, useState } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { useRouter } from "@tanstack/react-router"
import {
  IconBell,
  IconBox,
  IconBuildingStore,
  IconCalendar,
  IconCalendarCog,
  IconChartBar,
  IconCornerDownLeft,
  IconDashboard,
  IconPalette,
  IconReceipt,
  IconSchool,
  IconSearch,
  IconTrophy,
  IconUsers,
  IconUserStar,
} from "@tabler/icons-react"
import type { Icon } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface CommandItem {
  label: string
  to: string
  group: string
  icon: Icon
  keywords?: string
}

const COMMANDS: CommandItem[] = [
  { label: "Dashboard", to: "/", group: "Courts", icon: IconDashboard },
  {
    label: "Reservations",
    to: "/reservations",
    group: "Courts",
    icon: IconCalendar,
  },
  {
    label: "Sales Dashboard",
    to: "/inventory/dashboard",
    group: "Inventory",
    icon: IconChartBar,
  },
  { label: "Stock", to: "/inventory", group: "Inventory", icon: IconBox },
  {
    label: "Sales Log",
    to: "/inventory/sales-log",
    group: "Inventory",
    icon: IconReceipt,
  },
  { label: "Coaches", to: "/coaches", group: "Coaches", icon: IconUserStar },
  {
    label: "Classes",
    to: "/coaches/classes",
    group: "Coaches",
    icon: IconSchool,
  },
  { label: "Players", to: "/players", group: "Players", icon: IconUsers },
  {
    label: "Tournaments",
    to: "/tournaments",
    group: "Tournaments",
    icon: IconTrophy,
  },
  {
    label: "General",
    to: "/settings/general",
    group: "Settings",
    icon: IconBuildingStore,
    keywords: "club currency locale profile",
  },
  {
    label: "Reservation settings",
    to: "/settings/reservations",
    group: "Settings",
    icon: IconCalendarCog,
    keywords: "hours courts booking rules",
  },
  {
    label: "Notification settings",
    to: "/settings/notifications",
    group: "Settings",
    icon: IconBell,
    keywords: "email whatsapp reminders",
  },
  {
    label: "Inventory settings",
    to: "/settings/inventory",
    group: "Settings",
    icon: IconBox,
    keywords: "low stock threshold",
  },
  {
    label: "Users",
    to: "/settings/users",
    group: "Settings",
    icon: IconUsers,
    keywords: "roles security password",
  },
  {
    label: "Appearance",
    to: "/settings/ui",
    group: "Settings",
    icon: IconPalette,
    keywords: "theme accent color font size ui",
  },
]

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COMMANDS
    return COMMANDS.filter((c) =>
      `${c.label} ${c.group} ${c.keywords ?? ""}`.toLowerCase().includes(q)
    )
  }, [query])

  useEffect(() => {
    setActiveIdx(0)
  }, [query, open])

  function go(item: CommandItem | undefined) {
    if (!item) return
    setOpen(false)
    setQuery("")
    void router.navigate({ to: item.to })
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      go(results[activeIdx])
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-full max-w-sm items-center gap-2 rounded-md bg-muted/50 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <IconSearch className="size-4" />
        <span className="flex-1 text-left">Search anything...</span>
        <kbd className="hidden items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="fixed top-[15%] left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
            onOpenAutoFocus={(e) => {
              // Defer to the input's autoFocus instead of focusing the content.
              e.preventDefault()
            }}
          >
            <DialogPrimitive.Title className="sr-only">
              Command palette
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Search and jump to any page.
            </DialogPrimitive.Description>

            <div className="flex items-center gap-2 border-b px-3">
              <IconSearch className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Jump to a page..."
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="max-h-80 overflow-y-auto p-1.5">
              {results.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </p>
              ) : (
                results.map((item, i) => {
                  const active = i === activeIdx
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => go(item)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm",
                        active ? "bg-accent text-accent-foreground" : ""
                      )}
                    >
                      <item.icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.group}
                      </span>
                      {active && (
                        <IconCornerDownLeft className="size-3.5 text-muted-foreground" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
