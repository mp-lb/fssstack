# Library Check

Use this from a generated FSS Stack target repo when asked to check one or more publishable library packages.

## Goal

Check whether each library still matches what a fresh FSS Stack publishable library package would create today. Preserve the public API unless the user asked for an API change.

## Compare

Read the current publishable package setup source:

```bash
dx read SETUP_PROCESS.md
dx read scripts/install-publishable-packages.mjs
dx read layers/packages/publishable/package.json
dx read layers/packages/publishable/tsconfig.json
dx read layers/release/.github/workflows/release.yml
```

Compare each library package under `packages/<lib>` against the current generated library shape.

## Focus

- `package.json` has `private: false`, `files`, `exports`, `publishConfig`, and current scripts
- `tsconfig` extends the base config unless the library needs node, DOM, or React settings
- build emits `dist` JavaScript and declarations
- package exports match the intended public API
- peer dependencies are used for host-owned runtimes such as React or Fastify
- README and changelog describe public behavior accurately
- Changesets config and release workflow use direct release on pushed changesets
- release flow does not create a Changesets release PR

## Validate

Run focused checks first:

```bash
pnpm --filter=<lib-package> typecheck
pnpm --filter=<lib-package> test
pnpm --filter=<lib-package> build
pnpm --filter=<lib-package> pack --pack-destination /tmp
```

Inspect the tarball and public exports before changing release behavior. Warnings are acceptable; non-zero exits are blockers.
