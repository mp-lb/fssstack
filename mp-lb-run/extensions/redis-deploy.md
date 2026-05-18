# Redis Deployment

Use this after installing the Redis app extension.

## Environment

Add `REDIS_URL` to each backend or worker `env` list in `fssstack.json`.

Rerun base setup if `terraform/terraform.tfvars` or `deployment/apps.json` needs regeneration.

Add `UPSTASH_EMAIL=hi@felixsebastian.dev` to .env.production

## For the user

Ask the user to make sure `REDIS_URL` is in `secrets.enc.json`.
