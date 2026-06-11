import { createFileRoute } from "@tanstack/react-router"
import { clubInput } from "@/lib/clubs.functions"
import { createClubRecord, listClubRecords } from "@/lib/clubs.server"
import {
  apiErrorResponse,
  readJsonBody,
  requireApiAccess,
} from "@/lib/api-auth"

// REST endpoints for clubs:
//   GET  /api/clubs        — list all clubs
//   POST /api/clubs        — create a club
export const Route = createFileRoute("/api/clubs/")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          await requireApiAccess(request, "clubs:manage")
          return Response.json(await listClubRecords())
        } catch (error) {
          return apiErrorResponse(error)
        }
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          await requireApiAccess(request, "clubs:manage")
          const data = clubInput.parse(await readJsonBody(request))
          const created = await createClubRecord(data)
          return Response.json(created, { status: 201 })
        } catch (error) {
          return apiErrorResponse(error)
        }
      },
    },
  },
})
