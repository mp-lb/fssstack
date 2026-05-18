import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
};

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

  packageJson.dependencies = {
    ...packageJson.dependencies,
    "__PACKAGE_PREFIX__-trpc": "workspace:*",
    "@tanstack/react-query": "5.90.12",
    "@trpc/client": "11.7.1",
    "@trpc/react-query": "11.7.1",
    superjson: "2.2.6",
    zod: "4.4.1",
  };

  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    "@testing-library/jest-dom": "6.9.1",
    "@testing-library/react": "16.3.2",
    "@types/node": "24.12.0",
    vite: "7.3.3",
  };

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
