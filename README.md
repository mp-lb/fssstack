# FSS Stack Authoring Repo

This git repo is a thin wrapper around separate working projects and Doctrine payloads.

## Folders

- `landing-page/`: Next.js landing page and prompt builder.
- `flatpack-shell/`: Minimal working target-repo shell monorepo.
- `authoring-tools/`: npm project for building and testing generated Doctrine scripts.
- `flatpack-docs/`: Doctrine payload for creating FSS Stack target projects.
- `mp-lb-run/`: Doctrine payload for deploying FSS Stack target projects.
- `examples/`: local generated repos and experiments.

## Commands

Run commands from the project that owns them:

```bash
pnpm -C landing-page dev
pnpm -C landing-page build
pnpm -C flatpack-shell test
pnpm -C flatpack-shell build
pnpm -C authoring-tools check:docs
pnpm -C authoring-tools build:docs
```

The repository root is not an npm project.
