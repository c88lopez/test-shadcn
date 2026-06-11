import { useState } from "react"
import {
  IconDashboard,
  IconSettings,
  IconUsers,
  IconCalendar,
  IconReceipt,
  IconChartBar,
  IconBox,
  IconTrophy,
  IconUserStar,
  IconSchool,
  IconDotsVertical,
  IconSelector,
  IconCheck,
} from "@tabler/icons-react"
import { useRouter } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"
import { useAppSettings } from "@/lib/app-settings"
import { setActiveClub } from "@/lib/clubs.functions"
import type { ClubContext } from "@/lib/clubs.functions"
import type { TranslationKey } from "@/lib/i18n"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type NavItem = {
  titleKey: TranslationKey
  url: string
  icon: typeof IconDashboard
}

const navCourtManagement: NavItem[] = [
  { titleKey: "nav.items.dashboard", url: "/", icon: IconDashboard },
  {
    titleKey: "nav.items.reservations",
    url: "/reservations",
    icon: IconCalendar,
  },
]

const navInventory: NavItem[] = [
  {
    titleKey: "nav.items.inventoryDashboard",
    url: "/inventory/dashboard",
    icon: IconChartBar,
  },
  { titleKey: "nav.items.stock", url: "/inventory", icon: IconBox },
  {
    titleKey: "nav.items.salesLog",
    url: "/inventory/sales-log",
    icon: IconReceipt,
  },
]

const navCoaches: NavItem[] = [
  { titleKey: "nav.items.coaches", url: "/coaches", icon: IconUserStar },
  { titleKey: "nav.items.classes", url: "/coaches/classes", icon: IconSchool },
]

const navPlayers: NavItem[] = [
  { titleKey: "nav.items.players", url: "/players", icon: IconUsers },
]

const navTournaments: NavItem[] = [
  { titleKey: "nav.items.tournaments", url: "/tournaments", icon: IconTrophy },
]

const navSecondary: NavItem[] = [
  { titleKey: "nav.items.settings", url: "/settings", icon: IconSettings },
]

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const { t } = useTranslation()
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{t(item.titleKey)}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function initialsFromName(name: string | undefined | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function ClubBrand({ initials, name }: { initials: string; name: string }) {
  return (
    <>
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
        {initials}
      </div>
      <span className="truncate font-semibold">{name}</span>
    </>
  )
}

function ClubSwitcher({
  context,
  activeName,
  activeInitials,
}: {
  context: ClubContext
  activeName: string
  activeInitials: string
}) {
  const router = useRouter()
  const { t } = useTranslation()
  const [pending, setPending] = useState(false)

  async function switchClub(clubId: string) {
    if (clubId === context.activeClubId) return
    setPending(true)
    try {
      await setActiveClub({ data: { clubId } })
      await router.invalidate()
    } catch (error) {
      toast.error(t("clubSwitcher.switchError"), {
        description:
          error instanceof Error ? error.message : t("clubSwitcher.tryAgain"),
      })
    } finally {
      setPending(false)
    }
  }

  // With only one accessible club there's nothing to switch to — show the club
  // as static branding (visually enabled, no greyed-out look).
  if (context.clubs.length <= 1) {
    return (
      <div className="flex h-11 items-center gap-2 rounded-md px-2 text-sm">
        <ClubBrand initials={activeInitials} name={activeName} />
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          className="h-11 data-[state=open]:bg-sidebar-accent"
          disabled={pending}
        >
          <ClubBrand initials={activeInitials} name={activeName} />
          <IconSelector className="ml-auto size-4 shrink-0 opacity-50" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start" className="w-60">
        {context.clubs.map((club) => (
          <DropdownMenuItem
            key={club.id}
            onSelect={() => void switchClub(club.id)}
            className="gap-2"
          >
            <div className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-primary text-[10px] font-bold text-primary-foreground">
              {initialsFromName(club.name)}
            </div>
            <span className="truncate">{club.name}</span>
            {context.activeClubId === club.id && (
              <IconCheck className="ml-auto size-4 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export type SidebarUser = {
  name?: string | null
  email?: string | null
  image?: string | null
}

export function AppSidebar({
  clubContext,
  user,
}: {
  clubContext: ClubContext
  user: SidebarUser
}) {
  const router = useRouter()
  const { t } = useTranslation()
  const { general } = useAppSettings()

  async function handleSignOut() {
    await authClient.signOut()
    router.navigate({ to: "/login" })
  }

  // Fall back to the configured club profile when context has no club yet.
  const activeName = clubContext.activeClubName ?? general.clubName
  const activeInitials = clubContext.activeClubName
    ? initialsFromName(clubContext.activeClubName)
    : general.clubInitials

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <ClubSwitcher
              context={clubContext}
              activeName={activeName}
              activeInitials={activeInitials}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label={t("nav.groups.courts")} items={navCourtManagement} />
        <NavGroup label={t("nav.groups.inventory")} items={navInventory} />
        <NavGroup label={t("nav.groups.coaches")} items={navCoaches} />
        <NavGroup label={t("nav.groups.players")} items={navPlayers} />
        <NavGroup label={t("nav.groups.tournaments")} items={navTournaments} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{t(item.titleKey)}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-12 data-[state=open]:bg-sidebar-accent">
                  <Avatar className="size-7 rounded-md">
                    <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
                    <AvatarFallback className="rounded-md text-xs">
                      {initialsFromName(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="truncate text-sm font-medium">
                      {user.name ?? t("nav.account.account")}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email ?? ""}
                    </span>
                  </div>
                  <IconDotsVertical className="ml-auto size-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <DropdownMenuItem>{t("nav.account.profile")}</DropdownMenuItem>
                <DropdownMenuItem onSelect={handleSignOut}>
                  {t("nav.account.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
