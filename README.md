# Stackforge

Stackforge is the workbench for FSS Stack: a thin wrapper around separate working projects and Doctrine payloads. It authors the `fssstack` template store, the `mp-lb-run` deploy store, and the landing page.

## Folders

- `fssstack-start/`: Next.js landing page and prompt builder.
- `flatpack-shell/`: Minimal working target-repo shell monorepo.
- `authoring-tools/`: npm project for building and testing generated Doctrine scripts.
- `fssstack/`: Doctrine payload (store `felixsebastian/fssstack`) for creating FSS Stack target projects.
- `mp-lb-run/`: Doctrine payload (store `felixsebastian/mp-lb-run`) for deploying FSS Stack target projects.
- `examples/`: local generated repos and experiments.

## Commands

Run commands from the project that owns them:

```bash
pnpm -C fssstack-start dev
pnpm -C fssstack-start build
pnpm -C flatpack-shell test
pnpm -C flatpack-shell build
pnpm -C authoring-tools check:docs
pnpm -C authoring-tools build:docs
```

The repository root is not an npm project.
