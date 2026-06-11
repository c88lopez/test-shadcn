import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import {
  IconBell,
  IconBox,
  IconBuildingStore,
  IconBuildings,
  IconCalendarCog,
  IconPalette,
  IconUsers,
} from "@tabler/icons-react"
import type { Icon } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { useCan } from "@/hooks/use-permissions"
import type { Permission } from "@/lib/permissions"
import type { TranslationKey } from "@/lib/i18n"

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsLayout,
})

const navItems: {
  to: string
  labelKey: TranslationKey
  icon: Icon
  permission?: Permission
}[] = [
  {
    to: "/settings/general",
    labelKey: "settings.nav.general",
    icon: IconBuildingStore,
    permission: "settings:manage",
  },
  {
    to: "/settings/reservations",
    labelKey: "settings.nav.reservations",
    icon: IconCalendarCog,
    permission: "settings:manage",
  },
  {
    to: "/settings/notifications",
    labelKey: "settings.nav.notifications",
    icon: IconBell,
    permission: "settings:manage",
  },
  {
    to: "/settings/inventory",
    labelKey: "settings.nav.inventory",
    icon: IconBox,
    permission: "settings:manage",
  },
  {
    to: "/settings/users",
    labelKey: "settings.nav.users",
    icon: IconUsers,
    permission: "users:manage",
  },
  {
    to: "/settings/clubs",
    labelKey: "settings.nav.clubs",
    icon: IconBuildings,
    permission: "clubs:manage",
  },
  { to: "/settings/ui", labelKey: "settings.nav.ui", icon: IconPalette },
]

function SettingsLayout() {
  const { t } = useTranslation()
  const canSettings = useCan("settings:manage")
  const canUsers = useCan("users:manage")
  const canClubs = useCan("clubs:manage")
  const visibleItems = navItems.filter((item) => {
    if (item.permission === "settings:manage") return canSettings
    if (item.permission === "users:manage") return canUsers
    if (item.permission === "clubs:manage") return canClubs
    return true
  })

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.description")}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 md:flex-row md:gap-10">
        <nav className="flex shrink-0 gap-1 md:w-48 md:flex-col">
          {visibleItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              )}
              activeProps={{
                className: "bg-muted text-foreground",
              }}
            >
              <item.icon className="size-4" />
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-2">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
