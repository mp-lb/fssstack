# fssstack Setup

Run this from an empty folder. If other project files already exist, stop and ask the user for an empty folder or git repo.

The fssstack source kit is stored in doctrine. Do not clone it into the target repo and do not expect a local `.fssstack` directory. Read setup scripts and layer files from the store with `dx read`.

Target setup scripts are built JavaScript artifacts in `scripts/*.mjs`. Their TypeScript sources live in the authoring repository's root-level `scripts-src/`, but target repos run only the built `.mjs` files with Node.

## Inputs

Ask for any missing values:

- Project name
- Project slug, defaulting to the lowercased project name
- Package scope, defaulting to `@fssstack`
- shadcnPreset, defaulting to `b1VlIttI`
- Project description
- Emoji for favicon/readme
- Backend services, defaulting to `backend`
- Frontend clients, defaulting to `frontend (react-vite)`
- CLI packages, defaulting to none
- Library packages, defaulting to none

Use the chosen strings directly in commands and file edits. Do not rely on exported environment variables carrying across shell sessions.

App and package names must be unique and should use lowercase letters, numbers, and hyphens. The examples below use two backend services, `backend` and `baz`, two React/Vite frontend clients, `frontend` and `foobar`, one CLI package, `toolbox`, and one library package, `sdk`.

Other fssstack docs may use `backend` and `frontend` as role labels. When applying those docs, map the examples to the actual generated service names.

## Foundation

Install the foundation layer from doctrine:

```
dx read scripts/install-foundation.mjs | node --input-type=module - -- "$PWD"
```

## Apps and packages

Install the shared packages and one backend app for each backend service. Each backend includes a tRPC procedure integration-test helper at `apps/<backend>/src/test/createTestTrpc.ts` and a starter `*.procedure.test.ts` example:

```
dx read scripts/install-apps-packages.mjs | node --input-type=module - -- "$PWD" "<backend slugs comma separated>"
```

## Vite frontends

For each React/Vite frontend client, generate the frontend with the shadcn CLI, then apply the small fssstack Vite overlay from doctrine:

```
mkdir -p apps
CI=1 npx shadcn@latest init --preset <shadcnPreset> --template vite --cwd apps --name <frontend slug>
dx read scripts/apply-vite-layer.mjs | node --input-type=module - -- "$PWD" <frontend slug>
```

The shadcn CLI creates each app at `apps/<client-name>` when run with `--cwd apps --name <client-name>`. Do not run it with `--cwd apps/<client-name> --name <client-name>`, because that creates an accidental nested `apps/<client-name>/<client-name>` scaffold.

The shadcn CLI owns the generic Vite, React, Tailwind, and shadcn/ui scaffolding. The fssstack overlay should stay narrow: shared tsconfig wiring, package scripts, deployment rewrites, `index.html` templating, cleanup of scaffold noise, and a blank app surface.

## Next.js frontends

For each React/Next.js frontend client, generate the frontend with the shadcn CLI, then apply the small fssstack Next.js overlay from doctrine:

```
mkdir -p apps
CI=1 npx shadcn@latest init --preset <shadcnPreset> --template next --cwd apps --name <frontend slug> --no-monorepo --base radix --yes
dx read scripts/apply-next-layer.mjs | node --input-type=module - -- "$PWD" <frontend slug>
```

The Next.js overlay removes app-local install artifacts, uses shared Next TypeScript and ESLint config, normalizes package versions, makes the dev script use the Zapper-managed app port, and leaves a blank page. Keep the scaffolded page disposable; the important generated assets are the Next config files, Tailwind/shadcn CSS setup, `components.json`, and shadcn utility/component layout.

Frontend implementation and test examples live in:

```
docs/examples/frontend/web-request.md
docs/examples/frontend/logging.md
```

## Publishable packages

If the project has CLI or library packages, scaffold them as publishable TypeScript packages and install the direct-release Changesets workflow:

