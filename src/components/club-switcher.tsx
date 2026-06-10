import { useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { IconBuildings } from "@tabler/icons-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { setActiveClub } from "@/lib/clubs.functions"

export interface ClubContext {
  activeClubId: string | null
  activeClubName: string | null
  isSuper: boolean
  clubs: { id: string; name: string }[]
}

export function ClubSwitcher({ context }: { context: ClubContext }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  // Super-admins can switch the club they're acting as.
  if (context.isSuper && context.clubs.length > 0) {
    return (
      <Select
        value={context.activeClubId ?? undefined}
        disabled={pending}
        onValueChange={async (clubId) => {
          setPending(true)
          try {
            await setActiveClub({ data: { clubId } })
            await router.invalidate()
          } catch (error) {
            toast.error("Could not switch club", {
              description:
                error instanceof Error ? error.message : "Try again.",
            })
          } finally {
            setPending(false)
          }
        }}
      >
        <SelectTrigger size="sm" className="w-[190px] gap-2">
          <IconBuildings className="size-4 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Select club" />
        </SelectTrigger>
        <SelectContent>
          {context.clubs.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // Club-scoped users see their club name as static context.
  if (context.activeClubName) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <IconBuildings className="size-4" />
        <span className="hidden sm:inline">{context.activeClubName}</span>
      </div>
    )
  }

  return null
}
