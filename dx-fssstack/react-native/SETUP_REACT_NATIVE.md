# React Native Mobile Setup

Use this when the web/backend app already exists and the mobile app should live in a separate repo. The normal shape is:

- Main FSS repo owns backend, web, database, jobs, and release of the API contract.
- Mobile repo is a standalone Expo app, usually npm-based, not inside the pnpm monorepo.
- Mobile consumes a published internal package for the backend tRPC router/client types.
- Mobile usually trails web. Ship a dummy app to store review early, then replace screens as web flows stabilize.

## 1. Prepare the backend repo

1. Make the tRPC/API package publishable. In the shell this is the package shaped like `packages/trpc`.
2. Export only mobile-safe types and client helpers. Do not export server-only code, env loading, database clients, or Node-only utilities.
3. Publish the package to the private registry:

```bash
pnpm -C <main-repo> --filter <trpc-package> build
pnpm -C <main-repo> changeset
pnpm -C <main-repo> version-packages
pnpm -C <main-repo> release
```

4. Create a read-only package token for the mobile repo. Store it as `NODE_AUTH_TOKEN` locally, in GitHub Actions, and in EAS environment variables/secrets.
5. Confirm the backend has stable public URLs for mobile:

```text
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
EXPO_PUBLIC_APP_ENV=production
```

If Clerk/OAuth/push are used, the backend also needs native redirect URLs and push token endpoints before mobile can be complete.

## 2. Create the mobile repo

```bash
npx create-expo-app@latest <app-mobile> --template tabs@latest
cd <app-mobile>
npm install
npx expo install expo-dev-client expo-updates expo-secure-store expo-web-browser expo-auth-session
npx expo install expo-notifications expo-device expo-constants expo-linking
npm install @tanstack/react-query @trpc/client @trpc/react-query superjson
npm install <published-trpc-package>
```

Use Expo Router unless the project has a strong reason not to:

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens react-native-gesture-handler
```

Keep this repo out of pnpm workspaces unless there is a specific React Native expert owning the dependency/debugging cost.

## 3. Configure package auth

Add `.npmrc` using the snippet in `snippets/npmrc.example`.

Rules:

- Never commit a literal token.
- Use `NODE_AUTH_TOKEN` locally and in CI/EAS.
- Prefer `npm ci` in the mobile repo for reproducible installs.

Local install:

```bash
export NODE_AUTH_TOKEN=<github-or-registry-read-token>
npm ci
```

## 4. Configure Expo

Start from `snippets/eas.json` and `snippets/app.json`, or convert the app config to `app.config.ts` if the project needs computed values.

- `expo.name`, `slug`, `scheme`
- `expo.owner`
- `expo.version`
- `ios.bundleIdentifier`
- `ios.config.usesNonExemptEncryption`
- `android.package`
- `runtimeVersion: "fingerprint"`
- `updates.url` after `eas init`
- `extra.eas.projectId` after `eas init`
- icons, splash assets, and Android adaptive icon assets

Run:

```bash
npm install -g eas-cli
eas login
eas init
eas build:configure
```

For Expo prebuild / Continuous Native Generation, treat native folders as generated unless the project intentionally needs custom native edits:

```gitignore
/ios
/android
.expo/
dist/
*.jks
*.p8
*.p12
*.mobileprovision
```

Local native runs:

```bash
npx expo prebuild --clean
npx expo run:ios
npx expo run:android
```

Use a development build for real testing:

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
npx expo start --dev-client
```

Expo Go is only for quick UI checks. It will not cover native modules, push notifications, many auth flows, or the real app binary.

## 5. Mac setup

Install:

- Xcode from the App Store
- Xcode command line tools: `xcode-select --install`
- Watchman: `brew install watchman`
- Node matching `eas.json`
- EAS CLI: `npm install -g eas-cli`
- Android Studio if Android local runs are required

Then:

```bash
sudo xcodebuild -license accept
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
npx expo-doctor
```

In Xcode, sign in to the Apple Developer account under Settings -&gt; Accounts. EAS can manage most credentials remotely, but local `expo run:ios` often still needs Xcode account/team setup.

## 6. Auth and deep links

For Clerk:

