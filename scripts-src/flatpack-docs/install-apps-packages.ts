import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { fail, getScriptArgs } from "./lib/args";
import { installFromStore } from "./lib/dx";
import { replaceInFiles, walkFiles } from "./lib/files";
import {
  assertUniqueServices,
  parseServiceList,
  portEnvName,
} from "./lib/services";

const packageFiles: Array<[string, string]> = [
  ["layers/packages/core/package.json", "packages/core/package.json"],
  [
    "layers/packages/core/tsconfig.build.json",
    "packages/core/tsconfig.build.json",
  ],
  ["layers/packages/core/tsconfig.json", "packages/core/tsconfig.json"],
  ["layers/packages/core/vitest.config.ts", "packages/core/vitest.config.ts"],
  ["layers/packages/core/src/index.test.ts", "packages/core/src/index.test.ts"],
  ["layers/packages/core/src/index.ts", "packages/core/src/index.ts"],
  ["layers/packages/server/package.json", "packages/server/package.json"],
  [
    "layers/packages/server/tsconfig.build.json",
    "packages/server/tsconfig.build.json",
  ],
  ["layers/packages/server/tsconfig.json", "packages/server/tsconfig.json"],
  [
    "layers/packages/server/vitest.config.ts",
    "packages/server/vitest.config.ts",
  ],
  ["layers/packages/server/src/context.ts", "packages/server/src/context.ts"],
  [
    "layers/packages/server/src/index.test.ts",
    "packages/server/src/index.test.ts",
  ],
  ["layers/packages/server/src/index.ts", "packages/server/src/index.ts"],
  ["layers/packages/server/src/logger.ts", "packages/server/src/logger.ts"],
  ["layers/packages/server/src/trpc.ts", "packages/server/src/trpc.ts"],
  [
    "layers/packages/server/src/trpcError.ts",
    "packages/server/src/trpcError.ts",
  ],
  ["layers/packages/trpc/package.json", "packages/trpc/package.json"],
  [
    "layers/packages/trpc/tsconfig.build.json",
    "packages/trpc/tsconfig.build.json",
  ],
  ["layers/packages/trpc/tsconfig.json", "packages/trpc/tsconfig.json"],
  ["layers/packages/trpc/vitest.config.ts", "packages/trpc/vitest.config.ts"],
  ["layers/packages/trpc/src/index.test.ts", "packages/trpc/src/index.test.ts"],
  ["layers/packages/trpc/src/index.ts", "packages/trpc/src/index.ts"],
  [
    "layers/packages/trpc/src/procedures/helloWorld.ts",
    "packages/trpc/src/procedures/helloWorld.ts",
  ],
  ["layers/packages/trpc/src/server.ts", "packages/trpc/src/server.ts"],
];

const backendFiles: Array<[string, string]> = [
  ["layers/apps/backend/package.json", "apps/backend/package.json"],
  [
    "layers/apps/backend/tsconfig.build.json",
    "apps/backend/tsconfig.build.json",
  ],
  ["layers/apps/backend/tsconfig.json", "apps/backend/tsconfig.json"],
  ["layers/apps/backend/vitest.config.ts", "apps/backend/vitest.config.ts"],
  ["layers/apps/backend/src/config.ts", "apps/backend/src/config.ts"],
  ["layers/apps/backend/src/index.test.ts", "apps/backend/src/index.test.ts"],
  ["layers/apps/backend/src/index.ts", "apps/backend/src/index.ts"],
];

const args = getScriptArgs();

if (args.length < 1) {
  fail(
    "usage: install-apps-packages.mjs /path/to/target-project [backend-services]",
  );
}

const [targetRoot, ...backendArgs] = args;
const backendServices =
  backendArgs.length === 0
    ? ["backend"]
    : parseServiceList(backendArgs.join(" "));

if (backendServices.length === 0) {
  fail("at least one backend service is required");
}

assertUniqueServices(backendServices, "backend service");
mkdirSync(join(targetRoot!, "apps"), { recursive: true });
mkdirSync(join(targetRoot!, "packages"), { recursive: true });

for (const [sourcePath, targetPath] of packageFiles) {
  installFromStore(sourcePath, join(targetRoot!, targetPath));
}

for (const backendService of backendServices) {
  for (const [sourcePath, targetPath] of backendFiles) {
    installFromStore(
      sourcePath,
      join(targetRoot!, targetPath.replace("backend", backendService)),
    );
  }

  replaceInFiles(walkFiles(join(targetRoot!, "apps", backendService)), {
    __BACKEND_SERVICE_NAME__: backendService,
    __BACKEND_SERVICE_PORT_ENV__: portEnvName(backendService),
  });
}
