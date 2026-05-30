import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fail, getScriptArgs } from "./lib/args";
import { installFromStore } from "./lib/dx";
import { replaceInFiles, walkFiles } from "./lib/files";
import { assertUniqueServices } from "./lib/services";

// A publishable package is always a library. A library may opt into shipping an
// executable by marking its slug `(bin)` in the input list — there is no
// separate "CLI" package type anymore.
type LibrarySpec = { slug: string; executable: boolean };

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

// Parse a comma-separated library list where each entry is `slug` or
// `slug (bin)`. The `(bin)` marker opts the library into shipping an executable.
const parseLibrarySpecs = (raw: string | undefined): LibrarySpec[] => {
  const value = raw?.trim() ?? "";

  if (value === "" || value === "-" || value.toLowerCase() === "none") {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [slug = "", ...markers] = entry.split(/\s+/);
      const executable = markers.some(
        (marker) => marker.toLowerCase() === "(bin)",
      );

      return { slug, executable };
    });
};

const installPublishablePackage = (
  targetRoot: string,
  packageSlug: string,
  executable: boolean,
) => {
  const packageRoot = join(targetRoot, "packages", packageSlug);

  for (const [sourcePath, targetPath] of publishableFiles) {
    installFromStore(sourcePath, join(packageRoot, targetPath));
  }

  replaceInFiles(walkFiles(packageRoot), {
    __PUBLISHABLE_PACKAGE_NAME__: packageSlug,
    __PUBLISHABLE_KIND__: executable ? "executable library" : "library",
    __PUBLISHABLE_TSCONFIG__: executable
      ? "tsconfig.node.json"
      : "tsconfig.base.json",
  });

  if (executable) {
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

if (args.length < 1 || args.length > 2) {
  fail(
    "usage: install-publishable-packages.mjs /path/to/target-project [library-packages]",
  );
}

const [targetRoot, libraryPackagesArg] = args as [string, string?];
const librarySpecs = parseLibrarySpecs(libraryPackagesArg);

if (librarySpecs.length === 0) {
  process.exit(0);
}

assertUniqueServices(
  librarySpecs.map((spec) => spec.slug),
  "publishable package",
);

for (const { slug, executable } of librarySpecs) {
  installPublishablePackage(targetRoot, slug, executable);
}

for (const [sourcePath, targetPath] of releaseFiles) {
  installFromStore(sourcePath, join(targetRoot, targetPath));
}
