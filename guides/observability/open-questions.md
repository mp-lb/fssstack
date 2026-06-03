# Observability — open questions & conditional integrations

Unsettled questions and integration concerns raised while building the OTel work,
parked here so they're not lost. These are **not decided** — see
[decisions.md](./decisions.md) for what is.

## Sentry vs OTel as the primary connector

For front-end / back-end telemetry it's not yet decided whether **Sentry** or
**OTel** should be the primary connector. The connection point may actually be
**tRPC** (instrument at the tRPC layer rather than the framework). To resolve.

## MongoDB instrumentation is conditional — keep it out of default fssstack

The observability setup also connects to **MongoDB**. That's fine in `doctrine`,
but **MongoDB is not (yet) a standard part of FSS Stack**, so the Mongo connector
**must not go into the default fast-stack configuration** — it only applies when a
project actually uses MongoDB.

This is a **three-way integration**: observability × FSS Stack × MongoDB. Only
when all three are present does the extra Mongo-instrumentation piece apply.
(Leaning toward making MongoDB standard eventually — if that happens, this stops
being conditional.)

## What to do about conditional integrations — two paths

Until MongoDB is standard, the Mongo↔observability glue can't live in the default
template. Two options, to pick later:

1. **Fold it into FSS Stack when MongoDB becomes standard** — then it's just part
   of the default config.
2. **A library of integration files** — specific integrations applied only when
   their conditions are met (e.g. "observability + MongoDB"), pulled in per project
   when relevant rather than shipped by default.

Either way: **revisit when MongoDB's standard status changes.**
