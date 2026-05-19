import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const tempRoots: string[] = [];

const createTargetRoot = () => {
  const root = mkdtempSync(join(tmpdir(), "fssstack-render-template-test-"));

  tempRoots.push(root);
  mkdirSync(join(root, "apps", "frontend"), { recursive: true });
  writeFileSync(
    join(root, "apps", "frontend", "package.json"),
    `${JSON.stringify({ name: "__PACKAGE_PREFIX__-frontend" }, null, 2)}\n`,
  );

  return root;
};

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("render-template script", () => {
  it("generates zap.yaml with targeted lint and typecheck tasks", () => {
    const targetRoot = createTargetRoot();

    execFileSync(
      "node",
      [
        "flatpack-docs/scripts/render-template.mjs",
        "--",
        targetRoot,
        "demo",
        "@demo",
        "Demo",
        "Demo project",
        "🚀",
        "backend api",
        "frontend admin",
      ],
      { cwd: process.cwd(), stdio: "pipe" },
    );

    const zapYaml = readFileSync(join(targetRoot, "zap.yaml"), "utf8");

    expect(zapYaml).toContain("project: 'demo'");
    expect(zapYaml).toContain("  backend:");
    expect(zapYaml).toContain(
      "    cmd: 'pnpm --filter=@demo/demo-backend dev'",
    );
    expect(zapYaml).toContain("  admin:");
    expect(zapYaml).toContain("    cmd: 'pnpm --filter=@demo/demo-admin dev'");
    expect(zapYaml).toContain("  lint:");
    expect(zapYaml).toContain(
      'test -n "{{REST}}" || (echo "usage: zap t lint -- <file...>" >&2; exit 1)',
    );
    expect(zapYaml).toContain("      - 'pnpm exec eslint {{REST}}'");
    expect(zapYaml).toContain("  typecheck:");
    expect(zapYaml).toContain(
      'test -n "{{REST}}" || (echo "usage: zap t typecheck -- <app-or-package-dir...>" >&2; exit 1)',
    );
    expect(zapYaml).toContain("      - |");
    expect(zapYaml).toContain("        for app_or_package in {{REST}}; do");
    expect(zapYaml).toContain(
      '          pnpm --dir "$app_or_package" run typecheck',
    );
    expect(zapYaml).not.toContain("  check:");
  });
});
