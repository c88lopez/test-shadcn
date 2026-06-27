import { createFileRoute } from "@tanstack/react-router"
import { getMetrics, getMetricsContentType } from "@/lib/metrics.server"

// Prometheus scrape endpoint: GET /api/metrics returns the registry in the
// text exposition format. Left unauthenticated so Prometheus can scrape it in
// local/dev; do not expose it publicly in production (put it behind the
// platform's network controls or an allowlist).
export const Route = createFileRoute("/api/metrics")({
  server: {
    handlers: {
      GET: async () => {
        const body = await getMetrics()
        return new Response(body, {
          status: 200,
          headers: { "content-type": getMetricsContentType() },
        })
      },
    },
  },
})
