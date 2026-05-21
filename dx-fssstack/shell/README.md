# FSS Stack Shell

This is a minimal working target repo shell.

It intentionally avoids frontend frameworks and deployment code. It exists so the shell can be installed, tested, built, and run as a real monorepo before Flatpack layers add more app/package units.

## Projects

- `apps/example-backend`: basic Node HTTP backend with `/health`.
- `packages/core`: shared runtime-safe constants and helpers.
- `packages/server`: Node/server helpers used by the backend.
- `packages/trpc`: placeholder API contract package.
- `packages/example-cli`: simple executable CLI package.
- `packages/example-lib`: simple publishable library package.
- `docs/standards/release.md`: standard Changesets release process.

## Commands

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
zap up
```

The placeholder names are deliberately obvious:

- `example-backend`
- `@example/fss-shell-example-cli`
- `@example/fss-shell-example-lib`
- `EXAMPLE_BACKEND_PORT`