```
dx read scripts/install-publishable-packages.mjs | node --input-type=module - -- "$PWD" "<cli slugs comma separated or empty>" "<library slugs comma separated or empty>"
```

CLI packages use `etc/tsconfig.node.json`, add a package `bin`, and build executable `dist/index.js`. Library packages use `etc/tsconfig.base.json`. A committed changeset on `main` is the release trigger; do not use the Changesets release-PR flow.

## Render template

Replace template strings once after the foundation, apps/packages, Vite overlays, and publishable package scaffolds are in place. Pass the backend, frontend, CLI, and library lists so `zap.yaml`, `.env.local`, package names, service ports, and favicon/title values are generated together.

The render script generates the emoji favicon data URI and writes it into each `index.html` through the same template replacement pass:

```
dx read scripts/render-template.mjs | node --input-type=module - -- "$PWD" "<slug>" "<packagePrefix>" "<name>" "<description>" "<emoji>" "<backendServices>" "<frontendClients>" "<cliPackages>" "<libraryPackages>"
```

Default app wiring is intentionally minimal and comes from generated env values, not from a pairing process. Vite frontends can read `VITE_API_BASE_URL`, which points to the first backend service in the list. `FRONTEND_URL` points to the first frontend client for single-URL consumers. `FRONTEND_URLS` is one comma-separated list of every frontend URL for backend CORS allowlists. Extra backend services and extra frontend clients are created and runnable, but they are not paired with each other by setup.

## Dependencies

```
dx read scripts/install-root-dependencies.mjs | node --input-type=module - -- "$PWD"
pnpm install
pnpm dlx shadcn@latest add -c apps/frontend button card --yes --overwrite
pnpm dlx shadcn@latest add -c apps/foobar button card --yes --overwrite
dx read scripts/normalize-package-versions.mjs | node --input-type=module - -- package.json apps/*/package.json packages/*/package.json
pnpm exec eslint . --fix
```

## Create AGENTS.md

Follow `dx read --store felixsebastian/mp-lb-dev update-agents-md.md` expecting there to not be an existing file so just update the project info.

When updating the project info, include these generated project conventions:

- Put tRPC procedure integration tests in `apps/<backend>/src/*.procedure.test.ts` and use `apps/<backend>/src/test/createTestTrpc.ts` to call the real app router with an injected app context.
- For every change, run `zap t lint -- <file...>` to lint all touched files.
- For every change, run `zap t typecheck -- <app-or-package-dir...>` to typecheck every touched app or package.
- Run lint and typecheck as separate tasks. Do not tell agents to use a combined `check` task for targeted validation.

## Validate

```
pnpm install
zap t lint -- apps/backend/src/index.ts apps/frontend/src/App.tsx packages/core/src/index.ts packages/server/src/index.ts packages/trpc/src/index.ts
zap t typecheck -- apps/backend apps/frontend packages/core packages/server packages/trpc
pnpm test
pnpm turbo run build --filter=<package-prefix>-backend
pnpm turbo run build --filter=<package-prefix>-baz
pnpm turbo run build --filter=<package-prefix>-frontend
pnpm turbo run build --filter=<package-prefix>-foobar
pnpm turbo run build --filter=<package-prefix>-toolbox
pnpm turbo run build --filter=<package-prefix>-sdk
zap up
```

Verify:

- each frontend loads
- each backend `/health` returns `{ "ok": true }`
- each CLI/library package builds when present
- package names, app titles, readme/favicon values, env values, and Zap services use the chosen project values and service names

## Extensions

After the base project validates, apply any selected extensions from `manifest.json5`.

For each extension slug, read the matching doc from `docs/extensions/<slug>.md` and apply it as a follow-up layer. Extensions are allowed to require project-specific judgment; keep the base setup complete and committed before taking responsibility for extension-specific behavior.

Commit:

```
git add .
git commit -m init
```
