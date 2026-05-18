# Problem Map

## Scope

This map is based on a read-only inspection of:

- `~/Code/fssstack`, especially `extensions/*.md`
- `~/Code/fssstack-deployment`, this repo
- `~/Code/coderadar`, a fresh generated target project with Clerk already installed

Only this file was written.

## Current Repo Roles

### `~/Code/fssstack`

The main Doctrine source kit still contains extension docs at `extensions/*.md`.

The extension set found locally is:

- `bull.md`
- `clerk.md`
- `clerk-rbac.md`
- `custom-domains.md`
- `mongodb.md`
- `playwright.md`
- `redis.md`
- `s3.md`

Several of these docs are copied into generated target projects under `docs/extensions/`, as seen in `~/Code/coderadar`.

### `~/Code/fssstack-deployment`

This repo currently contains:

- `docs/deployment-setup.md`
- `docs/deployment-runbook.md`
- `docs/terraform.md`
- `terraform/*.tf`
- `github-workflows/deploy.yml`
- `github-workflows/publish.yaml`

It does not currently contain an `extensions/` directory for extension-specific deployment guidance.

### `~/Code/coderadar`

The fresh generated target project currently has:

- `apps/backend`
- `apps/frontend`
- `packages/core`
- `packages/server`
- `packages/trpc`
- `docs/extensions/*.md`
- `docs/standards/*.md`
- `zap.yaml` with `native` services and `env: "*"`
- package names under `@coderadar/*`
- Clerk installed in frontend and backend

It does not have:

- `docs/env-vars.md`
- `env-map.yaml`
- `.env.production`
- `apps/backend/Dockerfile`
- `apps/frontend/vercel.json`
- `packages/system`

## High-Level Problems

### 1. Deployment Concerns Still Live In Core Extension Docs

The core extension docs in `~/Code/fssstack/extensions` still contain production deployment instructions, Terraform snippets, GitHub Actions changes, provider-specific assumptions, and deployment secret wiring.

Most affected:

- `redis.md`: mostly an Upstash + Terraform deployment guide before local Redis/code guidance.
- `bull.md`: includes worker app creation, GitHub Actions changes, GCE worker Terraform, Dockerfile, VM reset operations, and Redis deployment coupling.
- `s3.md`: includes AWS production bucket/IAM Terraform and production secret instructions.
- `custom-domains.md`: entirely deployment-specific and should likely move out of core extensions.

Impact:

- Users applying an extension to a non-default deployment target get infrastructure-specific guidance mixed into app setup.
- Extension docs remain coupled to the old template/deployment model.
- The deployment repo has no clear home for this material yet.

### 2. Core Extension Docs Assume Files That Current Generated Projects Do Not Have

Multiple extension docs tell users to update files that do not exist in the current generated target project.

Observed missing in `~/Code/coderadar`:

- `docs/env-vars.md`
- `env-map.yaml`
- `.env.production`
- `apps/backend/Dockerfile`
- `apps/frontend/vercel.json`
- `packages/system`

Examples:

- `clerk.md`, `mongodb.md`, `bull.md`, and `s3.md` refer to `docs/env-vars.md`.
- `redis.md` refers to `../platform/env-vars.md` and `../platform/deployment-runbook.md`.
- `custom-domains.md` refers to `docs/platform/deployment-runbook.md`.
- `bull.md` is built around `packages/system`, but the current generated project has `packages/server`, `packages/trpc`, and `packages/core`.
- Deployment workflow expects `env-map.yaml`, `.env.production`, backend Dockerfile, and frontend Vercel config.

Impact:

- Fresh projects cannot follow several docs literally.
- Generated projects receive docs that are already stale at creation time.
- There is no single reliable environment variable registry/update path today.

### 3. Naming And Path Drift Is Widespread

The docs mix old project names, placeholder names, and current generated conventions.

Examples:

- `helloworld` appears in extension docs, deployment docs, Terraform defaults, and workflow config.
- `@mp-lb` appears in Playwright and deployment workflow/publish workflow examples.
- `@your-org` and `@myorg` appear throughout extension examples.
- Deployment docs use `infra/`, while this repo stores Terraform under `terraform/`.
- Extension docs use both `docs/deployment-runbook.md` and `docs/platform/deployment-runbook.md`.
- `clerk.md` says update `zap.yaml` under `bare_metal`, but the current generated `zap.yaml` uses `native`.

Impact:

