import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["scripts-src/flatpack-docs/augment-docs-site.ts"],
    outDir: "../fssstack/scripts",
    tsconfig: "tsconfig.docs.json",
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
  },
  {
    entry: ["scripts-src/mp-lb-run/install-deployment.ts"],
    outDir: "../mp-lb-run/scripts",
    tsconfig: "tsconfig.docs.json",
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
  },
  {
    entry: [
      "scripts-src/mp-lb-run/build-runtime-tfvars.ts",
      "scripts-src/mp-lb-run/load-deployment-env.ts",
    ],
    outDir: "../mp-lb-run/templates",
    tsconfig: "tsconfig.docs.json",
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
  },
]);
