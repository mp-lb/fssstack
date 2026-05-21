import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { fail, getScriptArgs } from "./lib/args";
import { installFromStore } from "./lib/dx";

const foundationFiles: Array<[string, string]> = [
  ["layers/foundation/root/.env.local", ".env.local"],
  ["layers/foundation/root/.gitignore", ".gitignore"],
  ["layers/foundation/root/.npmrc", ".npmrc"],
  ["layers/foundation/root/README.md", "README.md"],
  ["layers/foundation/root/eslint.config.js", "eslint.config.js"],
  ["layers/foundation/root/package.json", "package.json"],
  ["layers/foundation/root/pnpm-workspace.yaml", "pnpm-workspace.yaml"],
  ["layers/foundation/root/turbo.json", "turbo.json"],
  ["layers/foundation/root/zap.yaml", "zap.yaml"],
  ["layers/foundation/etc/tsconfig.base.json", "etc/tsconfig.base.json"],
  ["layers/foundation/etc/eslint.next.config.js", "etc/eslint.next.config.js"],
  ["layers/foundation/etc/tsconfig.node.json", "etc/tsconfig.node.json"],
  [
    "layers/foundation/etc/tsconfig.react-nextjs.json",
    "etc/tsconfig.react-nextjs.json",
  ],
  [
    "layers/foundation/etc/tsconfig.react-vite-app.json",
    "etc/tsconfig.react-vite-app.json",
  ],
  [
    "layers/foundation/etc/tsconfig.react-vite-node.json",
    "etc/tsconfig.react-vite-node.json",
  ],
  ["layers/foundation/etc/vitest.base.config.ts", "etc/vitest.base.config.ts"],
  ["layers/foundation/etc/vitest.node.config.ts", "etc/vitest.node.config.ts"],
  [
    "layers/foundation/etc/vitest.react.config.ts",
    "etc/vitest.react.config.ts",
  ],
  [
    "layers/foundation/environments.toml",
    ".codex/environments/environments.toml",
  ],
];

const args = getScriptArgs();

if (args.length !== 1) {
  fail("usage: install-foundation.mjs /path/to/target-project");
}

const targetRoot = args[0]!;

mkdirSync(join(targetRoot, "etc"), { recursive: true });
mkdirSync(join(targetRoot, ".codex", "environments"), { recursive: true });

for (const [sourcePath, targetPath] of foundationFiles) {
  installFromStore(sourcePath, join(targetRoot, targetPath));
}
