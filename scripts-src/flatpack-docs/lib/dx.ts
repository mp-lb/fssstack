import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

export const readFromStore = (sourcePath: string): string =>
  execFileSync("dx", ["read", sourcePath], { encoding: "utf8" });

export const installFromStore = (
  sourcePath: string,
  targetPath: string,
): void => {
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, readFromStore(sourcePath));
};
