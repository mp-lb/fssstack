#!/usr/bin/env node

/**
 * Example publishable CLI. A CLI is just a library with a `bin` and a shebang —
 * there is no separate CLI package type. Replace this with the real command.
 */
export const runExampleCli = (args: string[]): string => {
  const name = args[0] ?? "world";

  return `Hello, ${name}.`;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(runExampleCli(process.argv.slice(2)));
}
