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
var stripRange = (value) => typeof value === "string" ? value.replace(/^[~^]/, "") : value;
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
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    "@types/node": "24.12.0"
  };
  for (const dependencySet of [
    packageJson.dependencies,
    packageJson.devDependencies
  ]) {
    if (!dependencySet) continue;
    for (const [name, version] of Object.entries(dependencySet)) {
      dependencySet[name] = stripRange(version);
    }
  }
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
