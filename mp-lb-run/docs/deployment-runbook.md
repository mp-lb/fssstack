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
- `secrets.json.enc` for encrypted secrets
- `deployment/apps.json` for deployment and service env needs

CI needs one GitHub secret, `SECRETS_KEY`, to decrypt `secrets.json.enc`.

CI uses `@mp-lb/tools-env-mapper` after decryption. The mapper owns parsing/rendering, secret masking, GitHub env output, `GCP_SA_KEY` normalization, and Terraform runtime env output. `mp-lb-run` owns the inventory shape and workflow steps around it.

## Troubleshooting

- If Terraform cannot write DNS, check `CLOUDFLARE_ACCOUNT_ID` in `.env.production`, `CLOUDFLARE_API_TOKEN` in decrypted `secrets.json`, and that the account contains the app domain's active Cloudflare zone.
- If Redis creation fails, check `UPSTASH_EMAIL` in `.env.production` and `UPSTASH_API_KEY` in decrypted `secrets.json`.
- If a backend does not start, check Cloud Run logs.
- If a frontend deploy fails, check the app build command and Vercel project.
- If env values are missing, check `.env.production`, decrypted `secrets.json`, and the `deploymentEnv` or service `env` arrays in `deployment/apps.json`.
