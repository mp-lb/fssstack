import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  replaceInFiles,
  templateFiles,
  walkFiles,
} from "../scripts-src/lib/files";

const tempRoots: string[] = [];

const createRoot = () => {
  const root = mkdtempSync(join(tmpdir(), "fssstack-files-test-"));

  tempRoots.push(root);

  return root;
};

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("file helpers", () => {
  it("walks files while pruning requested directories", () => {
    const root = createRoot();

    mkdirSync(join(root, "src"), { recursive: true });
    mkdirSync(join(root, "node_modules", "dep"), { recursive: true });
    writeFileSync(join(root, "src", "index.ts"), "export {};\n");
    writeFileSync(join(root, "node_modules", "dep", "index.js"), "");

    expect(walkFiles(root, { prune: new Set(["node_modules"]) })).toEqual([
      join(root, "src", "index.ts"),
    ]);
  });

  it("selects only files that participate in template rendering", () => {
    const root = createRoot();

    mkdirSync(join(root, "src"), { recursive: true });
    mkdirSync(join(root, "node_modules"), { recursive: true });
    writeFileSync(join(root, "package.json"), "{}\n");
    writeFileSync(join(root, "src", "App.tsx"), "__PROJECT_NAME__\n");
    writeFileSync(join(root, "src", "style.css"), "__PROJECT_NAME__\n");
    writeFileSync(join(root, "node_modules", "package.json"), "{}\n");

    expect(templateFiles(root).sort()).toEqual(
      [join(root, "package.json"), join(root, "src", "App.tsx")].sort(),
    );
  });

  it("replaces all template tokens in selected files", () => {
    const root = createRoot();
    const readme = join(root, "README.md");

    writeFileSync(readme, "# __PROJECT_NAME__\n__PROJECT_NAME__\n");

    replaceInFiles([readme], {
      __PROJECT_NAME__: "Example",
    });

    expect(readFileSync(readme, "utf8")).toBe("# Example\nExample\n");
  });
});
