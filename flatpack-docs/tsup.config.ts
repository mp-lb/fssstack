import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "scripts-src/apply-vite-layer.ts",
    "scripts-src/emoji-favicon.ts",
    "scripts-src/install-apps-packages.ts",
    "scripts-src/install-foundation.ts",
    "scripts-src/normalize-package-versions.ts",
    "scripts-src/patch-vite-layer.ts",
    "scripts-src/render-template.ts",
  ],
  outDir: "scripts",
  format: ["esm"],
  target: "node20",
  bundle: true,
  splitting: false,
  sourcemap: false,
  clean: false,
  dts: false,
  outExtension: () => ({ js: ".mjs" }),
  banner: {
    js: "#!/usr/bin/env node",
  },
});
