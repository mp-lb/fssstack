# fssstack Setup

Run this from an empty folder. If other project files already exist, stop and ask the user for an empty folder or git repo.

## Shell

Start by fetching the shell project files:

```bash
dx pull --direct --store felixsebastian/fssstack --path shell --target .
```

The shell contains some example apps/packages: `apps/example-backend`, `packages/example-cli`, and `packages/example-lib`.

## Backends

For each backend service, duplicate the example backend and augment it:

```bash
cp -R apps/example-backend apps/<backend slug>
node scripts/augment-backend.mjs "<backend slug>" "<package-scope>" "<project-slug>"
```

The backend augment step should:

- update `apps/<backend slug>/package.json` name to `<package-scope>/<project-slug>-<backend slug>`
- replace `example-backend` display/service labels with the backend slug
- replace `EXAMPLE_BACKEND_PORT` with `<BACKEND_SLUG>_PORT`
- add or update the matching Zap native service
- keep `/health` returning `{ "ok": true, "service": "<backend slug>" }`

If the project has multiple backends, repeat the copy and augment step for every backend. Remove `apps/example-backend` after all requested backends exist, unless the requested backend slug is `example-backend`.

## Vite Frontends

For each React/Vite frontend client, generate the frontend with the shadcn CLI, then apply the narrow fssstack frontend wiring:

```bash
mkdir -p apps
CI=1 npx shadcn@latest init --preset <shadcnPreset> --template vite --cwd apps --name <frontend slug>
node scripts/augment-vite-frontend.mjs "<frontend slug>" "<package-scope>" "<project-slug>"
```

The shadcn CLI creates each app at `apps/<client-name>` when run with `--cwd apps --name <client-name>`. Do not run it with `--cwd apps/<client-name> --name <client-name>`, because that creates an accidental nested `apps/<client-name>/<client-name>` scaffold.

The frontend augment step should stay narrow: package name, shared TypeScript wiring, Zap service entry, port env name, deploy-safe SPA rewrites when needed, title/favicon values, and cleanup of scaffold noise. The shadcn CLI owns the generic Vite, React, Tailwind, and shadcn/ui scaffold.

## Next.js Frontends

For each React/Next.js frontend client, generate the frontend with the shadcn CLI, then apply the narrow fssstack frontend wiring:

```bash
mkdir -p apps
CI=1 npx shadcn@latest init --preset <shadcnPreset> --template next --cwd apps --name <frontend slug> --no-monorepo --base radix --yes
node scripts/augment-next-frontend.mjs "<frontend slug>" "<package-scope>" "<project-slug>"
```

The Next.js augment step should stay narrow: package name, shared config where appropriate, Zap service entry, port env name, title/favicon values, and cleanup of scaffold noise. Keep the scaffolded page disposable.

Frontend implementation and test examples live in:

```text
docs/examples/frontend/web-request.md
docs/examples/frontend/logging.md
```

## CLI Packages

For each CLI package, duplicate the example CLI and augment it:

```bash
cp -R packages/example-cli packages/<cli slug>
node scripts/augment-cli.mjs "<cli slug>" "<package-scope>" "<project-slug>"
```

The CLI augment step should:

- update package name to `<package-scope>/<project-slug>-<cli slug>`
- update `bin` to expose the requested command name
- keep the Node shebang on the entrypoint
- keep `files`, `exports`, `types`, and build scripts publish-safe
- update release docs if package names changed

Remove `packages/example-cli` after all requested CLIs exist, unless the requested CLI slug is `example-cli`.

## Delete examples

- `rm -rf apps/example-backend`
- `rm -rf packages/example-cli`
- `rm -rf packages/example-lib`

## Library Packages

For each library package, duplicate the example library and augment it:

```bash
cp -R packages/example-lib packages/<library slug>
node scripts/augment-lib.mjs "<library slug>" "<package-scope>" "<project-slug>"
```

The library augment step should:

- update package name to `<package-scope>/<project-slug>-<library slug>`
- keep `files`, `exports`, `types`, and build scripts publish-safe
- keep public exports small and explicit
- update release docs if package names changed

Remove `packages/example-lib` after all requested libraries exist, unless the requested library slug is `example-lib`.

## Dependencies

After shell augmentation and app/package creation:

```bash
pnpm install
pnpm dlx shadcn@latest add -c apps/admin button card --yes --overwrite
pnpm dlx shadcn@latest add -c apps/landing-page button card --yes --overwrite
```

Only run shadcn component installs for frontend apps that actually exist, and use each real frontend slug.

## Create AGENTS.md

Run `dx read standards/agents-md-template.txt > AGENTS.md`, and follow `dx read standards/update-agents-md.md`.

## Validate

Run validation after all selected apps and packages exist:

```bash
zap task setup
zap up
```

Run basic validation as per the AGENTS.md.

## Extensions

After the base project validates, apply any selected extensions from the extension docs.

For each extension slug, read the matching doc from `docs/extensions/<slug>.md` and apply it as a follow-up layer. Extensions are allowed to require project-specific judgment; keep the base setup complete and committed before taking responsibility for extension-specific behavior.

Commit:

```bash
git add .
git commit -m init
```

