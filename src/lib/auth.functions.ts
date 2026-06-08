import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { auth } from "@/lib/auth"

// Reads the current session from the request cookies. Runs server-side both on
// SSR and when invoked from the client during navigation.
export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const { headers } = getRequest()
    return auth.api.getSession({ headers })
  }
)
