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

- `SECRETS_KEY`: SOPS Age private key used to decrypt `secrets.enc.json`

Deployment values belong in committed files:

- `.env.production` for non-secrets
- `secrets.enc.json` for encrypted secrets

Put non-secret identifiers such as `GCP_PROJECT_ID`, `GCP_REGION`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_ZONE_ID` in `.env.production`.

Put sensitive provider credentials such as `GCP_SA_KEY`, `VERCEL_API_TOKEN`, and `CLOUDFLARE_API_TOKEN` in `secrets.enc.json`.

Prefer storing `GCP_SA_KEY` as the downloaded service-account JSON object inside `secrets.enc.json`. The generated workflow also accepts an existing base64-encoded JSON string.
