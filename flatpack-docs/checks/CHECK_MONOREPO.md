# Monorepo Check

Use this from a generated FSS Stack target repo when asked to check the workspace wrapper, root config, or overall monorepo shape.

## Goal

Check whether the repo still matches what a fresh FSS Stack setup would create today. Prefer small, targeted updates over broad rewrites.

## Compare

Read the current setup source:

```bash
dx read SETUP_PROCESS.md
dx read scripts/install-foundation.mjs
dx read scripts/install-root-dependencies.mjs
dx read scripts/render-template.mjs
```

Compare root files against current expectations:

- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `eslint.config.js`
- `zap.yaml`
- `.env.local`
- `etc/tsconfig*.json`
- `etc/vitest*.config.ts`
- `.github/workflows/release.yml` when publishable packages exist

## Focus

- workspace package globs include all app and package locations
- root scripts still match the recommended lint, typecheck, test, build, and release commands
- shared TypeScript, Vitest, ESLint, and Turbo config still match current generated defaults
- Zap services and ports match the generated apps
- root dependencies include current toolchain packages
- release workflow uses direct Changesets release on pushed changesets, not a release PR flow

## Validate

Run the repo's normal checks:

```bash
pnpm lint
pnpm turbo run typecheck
pnpm test
pnpm turbo run build
```

If checks fail, fix the first real mismatch. Warnings are not blockers unless the command exits non-zero.