1. Install `@clerk/clerk-expo` and `expo-secure-store`.
2. Store the publishable key as `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
3. Use SecureStore for Clerk token cache.
4. Add the native scheme to `app.json`.
5. Configure Clerk allowed redirect URLs for:

```text
<scheme>://oauth-native-callback
exp://*
```

Use `Linking.createURL("/oauth-native-callback")` for native OAuth redirects.

## 7. Push notifications

Install:

```bash
npx expo install expo-notifications expo-device expo-constants
```

Configure `expo-notifications` in `app.json`, then:

1. Create a Firebase project for Android.
2. Add the Android app with the exact `android.package`.
3. Download `google-services.json` into the repo root.
4. Reference it with `android.googleServicesFile`.
5. Create or upload FCM credentials in Expo/EAS.
6. Add backend endpoints to register/remove Expo push tokens by user/device.
7. Test on a physical device. Simulators are not enough for push.

Recommended backend API shape:

```ts
pushTokens.register({ token, platform: "ios" | "android" })
pushTokens.remove({ token })
```

Store tokens uniquely across users, remove on logout, and include route data in notification payloads so taps can navigate to the right screen.

## 8. Store setup early

Do this before the real mobile build is finished.

Apple:

1. Create bundle ID in Apple Developer.
2. Create the app in App Store Connect.
3. Fill privacy, encryption, support URL, screenshots placeholder, age rating, and review contact.
4. Create App Store Connect API key with App Manager access.
5. Add `ascAppId` to `eas.json`.

Google:

1. Create the app in Play Console.
2. Complete app content, data safety, target audience, ads, privacy policy, and testing setup.
3. Create a Google Cloud service account.
4. Grant it Play Console permissions for the app.
5. Upload the service account JSON to EAS submit credentials.

Dummy app strategy:

- Submit a simple authenticated shell or placeholder app as soon as bundle IDs, icons, privacy policy, and store metadata exist.
- Use internal/closed testing on Google Play early; review and tester approval can be the slowest part.
- Keep the dummy app honest: no fake claims, no broken login, no inaccessible core screen.

## 9. CI/CD

Copy:

- `snippets/.github/workflows/ci.yml`
- `snippets/.github/workflows/cd.yml`
- `snippets/.github/workflows/test-eas-connection.yml`

GitHub secrets:

```text
EXPO_TOKEN
NODE_AUTH_TOKEN
```

EAS environment variables/secrets:

```text
NODE_AUTH_TOKEN
EXPO_PUBLIC_APP_ENV
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
```

If EAS Submit credentials are not stored in Expo, also add:

```text
APP_STORE_CONNECT_API_KEY_ID
APP_STORE_CONNECT_ISSUER_ID
APP_STORE_CONNECT_API_KEY_BASE64
GOOGLE_SERVICE_ACCOUNT_KEY_BASE64
```

Create an Expo token:

```bash
eas whoami
# Expo dashboard -> account settings -> access tokens
```

Base64 encode local credential files when needed:

```bash
base64 -i AuthKey_XXXXXXXXXX.p8 | tr -d '\n'
base64 -i google-service-account.json | tr -d '\n'
```

The CD workflow first tries an OTA update to the production channel. If the runtime changed or no compatible build exists, it creates store builds and auto-submits them.

## 10. Release workflow

Development:

```bash
export NODE_AUTH_TOKEN=<token>
npm ci
npx expo start --dev-client
```

Build internal development apps:

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

Publish JS-only change:

```bash
eas update --channel production --message "Short release note"
```

Build and submit store binaries:

```bash
eas build --profile production --platform all --auto-submit
```

Validate before merging:

```bash
npm run lint
npx tsc --noEmit
npx expo-doctor
```

## 11. Done checklist

- Mobile repo created with Expo Router and development client.
- Private API package installs with `NODE_AUTH_TOKEN`.
- `app.json` has stable scheme, bundle ID, Android package, EAS project ID, and update URL.
- Local iOS run works on simulator.
- Local Android run works if Android is in scope.
- Development EAS builds install on real devices.
- Clerk/OAuth redirects return to the app.
- Push tokens register on the backend from real devices.
- Store records exist before feature work is complete.
- CI runs lint and typecheck on PRs.
- CD can publish OTA updates.
- Production EAS builds submit to TestFlight and Play Console.

