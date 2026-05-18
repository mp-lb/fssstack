#!/usr/bin/env node

// scripts-src/flatpack-docs/install-root-dependencies.ts
import { spawnSync } from "child_process";

// scripts-src/flatpack-docs/lib/args.ts
var getScriptArgs = () => {
  const args2 = process.argv.slice(2);
  return args2[0] === "--" ? args2.slice(1) : args2;
};
var fail = (message) => {
  console.error(message);
  process.exit(1);
};

// scripts-src/flatpack-docs/install-root-dependencies.ts
var dependencies = ["lodash", "pino", "pino-pretty", "zod"];
var devDependencies = [
  "turbo",
  "typescript",
  "vitest",
  "ts-node",
  "jsdom",
  "@types/node",
  "@types/lodash",
  "@types/pino",
  "eslint@9",
  "@eslint/js@9",
  "eslint-config-prettier",
  "eslint-plugin-import",
  "eslint-plugin-prettier",
  "eslint-plugin-react",
  "eslint-plugin-react-hooks",
  "eslint-plugin-react-refresh",
  "globals",
  "typescript-eslint",
  "@testing-library/react",
  "@testing-library/jest-dom",
  "prettier",
  "prettier-plugin-tailwindcss",
  "tsx",
  "vite",
  "@vitejs/plugin-react",
  "@tailwindcss/vite",
  "react",
  "react-dom"
];
var args = getScriptArgs();
if (args.length !== 1) {
  fail("usage: install-root-dependencies.mjs /path/to/target-project");
}
var targetRoot = args[0];
var run = (commandArgs) => {
  const result = spawnSync("pnpm", commandArgs, {
    cwd: targetRoot,
    stdio: "inherit"
  });
  if (result.error) {
    fail(result.error.message);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};
run(["add", "-w", "--save-exact", ...dependencies]);
run(["add", "-w", "--save-dev", "--save-exact", ...devDependencies]);
