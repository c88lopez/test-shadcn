import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { IconSearch } from "@tabler/icons-react"
import { AppSidebar } from "@/components/app-sidebar"
import { NotificationsDrawer } from "@/components/notifications-drawer"
import { isAuthenticated } from "@/lib/auth"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-1 flex-col">
          <header className="flex h-12 items-center gap-3 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" />
            <div className="relative w-full max-w-sm">
              <IconSearch className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search anything..."
                className="h-8 border-0 bg-muted/50 pl-8 focus-visible:ring-1"
              />
            </div>
            <div className="ml-auto">
              <NotificationsDrawer />
            </div>
          </header>
          <div className="flex-1 p-6">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  )
}
