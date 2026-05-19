# Redis Deployment

Use this after installing the Redis app extension.

## Environment

Pick the backend that owns Redis-backed behavior, usually queues or cache, and set it in `terraform/terraform.tfvars`:

```hcl
redis_backend_name = "backend"
```

Terraform provisions one Upstash Redis database and injects `REDIS_URL` into that backend. Do not add `REDIS_URL` to `fssstack.json`, `.env.production`, or `secrets.json.enc`.

Rerun base setup if `terraform/terraform.tfvars` or `deployment/apps.json` needs regeneration.

Add `UPSTASH_EMAIL=hi@felixsebastian.dev` to `.env.production`.

Add `UPSTASH_API_KEY` to `secrets.json.enc`.

Optionally add `UPSTASH_REDIS_URL` to `secrets.json.enc` to use an existing Upstash Redis database instead of provisioning a new one.

The default deployment template intentionally supports one Redis owner. If a project truly needs another independent Redis-connected backend, duplicate the Redis Terraform resource and backend injection for that project.

## For the user

Ask the user which backend should receive Redis, then set `redis_backend_name` to that service name. Make sure `UPSTASH_API_KEY` is in `secrets.json.enc`. Do not put `REDIS_URL` in `secrets.json.enc`; Terraform injects it into Cloud Run.