- It is hard to tell which examples are placeholders and which are current conventions.
- Instructions are harder to automate because paths and package names are not aligned.
- Users will likely copy old names into new projects.

### 4. Deployment Repo Docs Describe Infrastructure That Is Not Present

This repo's docs currently describe a richer deployment stack than the Terraform files actually implement.

Docs mention:

- GCE worker VM
- Upstash Redis
- `worker.tf`
- `redis.tf`
- backend + worker Docker images
- worker logs/debugging
- Redis injected into backend and worker by Terraform

Current Terraform files implement:

- Cloud Run backend
- Vercel frontend project/domain
- Cloudflare DNS records
- Artifact Registry
- optional GCP budget

Current Terraform files do not include:

- `worker.tf`
- `redis.tf`
- Upstash provider/resources
- worker image/env variables

Impact:

- The deployment repo is not internally coherent.
- Base deployment docs still include extension deployment assumptions.
- A user following `docs/terraform.md` would expect files and resources that do not exist.

### 5. The Deployment Workflow Does Not Match The Current Generated Project Shape

`github-workflows/deploy.yml` appears to be old HelloWorld workflow material.

Problems found:

- `PROJECT_NAME` is hardcoded to `helloworld`.
- Terraform working directory is `infra`, but this repo uses `terraform`.
- Backend image build expects `apps/backend/Dockerfile`, absent in `coderadar`.
- Backend env build expects `env-map.yaml`, absent in `coderadar`.
- Frontend build filter is hardcoded to `@mp-lb/helloworld-frontend`.
- Frontend deploy expects `apps/frontend/vercel.json`, absent in `coderadar`.
- The workflow assumes GitHub Actions, even though this system is now described as Doctrine repos rather than Git/GitHub-centered templates.

Impact:

- The workflow is not directly usable for a current generated project.
- It is unclear whether it is intended as a template, reference, or active deployment artifact.
- The deployment layer cannot yet be cleanly applied to a generated project.

### 6. Base Deployment Is Still Coupled To Extension Services

The desired base deployment is frontend + backend only. Current deployment docs still include extension service concepts:

- Redis/Upstash in setup, runbook, and Terraform docs.
- Worker VM in Terraform docs and debugging sections.
- `MONGODB_URL` listed as a Hello World production secret.
- Worker-specific IAM/API setup in deployment setup.

Impact:

- The base deployment surface is larger than the actual base app.
- Extension-specific operational burden appears mandatory.
- The split between core deployment and extension deployment is not yet visible.

### 7. Some Extension Docs Are Too Large And Internally Duplicated

Two docs are especially large:

- `bull.md`: about 720 lines.
- `s3.md`: about 698 lines.

`s3.md` appears to contain two overlapping versions of the guide in one file: an initial S3 guide, followed later by another `# S3` section with repeated environment variable, LocalStack, client, and infrastructure guidance.

Impact:

- The useful application setup path is buried.
- Deployment sections are harder to extract cleanly.
- Duplicated guidance increases the chance of contradictory updates.

### 8. Extension Docs Are Not Written Against Multi-Service/Multi-Client Setup

The current setup process explicitly allows multiple backend services and multiple frontend clients with user-chosen names. Several extension docs still assume:

- one backend named `backend`
- one frontend named `frontend`
- one worker named `worker`
- one package scope or hardcoded package name
- `apps/frontend` and `apps/backend` as universal paths

Impact:

- Docs are less reusable for the actual setup model.
- Instructions need either role-based wording or explicit mapping guidance from example names to generated service names.

### 9. Clerk Is Already Installed In The Reference Project But The Clerk Doc Still Reads Like First-Time Install

`~/Code/coderadar` has Clerk installed:

- frontend dependencies include `@clerk/react-router`, `react-router`, and auth pages/components.
- backend dependencies include `@clerk/fastify`.
- backend config requires `CLERK_SECRET_KEY`.

The core `clerk.md` still reads as a template-era installation guide and includes old environment/doc update instructions.

Impact:

- Clerk is a useful reference for how extensions should look after installation, but the doc has not been reconciled with that reality.
- It may need separate modes: "already generated with Clerk" versus "add Clerk to an existing base project."

## Per-Extension Problem Map

### `mongodb.md`

Problems:

- Points to `docs/env-vars.md`, which current generated projects do not have.
- Points to `deployment-runbook.md`, which belongs in deployment docs rather than core extension setup.
- Uses `helloworld` in the local database URL.
- Mentions `worker` in the env table even though worker is not part of the base generated project.

