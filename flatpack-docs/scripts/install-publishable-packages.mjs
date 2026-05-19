#!/usr/bin/env node

// scripts-src/flatpack-docs/install-publishable-packages.ts
import { readFileSync as readFileSync2, writeFileSync as writeFileSync3 } from "fs";
import { join as join2 } from "path";

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

// scripts-src/flatpack-docs/install-publishable-packages.ts
var publishableFiles = [
  ["layers/packages/publishable/package.json", "package.json"],
  ["layers/packages/publishable/README.md", "README.md"],
  ["layers/packages/publishable/CHANGELOG.md", "CHANGELOG.md"],
  ["layers/packages/publishable/tsconfig.build.json", "tsconfig.build.json"],
  ["layers/packages/publishable/tsconfig.json", "tsconfig.json"],
  ["layers/packages/publishable/vitest.config.ts", "vitest.config.ts"],
  ["layers/packages/publishable/src/index.test.ts", "src/index.test.ts"],
  ["layers/packages/publishable/src/index.ts", "src/index.ts"]
];
var releaseFiles = [
  ["layers/release/.changeset/config.json", ".changeset/config.json"],
  [
    "layers/release/.github/workflows/release.yml",
    ".github/workflows/release.yml"
  ]
];
var optionalServiceList = (raw) => {
  const value = raw?.trim() ?? "";
  if (value === "" || value === "-" || value.toLowerCase() === "none") {
    return [];
  }
  return parseServiceList(value);
};
var installPublishablePackage = (targetRoot2, packageSlug, kind) => {
  const packageRoot = join2(targetRoot2, "packages", packageSlug);
  for (const [sourcePath, targetPath] of publishableFiles) {
    installFromStore(sourcePath, join2(packageRoot, targetPath));
  }
  replaceInFiles(walkFiles(packageRoot), {
    __PUBLISHABLE_PACKAGE_NAME__: packageSlug,
    __PUBLISHABLE_KIND__: kind === "cli" ? "CLI" : "library",
    __PUBLISHABLE_TSCONFIG__: kind === "cli" ? "tsconfig.node.json" : "tsconfig.base.json"
  });
  if (kind === "cli") {
    const packageJsonPath = join2(packageRoot, "package.json");
    const indexPath = join2(packageRoot, "src", "index.ts");
    const packageJson = JSON.parse(readFileSync2(packageJsonPath, "utf8"));
    packageJson.bin = { [packageSlug]: "dist/index.js" };
    packageJson.scripts = {
      ...packageJson.scripts,
      build: "rm -rf dist && tsc --project tsconfig.build.json && chmod +x dist/index.js"
    };
    writeFileSync3(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}
`);
    writeFileSync3(
      indexPath,
      `#!/usr/bin/env node
${readFileSync2(indexPath, "utf8")}`
    );
  }
};
var args = getScriptArgs();
if (args.length < 1 || args.length > 3) {
  fail(
    "usage: install-publishable-packages.mjs /path/to/target-project [cli-packages] [library-packages]"
  );
}
var [targetRoot, cliPackagesArg, libraryPackagesArg] = args;
var cliPackages = optionalServiceList(cliPackagesArg);
var libraryPackages = optionalServiceList(libraryPackagesArg);
var publishablePackages = [...cliPackages, ...libraryPackages];
if (publishablePackages.length === 0) {
  process.exit(0);
}
assertUniqueServices(publishablePackages, "publishable package");
for (const packageSlug of cliPackages) {
  installPublishablePackage(targetRoot, packageSlug, "cli");
}
for (const packageSlug of libraryPackages) {
  installPublishablePackage(targetRoot, packageSlug, "lib");
}
for (const [sourcePath, targetPath] of releaseFiles) {
  installFromStore(sourcePath, join2(targetRoot, targetPath));
}
