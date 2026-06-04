# Request Correlation

Small standard for finding one failed API request across a client, backend logs,
and Axiom. It is intentionally only request IDs, trace IDs, and failure lookup
ergonomics.

## Contract

- Header: `X-Request-ID`.
- Field name in logs and client output: `requestId`.
- Generated format: `req_<time>_<random>`, where `<time>` is compact UTC time or
  milliseconds and `<random>` is URL-safe randomness.
- Accepted inbound IDs: ASCII letters, digits, `_`, `-`, `.`, `:`, 8-128 chars.
  Missing or invalid values are replaced by the backend.
- Every web API request gets a fresh request ID from the web client.
- Every CLI API call, or command-level API operation that may issue several calls,
  gets a generated request ID automatically.
- The backend accepts a valid client-provided request ID, generates one otherwise,
  and always returns the effective ID in `X-Request-ID`.
- If the backend can read the active OpenTelemetry span cheaply, it also returns
  `X-Trace-ID` on failed API responses.

Do not make users type this header. Clients should add it in the shared API
transport layer.

## Backend

Install request context at the HTTP edge, before tRPC handlers run:

1. Read and validate `X-Request-ID`.
2. Create a new ID when the header is missing or invalid.
3. Put the effective `requestId` in async request context.
4. Add `X-Request-ID` to the response.
5. On failure, add `X-Trace-ID` when an active span has a trace ID.

Use `AsyncLocalStorage` or the existing logger child mechanism so logs emitted
while handling the request receive the request fields automatically. Procedure
code should not manually pass `requestId`.

Required backend log fields:

- `requestId`
- `traceId`, when available
- `spanId`, when available
- `route` or HTTP path
- `procedure`, for tRPC calls
- `status`
- error name/message/code, with stack or cause details where safe

The shared request logger should enrich normal request/procedure completion logs
and backend error logs. Feature-specific logs may add domain fields such as
`store`, `path`, `bytes`, or `hash`, but request correlation must not depend on
every feature doing that work first.

## Clients

Web and CLI clients generate IDs in the shared API transport. On failed calls,
surface the IDs close to the user-visible error.

CLI failure output should include:

```text
Request ID: req_...
Trace ID: ...
Procedure: files.writeTextFileByRef
```

Add operation metadata when the command already has it, such as `store`, `path`,
`bytes`, or `hash`. Do not hide the original error message.

Web apps should expose the request ID in dev/error logs and in any developer
error detail shown for failed API calls. User-facing production UI can keep this
quiet unless a support/debug affordance exists.

## Axiom Lookup

For a failed Doctrine API call, start with the ID printed by the CLI or web dev
log:

```text
requestId == "req_..."
```

Check:

- `doctrine-logs`: request finish, tRPC procedure finish, backend error, and any
  storage/write logs.
- `doctrine-traces`: filter by `traceId` when the failed client printed one, or
  copy it from the matching log record.

Useful fields:

- logs: `requestId`, `traceId`, `spanId`, `route`, `procedure`, `status`,
  `level`, `msg`, `error.name`, `error.message`, `store`, `path`, `bytes`,
  `hash`
- traces: `traceId`, `spanId`, `parentSpanId`, `service.name`, `name`,
  `status.code`, `exception.message`

If no log matches a valid client-printed `requestId`, check whether the backend
returned a different `X-Request-ID`; that means the incoming ID was rejected by
validation or a proxy/client did not send it.

## Doctrine First

Roll this out in Doctrine before copying the pattern elsewhere:

1. Add request ID generation to the CLI API client and print `requestId` on failed
   API calls.
2. Add request ID generation to web API calls and log failed responses with
   `requestId`.
3. Add backend request context at the Fastify/tRPC edge and return `X-Request-ID`.
4. Enrich request, procedure, and error logs from context.
5. Return/print `X-Trace-ID` for failed calls when an active span is available.
6. Verify with a failing API call that the CLI/web output gives a request ID and
   Axiom can find backend logs with that ID.

The large single-line `index.js` upload failure is a good validation case, but
fixing that upload bug is separate work.

## Non-Goals

- New observability products or dashboards.
- Dataset changes.
- Full log schema redesign.
- Distributed tracing migration.
- Bespoke per-procedure request ID plumbing.
