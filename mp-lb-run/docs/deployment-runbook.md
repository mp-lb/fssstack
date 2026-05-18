# Deployment Runbook

## Deploy

Push to the configured deployment branch or run the generated GitHub Actions workflow manually.

## Verify

After deployment:

- each frontend URL loads
- each backend URL responds at `/health`
- `terraform output` shows expected frontend and backend URLs
- Vercel domains are valid
- Cloud Run services are serving the latest revision

## Environment

Production values are committed:

- `.env.production` for non-secrets
- `secrets.enc.json` for encrypted secrets

CI needs one secret to decrypt `secrets.enc.json`.

## Troubleshooting

- If Terraform cannot write DNS, check `CLOUDFLARE_ZONE_ID` and token permissions.
- If a backend does not start, check Cloud Run logs.
- If a frontend deploy fails, check the app build command and Vercel project.
- If env values are missing, check `.env.production`, decrypted `secrets.json`, and `deployment/apps.json`.

