# Adding Clerk Authentication

This guide explains how to add Clerk authentication to the template.

## Environment Variables

This extension adds the following environment variables:

| Variable | Services | Secret | Notes |
|----------|----------|--------|-------|
| `VITE_CLERK_PUBLISHABLE_KEY` | frontend | No | Public key, safe in `.env.local` |
| `CLERK_SECRET_KEY` | backend | Yes | Must be in `.env` (gitignored) |

After adding this extension, update:
- [docs/env-vars.md](../env-vars.md) - Add to the registry table
- [deployment-runbook.md](../deployment-runbook.md) - Add `CLERK_SECRET_KEY` to secrets table

## 1. Create Clerk Application

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application (e.g., "HelloWorld")
3. Configure sign-in options (Google, email/password, etc.)
4. Copy your API keys from the dashboard

## 2. Environment Variables

Add the publishable key to `.env.local` (committed):

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Add the secret key to `.env` (gitignored):

```bash
CLERK_SECRET_KEY=sk_test_...
```

Update `zap.yaml` to pass the variables to your services:

```yaml
bare_metal:
  backend:
    env:
      - CLERK_SECRET_KEY
  frontend:
    env:
      - VITE_CLERK_PUBLISHABLE_KEY
```

## 3. Frontend Setup

### Install Dependencies

```bash
pnpm --filter=@your-org/helloworld-frontend add @clerk/react-router react-router react-router-dom
```

### Update main.tsx

Wrap your app with `BrowserRouter` and `ClerkProvider`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { ClerkProvider } from "@clerk/react-router";
import { App } from "./App";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </StrictMode>
);
```

### Create ProtectedRoute Component

Create `src/components/auth/ProtectedRoute.tsx`:

```tsx
import { useAuth } from "@clerk/react-router";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: Props) => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  return <>{children}</>;
};
```

### Create Auth Pages

Create `src/pages/Auth/SignIn.tsx`:

```tsx
import { SignIn as ClerkSignIn } from "@clerk/react-router";

export const SignIn = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-background">
    <ClerkSignIn
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
      forceRedirectUrl="/"
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "shadow-lg",
        },
      }}
    />
  </div>
);
```

Create `src/pages/Auth/SignUp.tsx`:

```tsx
import { SignUp as ClerkSignUp } from "@clerk/react-router";

export const SignUp = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-background">
    <ClerkSignUp
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      forceRedirectUrl="/"
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "shadow-lg",
        },
      }}
    />
  </div>
);
```

Create `src/pages/Auth/SSOCallback.tsx`:

```tsx
import { AuthenticateWithRedirectCallback } from "@clerk/react-router";

export const SSOCallback = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
    <AuthenticateWithRedirectCallback />
  </div>
);
```

### Update App.tsx with Routes

```tsx
import { Routes, Route, Navigate } from "react-router";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SignIn } from "./pages/Auth/SignIn";
import { SignUp } from "./pages/Auth/SignUp";
import { SSOCallback } from "./pages/Auth/SSOCallback";
import { HelloWorld } from "./pages/HelloWorld";

export const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/hello" replace />} />
    <Route
      path="/hello"
      element={
        <ProtectedRoute>
          <HelloWorld />
        </ProtectedRoute>
      }
    />
    <Route path="/sign-in/*" element={<SignIn />} />
    <Route path="/sign-up/*" element={<SignUp />} />
    <Route path="/sso-callback" element={<SSOCallback />} />
  </Routes>
);
```

### Using the User in Components

Access the current user with Clerk hooks:

```tsx
import { useUser, UserButton } from "@clerk/react-router";

export const Header = () => {
  const { user } = useUser();

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <h1>HelloWorld</h1>
      <div className="flex items-center gap-2">
        <span>{user?.firstName || user?.username}</span>
        <UserButton />
      </div>
    </header>
  );
};
```

## 4. Backend Setup (Optional)

If you need to verify Clerk tokens on the backend:

### Install Dependencies

```bash
pnpm --filter=@your-org/helloworld-backend add @clerk/fastify
```

### Verify Tokens

```typescript
import { clerkPlugin, getAuth } from "@clerk/fastify";
import { env } from "./config";

// Register the Clerk plugin
await app.register(clerkPlugin, {
  secretKey: env.CLERK_SECRET_KEY,
});

// In a route handler
app.get("/api/protected", async (request, reply) => {
  const { userId } = getAuth(request);
  
  if (!userId) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  
  return { message: `Hello, user ${userId}` };
});
```

### WebSocket Authentication

For WebSocket connections, pass the Clerk session token:

Frontend:
```typescript
import { useAuth } from "@clerk/react-router";

const { getToken } = useAuth();
const token = await getToken();
const ws = new WebSocket(`${wsUrl}?token=${token}`);
```

Backend:
```typescript
import { verifyToken } from "@clerk/backend";

app.get("/ws", { websocket: true }, async (socket, req) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const token = url.searchParams.get("token");
  
  if (!token) {
    socket.close(4001, "Missing token");
    return;
  }
  
  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });
    const userId = payload.sub;
    // ... handle connection with userId
  } catch {
    socket.close(4002, "Invalid token");
  }
});
```

## 5. File Structure

After setup, your auth-related files should look like:

```
src/
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx
├── pages/
│   └── Auth/
│       ├── SignIn.tsx
│       ├── SignUp.tsx
│       └── SSOCallback.tsx
├── App.tsx
└── main.tsx
```

## 6. Clerk Dashboard Configuration

In the Clerk dashboard, configure:

1. **Allowed redirect URLs**: Add `http://localhost:5173` for development
2. **Sign-in/Sign-up options**: Enable the methods you want (Google, email, etc.)
3. **Session settings**: Configure token lifetime as needed

