import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const githubEnvPath = process.env.GITHUB_ENV;
const githubOutputPath = process.env.GITHUB_OUTPUT;
const gcpCredentialsPath = path.join(root, ".deployment", "gcp-sa-key.json");

type SecretValue = string | Record<string, unknown>;

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

const asEnvValue = (value: SecretValue) =>
  typeof value === "string" ? value : JSON.stringify(value);

const isLikelyBase64Json = (value: string) => {
  if (!/^[A-Za-z0-9+/=\s]+$/.test(value)) return false;
  try {
    return Buffer.from(value, "base64").toString("utf8").trim().startsWith("{");
  } catch {
    return false;
  }
};

const serviceAccountJson = (value: SecretValue) => {
  if (typeof value !== "string") return JSON.stringify(value, null, 2);
  if (value.trim().startsWith("{")) return value;
  if (isLikelyBase64Json(value)) {
    return Buffer.from(value, "base64").toString("utf8");
  }
  return value;
};

const appendGithubEnv = (key: string, value: string) => {
  if (!githubEnvPath) return;
  fs.appendFileSync(githubEnvPath, `${key}=${value}\n`);
};

const appendGithubOutput = (key: string, value: string) => {
  if (!githubOutputPath) return;
  fs.appendFileSync(githubOutputPath, `${key}=${value}\n`);
};

const publicEnv = readEnvFile(path.join(root, ".env.production"));
const secretEnv = readJson<Record<string, SecretValue>>(
  path.join(root, "secrets.json"),
  {},
);
const allEnv = { ...publicEnv, ...secretEnv };

const requiredKeys = [
  "GCP_PROJECT_ID",
  "GCP_REGION",
  "GCP_SA_KEY",
  "VERCEL_API_TOKEN",
];

const optionalKeys = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ZONE_ID",
  "GCP_BILLING_ACCOUNT",
  "MONTHLY_BUDGET_USD",
];

const missing = requiredKeys.filter((key) => !allEnv[key]);
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
  if (value === undefined) continue;
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
