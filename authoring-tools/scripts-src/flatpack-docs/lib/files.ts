import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";

const templateFileNames = new Set([
  "package.json",
  "zap.yaml",
  "AGENTS.md",
  "README.md",
  "index.html",
]);

const templateFileExtensions = new Set([".ts", ".tsx"]);

export const walkFiles = (
  root: string,
  options: { prune?: Set<string> } = {},
): string[] => {
  const prune = options.prune ?? new Set<string>();
  const files: string[] = [];

  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const rel = relative(root, path);

      if (entry.isDirectory()) {
        if (prune.has(entry.name) || prune.has(rel)) continue;
        visit(path);
        continue;
      }

      if (entry.isFile()) files.push(path);
    }
  };

  visit(root);

  return files;
};

export const templateFiles = (root: string): string[] =>
  walkFiles(root, { prune: new Set([".git", "node_modules"]) }).filter(
    (file) => {
      const name = basename(file);

      return (
        templateFileNames.has(name) ||
        [...templateFileExtensions].some((extension) =>
          name.endsWith(extension),
        )
      );
    },
  );

export const replaceInFiles = (
  files: string[],
  replacements: Record<string, string>,
): void => {
  for (const file of files) {
    const before = readFileSync(file, "utf8");
    let after = before;

    for (const [from, to] of Object.entries(replacements)) {
      after = after.split(from).join(to);
    }

    if (after !== before) writeFileSync(file, after);
  }
};

export const fileExists = (path: string): boolean => {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
};
