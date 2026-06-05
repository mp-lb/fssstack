# mp-lb-run Setup

Run this from a generated FSS Stack target repo.

## Preconditions

The target repo must have:

- `fssstack.json`
- frontend and backend apps already working locally
- production values ready for `.env.production`
- encrypted secrets ready for `secrets.json.enc`

## Manifest

`fssstack.json` must list the deployable services:

```json
{
  "projectSlug": "my-project",
  "customDomain": null,
  "gcpRegion": "asia-southeast1",
  "services": [
    {
      "type": "landing-page",
      "subdomain": null,
      "path": "apps/landing-page",
      "package": "@scope/my-project-landing-page",
      "buildCommand": "pnpm --filter=@scope/my-project-landing-page build",
      "outputDirectory": "apps/landing-page/dist"
    },
    {
      "type": "frontend",
      "subdomain": "app",
      "path": "apps/frontend",
      "package": "@scope/my-project-frontend",
      "buildCommand": "pnpm --filter=@scope/my-project-frontend build",
      "outputDirectory": "apps/frontend/dist"
    },
    {
      "type": "backend",
      "subdomain": "api",
      "path": "apps/backend",
      "package": "@scope/my-project-backend",
      "port": 8080,
      "env": ["APP_ENV", "FRONTEND_URLS"]
    },
    {
      "type": "worker",
      "name": "worker",
      "path": "apps/worker",
      "package": "@scope/my-project-worker",
      "env": ["APP_ENV", "QUEUE_NAME"]
    }
  ]
}
```

Services deploy under the resolved root domain. When `customDomain` is `null`, the root domain is `<projectSlug>.mp-lb.dev`, such as `my-project.mp-lb.dev`. When `customDomain` is a string, it is the root domain, such as `example.com`.

A `null` service subdomain maps to the root domain. A string subdomain maps under the root domain, such as `app.my-project.mp-lb.dev` or `api.my-project.mp-lb.dev`.

Setup validates the root domain, DNS zone domain, service names, subdomains, and resolved domains for uniqueness before writing Terraform files. Legacy `projectName`, `domain`, `baseDomain`, `frontends`, and `backends` fields are still accepted, but new configs should use `projectSlug`, `customDomain`, and `services`.

`env` arrays are the service runtime environment inventory. They list variable names, not values. Setup renders the canonical deployment inventory to `deployment/apps.json`, preserving frontend, backend, worker, landing-page, and docs-site entries where they apply. Do not add a long-lived `env-map.yaml`; if a simple env map is needed for tool compatibility, generate it from `deployment/apps.json`.

## Install

Apply the deployment layer:

```bash
dx read scripts/install-deployment.mjs | node --input-type=module - -- "$PWD"
```

Use `--force` to overwrite generated deployment files:

```bash
dx read scripts/install-deployment.mjs | node --input-type=module - -- "$PWD" --force
```

## Review

Review generated files:

- `terraform/`
- `.github/workflows/deploy.yml`
- `deployment/apps.json`
- `scripts/load-deployment-env.mjs`
- backend `Dockerfile` files
- `.env.production`
- `secrets.json.enc`

Fill `.env.production` with non-secret production values.

Fill `secrets.json.enc` with Doctrine-encrypted secret values. The generated workflow expects the Doctrine recipient secret stored in the GitHub repository secret `SECRETS_KEY`.

Review `deployment/apps.json` as the canonical deployment inventory. Its `deploymentEnv` array names required provider/CI values needed by the deployment workflow, while each service `env` array names runtime values for that service. Add extension-specific provider keys to `deploymentEnv` only when the workflow must require and export them. `@mp-lb/tools-env-mapper` owns merging `.env.production` with decrypted `secrets.json`, masking secret values, normalizing `GCP_SA_KEY`, writing GitHub env values, and rendering Terraform runtime env vars. `mp-lb-run` owns the generated inventory, templates, Terraform shape, and workflow composition.

## Deploy

Set one CI secret:

- `SECRETS_KEY`

Store non-secret deployment identifiers in `.env.production`:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `CLOUDFLARE_ACCOUNT_ID`
- `UPSTASH_EMAIL` when Redis is provisioned by Terraform

Store sensitive deployment tokens in `secrets.json.enc`:

- `GCP_SA_KEY`
- `VERCEL_API_TOKEN`
- `CLOUDFLARE_API_TOKEN`
- `UPSTASH_API_KEY` when Redis is provisioned by Terraform
- `UPSTASH_REDIS_URL` optionally, to use an existing Upstash Redis database instead of provisioning one

`GCP_SA_KEY` may be the downloaded Google service-account JSON object directly. The workflow also accepts the older base64-encoded JSON string during migration.

The generated workflow decrypts `secrets.json.enc` with `SECRETS_KEY`, loads deployment env through a thin mapper wrapper, then runs:

```bash
node scripts/load-deployment-env.mjs tfvars
```

Push to the deployment branch or run the generated workflow manually.
