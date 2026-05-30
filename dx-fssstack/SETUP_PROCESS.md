# fssstack Setup

Run this from an empty folder. If other project files already exist, stop and ask the user for an empty folder or git repo.

## Shell

Start by fetching the shell project files:

```bash
dx pull --direct --store felixsebastian/fssstack --path shell --target .
```

The shell contains some example apps/packages: `apps/example-backend` and `packages/example-lib`.

## Package naming

Every app and package is named `<package-scope>/<project-slug>-<slug>`, where `<slug>` is the backend/frontend/library slug.

**Exception — collapse on match:** when a slug is identical to the project slug, drop the duplicate and name the package `<package-scope>/<project-slug>` (not `<package-scope>/<project-slug>-<project-slug>`). This applies to every augment step below.

## Backends

For each backend service, duplicate the example backend and augment it:

```bash
cp -R apps/example-backend apps/<backend slug>
node scripts/augment-backend.mjs "<backend slug>" "<package-scope>" "<project-slug>"
```

The backend augment step should:

- update `apps/<backend slug>/package.json` name to `<package-scope>/<project-slug>-<backend slug>` (collapsing to `<package-scope>/<project-slug>` when the backend slug equals the project slug — see Package naming)
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

The frontend augment step should stay narrow: package name (`<package-scope>/<project-slug>-<frontend slug>`, collapsing to `<package-scope>/<project-slug>` when the frontend slug equals the project slug — see Package naming), shared TypeScript wiring, Zap service entry, port env name, deploy-safe SPA rewrites when needed, title/favicon values, and cleanup of scaffold noise. The shadcn CLI owns the generic Vite, React, Tailwind, and shadcn/ui scaffold.

## Next.js Frontends

For each React/Next.js frontend client, generate the frontend with the shadcn CLI, then apply the narrow fssstack frontend wiring:

```bash
mkdir -p apps
CI=1 npx shadcn@latest init --preset <shadcnPreset> --template next --cwd apps --name <frontend slug> --no-monorepo --base radix --yes
node scripts/augment-next-frontend.mjs "<frontend slug>" "<package-scope>" "<project-slug>"
```

The Next.js augment step should stay narrow: package name (`<package-scope>/<project-slug>-<frontend slug>`, collapsing to `<package-scope>/<project-slug>` when the frontend slug equals the project slug — see Package naming), shared config where appropriate, Zap service entry, port env name, title/favicon values, and cleanup of scaffold noise. Keep the scaffolded page disposable.

Frontend implementation and test examples live in:

```text
docs/examples/frontend/web-request.md
docs/examples/frontend/logging.md
```

## Docs Sites

For a library that publishes a documentation site, scaffold a **Fumadocs** app on
**React Router**, then apply the narrow fssstack wiring:

```bash
mkdir -p apps
npm create fumadocs-app@latest <docs slug> --template react-router --cwd apps
node scripts/augment-docs-site.mjs "<docs slug>" "<package-scope>" "<project-slug>"
```

Fumadocs owns the generic React Router + MDX + search scaffold (the
`fumadocs-core` / `fumadocs-mdx` / `fumadocs-ui` stack with Orama local search).
The docs-site augment step stays narrow, exactly like the frontend ones: package
name (`<package-scope>/<project-slug>-<docs slug>`, collapsing to
`<package-scope>/<project-slug>` when the docs slug equals the project slug — see
Package naming), shared TypeScript wiring, Zap service entry, port env name,
deploy-safe static rewrites, title/favicon values, and cleanup of scaffold noise.

A docs site renders the library's published `docs/public/` — the generated API
reference plus hand-written guides. This is the plain Fumadocs setup with no
extra dependencies; bringing a docs site up to internal house style (shared
theme, global TypeScript config, generated-reference wiring) is a separate
augmented flow and is not part of this template.

### AGENTS.md docs layer

A project with a docs site also needs its `AGENTS.md` to tell agents how the
generated-docs workflow works. That guidance is a conditional layer, not part of
the base template — copy it into the project's `docs/agents-md/` layers folder:

```bash
dx pull --direct --store felixsebastian/fssstack --path agents-md/docs-website.md --target docs/agents-md/docs-website.md
```

This is the conditional-snippet pattern: a project gets
`docs/agents-md/docs-website.md` only when it has a docs site. The AGENTS.md
compiler composes everything in `docs/agents-md/` into the final `AGENTS.md`, so
once the file is in place our responsibility ends.

## Delete examples

- `rm -rf apps/example-backend`
- `rm -rf packages/example-lib`

## Library Packages

For each library package, duplicate the example library and augment it:

```bash
cp -R packages/example-lib packages/<library slug>
node scripts/augment-lib.mjs "<library slug>" "<package-scope>" "<project-slug>"
```

The library augment step should:

- update package name to `<package-scope>/<project-slug>-<library slug>` (collapsing to `<package-scope>/<project-slug>` when the library slug equals the project slug — see Package naming)
- keep `files`, `exports`, `types`, and build scripts publish-safe
- keep public exports small and explicit
- update release docs if package names changed

A library that ships a command-line tool is still a library: add a package `bin`, the Node tsconfig, and a `#!/usr/bin/env node` shebang on the entrypoint. There is no separate CLI package type. See `docs/standards/clis.md` for command-line behaviour on top of the library baseline.

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

