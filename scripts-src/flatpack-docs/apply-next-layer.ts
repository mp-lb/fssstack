import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fail, getScriptArgs } from "./lib/args";
import { installFromStore } from "./lib/dx";
import { portEnvName, validateServiceName } from "./lib/services";

const localArtifacts = [".git", "node_modules", "package-lock.json"];

const stripRange = (value: unknown) =>
  typeof value === "string" ? value.replace(/^[~^]/, "") : value;

const args = getScriptArgs();

if (args.length < 1 || args.length > 2) {
  fail("usage: apply-next-layer.mjs /path/to/target-project [frontend-client]");
}

const targetRoot = args[0]!;
const frontendClient = args[1] ?? "frontend";

validateServiceName(frontendClient);

const frontendRoot = join(targetRoot, "apps", frontendClient);
const packageJsonPath = join(frontendRoot, "package.json");

for (const artifact of localArtifacts) {
  rmSync(join(frontendRoot, artifact), { recursive: true, force: true });
}

installFromStore(
  "layers/next/tsconfig.json",
  join(frontendRoot, "tsconfig.json"),
);
installFromStore(
  "layers/next/eslint.config.mjs",
  join(frontendRoot, "eslint.config.mjs"),
);
installFromStore(
  "layers/next/app/page.tsx",
  join(frontendRoot, "app", "page.tsx"),
);

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  version?: string;
  private?: boolean;
  type?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, unknown>;
  devDependencies?: Record<string, unknown>;
  [key: string]: unknown;
};
const clientPortEnv = portEnvName(frontendClient);

packageJson.version = "0.0.1";
packageJson.private = true;
packageJson.type = "module";
packageJson.scripts = {
  ...packageJson.scripts,
  dev: `next dev --turbopack --hostname 0.0.0.0 --port \${${clientPortEnv}:-3001}`,
  build: "next build",
  start: "next start",
  lint: "eslint",
  typecheck: "tsc --noEmit",
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
