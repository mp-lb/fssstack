import JSON5 from "json5";
import { describe, expect, it } from "vitest";
import { buildManifestJson5 } from "../app/project-manifest";
import { defaultProjectPromptConfig } from "../app/project-schema";

describe("buildManifestJson5", () => {
  it("renders JSON5 with one line per manifest key", () => {
    const manifest = buildManifestJson5({
      ...defaultProjectPromptConfig,
      slug: "my-app",
      backendServices: ["api", "worker"],
      frontendClients: [
        { slug: "web", type: "react-vite" },
        { slug: "admin", type: "react-nextjs" },
      ],
      cliPackages: ["toolbox"],
      libraryPackages: ["sdk", "ui"],
    });

    expect(manifest).toBe(
      [
        "{",
        "  projectSlug: 'my-app',",
        "  frontends: ['web','admin'],",
        "  backends: ['api','worker'],",
        "  clis: ['toolbox'],",
        "  libs: ['sdk','ui'],",
        "  extensions: []",
        "}",
      ].join("\n"),
    );
    expect(JSON5.parse(manifest)).toEqual({
      projectSlug: "my-app",
      frontends: ["web", "admin"],
      backends: ["api", "worker"],
      clis: ["toolbox"],
      libs: ["sdk", "ui"],
      extensions: [],
    });
  });
});
