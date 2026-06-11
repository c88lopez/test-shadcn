import { useEffect } from "react"
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { I18nextProvider } from "react-i18next"

import { Toaster } from "@/components/ui/sonner"
import { getUiSettingsInitScript } from "@/lib/ui-settings"
import i18n from "@/lib/i18n"
import { getLocale } from "@/lib/i18n.functions"
import appCss from "../styles.css?url"

export const Route = createRootRoute({
  // Resolve the language from the cookie on the server so the first render (SSR
  // and the matching client hydration) is already in the chosen locale.
  beforeLoad: async () => ({ locale: await getLocale() }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Padel Club Admin" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootComponent() {
  const { locale } = Route.useRouteContext()

  // Set synchronously (resources are bundled) so children render in `locale` on
  // both the server and the first client paint — no flash, no hydration drift.
  if (i18n.language !== locale) {
    void i18n.changeLanguage(locale)
  }

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <I18nextProvider i18n={i18n}>
      <Outlet />
      <Toaster />
    </I18nextProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{ __html: getUiSettingsInitScript() }}
        />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{ position: "bottom-right" }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
