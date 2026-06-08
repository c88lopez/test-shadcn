import { useEffect } from "react"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"
import { CommandPalette } from "@/components/command-palette"
import { NotificationsDrawer } from "@/components/notifications-drawer"
import { getSession } from "@/lib/auth.functions"
import { applyUiSettings, loadUiSettings } from "@/lib/ui-settings"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session || session.user.status === "archived") {
      throw redirect({ to: "/login" })
    }
    return { user: session.user }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  useEffect(() => {
    applyUiSettings(loadUiSettings())
  }, [])

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex h-svh min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-10 flex h-12 shrink-0 items-center gap-3 border-b bg-background px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" />
            <CommandPalette />
            <div className="ml-auto">
              <NotificationsDrawer />
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
