import { spawnSync } from "node:child_process";
import { fail, getScriptArgs } from "./lib/args";

const dependencies = ["lodash", "pino", "pino-pretty", "zod"];

const devDependencies = [
  "turbo",
  "typescript",
  "vitest",
  "@changesets/cli",
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
  "react-dom",
];

const args = getScriptArgs();

if (args.length !== 1) {
  fail("usage: install-root-dependencies.mjs /path/to/target-project");
}

const targetRoot = args[0]!;

const run = (commandArgs: string[]): void => {
  const result = spawnSync("pnpm", commandArgs, {
    cwd: targetRoot,
    stdio: "inherit",
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
