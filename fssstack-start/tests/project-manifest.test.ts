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
      libraryPackages: ["sdk", "ui"],
      extensions: ["mongodb", "s3"],
    });

    expect(manifest).toBe(
      [
        "{",
        "  name: 'My App',",
        "  emoji: '🚀',",
        "  description: '',",
        "  projectSlug: 'my-app',",
        "  packagePrefix: '@fssstack',",
        "  shadcnPreset: 'b1VlIttI',",
        "  frontends: [{name:'web',type:'react-vite'},{name:'admin',type:'react-nextjs'}],",
        "  backends: ['api','worker'],",
        "  libs: ['sdk','ui'],",
        "  extensions: ['mongodb','s3']",
        "}",
      ].join("\n"),
    );
    expect(JSON5.parse(manifest)).toEqual({
      name: "My App",
      emoji: "🚀",
      description: "",
      projectSlug: "my-app",
      packagePrefix: "@fssstack",
      shadcnPreset: "b1VlIttI",
      frontends: [
        { name: "web", type: "react-vite" },
        { name: "admin", type: "react-nextjs" },
      ],
      backends: ["api", "worker"],
      libs: ["sdk", "ui"],
      extensions: ["mongodb", "s3"],
    });
  });
});
