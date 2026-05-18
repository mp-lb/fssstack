#!/usr/bin/env node

// scripts-src/flatpack-docs/install-apps-packages.ts
import { join as join2 } from "path";
import { mkdirSync as mkdirSync2 } from "fs";

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

// scripts-src/flatpack-docs/lib/files.ts
import { readdirSync, readFileSync, statSync, writeFileSync as writeFileSync2 } from "fs";
import { basename, join, relative } from "path";
var walkFiles = (root, options = {}) => {
  const prune = options.prune ?? /* @__PURE__ */ new Set();
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const rel = relative(root, path);
      if (entry.isDirectory()) {
        if (prune.has(entry.name) || prune.has(rel)) continue;
        visit(path);
        continue;
      }
      if (entry.isFile()) files.push(path);
    }
  };
  visit(root);
  return files;
};
var replaceInFiles = (files, replacements) => {
  for (const file of files) {
    const before = readFileSync(file, "utf8");
    let after = before;
    for (const [from, to] of Object.entries(replacements)) {
      after = after.split(from).join(to);
    }
    if (after !== before) writeFileSync2(file, after);
  }
};

// scripts-src/flatpack-docs/lib/services.ts
var serviceNamePattern = /^[a-z][a-z0-9-]*$/;
var parseServiceList = (raw) => raw.replaceAll(/\([^)]*\)/g, "").replaceAll(",", " ").split(/\s+/).map((part) => part.trim()).filter(Boolean);
var validateServiceName = (serviceName) => {
  if (!serviceNamePattern.test(serviceName)) {
    fail(
      `invalid service name '${serviceName}'; use lowercase letters, numbers, and hyphens`
    );
  }
};
var assertUniqueServices = (serviceNames, label = "service") => {
  const seen = /* @__PURE__ */ new Set();
  for (const serviceName of serviceNames) {
    validateServiceName(serviceName);
    if (seen.has(serviceName)) {
      fail(`duplicate ${label} name '${serviceName}'`);
    }
    seen.add(serviceName);
  }
};
var portEnvName = (serviceName) => `${serviceName.toUpperCase().replaceAll("-", "_")}_PORT`;

// scripts-src/flatpack-docs/install-apps-packages.ts
var packageFiles = [
  ["layers/packages/core/package.json", "packages/core/package.json"],
  [
    "layers/packages/core/tsconfig.build.json",
    "packages/core/tsconfig.build.json"
  ],
  ["layers/packages/core/tsconfig.json", "packages/core/tsconfig.json"],
  ["layers/packages/core/vitest.config.ts", "packages/core/vitest.config.ts"],
  ["layers/packages/core/src/index.test.ts", "packages/core/src/index.test.ts"],
  ["layers/packages/core/src/index.ts", "packages/core/src/index.ts"],
  ["layers/packages/server/package.json", "packages/server/package.json"],
  [
    "layers/packages/server/tsconfig.build.json",
    "packages/server/tsconfig.build.json"
  ],
  ["layers/packages/server/tsconfig.json", "packages/server/tsconfig.json"],
  [
    "layers/packages/server/vitest.config.ts",
    "packages/server/vitest.config.ts"
  ],
  ["layers/packages/server/src/context.ts", "packages/server/src/context.ts"],
  [
    "layers/packages/server/src/index.test.ts",
    "packages/server/src/index.test.ts"
  ],
  ["layers/packages/server/src/index.ts", "packages/server/src/index.ts"],
  ["layers/packages/server/src/logger.ts", "packages/server/src/logger.ts"],
  ["layers/packages/server/src/trpc.ts", "packages/server/src/trpc.ts"],
  [
    "layers/packages/server/src/trpcError.ts",
    "packages/server/src/trpcError.ts"
  ],
  ["layers/packages/trpc/package.json", "packages/trpc/package.json"],
  [
    "layers/packages/trpc/tsconfig.build.json",
    "packages/trpc/tsconfig.build.json"
  ],
  ["layers/packages/trpc/tsconfig.json", "packages/trpc/tsconfig.json"],
  ["layers/packages/trpc/vitest.config.ts", "packages/trpc/vitest.config.ts"],
  ["layers/packages/trpc/src/index.test.ts", "packages/trpc/src/index.test.ts"],
  ["layers/packages/trpc/src/index.ts", "packages/trpc/src/index.ts"],
  [
    "layers/packages/trpc/src/procedures/helloWorld.ts",
    "packages/trpc/src/procedures/helloWorld.ts"
  ],
  ["layers/packages/trpc/src/server.ts", "packages/trpc/src/server.ts"]
];
var backendFiles = [
  ["layers/apps/backend/package.json", "apps/backend/package.json"],
  [
    "layers/apps/backend/tsconfig.build.json",
    "apps/backend/tsconfig.build.json"
  ],
  ["layers/apps/backend/tsconfig.json", "apps/backend/tsconfig.json"],
  ["layers/apps/backend/vitest.config.ts", "apps/backend/vitest.config.ts"],
  ["layers/apps/backend/src/config.ts", "apps/backend/src/config.ts"],
  ["layers/apps/backend/src/index.test.ts", "apps/backend/src/index.test.ts"],
  ["layers/apps/backend/src/index.ts", "apps/backend/src/index.ts"]
];
var args = getScriptArgs();
if (args.length < 1) {
  fail(
    "usage: install-apps-packages.mjs /path/to/target-project [backend-services]"
  );
}
var [targetRoot, ...backendArgs] = args;
var backendServices = backendArgs.length === 0 ? ["backend"] : parseServiceList(backendArgs.join(" "));
if (backendServices.length === 0) {
  fail("at least one backend service is required");
}
assertUniqueServices(backendServices, "backend service");
mkdirSync2(join2(targetRoot, "apps"), { recursive: true });
mkdirSync2(join2(targetRoot, "packages"), { recursive: true });
for (const [sourcePath, targetPath] of packageFiles) {
  installFromStore(sourcePath, join2(targetRoot, targetPath));
}
for (const backendService of backendServices) {
  for (const [sourcePath, targetPath] of backendFiles) {
    installFromStore(
      sourcePath,
      join2(targetRoot, targetPath.replace("backend", backendService))
    );
  }
  replaceInFiles(walkFiles(join2(targetRoot, "apps", backendService)), {
    __BACKEND_SERVICE_NAME__: backendService,
    __BACKEND_SERVICE_PORT_ENV__: portEnvName(backendService)
  });
}
