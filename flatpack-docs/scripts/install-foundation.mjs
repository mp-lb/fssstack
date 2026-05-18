#!/usr/bin/env node

// scripts-src/install-foundation.ts
import { join } from "path";
import { mkdirSync as mkdirSync2 } from "fs";

// scripts-src/lib/args.ts
var getScriptArgs = () => {
  const args2 = process.argv.slice(2);
  return args2[0] === "--" ? args2.slice(1) : args2;
};
var fail = (message) => {
  console.error(message);
  process.exit(1);
};

// scripts-src/lib/dx.ts
import { execFileSync } from "child_process";
import { dirname } from "path";
import { mkdirSync, writeFileSync } from "fs";
var readFromStore = (sourcePath) => execFileSync("dx", ["read", sourcePath], { encoding: "utf8" });
var installFromStore = (sourcePath, targetPath) => {
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, readFromStore(sourcePath));
};

// scripts-src/install-foundation.ts
var foundationFiles = [
  ["layers/foundation/root/.env.local", ".env.local"],
  ["layers/foundation/root/.gitignore", ".gitignore"],
  ["layers/foundation/root/.npmrc", ".npmrc"],
  ["layers/foundation/root/README.md", "README.md"],
  ["layers/foundation/root/doctrine.example.yaml", "doctrine.yaml"],
  ["layers/foundation/root/eslint.config.js", "eslint.config.js"],
  ["layers/foundation/root/package.json", "package.json"],
  ["layers/foundation/root/pnpm-workspace.yaml", "pnpm-workspace.yaml"],
  ["layers/foundation/root/turbo.json", "turbo.json"],
  ["layers/foundation/root/zap.yaml", "zap.yaml"],
  ["layers/foundation/etc/tsconfig.base.json", "etc/tsconfig.base.json"],
  ["layers/foundation/etc/tsconfig.node.json", "etc/tsconfig.node.json"],
  [
    "layers/foundation/etc/tsconfig.react-nextjs.json",
    "etc/tsconfig.react-nextjs.json"
  ],
  [
    "layers/foundation/etc/tsconfig.react-vite-app.json",
    "etc/tsconfig.react-vite-app.json"
  ],
  [
    "layers/foundation/etc/tsconfig.react-vite-node.json",
    "etc/tsconfig.react-vite-node.json"
  ],
  ["layers/foundation/etc/vitest.base.config.ts", "etc/vitest.base.config.ts"],
  ["layers/foundation/etc/vitest.node.config.ts", "etc/vitest.node.config.ts"],
  [
    "layers/foundation/etc/vitest.react.config.ts",
    "etc/vitest.react.config.ts"
  ],
  [
    "layers/foundation/environments.toml",
    ".codex/environments/environments.toml"
  ]
];
var args = getScriptArgs();
if (args.length !== 1) {
  fail("usage: install-foundation.mjs /path/to/target-project");
}
var targetRoot = args[0];
mkdirSync2(join(targetRoot, "etc"), { recursive: true });
mkdirSync2(join(targetRoot, ".codex", "environments"), { recursive: true });
for (const [sourcePath, targetPath] of foundationFiles) {
  installFromStore(sourcePath, join(targetRoot, targetPath));
}
