# mp-lb-run

`mp-lb-run` is a Doctrine repo for one cloud deployment pattern for FSS Stack projects.

It is not the universal deployment layer. FSS Stack projects can subscribe to different deployment repos or patterns depending on where and how they need to run.

This repo provides the deployment pattern that currently targets a small cloud stack: frontend apps, backend apps, container/image infrastructure, DNS/routing, and supporting setup docs/templates/scripts.

## How Agents Use This Repo

Agents read this repo through Doctrine.

For base deployment setup:

```bash
dx --store mp-lb-run read SETUP_PROCESS.md
```

For extension-specific cloud deployment guidance:

```bash
dx --store mp-lb-run read extensions/s3-deploy.md
```

For existing-project env mapper adoption notes:

```bash
dx --store mp-lb-run read docs/env-mapper-rollout.md
```

The base setup entry point should describe how to apply this deployment layer to a generated FSS Stack target project.

Extension deployment docs are read when an app extension from `fssstack/extensions` also needs cloud deployment work.

## Relationship To `fssstack`

The main `fssstack` repo owns the core project setup, local development model, standards, and app-level extensions.

This repo owns cloud deployment for one deployment pattern.

The split is:

- `fssstack`: local development, Zapper, `zap.yaml`, app code integration, extension installation
- `mp-lb-run`: cloud deployment docs, templates, scripts, Terraform, CI/CD adapters, production routing and cloud infrastructure

When a cross-cutting extension needs both local and cloud work, the local work stays in `fssstack/extensions`, and the cloud work lives here in `extensions/*-deploy.md`.

## Local Development Boundary

In this repo, "deployment" means cloud deployment. It does not mean local development.

Local development is standardized through Zapper and `zap.yaml`, so local development guidance belongs in `fssstack`.

This repo should not own:

- local Zapper setup
- local `zap.yaml` service definitions
- local Redis setup
- local MongoDB setup
- LocalStack setup
- local worker process setup
- local Playwright/test-stack orchestration

Those can be assumed by core extension docs because the local development model is standardized.

## Base Cloud Deployment Scope

The base deployment should stay small and decoupled.

Base deployment includes:

- any number of frontend apps
- any number of backend apps
- frontend hosting
- backend hosting
- backend container registry
- DNS/routing for deployed frontends and backends
- Terraform state setup
- optional budget/cost guardrails

Base deployment does not include:

- Redis
- BullMQ workers
- MongoDB
- S3/object storage
- auth-provider-specific infrastructure
- extension-specific infrastructure

Those belong in extension deployment docs.

## Deployment Adapter Model

This repo is one deployment adapter. It should be built with the expectation that other deployment repos may exist.

Core FSS Stack extensions should not assume this repo is mandatory. They can point to it as the matching cloud deployment guidance for this deployment pattern.

Example pointer from a core extension:

```md
For cloud deployment with the mp-lb-run pattern, read:

dx --store mp-lb-run read extensions/s3-deploy.md
```

## Target Project Contract

Deployment setup assumes a current generated FSS Stack target project.

FSS Stack projects can have any number of frontend apps and any number of backend apps. The deployment layer should not assume a single frontend/backend pair.

The deployment layer should only need a small target-project contract:

- `fssstack.json`
- backend run/build commands
- frontend build command/output path
- domains
- cloud/project identifiers
- environment variable names in deployment inventory `env` arrays

`fssstack.json` is expected to list the target project's frontend and backend apps. This repo does not need to infer app type from the file tree.

Frontend apps are React-based Vite or Next.js apps, and are generally deployed through similar Vercel flows.

Backend apps come from the FSS Stack backend template.

The setup process should read the manifest, produce a reviewable deployment inventory at `deployment/apps.json`, and generate the deployment variable files from that inventory. `deployment/apps.json` is the canonical env inventory for this adapter: `deploymentEnv` lists CI/provider variables, and service `env` arrays list runtime values for frontends, backends, workers, landing pages, and docs apps where applicable. Do not maintain a separate long-lived `env-map.yaml` beside it.

## Template Model

Base setup should copy or render Terraform templates into the target repo, then generate `terraform/terraform.tfvars` from `fssstack.json` and deployment inputs.

Terraform should be driven by variables, especially maps of frontends and backends.

Extension deployment setup should follow the same pattern:

- copy any extra Terraform files needed by the extension
- append or update deployment variables
- add any required environment variables or encrypted secrets

This keeps Terraform normal and reviewable while letting setup scripts handle project-specific values.

## Environment Variables

Environment variables should be committed to the target repo.

Non-secret production values should live in `.env.production`.

Sensitive values should live in `secrets.json.enc`.

GitHub Actions should use one repository secret, `SECRETS_KEY`, to decrypt `secrets.json.enc`.

This replaces the old model where many app environment variables lived directly in GitHub secrets or in a `PRODUCTION_SECRETS` blob.

Deployment docs and templates should use `.env.production` plus `secrets.json.enc`.

`@mp-lb/tools-env-mapper` owns env parsing and rendering: merging public and secret values, masking secrets in GitHub Actions, normalizing `GCP_SA_KEY`, writing `$GITHUB_ENV`, and producing Terraform runtime env vars. `mp-lb-run` owns the generated files, target-project deployment shape, Terraform variables, and GitHub Actions workflow composition.

## Expected Repo Shape

This repo can contain:

- `README.md`: stable project facts and boundaries
- `SETUP_PROCESS.md`: base deployment setup entry point
- `docs/`: reusable deployment documentation
- `extensions/`: extension-specific cloud deployment docs
- `templates/`: files rendered or copied into target projects, including Terraform templates
- `scripts/`: small mechanical setup scripts
- `archive/`: migration notes and historical snapshots that are not part of the product surface

Docs should be concise, consistent, and practical. Prefer short setup steps, small examples, and clear boundaries over long explanations.

## Archive

Historical migration artifacts live under `archive/`.

These files are not part of the deployment product surface. They are kept only for context while the repo settles.

- `archive/todo.md`
- `archive/problem-map.md`
- `archive/deploy-migration.md`
- `archive/fssstack-extension-snapshot/`
