import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { patchViteLayer } from "../scripts-src/lib/vite";

const tempRoots: string[] = [];

const createFrontend = () => {
  const root = mkdtempSync(join(tmpdir(), "fssstack-test-"));
  const frontendRoot = join(root, "apps", "frontend");

  tempRoots.push(root);
  mkdirSync(join(frontendRoot, "src", "components"), { recursive: true });
  writeFileSync(
    join(frontendRoot, "package.json"),
    JSON.stringify(
      {
        name: "frontend",
        type: "module",
        scripts: {
          dev: "vite",
          build: "tsc -b && vite build",
          preview: "vite preview",
        },
        dependencies: {
          react: "19.0.0",
        },
        devDependencies: {
          vite: "7.3.1",
          vitest: "4.0.0",
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(frontendRoot, "src", "main.tsx"),
    [
      'import App from "./App.tsx"',
      'import { ThemeProvider } from "./components/theme-provider.tsx"',
      "",
    ].join("\n"),
  );

  return { root, frontendRoot };
};

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("patchViteLayer", () => {
  it("patches package scripts and dependencies", () => {
    const { frontendRoot, root } = createFrontend();

    patchViteLayer(root, "frontend", "FRONTEND_PORT");

    const packageJson = JSON.parse(
      readFileSync(join(frontendRoot, "package.json"), "utf8"),
    ) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.scripts.dev).toBe(
      "vite --host 0.0.0.0 --port ${FRONTEND_PORT:-5173} --strictPort",
    );
    expect(packageJson.scripts.build).toBe(
      "tsc --project tsconfig.app.json && vite build",
    );
    expect(packageJson.scripts.preview).toBe("vite preview");
    expect(packageJson.dependencies.react).toBe("19.0.0");
    expect(packageJson.dependencies["@tanstack/react-query"]).toBe("5.90.12");
    expect(packageJson.dependencies["@trpc/client"]).toBe("11.7.1");
    expect(packageJson.dependencies["@trpc/react-query"]).toBe("11.7.1");
    expect(packageJson.dependencies["__PACKAGE_PREFIX__-trpc"]).toBe(
      "workspace:*",
    );
    expect(packageJson.devDependencies["@testing-library/react"]).toBe(
      "16.3.2",
    );
    expect(packageJson.devDependencies.vite).toBe("7.3.3");
    expect(packageJson.devDependencies.vitest).toBe("4.0.0");
  });

  it("uses the supplied client port env in the dev script", () => {
    const { frontendRoot, root } = createFrontend();

    patchViteLayer(root, "frontend", "ADMIN_PORT");

    const packageJson = JSON.parse(
      readFileSync(join(frontendRoot, "package.json"), "utf8"),
    ) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts.dev).toBe(
      "vite --host 0.0.0.0 --port ${ADMIN_PORT:-5173} --strictPort",
    );
  });

  it("normalizes generated main imports", () => {
    const { frontendRoot, root } = createFrontend();

    patchViteLayer(root, "frontend", "FRONTEND_PORT");

    expect(readFileSync(join(frontendRoot, "src", "main.tsx"), "utf8")).toBe(
      [
        'import { App } from "./App";',
        'import { ThemeProvider } from "./components/theme-provider"',
        "",
      ].join("\n"),
    );
  });

  it("patches package metadata when main.tsx is absent", () => {
    const { frontendRoot, root } = createFrontend();

    rmSync(join(frontendRoot, "src", "main.tsx"));

    expect(() =>
      patchViteLayer(root, "frontend", "FRONTEND_PORT"),
    ).not.toThrow();
  });
});
