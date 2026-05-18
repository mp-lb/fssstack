# FSS Stack Authoring Repo

This repository brings together three related surfaces:

- the FSS Stack landing page at the repository root
- `flatpack-docs/`, the Doctrine payload that agents read to create FSS Stack target projects
- `mp-lb-run/`, the Doctrine payload that agents read to deploy FSS Stack projects with the mp-lb-run cloud pattern

The Doctrine folders are published copies. Treat this repository as the authoring workspace: edit here, build generated artifacts here, commit here, then publish the Doctrine payloads.

## Working Model

Agents that create or deploy projects usually do not have this repository locally. They read published files with commands such as:

```bash
dx read SETUP_PROCESS.md
dx read scripts/install-foundation.mjs
```

That is why built setup scripts remain inside `flatpack-docs/scripts/`, `mp-lb-run/scripts/`, and `mp-lb-run/templates/`. Their TypeScript sources live in root-level `scripts-src/`.

## Common Commands

Run the landing page locally with Zapper:

```bash
pnpm dev
```

Useful process commands:

```bash
pnpm dev:status
pnpm dev:open
pnpm dev:down
```

Build the Doctrine setup scripts:

```bash
pnpm build:docs
```

Validate the authoring-side docs tooling:

```bash
pnpm check:docs
```

Use `dx pull`, `dx push`, or `dx git sync` when publishing Doctrine changes. `dx pull`/`dx push` are clearer when you want manual control over the Git commit.

## Repo Map

- `app/`, `components/`, `lib/`, `public/`: landing page
- `zap.yaml`: local process management for the authoring workspace
- `flatpack-docs/`: published FSS Stack project-creation docs and layer files
- `mp-lb-run/`: published deployment docs, templates, and built scripts
- `scripts-src/flatpack-docs/`: TypeScript sources for `flatpack-docs/scripts/*.mjs`
- `scripts-src/mp-lb-run/`: TypeScript sources for mp-lb-run built scripts
- `TARGET_PROJECT_SHAPE.md`: mental model for generated target repositories
- `tests/`: authoring-side tests for setup script behavior
- `examples/`: local example target repositories and experiments
