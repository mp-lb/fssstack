import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fail, getScriptArgs } from "./lib/args";
import { portEnvName, validateServiceName } from "./lib/services";

// Augments a vanilla `npm create fumadocs-app --template react-router` app into
// our house style. It is generate-then-wire (not a layer): Fumadocs owns the
// scaffold; this script only patches the wiring we standardise —
//   1. dev/start read the Zapper-injected port (`${<SLUG>_PORT}`),
//   2. tsconfig extends our shared frontend base (`etc/tsconfig.frontend.json`),
//   3. the `serve` dep + a `serve.json` exist so `start` works (static serving
//      of the prerendered build),
//   4. dependency ranges are pinned (matching the other layers).
// ESLint needs nothing app-local: the repo's root flat config already globs
// `apps/**`, so the docs app is covered once its tsconfig is in place.

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, unknown>;
  devDependencies?: Record<string, unknown>;
  [key: string]: unknown;
};

const stripRange = (value: unknown) =>
  typeof value === "string" ? value.replace(/^[~^]/, "") : value;

// The shared frontend base is a thin re-export of the published preset, never an
// inline copy — see @mp-lb/fssstack-config/tsconfig/frontend.json.
const FRONTEND_TSCONFIG = {
  extends: "@mp-lb/fssstack-config/tsconfig/frontend.json",
};

const args = getScriptArgs();

if (args.length < 1 || args.length > 2) {
  fail("usage: augment-docs-site.mjs /path/to/target-project [docs-client]");
}

const targetRoot = args[0]!;
const docsClient = args[1] ?? "docs";

validateServiceName(docsClient);

const docsRoot = join(targetRoot, "apps", docsClient);
const portEnv = portEnvName(docsClient);

if (!existsSync(docsRoot)) {
  fail(`docs app not found at ${docsRoot}; scaffold it with create-fumadocs-app first`);
}

// 1. Scripts — dev/start honour the Zapper-injected port (with a local fallback).
const packageJsonPath = join(docsRoot, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;

packageJson.scripts = {
  ...packageJson.scripts,
  dev: `react-router dev --host 0.0.0.0 --port \${${portEnv}:-4315}`,
  build: "react-router build",
  start: `serve ./build/client --config serve.json -l \${${portEnv}:-4315}`,
  typecheck: "react-router typegen && fumadocs-mdx && tsc --noEmit",
  postinstall: "fumadocs-mdx",
};

// `start` serves the prerendered build statically, so the `serve` tool has to be
// a dependency (the scaffold doesn't include it).
packageJson.devDependencies = {
  ...packageJson.devDependencies,
  serve: "14.2.6",
};

for (const dependencySet of [packageJson.dependencies, packageJson.devDependencies]) {
  if (!dependencySet) continue;
  for (const [name, version] of Object.entries(dependencySet)) {
    dependencySet[name] = stripRange(version);
  }
}

writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

// 2. tsconfig — extend the shared frontend base, keep only framework-specific
//    options. Ensure the shared base exists so the extend resolves.
const sharedTsconfigPath = join(targetRoot, "etc", "tsconfig.frontend.json");
if (!existsSync(sharedTsconfigPath)) {
  mkdirSync(dirname(sharedTsconfigPath), { recursive: true });
  writeFileSync(sharedTsconfigPath, `${JSON.stringify(FRONTEND_TSCONFIG, null, 2)}\n`);
}

const tsconfig = {
  extends: "../../etc/tsconfig.frontend.json",
  include: ["**/*", "**/.server/**/*", "**/.client/**/*", ".react-router/types/**/*"],
  compilerOptions: {
    types: ["node", "vite/client"],
    rootDirs: [".", "./.react-router/types"],
    paths: {
      "@/*": ["./app/*"],
      "collections/*": ["./.source/*"],
    },
  },
};

writeFileSync(
  join(docsRoot, "tsconfig.json"),
  `${JSON.stringify(tsconfig, null, 2)}\n`,
);

// 3. serve.json — `start` runs `serve ./build/client --config serve.json`; the
//    prerendered React Router build needs the SPA fallback for client routes.
const serveConfig = {
  rewrites: [{ source: "/**", destination: "/__spa-fallback.html" }],
};

writeFileSync(
  join(docsRoot, "serve.json"),
  `${JSON.stringify(serveConfig, null, 2)}\n`,
);
