# Frontend Check

Use this from a generated FSS Stack target repo when asked to check one or more frontend apps.

## Goal

Check whether each frontend still matches what a fresh FSS Stack frontend would create today. Preserve product UI; update stale scaffolding, wiring, and shared UI patterns.

## Compare

Read the current frontend setup source:

```bash
dx read SETUP_PROCESS.md
dx read scripts/apply-vite-layer.mjs
dx read layers/vite/src/App.tsx
dx read scripts/apply-next-layer.mjs
```

Compare each frontend app under `apps/<frontend>` against the current generated frontend shape for its type.

Read the local frontend examples in `docs/examples/frontend/` before changing request or logging patterns.

## Focus

- package scripts, dependencies, `tsconfig`, Vite config, and Vitest setup
- app config, web request boundaries, and environment variable conventions
- request states: loading, empty, error, retry, and success
- frontend logging helper and structured log naming
- accessibility and keyboard behavior for interactive UI
- tests for user-visible states and app wiring
- deployment-facing build output and frontend env assumptions

## Validate

Run focused checks first, then workspace checks:

```bash
pnpm --filter=<frontend-package> typecheck
pnpm --filter=<frontend-package> test
pnpm --filter=<frontend-package> build
pnpm lint
```

Check changed request and logging code against `docs/examples/frontend/web-request.md` and `docs/examples/frontend/logging.md`. Update stale local patterns.
