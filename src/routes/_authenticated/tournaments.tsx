import { createFileRoute } from "@tanstack/react-router"
import { IconTrophy, IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { NewTournamentDrawer } from "@/components/new-tournament-drawer"

export const Route = createFileRoute("/_authenticated/tournaments")({
  component: TournamentsPage,
})

function TournamentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tournaments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage club tournaments.
          </p>
        </div>
        <NewTournamentDrawer
          trigger={
            <Button size="sm">
              <IconPlus className="size-4" />
              New Tournament
            </Button>
          }
        />
      </div>
      <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
        <IconTrophy className="size-12 opacity-30" />
        <p className="text-sm">Tournament management coming soon.</p>
      </div>
    </div>
  )
}
