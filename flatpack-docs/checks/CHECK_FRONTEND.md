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
dx read layers/vite/src/config.ts
dx read layers/vite/src/trpc.ts
```

Compare each frontend app under `apps/<frontend>` against the current generated frontend shape for its type.

## Focus

- package scripts, dependencies, `tsconfig`, Vite config, and Vitest setup
- app config, logging, tRPC client, and environment variable conventions
- UI states: loading, empty, error, disabled, pending, success, and destructive flows
- modal, toast, alert, form, and navigation patterns
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

If the repo has a UI states guide such as `states.md`, check changed UI against it and update stale local patterns.
