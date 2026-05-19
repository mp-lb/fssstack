# CLI Check

Use this from a generated FSS Stack target repo when asked to check one or more CLI packages.

## Goal

Check whether each CLI still matches what a fresh FSS Stack publishable CLI package would create today. Prefer small updates to release, build, and package wiring.

## Compare

Read the current publishable package setup source:

```bash
dx read SETUP_PROCESS.md
dx read scripts/install-publishable-packages.mjs
dx read layers/packages/publishable/package.json
dx read layers/packages/publishable/tsconfig.json
dx read layers/release/.github/workflows/release.yml
```

Compare each CLI package under `packages/<cli>` against the current generated CLI shape.

## Focus

- `package.json` has `private: false`, `bin`, `files`, `exports`, `publishConfig`, and current scripts
- `tsconfig` extends the node config and emits declarations to `dist`
- build command creates executable `dist/index.js`
- CLI entrypoint starts with a node shebang
- package contents are limited to intended publish files
- Changesets config and release workflow use direct release on pushed changesets
- release flow does not create a Changesets release PR
- npm trusted publishing or `NPM_TOKEN` fallback is documented for the repo

## Validate

Run focused checks first:

```bash
pnpm --filter=<cli-package> typecheck
pnpm --filter=<cli-package> test
pnpm --filter=<cli-package> build
pnpm --filter=<cli-package> pack --pack-destination /tmp
```

Inspect the tarball before changing release behavior. Warnings are acceptable; non-zero exits are blockers.