Likely action:

- Keep local Docker/Zap and app connection guidance.
- Replace env registry/runbook update instructions with current generated-project guidance.
- Move production secret/deployment notes into a deployment extension doc if needed.

### `clerk.md`

Problems:

- Says "template" rather than current generated project.
- Points to missing `docs/env-vars.md`.
- Points to deployment runbook from the core extension doc.
- Uses `bare_metal` Zap config, but current generated projects use `native`.
- Uses `@your-org/helloworld-*` package names.
- Needs reconciliation with the Clerk implementation already present in `coderadar`.

Likely action:

- Rewrite around current target paths and packages.
- Keep deployment secret handling separate.
- Use `coderadar` as the reference installed state.

### `clerk-rbac.md`

Problems:

- Mostly app-level and fairly clean.
- Contains a typo: "falls back to the local the application user profile role."
- Needs verification against the current backend auth context shape.

Likely action:

- Keep in core extensions.
- Tighten wording and link it to the current Clerk implementation pattern.

### `redis.md`

Problems:

- Mostly deployment-specific Upstash/Terraform content.
- Points to `../platform/env-vars.md` and `../platform/deployment-runbook.md`, neither matching current generated docs.
- Assumes Terraform path `infra/`.
- Assumes Redis is injected into Cloud Run and a worker by Terraform.
- This repo currently has no `redis.tf` or Upstash provider.

Likely action:

- Split into app/local Redis extension guidance and `extensions/redis-deploy.md` in this repo.
- Decide whether Upstash Terraform is an example, a supported deployment module, or stale material to remove.

### `s3.md`

Problems:

- Very long and apparently duplicated.
- Mixes LocalStack/app code guidance with AWS production Terraform/IAM.
- Points to missing `docs/env-vars.md`.
- Uses `helloworld-files`.
- Assumes `backend, worker` services.
- Assumes `infra/` Terraform path.

Likely action:

- Deduplicate.
- Keep LocalStack/app client guidance in core extension docs.
- Move AWS bucket/IAM/CORS production infrastructure into this repo under extension deployment docs.

### `bull.md`

Problems:

- Very long and heavily coupled to deployment.
- Assumes `packages/system`, absent from current generated projects.
- Assumes a worker app and package structure not generated by default.
- Includes GitHub Actions, GCE worker Terraform, Dockerfile, VM restart, and Redis/Upstash coupling.
- Uses old placeholder package names and direct deployment instructions.

Likely action:

- Split aggressively.
- Core extension should cover queue concepts, dependencies, app/package structure options, and local worker setup.
- Deployment-specific worker image, GCE/Cloud Run job/other worker hosting, Redis provisioning, and CI changes should move to `extensions/bull-deploy.md`.
- Rebase examples on `packages/server` or explain where a shared queue package should be added in the current monorepo.

### `playwright.md`

Problems:

- Mostly app/test-level, not deployment-specific.
- Uses old package names such as `@mp-lb/e2e-tests` and `@myorg/*`.
- Assumes worker service in the E2E stack.
- May assume MongoDB for reset/seed helpers.
- Needs alignment with current Zap syntax and generated package names.

Likely action:

- Keep as core extension.
- Generalize service examples and remove stale organization/project names.

### `custom-domains.md`

Problems:

- Entirely deployment-specific.
- Lives in core extensions.
- References `infra/terraform.tfvars` and `docs/platform/deployment-runbook.md`.
- Contains Map Lab, Cloudflare, Vercel, Cloud Run, and Search Console operational instructions.

Likely action:

- Move into this repo, probably as `docs/custom-domains.md` or `extensions/custom-domains-deploy.md`.
- Keep only a short pointer in the core docs if needed.

## Deployment Repo Problem Map

### `docs/deployment-setup.md`

Problems:

- Includes worker VM permissions and `compute.admin` in base setup.
- Includes Upstash repository secrets in base setup.
- References Redis provisioned via `../extensions/redis.md`, but this repo has no `extensions/` directory yet.
- Describes GitHub org/repo secrets as the central deployment path.

Likely action:

- Make base setup only cover GCP Cloud Run, Artifact Registry, Vercel, Cloudflare, state bucket, and minimum required secrets.
- Move worker and Upstash setup into extension deployment docs.

### `docs/deployment-runbook.md`

Problems:

- Hardcoded HelloWorld URLs.
- Lists `MONGODB_URL` as a Hello World secret.
- Includes Upstash/Redis secrets and Redis injection behavior despite no Redis Terraform in this repo.
- Links to missing `docs/env-vars.md`.

