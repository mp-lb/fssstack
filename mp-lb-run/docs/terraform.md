# Terraform

Terraform lives in `terraform/` in the target repo.

Setup copies Terraform templates and generates `terraform/terraform.tfvars` from `fssstack.json`.

## Base Resources

The base layer manages:

- Vercel projects and domains for frontends
- Cloud Run services and domains for backends
- Artifact Registry for backend images
- Cloudflare DNS records
- optional GCP budget alerts

Extension infrastructure is added by extension deployment docs.

## Variables

The important generated variables are:

- `frontends`
- `backends`
- `backend_images`
- `runtime_env_vars`

`frontends` and `backends` come from the manifest.

`backend_images` is generated during CI from built images.

`runtime_env_vars` is generated during CI by `@mp-lb/tools-env-mapper` from `.env.production`, decrypted `secrets.json`, and `deployment/apps.json`. Terraform reads only the service keys it needs for deployed backends; extra inventory entries such as workers are allowed for extension-specific deployment layers.

## State

The generated workflow runs:

```bash
terraform init \
  -backend-config="bucket=${GCP_PROJECT_ID}-terraform-state" \
  -backend-config="prefix=terraform/state/${PROJECT_NAME}"
```
