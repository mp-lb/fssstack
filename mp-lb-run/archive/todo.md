# Migration Todo

## 1. Establish The Deployment Repo Shape

- [x] Add the base Doctrine entry point `SETUP_PROCESS.md`.
- [x] Create the repo structure for installable deployment assets: setup docs, templates, scripts, and extension deployment docs.
- [x] Define the target-project contract for v1: read `docs/fssstack-manifest.md`, use `terraform/`, GitHub Actions adapter, `.env.production`, and `secrets.enc.json`.
- [x] State explicitly that this repo covers cloud deployment only; local development remains in `fssstack` and Zapper.
- [x] Document how agents should consume this repo with `dx --store fssstack-deployment read ...`.

## 2. Build The Base Deployment Layer

- [x] Turn the current Terraform into a clean base deployment template for multiple frontend and backend apps, driven by vars.
- [x] Add or template the target-project files needed by the base deployment, including Terraform, workflow, backend Dockerfile, and deployment env configuration.
- [x] Replace old `PRODUCTION_SECRETS` assumptions with `.env.production` for non-secrets and `secrets.enc.json` for encrypted secrets.
- [x] Make the GitHub Actions workflow a generated target-project adapter, not a workflow for this repo itself.
- [x] Remove stale HelloWorld, `@mp-lb`, `infra/`, worker, Redis, and MongoDB assumptions from the base deployment layer.
- [x] Generate `terraform/terraform.tfvars` from `docs/fssstack-manifest.md` and deployment inputs.

## 3. Rewrite The Base Deployment Docs

- [x] Rewrite `docs/deployment-setup.md` around the actual base setup flow.
- [x] Rewrite `docs/deployment-runbook.md` as a reusable runbook for multiple deployed frontends and backends.
- [x] Rewrite `docs/terraform.md` so it matches the actual `terraform/` base layer.
- [x] Move custom/client-owned domain guidance into this repo as deployment documentation.
- [x] Make all base docs clear that Redis, workers, MongoDB, S3, and auth-provider infrastructure are extension concerns.
- [x] Keep docs painfully simple, concise, and consistent.

## 4. Create Extension Deployment Docs

- [x] Create `extensions/redis-deploy.md` for managed Redis and production Redis wiring.
- [x] Create `extensions/bull-deploy.md` for worker deployment and queue infrastructure.
- [x] Create `extensions/s3-deploy.md` for production object storage infrastructure.
- [x] Create a deployment doc for custom domains if it fits better under `extensions/` than `docs/`.
- [x] Add MongoDB deployment guidance only if there is concrete production setup to preserve.
- [x] Use a consistent structure in each extension deployment doc: assumptions, added env, encrypted secrets, Terraform/workflow changes, and verification.
- [x] Keep local Zapper, `zap.yaml`, LocalStack, local Redis, local MongoDB, and local test-stack setup out of deployment extension docs.

## 5. Clean Core Extension Docs In `~/Code/fssstack/extensions`

- [x] Strip cloud deployment-specific Terraform, workflow, provider, and production secret instructions out of core extension docs.
- [x] Replace inlined deployment instructions with explicit Doctrine read commands pointing to this repo.
- [x] Update extension docs to match the current generated project shape shown by `~/Code/coderadar`.
- [x] Fix stale paths and names, especially `docs/env-vars.md`, `docs/platform/*`, `infra/`, `bare_metal`, `packages/system`, `helloworld`, `@mp-lb`, `@your-org`, and `@myorg`.
- [x] Deduplicate and simplify the oversized S3 and Bull docs.
- [x] Keep each core extension focused on local/app-level installation and integration, including Zapper assumptions where useful.

## 6. Add Setup Scripts And Templates Where Useful

- [x] Add small setup scripts for mechanical base deployment installation.
- [x] Add a manifest reader that turns `docs/fssstack-manifest.md` plus deployment inputs into a reviewable deployment inventory.
- [x] Add templates for Terraform, GitHub Actions, backend Dockerfile, `.env.production`, and `secrets.enc.json` handling.
- [x] Keep extension deployment automation incremental; start with docs, then script only the low-risk repetitive parts.
- [x] Ensure generated files use target-project values instead of hardcoded project names.

## 7. Validate End To End

- [x] Read the new setup flow as an agent would, starting from `dx --store fssstack-deployment read SETUP_PROCESS.md`.
- [x] Check deployment templates against a target project with `docs/fssstack-manifest.md` without modifying it.
- [x] Re-scan `~/Code/fssstack/extensions` for deployment leakage after cleanup.
- [x] Re-scan this repo's base docs for extension-specific assumptions.
- [x] Check all Doctrine read commands, file paths, and relative links.
- [x] Confirm no files outside `~/Code/fssstack/extensions` were changed in `~/Code/fssstack`.
- [x] Confirm `~/Code/coderadar` remains untouched.
