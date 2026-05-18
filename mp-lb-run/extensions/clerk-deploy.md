# Clerk Deployment

Use this after installing the Clerk app extension.

## Clerk Dashboard

Add deployed frontend URLs to Clerk redirect settings.

Add backend API origins if the app uses them in Clerk-related flows.

## Environment

Add frontend public keys to `.env.production`:

```bash
VITE_CLERK_PUBLISHABLE_KEY=...
```

Add backend secrets to `secrets.enc.json`:

```json
{
  "CLERK_SECRET_KEY": "..."
}
```

Add those variable names to the relevant app `env` lists in `docs/fssstack-manifest.md`.

## Verify

Deploy and complete sign-in from each deployed frontend.

