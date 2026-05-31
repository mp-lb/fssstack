#!/usr/bin/env node

// scripts-src/flatpack-docs/render-template.ts
import { readFileSync as readFileSync2, writeFileSync as writeFileSync2 } from "fs";
import { join as join2 } from "path";

// scripts-src/flatpack-docs/lib/args.ts
var getScriptArgs = () => {
  const args2 = process.argv.slice(2);
  return args2[0] === "--" ? args2.slice(1) : args2;
};
var fail = (message) => {
  console.error(message);
  process.exit(1);
};

// scripts-src/flatpack-docs/lib/files.ts
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { basename, join, relative } from "path";
var templateFileNames = /* @__PURE__ */ new Set([
  "package.json",
  "zap.yaml",
  "AGENTS.md",
  "README.md",
  "index.html"
]);
var templateFileExtensions = /* @__PURE__ */ new Set([".ts", ".tsx"]);
var walkFiles = (root, options = {}) => {
  const prune = options.prune ?? /* @__PURE__ */ new Set();
  const files = [];
  const visit = (directory) => {
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
var templateFiles = (root) => walkFiles(root, { prune: /* @__PURE__ */ new Set([".git", "node_modules"]) }).filter(
  (file) => {
    const name = basename(file);
    return templateFileNames.has(name) || [...templateFileExtensions].some(
      (extension) => name.endsWith(extension)
    );
  }
);
var replaceInFiles = (files, replacements) => {
  for (const file of files) {
    const before = readFileSync(file, "utf8");
    let after = before;
    for (const [from, to] of Object.entries(replacements)) {
      after = after.split(from).join(to);
    }
    if (after !== before) writeFileSync(file, after);
  }
};
var fileExists = (path) => {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
};

// scripts-src/flatpack-docs/lib/services.ts
var serviceNamePattern = /^[a-z][a-z0-9-]*$/;
var parseServiceList = (raw) => raw.replaceAll(/\([^)]*\)/g, "").replaceAll(",", " ").split(/\s+/).map((part) => part.trim()).filter(Boolean);
var validateServiceName = (serviceName) => {
  if (!serviceNamePattern.test(serviceName)) {
    fail(
      `invalid service name '${serviceName}'; use lowercase letters, numbers, and hyphens`
    );
  }
};
var assertUniqueServices = (serviceNames, label = "service") => {
  const seen = /* @__PURE__ */ new Set();
  for (const serviceName of serviceNames) {
    validateServiceName(serviceName);
    if (seen.has(serviceName)) {
      fail(`duplicate ${label} name '${serviceName}'`);
    }
    seen.add(serviceName);
  }
};
var portEnvName = (serviceName) => `${serviceName.toUpperCase().replaceAll("-", "_")}_PORT`;

// scripts-src/flatpack-docs/lib/template.ts
var emojiFaviconDataUri = (emoji) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text y="75" font-size="80">${emoji}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

// scripts-src/flatpack-docs/lib/yaml.ts
var scalarToYaml = (value) => {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  return `'${value.replaceAll("'", "''")}'`;
};
var valueToYaml = (value, indent) => {
  const pad = " ".repeat(indent);
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    if (typeof value === "string" && value.includes("\n")) {
      return [
        "|",
        ...value.split("\n").map((line) => `${" ".repeat(indent)}${line}`)
      ];
    }
    return [scalarToYaml(value)];
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return ["[]"];
    return value.flatMap((item) => {
      const rendered = valueToYaml(item, indent + 2);
      const [firstLine = "", ...rest] = rendered;
      if (item !== null && typeof item === "object" && !Array.isArray(item)) {
        return [`${pad}- ${firstLine}`, ...rest];
      }
      return [`${pad}- ${firstLine}`, ...rest];
    });
  }
  return objectToYaml(value, indent);
};
var objectToYaml = (value, indent) => {
  const lines = [];
  const pad = " ".repeat(indent);
  for (const [key, item] of Object.entries(value)) {
    const rendered = valueToYaml(item, indent + 2);
    if (rendered.length === 1 && (item === null || typeof item === "boolean" || typeof item === "number" || typeof item === "string")) {
      lines.push(`${pad}${key}: ${rendered[0]}`);
      continue;
    }
    lines.push(`${pad}${key}:`);
    lines.push(...rendered);
  }
  return lines;
};
var jsonToYaml = (value) => `${objectToYaml(value, 0).join("\n")}
`;

