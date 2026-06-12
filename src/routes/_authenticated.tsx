import { useEffect } from "react"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"
import { CommandPalette } from "@/components/command-palette"
import { NotificationsDrawer } from "@/components/notifications-drawer"
import { getSession } from "@/lib/auth.functions"
import { getClubContext } from "@/lib/clubs.functions"
import { listStockItems } from "@/lib/inventory.functions"
import { applyUiSettingsForClub } from "@/lib/ui-settings"
import { setActiveSettingsClub } from "@/lib/app-settings"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session || session.user.status === "archived") {
      throw redirect({ to: "/login" })
    }
    return { user: session.user }
  },
  loader: async () => ({
    stockItems: await listStockItems(),
    clubContext: await getClubContext(),
  }),
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext()
  const { stockItems, clubContext } = Route.useLoaderData()

  // Theme/font size are global; the accent color is per club. Apply the active
  // club's UI (and re-apply when the user switches clubs).
  useEffect(() => {
    applyUiSettingsForClub(clubContext.activeClubId)
  }, [clubContext.activeClubId])

  // App settings are scoped per club; load the active club's settings (and
  // reload them whenever the user switches clubs).
  useEffect(() => {
    setActiveSettingsClub(clubContext.activeClubId)
  }, [clubContext.activeClubId])

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar clubContext={clubContext} user={user} />
        <main className="flex h-svh min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-10 flex h-12 shrink-0 items-center gap-3 border-b bg-background px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" />
            <CommandPalette />
            <div className="ml-auto flex items-center gap-3">
              <NotificationsDrawer stockItems={stockItems} />
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  )
}
