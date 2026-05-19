import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fail, getScriptArgs } from "./lib/args";
import { installFromStore } from "./lib/dx";
import { replaceInFiles, walkFiles } from "./lib/files";
import { assertUniqueServices, parseServiceList } from "./lib/services";

type PublishableKind = "cli" | "lib";

const publishableFiles: Array<[string, string]> = [
  ["layers/packages/publishable/package.json", "package.json"],
  ["layers/packages/publishable/README.md", "README.md"],
  ["layers/packages/publishable/CHANGELOG.md", "CHANGELOG.md"],
  ["layers/packages/publishable/tsconfig.build.json", "tsconfig.build.json"],
  ["layers/packages/publishable/tsconfig.json", "tsconfig.json"],
  ["layers/packages/publishable/vitest.config.ts", "vitest.config.ts"],
  ["layers/packages/publishable/src/index.test.ts", "src/index.test.ts"],
  ["layers/packages/publishable/src/index.ts", "src/index.ts"],
];

const releaseFiles: Array<[string, string]> = [
  ["layers/release/.changeset/config.json", ".changeset/config.json"],
  [
    "layers/release/.github/workflows/release.yml",
    ".github/workflows/release.yml",
  ],
];

const optionalServiceList = (raw: string | undefined): string[] => {
  const value = raw?.trim() ?? "";

  if (value === "" || value === "-" || value.toLowerCase() === "none") {
    return [];
  }

  return parseServiceList(value);
};

const installPublishablePackage = (
  targetRoot: string,
  packageSlug: string,
  kind: PublishableKind,
) => {
  const packageRoot = join(targetRoot, "packages", packageSlug);

  for (const [sourcePath, targetPath] of publishableFiles) {
    installFromStore(sourcePath, join(packageRoot, targetPath));
  }

  replaceInFiles(walkFiles(packageRoot), {
    __PUBLISHABLE_PACKAGE_NAME__: packageSlug,
    __PUBLISHABLE_KIND__: kind === "cli" ? "CLI" : "library",
    __PUBLISHABLE_TSCONFIG__:
      kind === "cli" ? "tsconfig.node.json" : "tsconfig.base.json",
  });

  if (kind === "cli") {
    const packageJsonPath = join(packageRoot, "package.json");
    const indexPath = join(packageRoot, "src", "index.ts");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
      bin?: Record<string, string>;
      [key: string]: unknown;
    };

    packageJson.bin = { [packageSlug]: "dist/index.js" };
    packageJson.scripts = {
      ...packageJson.scripts,
      build:
        "rm -rf dist && tsc --project tsconfig.build.json && chmod +x dist/index.js",
    };

    writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
    writeFileSync(
      indexPath,
      `#!/usr/bin/env node\n${readFileSync(indexPath, "utf8")}`,
    );
  }
};

const args = getScriptArgs();

if (args.length < 1 || args.length > 3) {
  fail(
    "usage: install-publishable-packages.mjs /path/to/target-project [cli-packages] [library-packages]",
  );
}

const [targetRoot, cliPackagesArg, libraryPackagesArg] = args as [
  string,
  string?,
  string?,
];
const cliPackages = optionalServiceList(cliPackagesArg);
const libraryPackages = optionalServiceList(libraryPackagesArg);
const publishablePackages = [...cliPackages, ...libraryPackages];

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
  installFromStore(sourcePath, join(targetRoot, targetPath));
}