// scripts-src/flatpack-docs/render-template.ts
var args = getScriptArgs();
if (args.length < 6 || args.length > 9) {
  fail(
    "usage: render-template.mjs /path/to/target-project project-slug package-scope project-name project-description project-emoji [backend-services] [frontend-clients] [library-packages]"
  );
}
var [
  targetRoot,
  projectSlug,
  packageScope,
  projectName,
  projectDescription,
  projectEmoji,
  backendServicesArg = "backend",
  frontendClientsArg = "frontend",
  libraryPackagesArg = ""
] = args;
var backendServices = parseServiceList(backendServicesArg);
var frontendClients = parseServiceList(frontendClientsArg);
var libraryPackages = parseServiceList(libraryPackagesArg);
if (backendServices.length === 0 || frontendClients.length === 0) {
  fail("at least one backend service and one frontend client are required");
}
assertUniqueServices([
  ...backendServices,
  ...frontendClients,
  ...libraryPackages
]);
var packagePrefix = `${packageScope}/${projectSlug}`;
var firstBackendPortEnv = portEnvName(backendServices[0]);
var firstFrontendPortEnv = portEnvName(frontendClients[0]);
replaceInFiles(templateFiles(targetRoot), {
  __PACKAGE_PREFIX__: packagePrefix,
  __PROJECT_SLUG__: projectSlug,
  __PROJECT_NAME__: projectName,
  __PROJECT_DESCRIPTION__: projectDescription,
  __PROJECT_EMOJI__: projectEmoji,
  __PROJECT_FAVICON__: emojiFaviconDataUri(projectEmoji)
});
for (const frontendClient of frontendClients) {
  const packageJsonPath = join2(
    targetRoot,
    "apps",
    frontendClient,
    "package.json"
  );
  if (!fileExists(packageJsonPath)) continue;
  const packageJson = JSON.parse(readFileSync2(packageJsonPath, "utf8"));
  packageJson.name = `${packagePrefix}-${frontendClient}`;
  writeFileSync2(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}
`);
}
var frontendUrls = frontendClients.map(
  (frontendClient) => `http://localhost:\${${portEnvName(frontendClient)}}`
).join(",");
writeFileSync2(
  join2(targetRoot, ".env.local"),
  [
    "APP_ENV=development",
    `FRONTEND_URL=http://localhost:\${${firstFrontendPortEnv}}`,
    `FRONTEND_URLS=${frontendUrls}`,
    "VITE_APP_ENV=development",
    `VITE_API_BASE_URL=http://localhost:\${${firstBackendPortEnv}}`,
    ""
  ].join("\n")
);
var ports = [...backendServices, ...frontendClients].map(portEnvName);
var nativeServices = Object.fromEntries(
  [...backendServices, ...frontendClients].map((serviceName) => [
    serviceName,
    {
      cmd: `pnpm --filter=${packagePrefix}-${serviceName} dev`,
      env: "*"
    }
  ])
);
writeFileSync2(
  join2(targetRoot, "zap.yaml"),
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
          "pnpm exec eslint {{REST}}"
        ]
      },
      typecheck: {
        cmds: [
          'test -n "{{REST}}" || (echo "usage: zap t typecheck -- <app-or-package-dir...>" >&2; exit 1)',
          [
            "for app_or_package in {{REST}}; do",
            '  pnpm --dir "$app_or_package" run typecheck',
            "done"
          ].join("\n")
        ]
      },
      build: {
        cmds: ["pnpm turbo run build"]
      },
      test: {
        aliases: ["vitest"],
        cmds: ["pnpm test"]
      },
      worktree_setup: {
        cmds: ["pnpm install"]
      }
    }
  })
);
