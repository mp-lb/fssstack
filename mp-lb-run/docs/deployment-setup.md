# Deployment Setup

This repo installs one cloud deployment pattern for FSS Stack projects.

## Target Repo

Run:

```bash
dx --store mp-lb-run read SETUP_PROCESS.md
```

The setup expects `fssstack.json` and generates deployment files from it.

## Cloud Accounts

Create or choose:

- Google Cloud project
- Vercel account/team
- Cloudflare zone
- Terraform state bucket in GCS

## CI Secrets

Set only infrastructure/decryption secrets in CI:

- `GCP_PROJECT_ID`
- `GCP_SA_KEY`
- `VERCEL_API_TOKEN`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_ID`
- one secret used to decrypt `secrets.enc.json`

App values belong in committed files:

- `.env.production` for non-secrets
- `secrets.enc.json` for encrypted secrets
