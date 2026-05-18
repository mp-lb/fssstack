# mp-lb-run Setup

Run this from a generated FSS Stack target repo.

## Preconditions

The target repo must have:

- `fssstack.json`
- frontend and backend apps already working locally
- production values ready for `.env.production`
- encrypted secrets ready for `secrets.enc.json`

## Manifest

`fssstack.json` must list the deployable apps:

```json
{
  "projectName": "my-project",
  "domain": "example.com",
  "gcpRegion": "asia-southeast1",
  "frontends": [
    {
      "name": "frontend",
      "path": "apps/frontend",
      "package": "@scope/my-project-frontend",
      "domain": "my-project.example.com",
      "buildCommand": "pnpm --filter=@scope/my-project-frontend build",
      "outputDirectory": "apps/frontend/dist"
    }
  ],
  "backends": [
    {
      "name": "backend",
      "path": "apps/backend",
      "package": "@scope/my-project-backend",
      "domain": "api.my-project.example.com",
      "port": 8080,
      "env": ["APP_ENV", "FRONTEND_URLS"]
    }
  ]
}
```

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
- `secrets.enc.json`

Fill `.env.production` with non-secret production values.

Fill `secrets.enc.json` with encrypted secret values. The generated workflow expects SOPS with an Age key stored in the GitHub repository secret `SECRETS_KEY`.

## Deploy

Set one CI secret:

- `SECRETS_KEY`

Store non-secret deployment identifiers in `.env.production`:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ZONE_ID`

Store sensitive deployment tokens in `secrets.enc.json`:

- `GCP_SA_KEY`
- `VERCEL_API_TOKEN`
- `CLOUDFLARE_API_TOKEN`

`GCP_SA_KEY` may be the downloaded Google service-account JSON object directly. The workflow also accepts the older base64-encoded JSON string during migration.

Push to the deployment branch or run the generated workflow manually.
