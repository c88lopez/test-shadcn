import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/")({ component: Dashboard })

function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground mt-1 text-sm">Welcome to your dashboard.</p>
    </div>
  )
}
