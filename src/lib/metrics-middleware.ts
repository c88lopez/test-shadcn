import { createMiddleware } from "@tanstack/react-start"

// Global request middleware that times every request the Start server handles
// and records Prometheus metrics. The `prom-client` registry lives in the
// server-only `metrics.server` module, which is loaded with a dynamic import
// inside the `.server()` body so it never reaches the client bundle (this file
// is reachable from the client via `src/start.ts`).
export const metricsRequestMiddleware = createMiddleware({
  type: "request",
}).server(async ({ request, next, handlerType }) => {
  const start = performance.now()
  let status = 500
  try {
    const result = await next()
    status = result.response.status
    return result
  } finally {
    try {
      const { recordHttpRequest } = await import("@/lib/metrics.server")
      recordHttpRequest({
        method: request.method,
        kind: handlerType,
        status,
        seconds: (performance.now() - start) / 1000,
      })
    } catch {
      // Metrics must never affect request handling.
    }
  }
})