Likely action:

- Convert to base frontend/backend runbook with placeholders.
- Move MongoDB and Redis secret handling to extension deployment docs.

### `docs/terraform.md`

Problems:

- Says Terraform files live in `infra/`, but this repo uses `terraform/`.
- Describes worker VM and Upstash Redis that are not present.
- File tree includes `worker.tf` and `redis.tf`, absent from this repo.
- Build flow says backend + worker images.
- Debugging section includes worker VM commands.
- Links to `custom-domains.md`, but no such doc exists in this repo.

Likely action:

- Rewrite to match the actual base Terraform.
- Add separate extension deployment docs for Redis, Bull worker, S3, and custom domains.

### `terraform/*.tf`

Problems:

- `main.tf` hardcodes backend state prefix to `terraform/state/helloworld`.
- `terraform.tfvars` hardcodes `project_name = "helloworld"` and `github_repo = "mp-lb/helloworld"`.
- `github_repo` variable exists but does not appear to be used by current Terraform.
- Base Terraform has no direct support for current generated-project build artifacts; that lives in the workflow.
- Cloud Run domain mappings are used directly, with notes elsewhere warning this may not be ideal for stricter production needs.

Likely action:

- Decide whether Terraform files are examples, templates, or active deployable source.
- Remove unused variables or document their intended template substitution.
- Keep base Terraform focused on frontend/backend.

### `github-workflows/deploy.yml`

Problems:

- Hardcoded old project and package names.
- Uses `infra`, not `terraform`.
- Assumes generated projects contain Dockerfile, Vercel config, `.env.production`, and `env-map.yaml`.
- Does not match `coderadar` as generated today.

Likely action:

- Either update it into a current deployment workflow template or move it into docs as an example.
- Define the missing target-project deployment layer files if this workflow is still the intended path.

### `github-workflows/publish.yaml`

Problems:

- Disabled, but still hardcoded to old package scope `@mp-lb`, Node 18, pnpm 9.
- Unclear if package publishing belongs in deployment repo.

Likely action:

- Remove, archive as historical, or explicitly mark as not part of deployment migration.

## Dependency Problems Between Docs

### Redis And Bull Are Coupled But Live In The Wrong Layer

Bull needs Redis. Current Bull docs point users to Redis docs, and both then assume Upstash/Terraform/GitHub Actions. That coupling is real, but the deployment part should be expressed in this repo instead of in core extension docs.

Needed split:

- Core Bull doc: requires a Redis URL and explains local/development setup.
- Core Redis doc: explains local Redis and app access.
- Deployment Redis doc: explains managed Redis choices and default Upstash/Terraform path if supported.
- Deployment Bull doc: explains worker hosting and how Redis is wired in production.

### Environment Variable Management Has No Current Single Source

Old docs assume an env registry and deployment runbook. Current generated projects use `zap.yaml` with `env: "*"` and app-local Zod config, but there is no `docs/env-vars.md` or `env-map.yaml`.

Needed decision:

- Reintroduce an env registry in generated projects, or
- Rewrite extension docs to update app config files and deployment docs directly, or
- Keep env registry only in deployment-specific material.

### Deployment Templates Need A Target Project Layer

The deployment repo has Terraform and GitHub workflow snippets, but a generated project does not currently contain the supporting files the workflow needs.

Missing deployment-layer outputs include:

- backend Dockerfile
- frontend Vercel config, if needed
- `.env.production` convention
- `env-map.yaml` or replacement mechanism
- copied/adapted GitHub workflow path
- Terraform directory naming and state-prefix substitution

Needed decision:

- Is `fssstack-deployment` documentation-only, or should it provide files/layers that are installed into target projects?

## Suggested Priority Order

1. Decide the deployment repo structure, especially `extensions/<name>-deploy.md`.
2. Rewrite deployment repo docs to match current base Terraform and remove worker/Redis from the base path.
3. Extract `custom-domains.md` from core extensions into deployment docs.
4. Split Redis deployment guidance from Redis app/local guidance.
5. Split Bull deployment guidance from Bull app/local guidance.
6. Deduplicate and split S3.
7. Update Clerk, MongoDB, and Playwright docs to match current generated project paths and Zap syntax.
8. Decide the env variable story before finalizing extension docs.
9. Decide whether GitHub workflow files are active templates, examples, or historical artifacts.

