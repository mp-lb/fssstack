#!/usr/bin/env node

// scripts-src/flatpack-docs/apply-vite-layer.ts
import { join as join2 } from "path";
import { rmSync } from "fs";

// scripts-src/flatpack-docs/lib/args.ts
var getScriptArgs = () => {
  const args2 = process.argv.slice(2);
  return args2[0] === "--" ? args2.slice(1) : args2;
};
var fail = (message) => {
  console.error(message);
  process.exit(1);
};

// scripts-src/flatpack-docs/lib/dx.ts
import { execFileSync } from "child_process";
import { dirname } from "path";
import { mkdirSync, writeFileSync } from "fs";
var readFromStore = (sourcePath) => execFileSync("dx", ["read", sourcePath], { encoding: "utf8" });
var installFromStore = (sourcePath, targetPath) => {
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, readFromStore(sourcePath));
};

// scripts-src/flatpack-docs/lib/services.ts
var serviceNamePattern = /^[a-z][a-z0-9-]*$/;
var validateServiceName = (serviceName) => {
  if (!serviceNamePattern.test(serviceName)) {
    fail(
      `invalid service name '${serviceName}'; use lowercase letters, numbers, and hyphens`
    );
  }
};
var portEnvName = (serviceName) => `${serviceName.toUpperCase().replaceAll("-", "_")}_PORT`;

// scripts-src/flatpack-docs/lib/vite.ts
import { existsSync, readFileSync, writeFileSync as writeFileSync2 } from "fs";
import { join } from "path";
var patchViteLayer = (targetRoot2, frontendClient2, clientPortEnv) => {
  const frontendRoot2 = join(targetRoot2, "apps", frontendClient2);
  const packageJsonPath = join(frontendRoot2, "package.json");
  const mainPath = join(frontendRoot2, "src", "main.tsx");
  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, "utf8")
  );
  packageJson.scripts = {
    ...packageJson.scripts,
    dev: `vite --host 0.0.0.0 --port \${${clientPortEnv}:-5173} --strictPort`,
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
  writeFileSync2(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}
`);
  if (!existsSync(mainPath)) return;
  const main = readFileSync(mainPath, "utf8").replace(
    /import\s+App\s+from\s+["']\.\/App(?:\.tsx)?["'];?/g,
    'import { App } from "./App";'
  ).replace(/from\s+["'](.+)\.tsx["']/g, 'from "$1"');
  writeFileSync2(mainPath, main);
};

// scripts-src/flatpack-docs/apply-vite-layer.ts
var viteFiles = [
  ["layers/vite/index.html", "index.html"],
  ["layers/vite/vercel.json", "vercel.json"],
  ["layers/vite/tsconfig.app.json", "tsconfig.app.json"],
  ["layers/vite/tsconfig.node.json", "tsconfig.node.json"],
  ["layers/vite/vitest.config.ts", "vitest.config.ts"],
  ["layers/vite/src/App.test.tsx", "src/App.test.tsx"],
  ["layers/vite/src/App.tsx", "src/App.tsx"],
  ["layers/vite/src/config.ts", "src/config.ts"],
  ["layers/vite/src/logger.ts", "src/logger.ts"],
  ["layers/vite/src/test-setup.ts", "src/test-setup.ts"],
  ["layers/vite/src/trpc.ts", "src/trpc.ts"]
];
var args = getScriptArgs();
if (args.length < 1 || args.length > 2) {
  fail("usage: apply-vite-layer.mjs /path/to/target-project [frontend-client]");
}
var targetRoot = args[0];
var frontendClient = args[1] ?? "frontend";
validateServiceName(frontendClient);
var frontendRoot = join2(targetRoot, "apps", frontendClient);
for (const targetPath of [
  ".git",
  "node_modules",
  "package-lock.json",
  "public/vite.svg",
  "src/assets",
  "src/App.css"
]) {
  rmSync(join2(frontendRoot, targetPath), { recursive: true, force: true });
}
for (const [sourcePath, targetPath] of viteFiles) {
  installFromStore(sourcePath, join2(frontendRoot, targetPath));
}
patchViteLayer(targetRoot, frontendClient, portEnvName(frontendClient));
