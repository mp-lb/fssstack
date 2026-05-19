# Clerk Deployment

Use this after installing the Clerk app extension.

## Environment

Ask the user to provide a `CLERK_PUBLISHABLE_KEY` and add it to `.env.production`

```bash
CLERK_PUBLISHABLE_KEY=...
VITE_CLERK_PUBLISHABLE_KEY=...
```

## For the user

Ask the user to add `CLERK_SECRET_KEY` to `secrets.json.enc`.
