# BullMQ Deployment

Use this after installing the BullMQ app extension.

## Requirements

Read Redis deployment first:

```bash
dx read extensions/redis-deploy.md
```

## Worker Deployment

Add each worker app to `fssstack.json` as a backend-style deployable service.

Give the worker:
- package name
- app path
- Dockerfile
- required env list
- no public domain unless it exposes HTTP

## For the user

Ask the user to make sure the Redis deployment setup is complete and `redis_backend_name` points to the backend or worker that owns BullMQ. Do not put `REDIS_URL` in `secrets.json.enc`; Terraform injects it into Cloud Run.
