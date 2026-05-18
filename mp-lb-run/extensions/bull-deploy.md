# BullMQ Deployment

Use this after installing the BullMQ app extension.

## Requirements

BullMQ needs:

- cloud Redis
- one or more deployed worker processes

Read Redis deployment first:

```bash
dx --store fssstack-deployment read extensions/redis-deploy.md
```

## Worker Deployment

Add each worker app to `docs/fssstack-manifest.md` as a backend-style deployable service.

Give the worker:

- package name
- app path
- Dockerfile
- required env list
- no public domain unless it exposes HTTP

## Environment

Add `REDIS_URL` and worker-specific secrets to `secrets.enc.json`.

Add non-secret worker values to `.env.production`.

## Verify

Deploy and check worker logs for job processing.

