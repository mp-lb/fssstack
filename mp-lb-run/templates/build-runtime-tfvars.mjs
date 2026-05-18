#!/usr/bin/env node

// scripts-src/mp-lb-run/build-runtime-tfvars.ts
import fs from "fs";
import path from "path";
var root = process.cwd();
var inventoryPath = path.join(root, "deployment", "apps.json");
var outputPath = path.join(root, "terraform", "runtime.auto.tfvars.json");
var readJson = (file, fallback) => {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
};
var readEnvFile = (file) => {
  if (!fs.existsSync(file)) return {};
  const values = {};
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
var inventory = readJson(inventoryPath, null);
if (!inventory) {
  throw new Error(`Missing ${path.relative(root, inventoryPath)}`);
}
var publicEnv = readEnvFile(path.join(root, ".env.production"));
var secretEnv = readJson(path.join(root, "secrets.json"), {});
var allEnv = { ...publicEnv, ...secretEnv };
var backendImages = {};
for (const backend of inventory.backends ?? []) {
  const envName = `IMAGE_${backend.name.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase()}`;
  if (process.env[envName]) {
    backendImages[backend.name] = process.env[envName];
  }
}
var backendEnv = {};
for (const backend of inventory.backends ?? []) {
  backendEnv[backend.name] = {};
  for (const key of backend.env ?? []) {
    if (allEnv[key] !== void 0) {
      backendEnv[backend.name][key] = allEnv[key];
    }
  }
}
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  `${JSON.stringify({ backend_images: backendImages, backend_env: backendEnv }, null, 2)}
`,
);
console.log(`Wrote ${path.relative(root, outputPath)}`);
