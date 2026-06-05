import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type DeploymentApp = {
  name: string;
  env?: string[];
};

type DeploymentInventory = {
  deploymentEnv?: string[];
  frontends?: DeploymentApp[];
  backends?: DeploymentApp[];
  workers?: DeploymentApp[];
};

const root = process.cwd();
const inventoryPath = path.join(root, "deployment", "apps.json");
const mode = process.argv[2] ?? "github-env";
const requiredDeploymentEnv = [
  "GCP_PROJECT_ID",
  "GCP_REGION",
  "GCP_SA_KEY",
  "VERCEL_API_TOKEN",
];

const readJson = <T>(file: string): T => {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${path.relative(root, file)}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
};

const unique = (values: string[]) => [...new Set(values)];
const shellQuote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
const mapperCli =
  'node "$(node -e \'console.log(require("node:fs").realpathSync(process.argv[1]))\' "$(command -v tools-env-mapper)")"';
const runMapper = (args: string[]) => {
  execFileSync(
    "npx",
    [
      "-y",
      "--package",
      "@mp-lb/tools-env-mapper",
      "-c",
      [mapperCli, ...args.map(shellQuote)].join(" "),
    ],
    { stdio: "inherit" },
  );
};
const renderYamlMap = (map: Record<string, string[]>) =>
  `${Object.entries(map)
    .map(([service, keys]) =>
      keys.length === 0
        ? `${service}: []`
        : `${service}:\n${keys.map((key) => `  - ${key}`).join("\n")}`,
    )
    .join("\n")}\n`;

const inventory = readJson<DeploymentInventory>(inventoryPath);

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
    "terraform/runtime.auto.tfvars.json",
  ]);
  process.exit(0);
}

if (mode !== "github-env") {
  throw new Error(`Unknown deployment env mode: ${mode}`);
}

const envMap: Record<string, string[]> = {
  deployment: unique([
    ...requiredDeploymentEnv,
    ...(inventory.deploymentEnv ?? []),
  ]),
};

for (const app of [
  ...(inventory.frontends ?? []),
  ...(inventory.backends ?? []),
  ...(inventory.workers ?? []),
]) {
  envMap[app.name] = app.env ?? [];
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mp-lb-env-map-"));
const mapPath = path.join(tempDir, "env-map.yaml");

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
    process.env.RUNNER_TEMP
      ? path.join(process.env.RUNNER_TEMP, "gcp-sa-key.json")
      : path.join(root, ".deployment", "gcp-sa-key.json"),
  ]);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
