#!/usr/bin/env node

// scripts-src/mp-lb-run/load-deployment-env.ts
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
var root = process.cwd();
var inventoryPath = path.join(root, "deployment", "apps.json");
var mode = process.argv[2] ?? "github-env";
var requiredDeploymentEnv = [
  "GCP_PROJECT_ID",
  "GCP_REGION",
  "GCP_SA_KEY",
  "VERCEL_API_TOKEN"
];
var readJson = (file) => {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${path.relative(root, file)}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
};
var unique = (values) => [...new Set(values)];
var shellQuote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
var mapperCli = `node "$(node -e 'console.log(require("node:fs").realpathSync(process.argv[1]))' "$(command -v tools-env-mapper)")"`;
var runMapper = (args) => {
  execFileSync(
    "npx",
    [
      "-y",
      "--package",
      "@mp-lb/tools-env-mapper",
      "-c",
      [mapperCli, ...args.map(shellQuote)].join(" ")
    ],
    { stdio: "inherit" }
  );
};
var renderYamlMap = (map) => `${Object.entries(map).map(
  ([service, keys]) => keys.length === 0 ? `${service}: []` : `${service}:
${keys.map((key) => `  - ${key}`).join("\n")}`
).join("\n")}
`;
var inventory = readJson(inventoryPath);
if (mode === "tfvars") {
  runMapper([
    "tfvars",
    "--secrets",
    "secrets.json",
    "--public",
    ".env.production",
    "--map",
    "deployment/apps.json",
    "--out",
    "terraform/runtime.auto.tfvars.json"
  ]);
  process.exit(0);
}
if (mode !== "github-env") {
  throw new Error(`Unknown deployment env mode: ${mode}`);
}
var envMap = {
  deployment: unique([
    ...requiredDeploymentEnv,
    ...inventory.deploymentEnv ?? []
  ])
};
for (const app of [
  ...inventory.frontends ?? [],
  ...inventory.backends ?? [],
  ...inventory.workers ?? []
]) {
  envMap[app.name] = app.env ?? [];
}
var tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mp-lb-env-map-"));
var mapPath = path.join(tempDir, "env-map.yaml");
try {
  fs.writeFileSync(mapPath, renderYamlMap(envMap));
  runMapper([
    "github-env",
    "--secrets",
    "secrets.json",
    "--public",
    ".env.production",
    "--map",
    mapPath,
    "--gcp-credentials",
    process.env.RUNNER_TEMP ? path.join(process.env.RUNNER_TEMP, "gcp-sa-key.json") : path.join(root, ".deployment", "gcp-sa-key.json")
  ]);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
