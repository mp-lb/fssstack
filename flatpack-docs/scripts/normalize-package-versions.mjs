#!/usr/bin/env node

// scripts-src/normalize-package-versions.ts
import { existsSync, readFileSync, writeFileSync } from "fs";

// scripts-src/lib/args.ts
var getScriptArgs = () => {
  const args = process.argv.slice(2);
  return args[0] === "--" ? args.slice(1) : args;
};
var fail = (message) => {
  console.error(message);
  process.exit(1);
};

// scripts-src/normalize-package-versions.ts
var dependencySections = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies"
];
var files = getScriptArgs();
if (files.length === 0) {
  fail("usage: normalize-package-versions.mjs <package.json> [...]");
}
for (const file of files) {
  if (!existsSync(file)) continue;
  const packageJson = JSON.parse(readFileSync(file, "utf8"));
  for (const section of dependencySections) {
    const dependencies = packageJson[section];
    if (!dependencies || typeof dependencies !== "object") continue;
    for (const [name, version] of Object.entries(
      dependencies
    )) {
      if (typeof version === "string") {
        dependencies[name] = version.replace(
          /^[~^]/,
          ""
        );
      }
    }
  }
  writeFileSync(file, `${JSON.stringify(packageJson, null, 2)}
`);
}
