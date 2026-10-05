import { createFileRoute } from "@tanstack/react-router"
import { userApiPatchInput } from "@/lib/users.functions"
import {
  deleteUserRecord,
  getUserRecord,
  updateUserRecord,
} from "@/lib/users.server"
import {
  ApiError,
  apiErrorResponse,
  readJsonBody,
  requireApiAccess,
} from "@/lib/api-auth"

type Ctx = { request: Request; params: { id: string } }

// REST endpoints for a single user:
//   GET    /api/users/:id  — fetch one user
//   PATCH  /api/users/:id  — update fields (partial)
//   DELETE /api/users/:id  — delete a user
export const Route = createFileRoute("/api/users/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }: Ctx) => {
        try {
          await requireApiAccess(request, "users:manage")
          const record = await getUserRecord(params.id)
          if (!record) throw new ApiError(404, "User not found.")
          return Response.json(record)
        } catch (error) {
          return apiErrorResponse(error)
        }
      },
      PATCH: async ({ request, params }: Ctx) => {
        try {
          await requireApiAccess(request, "users:manage")
          const data = userApiPatchInput.parse(await readJsonBody(request))
          const updated = await updateUserRecord({ id: params.id, ...data })
          return Response.json(updated)
        } catch (error) {
          return apiErrorResponse(error)
        }
      },
      DELETE: async ({ request, params }: Ctx) => {
        try {
          await requireApiAccess(request, "users:manage")
          return Response.json(await deleteUserRecord(params.id))
        } catch (error) {
          return apiErrorResponse(error)
        }
      },
    },
  },
})
