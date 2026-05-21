import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, unknown>;
  devDependencies?: Record<string, unknown>;
  [key: string]: unknown;
};

const stripRange = (value: unknown) =>
  typeof value === "string" ? value.replace(/^[~^]/, "") : value;

export const patchViteLayer = (
  targetRoot: string,
  frontendClient: string,
  clientPortEnv: string,
): void => {
  const frontendRoot = join(targetRoot, "apps", frontendClient);
  const packageJsonPath = join(frontendRoot, "package.json");
  const mainPath = join(frontendRoot, "src", "main.tsx");
  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, "utf8"),
  ) as PackageJson;

  packageJson.scripts = {
    ...packageJson.scripts,
    dev: `vite --host 0.0.0.0 --port \${${clientPortEnv}:-5173} --strictPort`,
    build: "tsc --project tsconfig.app.json && vite build",
    typecheck: "tsc --project tsconfig.app.json --noEmit",
    test: "vitest run",
    "test:watch": "vitest",
  };

  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    "@types/node": "24.12.0",
  };

  for (const dependencySet of [
    packageJson.dependencies,
    packageJson.devDependencies,
  ]) {
    if (!dependencySet) continue;

    for (const [name, version] of Object.entries(dependencySet)) {
      dependencySet[name] = stripRange(version);
    }
  }

  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

  if (!existsSync(mainPath)) return;

  const main = readFileSync(mainPath, "utf8")
    .replace(
      /import\s+App\s+from\s+["']\.\/App(?:\.tsx)?["'];?/g,
      'import { App } from "./App";',
    )
    .replace(/from\s+["'](.+)\.tsx["']/g, 'from "$1"');

  writeFileSync(mainPath, main);
};
