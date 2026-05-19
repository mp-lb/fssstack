import { join } from "node:path";
import { rmSync } from "node:fs";
import { fail, getScriptArgs } from "./lib/args";
import { installFromStore } from "./lib/dx";
import { portEnvName, validateServiceName } from "./lib/services";
import { patchViteLayer } from "./lib/vite";

const viteFiles: Array<[string, string]> = [
  ["layers/vite/index.html", "index.html"],
  ["layers/vite/vercel.json", "vercel.json"],
  ["layers/vite/tsconfig.app.json", "tsconfig.app.json"],
  ["layers/vite/tsconfig.node.json", "tsconfig.node.json"],
  ["layers/vite/vitest.config.ts", "vitest.config.ts"],
  ["layers/vite/src/App.tsx", "src/App.tsx"],
];

const args = getScriptArgs();

if (args.length < 1 || args.length > 2) {
  fail("usage: apply-vite-layer.mjs /path/to/target-project [frontend-client]");
}

const targetRoot = args[0]!;
const frontendClient = args[1] ?? "frontend";

validateServiceName(frontendClient);

const frontendRoot = join(targetRoot, "apps", frontendClient);

for (const targetPath of [
  ".git",
  "node_modules",
  "package-lock.json",
  "public/vite.svg",
  "src/assets",
  "src/App.css",
  "src/index.css",
]) {
  rmSync(join(frontendRoot, targetPath), { recursive: true, force: true });
}

for (const [sourcePath, targetPath] of viteFiles) {
  installFromStore(sourcePath, join(frontendRoot, targetPath));
}

patchViteLayer(targetRoot, frontendClient, portEnvName(frontendClient));
