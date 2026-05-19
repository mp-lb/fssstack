# Deployment Setup

This repo installs one cloud deployment pattern for FSS Stack projects.

## Target Repo

Run:

```bash
dx read SETUP_PROCESS.md
```

The setup expects `fssstack.json` and generates deployment files from it.

## Cloud Accounts

Create or choose:

- Google Cloud project
- Vercel account/team
- Cloudflare zone
- Terraform state bucket in GCS

## CI Secrets

Set one GitHub Actions secret:

- `SECRETS_KEY`: Doctrine recipient secret used to decrypt `secrets.json.enc`

Deployment values belong in committed files:

- `.env.production` for non-secrets
- `secrets.json.enc` for encrypted secrets

Put non-secret identifiers such as `GCP_PROJECT_ID`, `GCP_REGION`, and `CLOUDFLARE_ACCOUNT_ID` in `.env.production`. Terraform derives the Cloudflare zone from the app domain.

Put sensitive provider credentials such as `GCP_SA_KEY`, `VERCEL_API_TOKEN`, and `CLOUDFLARE_API_TOKEN` in `secrets.json.enc`.

Prefer storing `GCP_SA_KEY` as the downloaded service-account JSON object inside `secrets.json.enc`. The generated workflow also accepts an existing base64-encoded JSON string.

For Terraform-provisioned Redis, put `UPSTASH_EMAIL` in `.env.production` and `UPSTASH_API_KEY` in `secrets.json.enc`. Optionally put `UPSTASH_REDIS_URL` in `secrets.json.enc` to use an existing Upstash Redis database.
