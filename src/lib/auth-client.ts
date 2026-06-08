import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"

// Browser-side auth client. baseURL defaults to the current origin, so the
// /api/auth handler is reached automatically. inferAdditionalFields mirrors the
// server's user additionalFields (role/status) so they are typed on the session.
export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: "string" },
        status: { type: "string" },
      },
    }),
  ],
})

export const { signIn, signOut, useSession } = authClient
