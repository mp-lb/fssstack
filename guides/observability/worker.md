# Worker instrumentation (separate concern)

> This is noted here on purpose but kept **out of the main [recipe](./recipe.md)**:
> the worker is a separate, smaller piece of work, tracked but not bundled with
> the core backend rollout.

## What's different about the worker

A worker (background job runner, no HTTP server, usually no Sentry) is the
**standalone OTel path** — simpler than the backend:

- No tRPC → **no span middleware** to wire.
- No Sentry DSN (typically) → `startObservability` just runs the OTel SDK; the
  Sentry branch is skipped.
- Still gets **traces** (mongodb/redis/outbound-http auto-instrumentation),
  **metrics** (Node runtime), and **logs** (pino → OTLP, trace-correlated) for
  free, the moment it bootstraps with an endpoint.

## What it takes

1. `pnpm --filter <worker> add @mp-lb/fssstack-observability`
2. `src/instrument.ts` as line 1 of the worker entrypoint:
   ```ts
   import { startObservability } from "@mp-lb/fssstack-observability";
   import { env } from "./config";
   await startObservability({
     serviceName: "<project>-worker",
     environment: env.APP_ENV,
   });
   ```
3. Env wiring for the worker service: `OTEL_EXPORTER_OTLP_ENDPOINT` +
   `OTEL_EXPORTER_OTLP_HEADERS` in `env-map.yaml` (and the values in
   `.env.production` / `secrets.json.enc`), same as the backend.
4. If the worker runs on Cloud Run, the same `cpu_idle = false`. (doctrine's
   worker runs on a Compute Engine VM, not Cloud Run — CPU throttling doesn't
   apply there; just confirm the env vars reach it.)

## Status

doctrine's worker is **not yet instrumented**. Noted for the rollout; not a
blocker for the backend work.
