# Observability: OpenTelemetry → Grafana Cloud

**Started:** 2026-06-02 · **First instance:** doctrine

This folder is the **program** for instrumenting the fleet with OpenTelemetry and
shipping the data to **Grafana Cloud**. It's not a single migration — it's an
ongoing rollout across ~100 FSS Stack projects that all deploy the same way (Node
apps on Cloud Run, Terraform-managed). The point of writing it down once is that
every project does essentially the same thing, so we want one canonical recipe and
one place that tracks who's done.

- **[recipe.md](./recipe.md)** — the canonical per-project recipe. Follow it verbatim.
- **[request-correlation.md](./request-correlation.md)** — small standard for
  request IDs, trace IDs, client error output, and Axiom lookup.
- **[rollout.md](./rollout.md)** — per-project status + the checklist to tick off.
- **[decisions.md](./decisions.md)** — why we chose this shape (and what we rejected).
- **[open-questions.md](./open-questions.md)** — unsettled questions + conditional integrations (Sentry-vs-OTel, MongoDB-only glue).
- **[status-pages.md](./status-pages.md)** — the **reliability** side: status pages, uptime checks, incident comms. Placeholder.

**Scope:** this folder is the broader observability umbrella, not just OTel — it
also covers **Sentry** (error tracking) and **reliability** (status pages, see
above). The OTel→Axiom recipe below is the first and largest piece. *(Product
analytics / PostHog is a separate, still-undecided question — see the Stackforge
taxonomy; it may get its own home rather than living here.)*

## The one-paragraph version

The backend is an **OTLP endpoint** — currently **Axiom** (Grafana is the
documented upgrade path if we ever need Prometheus/metrics; switching is env-only,
see [decisions.md](./decisions.md)). The instrumentation ships as a shared package,
**[`@mp-lb/fssstack-observability`](https://www.npmjs.com/package/@mp-lb/fssstack-observability)**,
which each service consumes and points at that endpoint — traces + metrics + logs
export **straight to it**, **no collector and no Alloy** (at our scale a local
agent buys nothing and costs RAM). Local dev is **off by default**. Projects just
add the dep, call `startObservability`, and set prod env. We revisit Alloy only if a specific
project needs local scraping/aggregation/relabeling; see [decisions.md](./decisions.md).

## Two gotchas that bite every project

1. **Sentry wants to own OpenTelemetry — don't let it.** `@sentry/node` v8+ is an
   OTel distro and will claim the global `TracerProvider`. The package forces
   `skipOpenTelemetrySetup: true` so *our* OTel `NodeSDK` owns the pipeline and
   Sentry stays a secondary error-only tracker. (We briefly did the reverse; see
   [decisions.md](./decisions.md) for why we flipped — short version: Sentry's
   sampling shouldn't gate what reaches Grafana.)

2. **Cloud Run throttles CPU between requests.** The SDK's background batch exporter
   needs CPU to flush; with default request-based billing, spans/metrics buffer and
   then drop on scale-down. Set **`cpu_idle = false`** (CPU always allocated) on each
   instrumented Cloud Run service. This has a cost implication — call it out per
   project.

Both are covered step-by-step in [recipe.md](./recipe.md).
