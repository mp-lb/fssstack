# Playwright Setup

This document explains how to set up Playwright E2E tests in the monorepo.

## Environment Variables

E2E tests run against a separate test stack with its own environment. These are typically defined in `.env.e2e` (gitignored) and don't need to be added to the main registry.

## Package Structure

Create `packages/e2e-tests/` with:

```
packages/e2e-tests/
├── helpers/
│   ├── auth.ts       # Test user login helpers
│   ├── config.ts     # URLs and env config
│   ├── dbReset.ts    # Database reset utilities
│   ├── seed.ts       # Test data seeding
│   ├── testUsers.ts  # Test user definitions
│   └── index.ts
├── tests/
│   └── *.spec.ts
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

### package.json

```json
{
  "name": "@mp-lb/e2e-tests",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@types/node": "^20.19.25",
    "mongodb": "^6.8.0"
  }
}
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from "@playwright/test";
import { config } from "./helpers/config";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: "html",
  timeout: 30000,
  expect: { timeout: 5000 },
  use: {
    baseURL: config.frontendUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 5000,
    navigationTimeout: 10000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: undefined,
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "@playwright/test"]
  },
  "include": ["**/*.ts"]
}
```

## Test Stack Architecture

E2E tests run against a completely separate stack with its own zap configuration, Docker services, and environment variables. This provides complete isolation from development.

### Separate Zap Configuration

Create `zap.e2e.yaml` as a dedicated config for the e2e stack:

```yaml
project: myproject-e2e
env_files: [.env.local, .env, .env.e2e]

native:
  backend:
    cmd: pnpm --filter=@myorg/backend dev
    env:
      - APP_ENV
      - BACKEND_PORT
      - DATABASE_URL
      # ... other env vars

  frontend:
    cmd: pnpm --filter=@myorg/frontend dev
    env:
      - APP_ENV
      - FRONTEND_PORT
      - VITE_API_BASE_URL
      # ... other env vars

  worker:
    cmd: pnpm --filter=@myorg/worker dev
    env:
      - APP_ENV
      - DATABASE_URL
      # ... other env vars

docker:
  mongodb:
    image: mongo:latest
    ports:
      - "6320:27017"
    env:
      - MONGO_INITDB_DATABASE=mydb-test
    volumes:
      - mongodb-e2e-data:/data/db
  
  # Add other Docker services your project needs
  # (cache, message queue, object storage, etc.)

tasks:
  e2e:
    env:
      - APP_ENV
      - DATABASE_URL
    cmds:
      - FRONTEND_URL=http://localhost:9775 BACKEND_URL=http://localhost:2821 DATABASE_URL="${DATABASE_URL}" pnpm --filter=@myorg/e2e-tests test {{REST}}
```

### Choosing Local Ports

To avoid port conflicts, choose unused local ports for your e2e services:

```bash
node -e 'console.log(1024 + Math.floor(Math.random() * 8976))'
```

Generate ports for your stack:

```bash
node -e 'console.log(1024 + Math.floor(Math.random() * 8976))'  # MongoDB
node -e 'console.log(1024 + Math.floor(Math.random() * 8976))'  # Frontend
node -e 'console.log(1024 + Math.floor(Math.random() * 8976))'  # Backend
# ... repeat for each service in your stack
```

### Environment File (.env.e2e)

Create `.env.e2e` to override base environment variables for e2e testing:

```bash
# E2E Test Environment Overrides
APP_ENV=test

# Ports
BACKEND_PORT=2821
FRONTEND_PORT=9775
VITE_API_BASE_URL=http://localhost:2821

# Database
DATABASE_URL=mongodb://localhost:6320/mydb-test?directConnection=true

# Add other service URLs as needed
```

This file is gitignored and loaded after `.env.local` and `.env`, allowing you to override any dev values for testing.

### Test Helper Configuration

Make environment variables required with strict validation:

```typescript
// helpers/config.ts
import { z } from "zod";

const envSchema = z.object({
  FRONTEND_URL: z.string(),
  BACKEND_URL: z.string(),
  DATABASE_URL: z.string(),
});

const env = envSchema.parse(process.env);

export const config = {
  frontendUrl: env.FRONTEND_URL,
  backendUrl: env.BACKEND_URL,
  databaseUrl: env.DATABASE_URL,
};
```

This eliminates misleading fallbacks and fails fast if configuration is wrong.

### Wrapper Script

Create `run-e2e-tests.sh` to manage the full test lifecycle:

```bash
#!/bin/bash
set -e

CONFIG_FILE="zap.e2e.yaml"
MAX_WAIT_TIME=60
POLL_INTERVAL=2

