#!/usr/bin/env node

// scripts-src/flatpack-docs/apply-next-layer.ts
import { readFileSync, rmSync, writeFileSync as writeFileSync2 } from "fs";
import { join } from "path";

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

// scripts-src/flatpack-docs/apply-next-layer.ts
var localArtifacts = [".git", "node_modules", "package-lock.json"];
var stripRange = (value) => typeof value === "string" ? value.replace(/^[~^]/, "") : value;
var args = getScriptArgs();
if (args.length < 1 || args.length > 2) {
  fail("usage: apply-next-layer.mjs /path/to/target-project [frontend-client]");
}
var targetRoot = args[0];
var frontendClient = args[1] ?? "frontend";
validateServiceName(frontendClient);
var frontendRoot = join(targetRoot, "apps", frontendClient);
var packageJsonPath = join(frontendRoot, "package.json");
for (const artifact of localArtifacts) {
  rmSync(join(frontendRoot, artifact), { recursive: true, force: true });
}
installFromStore(
  "layers/next/tsconfig.json",
  join(frontendRoot, "tsconfig.json")
);
installFromStore(
  "layers/next/eslint.config.mjs",
  join(frontendRoot, "eslint.config.mjs")
);
installFromStore(
  "layers/next/app/page.tsx",
  join(frontendRoot, "app", "page.tsx")
);
var packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
var clientPortEnv = portEnvName(frontendClient);
packageJson.version = "0.0.1";
packageJson.private = true;
packageJson.type = "module";
packageJson.scripts = {
  ...packageJson.scripts,
  dev: `next dev --turbopack --hostname 0.0.0.0 --port \${${clientPortEnv}:-3001}`,
  build: "next build",
  start: "next start",
  lint: "eslint",
  typecheck: "tsc --noEmit"
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
writeFileSync2(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}
`);
