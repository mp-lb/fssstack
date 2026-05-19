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
  "projectName": "my-project",
  "baseDomain": "mp-lb.dev",
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
    }
  ]
}
```

Services deploy under `<projectName>.<baseDomain>`. A `null` subdomain maps to the project root domain, such as `my-project.mp-lb.dev`. A string subdomain maps under the project domain, such as `app.my-project.mp-lb.dev` or `api.my-project.mp-lb.dev`.

Setup validates service names, subdomains, and resolved domains for uniqueness before writing Terraform files. Legacy `frontends` and `backends` arrays are still accepted, and legacy `maplab.dev` domain values are migrated to `mp-lb.dev` during setup.

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
- `scripts/build-runtime-tfvars.mjs`
- backend `Dockerfile` files
- `.env.production`
- `secrets.json.enc`

Fill `.env.production` with non-secret production values.

Fill `secrets.json.enc` with Doctrine-encrypted secret values. The generated workflow expects the Doctrine recipient secret stored in the GitHub repository secret `SECRETS_KEY`.

## Deploy

Set one CI secret:

- `SECRETS_KEY`

Store non-secret deployment identifiers in `.env.production`:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ZONE_ID`
- `UPSTASH_EMAIL` when Redis is provisioned by Terraform

Store sensitive deployment tokens in `secrets.json.enc`:

- `GCP_SA_KEY`
- `VERCEL_API_TOKEN`
- `CLOUDFLARE_API_TOKEN`
- `UPSTASH_API_KEY` when Redis is provisioned by Terraform
- `UPSTASH_REDIS_URL` optionally, to use an existing Upstash Redis database instead of provisioning one

`GCP_SA_KEY` may be the downloaded Google service-account JSON object directly. The workflow also accepts the older base64-encoded JSON string during migration.

Push to the deployment branch or run the generated workflow manually.
