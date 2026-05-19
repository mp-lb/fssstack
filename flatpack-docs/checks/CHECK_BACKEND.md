# Backend Check

Use this from a generated FSS Stack target repo when asked to check one or more backend apps.

## Goal

Check whether each backend still matches what a fresh FSS Stack backend would create today. Keep app behavior intact; update only stale scaffolding, config, or conventions.

## Compare

Read the current backend setup source:

```bash
dx read SETUP_PROCESS.md
dx read scripts/install-apps-packages.mjs
dx read layers/apps/backend/package.json
dx read layers/apps/backend/src/index.ts
dx read layers/apps/backend/src/config.ts
```

Compare each backend app under `apps/<backend>` against the current generated backend shape.

## Focus

- package scripts, dependencies, `tsconfig`, and `vitest.config.ts`
- Fastify/tRPC server setup, health endpoint, logging, CORS, and config loading
- middleware and request context conventions
- database access placement and shared package boundaries
- tRPC procedure integration-test setup in `src/test/createTestTrpc.ts`
- environment variables used by local Zap, production deploy, and tests
- deployment-facing details such as port, Dockerfile expectations, and health checks

## Validate

Run focused checks first:

```bash
zap t lint -- <changed-file...>
zap t typecheck -- <backend-app-dir>
pnpm --filter=<backend-package> test
pnpm --filter=<backend-package> build
```

If several backends exist, repeat the focused checks for each backend.
