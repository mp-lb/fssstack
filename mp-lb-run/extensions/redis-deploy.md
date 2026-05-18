# Redis Deployment

Use this after installing the Redis app extension.

## Add Cloud Redis

Create a managed Redis instance with the provider for this deployment.

For this deployment pattern, Upstash is the expected default.

## Environment

Add `REDIS_URL` to `secrets.enc.json`.

Add `REDIS_URL` to each backend or worker `env` list in `docs/fssstack-manifest.md`.

Rerun base setup if `terraform/terraform.tfvars` or `deployment/apps.json` needs regeneration.

## Verify

Deploy and check the app logs for a successful Redis connection.

