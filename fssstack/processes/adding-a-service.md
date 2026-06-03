# Adding a Service

Use this process when a project needs a new local service: a frontend, backend,
worker, docs app, or local container.

## 1. Create the app or package

Create the app or package under the normal workspace location:

- `apps/<service-slug>` for runnable services.
- `packages/<package-slug>` for shared code or libraries.

Name packages with the project scope and service slug. Keep `dev`, `start`, and
`build` scripts only when the service actually needs them.

## 2. Add Zapper wiring

Add a port variable to `zap.yaml` when the service listens on a port.

```yaml
ports:
  - MY_SERVICE_PORT
```

Add a native or docker service entry.

```yaml
native:
  my-service:
    cmd: pnpm --filter=@scope/project-my-service dev
    env: "*"
```

```yaml
docker:
  my-database:
    image: postgres:16
    ports:
      - "${MY_DATABASE_PORT}:5432"
```

The service must read the Zapper-provided port from the environment. Do not rely
on framework default ports.

## 3. Add environment variables

Add local non-secret values to `.env.local`.

Add local secrets to `.env`.

If the service is deployed, add production non-secrets to `.env.production` and
production secrets to the encrypted secrets file used by the project.

## 4. Validate locally

Start the service with Zapper.

```bash
zap up my-service
```

Check logs and the service health or UI.

```bash
zap logs my-service --no-follow
```

Run the relevant project checks through Zapper tasks.

## 5. Handle deployment separately

If the service deploys, use the project's deployment adapter documentation.

For the MAP Lab `mp-lb-run` deployment pattern, read:

```bash
dx --store mp-lb-run read SETUP_PROCESS.md
```
