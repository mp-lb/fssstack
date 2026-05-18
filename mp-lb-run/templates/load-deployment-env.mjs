#!/usr/bin/env node

// scripts-src/mp-lb-run/load-deployment-env.ts
import fs from "fs";
import path from "path";
var root = process.cwd();
var githubEnvPath = process.env.GITHUB_ENV;
var githubOutputPath = process.env.GITHUB_OUTPUT;
var gcpCredentialsPath = path.join(root, ".deployment", "gcp-sa-key.json");
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
var asEnvValue = (value) =>
  typeof value === "string" ? value : JSON.stringify(value);
var isLikelyBase64Json = (value) => {
  if (!/^[A-Za-z0-9+/=\s]+$/.test(value)) return false;
  try {
    return Buffer.from(value, "base64").toString("utf8").trim().startsWith("{");
  } catch {
    return false;
  }
};
var serviceAccountJson = (value) => {
  if (typeof value !== "string") return JSON.stringify(value, null, 2);
  if (value.trim().startsWith("{")) return value;
  if (isLikelyBase64Json(value)) {
    return Buffer.from(value, "base64").toString("utf8");
  }
  return value;
};
var appendGithubEnv = (key, value) => {
  if (!githubEnvPath) return;
  fs.appendFileSync(
    githubEnvPath,
    `${key}=${value}
`,
  );
};
var appendGithubOutput = (key, value) => {
  if (!githubOutputPath) return;
  fs.appendFileSync(
    githubOutputPath,
    `${key}=${value}
`,
  );
};
var publicEnv = readEnvFile(path.join(root, ".env.production"));
var secretEnv = readJson(path.join(root, "secrets.json"), {});
var allEnv = { ...publicEnv, ...secretEnv };
var requiredKeys = [
  "GCP_PROJECT_ID",
  "GCP_REGION",
  "GCP_SA_KEY",
  "VERCEL_API_TOKEN",
];
var optionalKeys = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ZONE_ID",
  "GCP_BILLING_ACCOUNT",
  "MONTHLY_BUDGET_USD",
];
var missing = requiredKeys.filter((key) => !allEnv[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing deployment environment values: ${missing.join(", ")}`,
  );
}
if (secretEnv.GCP_SA_KEY) {
  fs.mkdirSync(path.dirname(gcpCredentialsPath), { recursive: true });
  fs.writeFileSync(
    gcpCredentialsPath,
    serviceAccountJson(secretEnv.GCP_SA_KEY),
  );
  console.log("::add-mask::" + asEnvValue(secretEnv.GCP_SA_KEY));
  appendGithubEnv("GOOGLE_APPLICATION_CREDENTIALS", gcpCredentialsPath);
}
for (const key of [...requiredKeys, ...optionalKeys]) {
  const value = allEnv[key];
  if (value === void 0) continue;
  if (key === "GCP_SA_KEY") continue;
  const envValue = asEnvValue(value);
  if (secretEnv[key]) {
    console.log(`::add-mask::${envValue}`);
  } else {
    appendGithubOutput(key, envValue);
  }
  appendGithubEnv(key, envValue);
}
console.log(
  "Loaded deployment environment from .env.production and secrets.json",
);
