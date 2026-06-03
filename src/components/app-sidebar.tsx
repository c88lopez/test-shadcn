import {
  IconDashboard,
  IconSettings,
  IconUsers,
  IconCalendar,
  IconShoppingCart,
  IconBox,
  IconDotsVertical,
} from "@tabler/icons-react"
import { useRouter } from "@tanstack/react-router"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/lib/auth"

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
  { title: "Sales", url: "/sales", icon: IconShoppingCart },
  { title: "Inventory", url: "/inventory", icon: IconBox },
]

const navPlayers = [{ title: "Players", url: "/players", icon: IconUsers }]

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

  function handleSignOut() {
    logout()
    router.navigate({ to: "/login" })
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            D
          </div>
          <span className="font-semibold">Dashboard</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Court Management" items={navCourtManagement} />
        <NavGroup label="Inventory" items={navInventory} />
        <NavGroup label="Players" items={navPlayers} />
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
