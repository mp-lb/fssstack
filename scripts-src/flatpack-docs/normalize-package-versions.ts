import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fail, getScriptArgs } from "./lib/args";

const dependencySections = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

const files = getScriptArgs();

if (files.length === 0) {
  fail("usage: normalize-package-versions.mjs <package.json> [...]");
}

for (const file of files) {
  if (!existsSync(file)) continue;

  const packageJson = JSON.parse(readFileSync(file, "utf8")) as Record<
    string,
    unknown
  >;

  for (const section of dependencySections) {
    const dependencies = packageJson[section];

    if (!dependencies || typeof dependencies !== "object") continue;

    for (const [name, version] of Object.entries(
      dependencies as Record<string, unknown>,
    )) {
      if (typeof version === "string") {
        (dependencies as Record<string, string>)[name] = version.replace(
          /^[~^]/,
          "",
        );
      }
    }
  }

  writeFileSync(file, `${JSON.stringify(packageJson, null, 2)}\n`);
}
