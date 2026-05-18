# fssstack-deployment Setup

Run this from a generated FSS Stack target repo.

## Preconditions

The target repo must have:

- `docs/fssstack-manifest.md`
- frontend and backend apps already working locally
- production values ready for `.env.production`
- encrypted secrets ready for `secrets.enc.json`

## Manifest

`docs/fssstack-manifest.md` must include a fenced deployment JSON block:

```json deployment
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
dx --store fssstack-deployment read scripts/install-deployment.mjs | node --input-type=module - -- "$PWD"
```

Use `--force` to overwrite generated deployment files:

```bash
dx --store fssstack-deployment read scripts/install-deployment.mjs | node --input-type=module - -- "$PWD" --force
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

Fill `secrets.enc.json` with encrypted secret values using the project encryption tool.

## Deploy

Set CI secrets for infrastructure access:

- `GCP_PROJECT_ID`
- `GCP_SA_KEY`
- `VERCEL_API_TOKEN`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_ID`
- one project-specific secret used to decrypt `secrets.enc.json`

Push to the deployment branch or run the generated workflow manually.

