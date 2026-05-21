import fs from "node:fs";
import path from "node:path";

type DeploymentApp = {
  name: string;
  env?: string[];
};

type DeploymentInventory = {
  backends?: DeploymentApp[];
};

const root = process.cwd();
const inventoryPath = path.join(root, "deployment", "apps.json");
const outputPath = path.join(root, "terraform", "runtime.auto.tfvars.json");

const readJson = <T>(file: string, fallback: T): T => {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
};

const readEnvFile = (file: string) => {
  if (!fs.existsSync(file)) return {};
  const values: Record<string, string> = {};
  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    values[key] = value.replace(/^"(.*)"$/, "$1");
  }
  return values;
};

const inventory = readJson<DeploymentInventory | null>(inventoryPath, null);
if (!inventory) {
  throw new Error(`Missing ${path.relative(root, inventoryPath)}`);
}

const publicEnv = readEnvFile(path.join(root, ".env.production"));
const secretEnv = readJson<Record<string, string>>(
  path.join(root, "secrets.json"),
  {},
);
const allEnv = { ...publicEnv, ...secretEnv };

const backendImages: Record<string, string> = {};
for (const backend of inventory.backends ?? []) {
  const envName = `IMAGE_${backend.name.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase()}`;
  if (process.env[envName]) {
    backendImages[backend.name] = process.env[envName];
  }
}

const backendEnv: Record<string, Record<string, string>> = {};
const missingBackendEnv: string[] = [];
for (const backend of inventory.backends ?? []) {
  backendEnv[backend.name] = {};
  for (const key of backend.env ?? []) {
    if (key === "REDIS_URL") {
      throw new Error(
        `Do not list REDIS_URL in ${backend.name}.env. Set redis_backend_name in terraform/terraform.tfvars and let Terraform inject REDIS_URL.`,
      );
    }
    if (allEnv[key] === undefined || allEnv[key] === "") {
      missingBackendEnv.push(`${backend.name}.${key}`);
      continue;
    }
    backendEnv[backend.name][key] = allEnv[key];
  }
}

if (missingBackendEnv.length > 0) {
  throw new Error(
    `Missing deployment environment values: ${missingBackendEnv.join(", ")}`,
  );
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  `${JSON.stringify({ backend_images: backendImages, backend_env: backendEnv }, null, 2)}\n`,
);

console.log(`Wrote ${path.relative(root, outputPath)}`);
