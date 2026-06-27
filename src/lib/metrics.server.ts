import client from "prom-client"

// Server-only Prometheus instrumentation. Exposes a registry with Node process
// metrics plus per-request HTTP metrics, and a `recordHttpRequest` helper used
// by the global request middleware. Imported only from server boundaries (the
// middleware's `.server()` body via dynamic import, and the /api/metrics route
// handler) so the Node-only `prom-client` never reaches the client bundle.

// A dedicated registry (not the global default) so module re-evaluation under
// dev HMR creates a fresh registry instead of throwing "already registered".
const register = new client.Registry()

client.collectDefaultMetrics({ register })

// Bound label cardinality on purpose: we label by method, coarse handler kind
// (page render vs server function) and status — never the raw pathname, which
// would explode with ids like /api/clubs/<uuid>.
const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests handled by the app server.",
  labelNames: ["method", "kind", "status"],
  registers: [register],
})

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests handled by the app server, in seconds.",
  labelNames: ["method", "kind", "status"],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
})

/** Records a single handled request. Called by the request middleware. */
export function recordHttpRequest(opts: {
  method: string
  kind: string
  status: number
  seconds: number
}): void {
  const labels = {
    method: opts.method,
    kind: opts.kind,
    status: String(opts.status),
  }
  httpRequestsTotal.inc(labels)
  httpRequestDuration.observe(labels, opts.seconds)
}

/** Prometheus exposition text for the /api/metrics endpoint. */
export function getMetrics(): Promise<string> {
  return register.metrics()
}

export function getMetricsContentType(): string {
  return register.contentType
}
