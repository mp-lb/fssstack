#!/usr/bin/env node
import { exampleGreeting } from "@example/fss-shell-example-lib";

export const runExampleCli = (args: string[]): string => {
  const name = args[0] ?? "Shell";

  return exampleGreeting(name);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(runExampleCli(process.argv.slice(2)));
}
