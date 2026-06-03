import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { IconSearch } from "@tabler/icons-react"
import { AppSidebar } from "@/components/app-sidebar"

import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dashboard" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  component: RootLayout,
  shellComponent: RootDocument,
})

function RootLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-1 flex-col">
          <header className="flex h-12 items-center gap-3 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" />
            <div className="flex flex-1 justify-center">
              <div className="relative w-full max-w-sm">
                <IconSearch className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input placeholder="Search…" className="pl-8 h-8 bg-muted/50 border-0 focus-visible:ring-1" />
              </div>
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

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{ position: "bottom-right" }}
          plugins={[{ name: "Tanstack Router", render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  )
}
