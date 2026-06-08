import { createFileRoute, redirect } from "@tanstack/react-router"
import { can } from "@/lib/permissions"

export const Route = createFileRoute("/_authenticated/settings/")({
  beforeLoad: ({ context }) => {
    // Land everyone on a tab they're allowed to see. Only admins/owners can see
    // the configuration tabs; everyone can manage their own appearance (UI).
    throw redirect({
      to: can(context.user.role, "settings:manage")
        ? "/settings/general"
        : "/settings/ui",
    })
  },
})
