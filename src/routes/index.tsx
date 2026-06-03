import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({ component: Dashboard })

function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome to your dashboard.
      </p>
    </div>
  )
}
