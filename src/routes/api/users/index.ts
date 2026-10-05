import { createFileRoute } from "@tanstack/react-router"
import { userApiCreateInput } from "@/lib/users.functions"
import { createUserRecord, listUserRecords } from "@/lib/users.server"
import {
  apiErrorResponse,
  readJsonBody,
  requireApiAccess,
} from "@/lib/api-auth"

// REST endpoints for users:
//   GET  /api/users        — list all users
//   POST /api/users        — create a user
export const Route = createFileRoute("/api/users/")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          await requireApiAccess(request, "users:manage")
          return Response.json(await listUserRecords())
        } catch (error) {
          return apiErrorResponse(error)
        }
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          await requireApiAccess(request, "users:manage")
          const data = userApiCreateInput.parse(await readJsonBody(request))
          const created = await createUserRecord(data)
          return Response.json(created, { status: 201 })
        } catch (error) {
          return apiErrorResponse(error)
        }
      },
    },
  },
})
