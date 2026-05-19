import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fail, getScriptArgs } from "./lib/args";
import { fileExists, replaceInFiles, templateFiles } from "./lib/files";
import {
  assertUniqueServices,
  parseServiceList,
  portEnvName,
} from "./lib/services";
import { emojiFaviconDataUri } from "./lib/template";
import { jsonToYaml } from "./lib/yaml";

const args = getScriptArgs();

if (args.length < 6 || args.length > 10) {
  fail(
    "usage: render-template.mjs /path/to/target-project project-slug package-scope project-name project-description project-emoji [backend-services] [frontend-clients] [cli-packages] [library-packages]",
  );
}

const [
  targetRoot,
  projectSlug,
  packageScope,
  projectName,
  projectDescription,
  projectEmoji,
  backendServicesArg = "backend",
  frontendClientsArg = "frontend",
  cliPackagesArg = "",
  libraryPackagesArg = "",
] = args as [
  string,
  string,
  string,
  string,
  string,
  string,
  string?,
  string?,
  string?,
  string?,
];

const backendServices = parseServiceList(backendServicesArg);
const frontendClients = parseServiceList(frontendClientsArg);
const cliPackages = parseServiceList(cliPackagesArg);
const libraryPackages = parseServiceList(libraryPackagesArg);

if (backendServices.length === 0 || frontendClients.length === 0) {
  fail("at least one backend service and one frontend client are required");
}

assertUniqueServices([
  ...backendServices,
  ...frontendClients,
  ...cliPackages,
  ...libraryPackages,
]);

const packagePrefix = `${packageScope}/${projectSlug}`;
const firstBackendPortEnv = portEnvName(backendServices[0]!);
const firstFrontendPortEnv = portEnvName(frontendClients[0]!);

replaceInFiles(templateFiles(targetRoot), {
  __PACKAGE_PREFIX__: packagePrefix,
  __PROJECT_SLUG__: projectSlug,
  __PROJECT_NAME__: projectName,
  __PROJECT_DESCRIPTION__: projectDescription,
  __PROJECT_EMOJI__: projectEmoji,
  __PROJECT_FAVICON__: emojiFaviconDataUri(projectEmoji),
});

for (const frontendClient of frontendClients) {
  const packageJsonPath = join(
    targetRoot,
    "apps",
    frontendClient,
    "package.json",
  );

  if (!fileExists(packageJsonPath)) continue;

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    name?: string;
    [key: string]: unknown;
  };

  packageJson.name = `${packagePrefix}-${frontendClient}`;
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

const frontendUrls = frontendClients
  .map(
    (frontendClient) => `http://localhost:\${${portEnvName(frontendClient)}}`,
  )
  .join(",");

writeFileSync(
  join(targetRoot, ".env.local"),
  [
    "APP_ENV=development",
    `FRONTEND_URL=http://localhost:\${${firstFrontendPortEnv}}`,
    `FRONTEND_URLS=${frontendUrls}`,
    "VITE_APP_ENV=development",
    `VITE_API_BASE_URL=http://localhost:\${${firstBackendPortEnv}}`,
    "",
  ].join("\n"),
);

const ports = [...backendServices, ...frontendClients].map(portEnvName);
const nativeServices = Object.fromEntries(
  [...backendServices, ...frontendClients].map((serviceName) => [
    serviceName,
    {
      cmd: `pnpm --filter=${packagePrefix}-${serviceName} dev`,
      env: "*",
    },
  ]),
);

writeFileSync(
  join(targetRoot, "zap.yaml"),
  jsonToYaml({
    project: projectSlug,
    env_files: [".env.local", ".env"],
    homepage: `http://localhost:\${${firstFrontendPortEnv}}`,
    ports,
    native: nativeServices,
    tasks: {
      lint: {
        cmds: [
          'test -n "{{REST}}" || (echo "usage: zap t lint -- <file...>" >&2; exit 1)',
          "pnpm exec eslint {{REST}}",
        ],
      },
      typecheck: {
        cmds: [
          'test -n "{{REST}}" || (echo "usage: zap t typecheck -- <app-or-package-dir...>" >&2; exit 1)',
          [
            "for app_or_package in {{REST}}; do",
            '  pnpm --dir "$app_or_package" run typecheck',
            "done",
          ].join("\n"),
        ],
      },
      build: {
        cmds: ["pnpm turbo run build"],
      },
      test: {
        aliases: ["vitest"],
        cmds: ["pnpm test"],
      },
      worktree_setup: {
        cmds: ["pnpm install"],
      },
    },
  }),
);
