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

Use the chosen strings directly in commands and file edits. Do not rely on exported environment variables carrying across shell sessions.

Service names must be unique and should use lowercase letters, numbers, and hyphens. The examples below use two backend services, `backend` and `baz`, and two React/Vite frontend clients, `frontend` and `foobar`.

Other fssstack docs may use `backend` and `frontend` as role labels. When applying those docs, map the examples to the actual generated service names.

## Foundation

Install the foundation layer from doctrine:

```
dx read scripts/install-foundation.mjs | node --input-type=module - -- "$PWD"
```

## Apps and packages

Install the shared packages and one backend app for each backend service:

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

The shadcn CLI owns the generic Vite, React, Tailwind, and shadcn/ui scaffolding. The fssstack overlay should stay narrow: shared tsconfig wiring, frontend package scripts/dependencies, frontend logging/config/tRPC/test setup, `index.html` templating, and the demo `App.tsx` card plus its test.

## Render template

Replace template strings once after the foundation, apps/packages, and Vite overlays are in place. Pass the backend service list and frontend client list so `zap.yaml`, `.env.local`, backend package names, frontend package names, service ports, and favicon/title values are generated together.

The render script generates the emoji favicon data URI and writes it into each `index.html` through the same template replacement pass:

```
dx read scripts/render-template.mjs | node --input-type=module - -- "$PWD" "my-project" "@fssstack" "My Project" "One sentence project description." "🐱" "backend, baz" "frontend (react-vite), foobar (react-vite)"
```

Default app wiring is intentionally minimal and comes from generated env values, not from a pairing process. Every generated frontend reads the same `VITE_API_BASE_URL`, which points to the first backend service in the list. `FRONTEND_URL` points to the first frontend client for single-URL consumers. `FRONTEND_URLS` is one comma-separated list of every frontend URL for backend CORS allowlists. Extra backend services and extra frontend clients are created and runnable, but they are not paired with each other by setup.

## Dependencies

```
pnpm add -w --save-exact lodash pino pino-pretty zod
pnpm add -w --save-dev --save-exact turbo typescript vitest ts-node jsdom @types/node @types/lodash @types/pino eslint@9 @eslint/js@9 eslint-config-prettier eslint-plugin-import eslint-plugin-prettier eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh globals typescript-eslint @testing-library/react @testing-library/jest-dom prettier prettier-plugin-tailwindcss tsx vite @vitejs/plugin-react @tailwindcss/vite react react-dom
pnpm install
pnpm dlx shadcn@latest add -c apps/frontend button card --yes --overwrite
pnpm dlx shadcn@latest add -c apps/foobar button card --yes --overwrite
dx read scripts/normalize-package-versions.mjs | node --input-type=module - -- package.json apps/*/package.json packages/*/package.json
pnpm exec eslint . --fix
```

## Create AGENTS.md

Follow `dx read --store felixsebastian/mp-lb-dev update-agents-md.md` expecting there to not be an existing file so just update the project info.

## Validate

```
pnpm install
pnpm lint
pnpm turbo run typecheck
pnpm test
pnpm turbo run build --filter=<package-prefix>-backend
pnpm turbo run build --filter=<package-prefix>-baz
pnpm turbo run build --filter=<package-prefix>-frontend
pnpm turbo run build --filter=<package-prefix>-foobar
zap up
```

Verify:

- each frontend loads
- each frontend calls the first backend through tRPC
- each backend `/health` returns `{ "ok": true }`
- package names, app titles, readme/favicon values, env values, and Zap services use the chosen project values and service names

Commit:

```
git add .
git commit -m init
```
