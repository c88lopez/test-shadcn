import { createFileRoute } from "@tanstack/react-router"
import { auth } from "@/lib/auth"

// Mounts the Better Auth request handler at /api/auth/* (sign-in, sign-out,
// session, etc.).
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => auth.handler(request),
      POST: ({ request }: { request: Request }) => auth.handler(request),
    },
  },
})