# Check if dev stack is running and shut it down
if zap status | grep -q "up"; then
  echo "⚠️  Dev stack is running. Shutting it down to avoid port conflicts..."
  zap down
  sleep 2
fi

echo "🧹 Ensuring clean state..."
zap --config "$CONFIG_FILE" down 2>/dev/null || true

echo "🚀 Starting E2E test stack..."
zap --config "$CONFIG_FILE" up

echo "⏳ Waiting for services to be ready..."
# Add service health checks here

echo "🧪 Running E2E tests..."
set +e
zap --config "$CONFIG_FILE" t e2e
TEST_EXIT_CODE=$?
set -e

echo "🛑 Shutting down E2E test stack..."
zap --config "$CONFIG_FILE" down

exit $TEST_EXIT_CODE
```

**Run with:**

```bash
./run-e2e-tests.sh
```

Or manage manually:

```bash
zap --config zap.e2e.yaml up
zap --config zap.e2e.yaml t e2e
zap --config zap.e2e.yaml down
```

### Benefits

- **Complete isolation**: Separate Docker services, no shared state
- **Random ports**: Minimizes conflicts with other services
- **Explicit configuration**: No hidden fallbacks or profile switching
- **CI-ready**: Wrapper script manages full lifecycle
- **Parallel capability**: Dev and e2e stacks can theoretically run simultaneously (though wrapper shuts down dev to be safe)

## Database Reset

Tests should reset and seed the database in `beforeAll`:

```typescript
test.beforeAll(async () => {
  await resetDatabase();
  await seedTestUser(TEST_USERS.alice);
});
```

## Multi-User Testing

Playwright supports multiple browser contexts for testing multi-user scenarios:

```typescript
const aliceContext = await browser.newContext();
const alicePage = await aliceContext.newPage();

const bobContext = await browser.newContext();
const bobPage = await bobContext.newPage();
```

Each context has isolated cookies, localStorage, and session state.

## Authentication Mocking

If your project uses third-party authentication (e.g., Auth0, Clerk, Firebase Auth), real authentication flows are problematic for E2E tests due to email verification, 2FA, and rate limiting. The recommended approach is to mock authentication entirely in non-production environments.

### Backend

Read a test user header in non-prod mode:

```typescript
const createContext = ({ req }: { req: Request }) => {
  let userId: string | undefined;
  
  if (process.env.APP_ENV === 'test') {
    userId = req.headers["x-test-user-id"] as string | undefined;
  }
  
  return { db, userId, /* ... other context */ };
};
```

### Frontend

Create wrapper hooks that return mock data in test mode:

```typescript
// lib/e2e-mocks/testMode.ts
export const getTestUserId = () => localStorage.getItem("x-test-user-id");
export const isTestMode = () => import.meta.env.DEV && !!getTestUserId();

// lib/e2e-mocks/useAppUser.ts
export const useAppUser = () => {
  const authResult = useAuth(); // Your real auth hook
  
  if (isTestMode()) {
    return { 
      isLoaded: true, 
      isSignedIn: true, 
      user: getTestUser() 
    };
  }
  
  return authResult;
};
```

Replace your real auth hook imports with `useAppUser` across the frontend.

Update your API client to include the test header:

```typescript
// Example for tRPC
httpBatchLink({
  url: `${baseUrl}/trpc`,
  headers: () => {
    const testUserId = getTestUserId();
    if (testUserId) return { "x-test-user-id": testUserId };
    return {};
  },
})

// Example for fetch
fetch(url, {
  headers: {
    ...otherHeaders,
    ...(getTestUserId() ? { "x-test-user-id": getTestUserId() } : {}),
  },
})
```

### Test Helper

```typescript
export async function loginAsTestUser(
  page: Page,
  user: TestUser,
  options?: { clearOnboarding?: boolean }
): Promise<void> {
  await page.addInitScript(
    ({ userId, clearOnboarding }) => {
      window.localStorage.setItem("x-test-user-id", userId);
      
      if (clearOnboarding) {
        window.localStorage.removeItem(`app:onboarding-complete:${userId}`);
      } else {
        window.localStorage.setItem(`app:onboarding-complete:${userId}`, "true");
      }
    },
    { userId: user.id, clearOnboarding: options?.clearOnboarding ?? false }
  );

  await page.route("**/*", async (route) => {
    const url = route.request().url();
    
    if (url.includes("/trpc") || url.includes("/files")) {
      const headers = {
        ...route.request().headers(),
        "x-test-user-id": user.id,
      };
      await route.continue({ headers });
    } else {
      await route.continue();
    }
  });
}
```

The frontend's API client reads from localStorage and includes the `x-test-user-id` header automatically in test mode. Route interception ensures the header is added to API requests. Database selection is handled by the separate test stack via `APP_ENV=test`.