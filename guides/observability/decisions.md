# Observability — decisions

## Backend: Axiom now, Grafana later if we need it

**Decision:** the OTLP backend is **Axiom**. Grafana Cloud is the documented
upgrade path, not the current choice.

**Why:** Grafana earns its keep when you genuinely use **metrics + dashboards +
Prometheus-style alerting** — and we don't, yet. What we actually want right now
is fast, simple access to **logs and traces** for debugging, which is exactly
Axiom's strength (and its UX is simpler). Grafana's metrics/Mimir power would be
paid-for-but-unused complexity at our stage.

**Why this is safe / reversible:** because the instrumentation is OTLP-native
and vendor-neutral (no collector, no backend-specific code), switching backends
is **env-only** — change `OTEL_EXPORTER_OTLP_ENDPOINT` + `OTEL_EXPORTER_OTLP_HEADERS`,
no code, no redeploy of logic. So the plan is: **start on Axiom; if we grow into
a real need for Prometheus/metrics dashboards, drop in Grafana then.** The
architecture makes that a one-line change per project, not a migration.

(We proved the OTLP path end-to-end against Grafana Cloud first — that history is
below and still valid; only the destination changes.)

## Logic in a shared package, not per-project

**Decision:** the instrumentation lives in **`@mp-lb/fssstack-observability`**
(published, in `tools`). Projects consume it; they don't hand-roll an
`instrument.ts`.

**Why:** ~100 projects would otherwise each re-derive the same tricky bootstrap
(tracer-provider ownership, Sentry coexistence, exporter setup) and drift. One
tested package, consumed everywhere, means the hard decisions are made once. It's
its own package (not part of `fssstack-platform`) because the OTel Node SDK is a
large, server-only dependency tree and `fssstack-platform` ships a browser-safe
client logger — you don't want to drag OTel into the browser. Dependency
direction: observability depends on platform (for the event/log schema later),
never the reverse.

## Local export OFF by default

**Decision:** local dev does **not** export telemetry. The package is gated on
`OTEL_EXPORTER_OTLP_ENDPOINT`; we leave it unset (commented) in `.env.local`.

**Why:** Grafana Cloud bills on ingestion, and local dev is high-cardinality
noise (restarts, hot reloads, experiments) that would both cost money and pollute
the production dashboards you actually debug with. Across a 100-project fleet,
"every dev exports from their laptop" is a real bill. Verify in deployed
environments instead; a one-time deliberate local smoke (header temporarily set,
`environment=development`) is the escape hatch.

## Direct OTLP, no collector / no Alloy

**Decision:** apps export OTLP directly to the Grafana Cloud OTLP gateway. No
OpenTelemetry Collector, no Grafana Alloy.

**Why:** our deployment is a handful of Cloud Run instances per service (typically
`min=1, max=2`). A collector/agent earns its place when you need local batching that
survives the app, Prometheus-style scraping, fan-out to multiple backends, or
relabeling/PII-scrubbing before egress. None of that applies yet. The SDK's own
`BatchSpanProcessor` / periodic metric reader already batch before egress.

**Revisit Alloy if** a project needs: scraping `/metrics` off something we don't
control, dropping/relabeling high-cardinality attributes before they cost us, or one
config fanning telemetry to several destinations.

## Why not an Alloy sidecar — and the cost myth

The original instinct was "run Alloy as a sidecar in the same Dockerfile so we don't
pay for a separate container." Two corrections:

- **Cloud Run sidecars are not billed as a separate service.** Multi-container
  (GA since 2023) runs all containers in the *same instance*; you pay for the
  instance's total CPU/memory, not per container, and there's no second
  `min-instances` to keep warm. So "a whole separate container that costs money"
  isn't the trap it sounds like — the only marginal cost is the RAM/CPU Alloy needs,
  which you'd pay either way.
- **So if we ever do want Alloy, use a native sidecar container, not a
  second process crammed into our image.** The co-process approach (supervisor /
  background `alloy run` + `exec node`) saves nothing on Cloud Run and adds a shared
  PID space, interleaved logs, and messy restart semantics. Rejected.

For now both are moot: direct OTLP needs neither.

## OpenTelemetry is the engine; Sentry is a secondary error tracker

**Decision (supersedes the earlier "piggyback on Sentry" approach):** our own OTel
`NodeSDK` always owns the tracer/meter/logger providers and all instrumentation,
exporting traces/metrics/logs via OTLP. Sentry, when a DSN is set, initialises for
**error capture only** with `skipOpenTelemetrySetup: true` — it never claims the
provider or emits spans.

**Why we first did the opposite, then flipped:** Sentry v8+ (`@sentry/node`) *is* an
OTel distro and claims the global tracer provider, so the path of least resistance
was to let Sentry own it and tee spans to OTLP via `openTelemetrySpanProcessors`.
That worked but was backwards for our goals:

- **Grafana completeness shouldn't depend on Sentry's config.** With Sentry as the
  engine, Sentry's `tracesSampleRate` gates what reaches Grafana — and its default
  is *off*, which silently emptied Grafana until we set it to 1.0. That violates the
  core value: "everything is in one place, never guess."
- **Sentry is the most specialised tool (exceptions), so it belongs at arm's length
  as a consumer, not running everyone else's telemetry.** The engine should be the
  neutral pipe (OTel); the specialised tool sits beside it.
- We don't lean on Sentry's trace/perf UI — Grafana is the trace surface. The only
  thing given up is Sentry-native span enrichment, which is a fair price for
  vendor-neutrality and an unconditionally-complete Grafana.

Verified: `skipOpenTelemetrySetup` exists on `@sentry/node` init options; with it
set, error capture still works and our `NodeTracerProvider` owns the global provider.

If we ever want Sentry's trace UI back, add `SentrySpanProcessor` from
`@sentry/opentelemetry` to our provider — without giving up OTel ownership.

## cpu_idle = false on instrumented Cloud Run services

**Decision:** flip CPU to always-allocated on each service we instrument.

**Why:** request-based billing throttles CPU to ~0 between requests, so background
flushes don't run and telemetry drops on scale-down. Cost is real but bounded at our
instance counts; the alternative (lossy telemetry) defeats the point.
