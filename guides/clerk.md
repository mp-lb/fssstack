# Clerk

Loose guide for setting up Clerk auth in MAP Lab apps. Clerk itself is the
source of truth. CLI output and pulled config files are for setup, review,
debugging, and promotion; do not maintain a parallel hand-authored auth config
unless we build a real sync tool.

## Decide First

- **Auth boundary** - is Clerk only responsible for sign-in/session handling, or
  should it own user-facing profile fields too?
- **Login methods** - usually email, password, and Google. Decide whether
  usernames are part of the product.
- **RBAC** - if the app has an admin surface, use the standard Clerk role claim.
- **App shape** - consumer, internal/admin, or B2B. B2B usually means
  organizations and more setup.
- **Profiles** - decide whether Clerk avatars/profile screens are useful, or
  whether the app owns profile data.
- **Production timing** - usually configure development first, then create or
  align production once the development setup is verified.

## Strong Default

For a basic or internal app:

1. Create the Clerk application.
2. Configure the development instance first.
3. Enable email, password, and Google sign-in.
4. Skip usernames unless the product needs them.
5. Let the app own profile data unless Clerk's profile features are clearly
   useful.
6. Add standard RBAC if there is an admin section.
7. Add the application auth guard before treating setup as done.
8. Create or align production after the development config is verified.

## CLI Baseline

Start with the health check:

```sh
clerk --version
clerk doctor --json
```

List existing apps before creating a new one:

```sh
clerk apps list --json
```

Create the app if needed:

```sh
clerk apps create "<App Name>" --json
```

Capture the app id from the output:

```sh
APP_ID="app_xxxxx"
```

Link the repo:

```sh
clerk link --app "$APP_ID"
```

Pull development env vars:

```sh
clerk env pull --app "$APP_ID" --instance dev --file .env.local
```

Review the result. Keep secret keys server-side. In FSS Stack projects,
`CLERK_SECRET_KEY` belongs in `.env`; publishable frontend keys may live in
`.env.local`. Vite frontends need a `VITE_`-prefixed publishable key, for
example `VITE_CLERK_PUBLISHABLE_KEY`.

## Application Guard

Do this as part of the initial Clerk setup, before building product behavior on
top of the app.

- If Clerk is configured, missing frontend Clerk env should fail loudly.
- Signed-out users should see the sign-in screen from every protected route, not
  a half-loaded app, a crash, or public product UI.
- Signed-in non-admin users should not see admin navigation.
- Signed-in non-admin users should not be able to visit admin routes directly.
- Backend admin endpoints must enforce the same admin check from verified Clerk
  claims. Frontend guards are for navigation and user experience only.

For route-based apps, use a protected-route wrapper around every product route
and keep `/sign-in`, `/sign-up`, and OAuth callback routes public. For simpler
apps, put the boundary at the app shell: render Clerk's sign-in page until
`isLoaded && isSignedIn`, then render the product shell.

Inspect config when needed:

```sh
clerk config pull \
  --app "$APP_ID" \
  --instance dev \
  --output /tmp/clerk-dev.config.json

clerk config schema \
  --app "$APP_ID" \
  --instance dev
```

Patch only after previewing:

```sh
clerk config patch \
  --app "$APP_ID" \
  --instance dev \
  --file clerk.patch.json \
  --dry-run

clerk config patch \
  --app "$APP_ID" \
  --instance dev \
  --file clerk.patch.json \
  --yes
```

The CLI also exposes the Platform API. Confirm endpoints before using them:

```sh
clerk api ls --platform instances
```

Instance creation is available through:

```sh
clerk api \
  --platform \
  "/platform/applications/$APP_ID/instances" \
  -d '<confirm payload from current Clerk schema>' \
  --dry-run
```

Do not bake the instance-create payload into a process until it has been
confirmed against the current CLI/schema.

## RBAC

Use this when the app has an admin surface.

Standard roles:

```text
user
admin
super_admin
```

Store the role in Clerk public metadata:

```json
{
  "role": "super_admin"
}
```

Add the role to the session token claim in Clerk:

```json
{
  "role": "{{user.public_metadata.role}}"
}
```

After the first admin user exists, assign the role:

```sh
clerk users list \
  --app "$APP_ID" \
  --instance dev \
  --email-address "you@example.com" \
  --json
```

```sh
USER_ID="user_xxxxx"
```

```sh
clerk api \
  --app "$APP_ID" \
  --instance dev \
  "/users/$USER_ID" \
  -X PATCH \
  -d '{"public_metadata":{"role":"super_admin"}}' \
  --dry-run

clerk api \
  --app "$APP_ID" \
  --instance dev \
  "/users/$USER_ID" \
  -X PATCH \
  -d '{"public_metadata":{"role":"super_admin"}}' \
  --yes
```

The backend should read the role from verified Clerk session claims and expose
app-owned auth fields to application code. Frontend role checks are for UI only.

## Optional Decisions

### Usernames

Turn on usernames only when the product needs public handles, memorable
identifiers, or username-based login. Otherwise email and OAuth are simpler.

### Clerk Profiles

Use Clerk profile/avatar features when they are enough for the product and save
real implementation work. Prefer app-owned profiles when the domain has its own
profile model, display rules, onboarding, moderation, or audit needs.

### Organizations

Use Clerk organizations for proper B2B apps: workspaces, team membership,
organization switching, organization roles, invitations, verified domains, and
enterprise login. Do not add organizations to a basic consumer or internal app
just because Clerk supports them.

### Production

Prefer configuring development first. Once development login and RBAC are known
good, create or align production and review the production instance separately.
Pulled config files are useful snapshots for comparison, but Clerk remains the
canonical state.
