# FSS Stack Authoring Repo

This repository is the authoring workspace for three closely related projects:

- The root Next.js app is the FSS Stack landing page and prompt builder.
- `flatpack-docs/` is the Doctrine payload for creating a new FSS Stack target project.
- `mp-lb-run/` is the Doctrine payload for deploying FSS Stack target projects with the mp-lb-run cloud pattern.

Treat this repository as the place where changes are authored and reviewed. Treat Doctrine as the published runtime surface that downstream agents read with commands such as `dx read SETUP_PROCESS.md` and `dx read scripts/install-foundation.mjs`.

## Contribution Model

Do not add `AGENTS.md` files inside `flatpack-docs/` or `mp-lb-run/`. Those folders are published payloads, not standalone working repos in this checkout.

For Doctrine payload changes:

1. Edit the relevant docs, templates, layers, or TypeScript source in this repository.
2. If setup script behavior changes, edit root-level `scripts-src/`.
3. Run `pnpm build:docs` so built `.mjs` artifacts are written into the Doctrine payload folders.
4. Run focused validation, usually `pnpm check:docs` for setup-script changes.
5. Commit changes in this repository.
6. Publish Doctrine payloads with `dx pull`, `dx push`, or `dx git sync` as appropriate. Prefer separate `dx pull`/`dx push` when you want clearer control over what changed.

The Doctrine folders are still important: target agents execute and read the files that are published from them. The authoring source for generated scripts, however, belongs at the repository root.

## Source And Build Layout

Root-owned authoring files:

- `scripts-src/flatpack-docs/`: TypeScript source for `flatpack-docs/scripts/*.mjs`
- `scripts-src/mp-lb-run/`: TypeScript source for `mp-lb-run/scripts/*.mjs` and generated template scripts
- `tests/flatpack-docs/`: tests for flatpack setup helpers
- `TARGET_PROJECT_SHAPE.md`: target-repo layout reference for authors
- `examples/`: local generated repos and experiments

Published Doctrine payload files:

- `flatpack-docs/SETUP_PROCESS.md`
- `flatpack-docs/extensions/`
- `flatpack-docs/layers/`
- `flatpack-docs/scripts/*.mjs`
- `mp-lb-run/SETUP_PROCESS.md`
- `mp-lb-run/docs/`
- `mp-lb-run/extensions/`
- `mp-lb-run/templates/`
- `mp-lb-run/scripts/*.mjs`

Do not edit built `.mjs` files directly unless you are doing an emergency published-artifact patch. Normal changes go through `scripts-src/` and `pnpm build:docs`.

## Landing Page Notes

The root app uses Next.js. This installed Next version may differ from older training-data conventions. Before changing framework-sensitive behavior, check the relevant guide in `node_modules/next/dist/docs/`.

Use Zapper for local process management in this authoring repo. `pnpm dev` runs `zap up`; the raw Next dev command is `pnpm dev:next` and is intended for the `website` service in `zap.yaml`. Use `pnpm dev:status`, `pnpm dev:open`, and `pnpm dev:down` for process inspection, opening, and shutdown.

Use the existing app structure and UI components. Keep the landing page focused on helping a human generate a prompt for an AI agent that will read the published Doctrine docs.

## Target Repo Mental Model

The target project is a separate repository assembled by an AI agent. The agent generally starts from an empty directory, reads setup instructions from Doctrine, copies or renders files, installs packages, and validates the generated monorepo.

Use `TARGET_PROJECT_SHAPE.md` when changing setup instructions, extension docs, layer files, or setup scripts. It explains which files exist at each setup stage and helps avoid instructions that assume this authoring checkout exists inside the generated target repo.
