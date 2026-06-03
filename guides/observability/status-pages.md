# Status pages & reliability

**Status: placeholder.** A home for the **reliability** side of observability —
the outward-facing "is it up?" story, which is *not* OTel telemetry and so needs
its own doc here.

Reliability sits close enough to observability to live under it (rather than as a
top-level concern), but it's a distinct surface: where OTel/Sentry are about
*us* seeing what's happening internally, status pages are about *users* seeing
whether the service is healthy.

## Intended scope (to be filled in)

- **Status pages** — a public/customer-facing status page per product (or one
  shared), what it monitors, and how incidents get posted.
- **Uptime / synthetic checks** — external probes that feed the status page.
- **Incident comms** — how we declare, update, and resolve incidents.
- **SLOs / alerting** — what we promise and what pages a human. (Overlaps the OTel
  metrics side; cross-link once both exist.)

## Status

Nothing implemented yet. Decide tooling (hosted status page vs self-host) when we
start. Cross-reference `recipe.md` (OTel) and `decisions.md` for the telemetry side.
