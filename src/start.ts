import { createStart } from "@tanstack/react-start"
import { metricsRequestMiddleware } from "@/lib/metrics-middleware"

// Global Start instance. Registers the Prometheus request middleware so every
// request the server handles (page renders + server functions) is timed and
// counted. The `.server()` body of the middleware is the only place that pulls
// in `prom-client`, keeping it out of the client bundle.
export const startInstance = createStart(() => ({
  requestMiddleware: [metricsRequestMiddleware],
}))
