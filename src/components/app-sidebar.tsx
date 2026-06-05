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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/lib/auth"
import { useAppSettings } from "@/lib/app-settings"

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

const navCourtManagement = [
  { title: "Dashboard", url: "/", icon: IconDashboard },
  { title: "Reservations", url: "/reservations", icon: IconCalendar },
]

const navInventory = [
  { title: "Dashboard", url: "/inventory/dashboard", icon: IconChartBar },
  { title: "Stock", url: "/inventory", icon: IconBox },
  { title: "Sales Log", url: "/inventory/sales-log", icon: IconReceipt },
]

const navCoaches = [
  { title: "Coaches", url: "/coaches", icon: IconUserStar },
  { title: "Classes", url: "/coaches/classes", icon: IconSchool },
]

const navPlayers = [{ title: "Players", url: "/players", icon: IconUsers }]

const navTournaments = [
  { title: "Tournaments", url: "/tournaments", icon: IconTrophy },
]

const navSecondary = [
  { title: "Settings", url: "/settings", icon: IconSettings },
]

function NavGroup({
  label,
  items,
}: {
  label: string
  items: typeof navCourtManagement
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const router = useRouter()
  const { general } = useAppSettings()

  // The primary club reflects the configured club profile (Settings → General).
  const clubs = [
    { id: 1, name: general.clubName, initials: general.clubInitials },
    { id: 2, name: "Chance", initials: "CH" },
  ]
  const [activeClubId, setActiveClubId] = useState(1)
  const activeClub = clubs.find((c) => c.id === activeClubId) ?? clubs[0]

  function handleSignOut() {
    logout()
    router.navigate({ to: "/login" })
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-11 data-[state=open]:bg-sidebar-accent">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                    {activeClub.initials}
                  </div>
                  <span className="truncate font-semibold">
                    {activeClub.name}
                  </span>
                  <IconSelector className="ml-auto size-4 shrink-0 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start" className="w-60">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Your clubs
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {clubs.map((club) => (
                  <DropdownMenuItem
                    key={club.id}
                    onSelect={() => setActiveClubId(club.id)}
                    className="gap-2"
                  >
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-primary text-[10px] font-bold text-primary-foreground">
                      {club.initials}
                    </div>
                    <span className="truncate">{club.name}</span>
                    {activeClub.id === club.id && (
                      <IconCheck className="ml-auto size-4 shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Courts" items={navCourtManagement} />
        <NavGroup label="Inventory" items={navInventory} />
        <NavGroup label="Coaches" items={navCoaches} />
        <NavGroup label="Players" items={navPlayers} />
        <NavGroup label="Tournaments" items={navTournaments} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
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
                    <AvatarImage src="" alt="Cristian Lopez" />
                    <AvatarFallback className="rounded-md text-xs">
                      CL
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="truncate text-sm font-medium">
                      Cristian Lopez
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      cristian@coperniq.io
                    </span>
                  </div>
                  <IconDotsVertical className="ml-auto size-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem onSelect={handleSignOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
