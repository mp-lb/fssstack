#!/usr/bin/env node

// scripts-src/flatpack-docs/lib/args.ts
var getScriptArgs = () => {
  const args2 = process.argv.slice(2);
  return args2[0] === "--" ? args2.slice(1) : args2;
};
var fail = (message) => {
  console.error(message);
  process.exit(1);
};

// scripts-src/flatpack-docs/lib/vite.ts
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
var patchViteLayer = (targetRoot2, frontendClient2, clientPortEnv2) => {
  const frontendRoot = join(targetRoot2, "apps", frontendClient2);
  const packageJsonPath = join(frontendRoot, "package.json");
  const mainPath = join(frontendRoot, "src", "main.tsx");
  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, "utf8")
  );
  packageJson.scripts = {
    ...packageJson.scripts,
    dev: `vite --host 0.0.0.0 --port \${${clientPortEnv2}:-5173} --strictPort`,
    build: "tsc --project tsconfig.app.json && vite build",
    typecheck: "tsc --project tsconfig.app.json --noEmit",
    test: "vitest run",
    "test:watch": "vitest"
  };
  packageJson.dependencies = {
    ...packageJson.dependencies,
    "__PACKAGE_PREFIX__-trpc": "workspace:*",
    "@tanstack/react-query": "5.90.12",
    "@trpc/client": "11.7.1",
    "@trpc/react-query": "11.7.1",
    superjson: "2.2.6",
    zod: "4.4.1"
  };
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    "@testing-library/jest-dom": "6.9.1",
    "@testing-library/react": "16.3.2",
    "@types/node": "24.12.0",
    vite: "7.3.3"
  };
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}
`);
  if (!existsSync(mainPath)) return;
  const main = readFileSync(mainPath, "utf8").replace(
    /import\s+App\s+from\s+["']\.\/App(?:\.tsx)?["'];?/g,
    'import { App } from "./App";'
  ).replace(/from\s+["'](.+)\.tsx["']/g, 'from "$1"');
  writeFileSync(mainPath, main);
};

// scripts-src/flatpack-docs/patch-vite-layer.ts
var args = getScriptArgs();
var targetRoot = args[0];
var frontendClient = process.env.FRONTEND_CLIENT;
var clientPortEnv = process.env.CLIENT_PORT_ENV;
if (!targetRoot || !frontendClient || !clientPortEnv) {
  fail(
    "usage: FRONTEND_CLIENT=<name> CLIENT_PORT_ENV=<ENV> patch-vite-layer.mjs /path/to/target-project"
  );
}
var resolvedTargetRoot = targetRoot;
var resolvedFrontendClient = frontendClient;
var resolvedClientPortEnv = clientPortEnv;
patchViteLayer(
  resolvedTargetRoot,
  resolvedFrontendClient,
  resolvedClientPortEnv
);
