import { createFileRoute } from "@tanstack/react-router"
import { clubPatchInput } from "@/lib/clubs.functions"
import {
  deleteClubRecord,
  getClubRecord,
  updateClubRecord,
} from "@/lib/clubs.server"
import {
  ApiError,
  apiErrorResponse,
  readJsonBody,
  requireApiAccess,
} from "@/lib/api-auth"

type Ctx = { request: Request; params: { id: string } }

// REST endpoints for a single club:
//   GET    /api/clubs/:id  — fetch one club
//   PATCH  /api/clubs/:id  — update name/status (partial)
//   DELETE /api/clubs/:id  — delete a club (Default Club is protected)
export const Route = createFileRoute("/api/clubs/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }: Ctx) => {
        try {
          await requireApiAccess(request, "clubs:manage")
          const record = await getClubRecord(params.id)
          if (!record) throw new ApiError(404, "Club not found.")
          return Response.json(record)
        } catch (error) {
          return apiErrorResponse(error)
        }
      },
      PATCH: async ({ request, params }: Ctx) => {
        try {
          await requireApiAccess(request, "clubs:manage")
          const data = clubPatchInput.parse(await readJsonBody(request))
          const updated = await updateClubRecord({ id: params.id, ...data })
          return Response.json(updated)
        } catch (error) {
          return apiErrorResponse(error)
        }
      },
      DELETE: async ({ request, params }: Ctx) => {
        try {
          await requireApiAccess(request, "clubs:manage")
          return Response.json(await deleteClubRecord(params.id))
        } catch (error) {
          return apiErrorResponse(error)
        }
      },
    },
  },
})
