import { createAuthClient } from "better-auth/react"

// Browser-side auth client. baseURL defaults to the current origin, so the
// /api/auth handler is reached automatically.
export const authClient = createAuthClient()

export const { signIn, signOut, useSession } = authClient
