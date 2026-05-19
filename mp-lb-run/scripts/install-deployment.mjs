#!/usr/bin/env node

// scripts-src/mp-lb-run/install-deployment.ts
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var importRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
var cwdRoot = process.cwd();
var repoRoot = [importRoot, cwdRoot].find(
  (candidate) => fs.existsSync(path.join(candidate, "templates", "main.tf"))
) ?? importRoot;
var storeName = process.env.MP_LB_RUN_STORE ?? "mp-lb-run";
var defaultDomain = "mp-lb.dev";
var legacyDomain = "maplab.dev";
var terraformTemplates = [
  "backend.tf",
  "budget.tf",
  "dns.tf",
  "frontend.tf",
  "main.tf",
  "outputs.tf",
  "redis.tf",
  "registry.tf",
  "variables.tf"
];
var args = process.argv.slice(2).filter((arg) => arg !== "--");
var targetRoot = path.resolve(args[0] ?? process.cwd());
var force = args.includes("--force");
var read = (file) => fs.readFileSync(file, "utf8");
var readRepoFile = (relativePath) => {
  const localPath = path.join(repoRoot, relativePath);
  if (fs.existsSync(localPath)) return read(localPath);
  try {
    return execFileSync("dx", ["--store", storeName, "read", relativePath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"]
    });
  } catch {
    throw new Error(
      `Could not read ${relativePath} from local files or Doctrine store ${storeName}`
    );
  }
};
var writeFile = (file, content) => {
  if (fs.existsSync(file) && !force) {
    console.log(`skip ${path.relative(targetRoot, file)} already exists`);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log(`write ${path.relative(targetRoot, file)}`);
};
var sanitizeName = (value) => value.replace(/[^a-zA-Z0-9_-]/g, "-");
var sanitizeSlug = (value) => value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
var isDnsLabel = (value) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(value);
var isDomain = (value) => value.split(".").every((part) => isDnsLabel(part));
var hclString = (value) => JSON.stringify(String(value));
var serviceDeploymentType = (type) => type === "backend" ? "backend" : "frontend";
var serviceName = (service) => service.name ?? service.subdomain ?? service.type;
var serviceDomain = (rootDomain2, service) => {
  if (service.domain) return normalizeDomain(service.domain);
  return service.subdomain === null ? rootDomain2 : `${service.subdomain}.${rootDomain2}`;
};
var defaultAppDomain = (projectName, type, appName, index) => {
  const safeAppName = sanitizeName(appName).toLowerCase();
  const safeProjectName = sanitizeName(projectName).toLowerCase();
  if (type === "frontend") {
    return index === 0 ? `${safeProjectName}.${defaultDomain}` : `${safeAppName}-${safeProjectName}.${defaultDomain}`;
  }
  return index === 0 ? `api.${safeProjectName}.${defaultDomain}` : `${safeAppName}.${safeProjectName}.${defaultDomain}`;
};
var normalizeDomain = (domain) => {
  if (domain === legacyDomain) return defaultDomain;
  if (domain.endsWith(`.${legacyDomain}`)) {
    return `${domain.slice(0, -legacyDomain.length)}${defaultDomain}`;
  }
  return domain;
};
var validateUnique = (errors, label, values) => {
  const seen = /* @__PURE__ */ new Map();
  for (const item of values) {
    const previousOwner = seen.get(item.value);
    if (previousOwner) {
      errors.push(
        `Duplicate ${label} "${item.value}" for ${previousOwner} and ${item.owner}.`
      );
      continue;
    }
    seen.set(item.value, item.owner);
  }
};
var normalizeServices = (services, rootDomain2) => {
  const errors = [];
  const serviceNames = [];
  const serviceSubdomains = [];
  const serviceDomains = [];
  const frontends = [];
  const backends = [];
  for (const [index, service] of services.entries()) {
    const owner = `services[${index}]`;
    const name = serviceName(service);
    const domain = serviceDomain(rootDomain2, service);
    const deploymentType = serviceDeploymentType(service.type);
    serviceNames.push({ value: name, owner });
    serviceDomains.push({ value: domain, owner });
    if (service.subdomain !== null) {
      serviceSubdomains.push({ value: service.subdomain, owner });
    }
    if (!isDnsLabel(name)) {
      errors.push(`${owner}.name must be a DNS-safe label; received "${name}".`);
    }
    if (!["frontend", "backend", "landing-page"].includes(service.type)) {
      errors.push(
        `${owner}.type must be "frontend", "backend", or "landing-page"; received "${service.type}".`
      );
    }
    if (!service.path) {
      errors.push(`${owner}.path is required.`);
    }
    if (!service.package) {
      errors.push(`${owner}.package is required.`);
    }
    if (deploymentType === "frontend" && !service.buildCommand) {
      errors.push(`${owner}.buildCommand is required for frontend services.`);
    }
    if (deploymentType === "frontend" && !service.outputDirectory) {
      errors.push(`${owner}.outputDirectory is required for frontend services.`);
    }
    if (service.subdomain !== null && typeof service.subdomain !== "string") {
      errors.push(`${owner}.subdomain must be null or a DNS-safe label.`);
    } else if (service.subdomain !== null && !isDnsLabel(service.subdomain)) {
      errors.push(
        `${owner}.subdomain must be null or a DNS-safe label; received "${service.subdomain}".`
      );
    }
    if (!isDomain(domain)) {
      errors.push(`${owner} resolves to invalid domain "${domain}".`);
    }
    const app = {
      ...service,
      name,
      domain
    };
    delete app.type;
    delete app.subdomain;
    if (deploymentType === "backend") {
      backends.push(app);
    } else {
      frontends.push(app);
    }
  }
  validateUnique(errors, "service name", serviceNames);
  validateUnique(errors, "service subdomain", serviceSubdomains);
  validateUnique(errors, "service domain", serviceDomains);
  if (errors.length > 0) {
    throw new Error(`Invalid fssstack.json services:
- ${errors.join("\n- ")}`);
  }
  return { frontends, backends };
};
var normalizeApps = (apps, projectName, type) => apps.map((app, index) => ({
  ...app,
  domain: normalizeDomain(
    app.domain ?? defaultAppDomain(projectName, type, app.name, index)
  )
}));
var renderTfvars = (manifest2) => {
  const lines = [
    `project_name = ${hclString(manifest2.projectName)}`,
    `domain       = ${hclString(manifest2.domain)}`,
    `dns_zone_domain = ${hclString(manifest2.dnsZoneDomain)}`,
    `gcp_region   = ${hclString(manifest2.gcpRegion)}`,
    `manage_cloudflare_dns = ${manifest2.manageCloudflareDns ? "true" : "false"}`,
    "",
    "frontends = {"
  ];
  for (const app of manifest2.frontends) {
    lines.push(`  ${app.name} = {`);
    lines.push(`    path               = ${hclString(app.path)}`);
    lines.push(`    package            = ${hclString(app.package)}`);
    lines.push(`    domain             = ${hclString(app.domain)}`);
    lines.push(`    build_command      = ${hclString(app.buildCommand)}`);
    lines.push(`    output_directory   = ${hclString(app.outputDirectory)}`);
    lines.push(
      `    dns_record_type    = ${hclString(app.dnsRecordType ?? "CNAME")}`
    );
    lines.push(
      `    dns_record_content = ${hclString(app.dnsRecordContent ?? "cname.vercel-dns.com")}`
    );
    lines.push("  }");
  }
  lines.push("}", "", "backends = {");
  for (const app of manifest2.backends) {
    lines.push(`  ${app.name} = {`);
    lines.push(`    path    = ${hclString(app.path)}`);
    lines.push(`    package = ${hclString(app.package)}`);
    lines.push(`    domain  = ${hclString(app.domain)}`);
    lines.push(`    port    = ${Number(app.port ?? 8080)}`);
    lines.push("    env     = {}");
    lines.push("  }");
  }
  lines.push("}", "");
  return `${lines.join("\n")}
`;
};
var renderWorkflow = (template, manifest2) => {
  const backendImageSteps = manifest2.backends.map((backend) => {
    const envName = `IMAGE_${backend.name.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase()}`;
    return `      - name: Build ${backend.name} image
        run: |
          IMAGE="$GCP_REGION-docker.pkg.dev/$GCP_PROJECT_ID/$PROJECT_NAME/${backend.name}:\${{ github.sha }}"
          docker build -t "$IMAGE" -f ${backend.path}/Dockerfile .
          docker push "$IMAGE"
          echo "${envName}=$IMAGE" >> "$GITHUB_ENV"`;
  }).join("\n\n");
  const frontendSteps = manifest2.frontends.map((frontend) => {
    return `      - name: Build ${frontend.name}
        run: ${frontend.buildCommand}

      - name: Deploy ${frontend.name} to Vercel
        run: |
          PROJECT_ID=$(terraform -chdir=terraform output -json vercel_project_ids | node -e "let d=''; process.stdin.on('data', c => d += c).on('end', () => console.log(JSON.parse(d)['${frontend.name}']))")
          ORG_ID=$(curl -s -H "Authorization: Bearer $VERCEL_API_TOKEN" https://api.vercel.com/v2/user | node -e "let d=''; process.stdin.on('data', c => d += c).on('end', () => console.log(JSON.parse(d).user.id))")
          VERCEL_PROJECT_ID="$PROJECT_ID" VERCEL_ORG_ID="$ORG_ID" npx vercel deploy ${frontend.outputDirectory} --prod --yes --token="$VERCEL_API_TOKEN"`;
  }).join("\n\n");
  return template.replaceAll("{{PROJECT_NAME}}", manifest2.projectName).replace("{{BACKEND_IMAGE_STEPS}}", backendImageSteps).replace("{{FRONTEND_DEPLOY_STEPS}}", frontendSteps);
};
var manifestPath = path.join(targetRoot, "fssstack.json");
if (!fs.existsSync(manifestPath)) {
  throw new Error(`Missing ${path.relative(targetRoot, manifestPath)}`);
}
var rawManifest = JSON.parse(read(manifestPath));
if (!rawManifest.services && !rawManifest.frontends && !rawManifest.backends) {
  throw new Error("fssstack.json must include services, frontends, or backends.");
}
var projectSlug = sanitizeSlug(
  rawManifest.projectSlug ?? rawManifest.projectName ?? path.basename(targetRoot)
);
if (!projectSlug || !isDnsLabel(projectSlug)) {
  throw new Error(`Invalid projectSlug "${rawManifest.projectSlug ?? rawManifest.projectName ?? path.basename(targetRoot)}".`);
}
var hasCustomDomain = Object.hasOwn(rawManifest, "customDomain");
var customDomain = rawManifest.customDomain === null || rawManifest.customDomain === void 0 ? null : normalizeDomain(rawManifest.customDomain);
var legacyManifestDomain = rawManifest.domain ? normalizeDomain(rawManifest.domain) : void 0;
var legacyBaseDomain = rawManifest.baseDomain ? normalizeDomain(rawManifest.baseDomain) : void 0;
var rootDomain = hasCustomDomain ? customDomain ?? `${projectSlug}.${defaultDomain}` : legacyManifestDomain ?? `${projectSlug}.${legacyBaseDomain ?? defaultDomain}`;
var dnsZoneDomain = hasCustomDomain && customDomain === null ? defaultDomain : !hasCustomDomain && !legacyManifestDomain ? legacyBaseDomain ?? defaultDomain : rootDomain;
if (!isDomain(rootDomain)) {
  throw new Error(`Resolved root domain is invalid: "${rootDomain}".`);
}
if (!isDomain(dnsZoneDomain)) {
  throw new Error(`Resolved DNS zone domain is invalid: "${dnsZoneDomain}".`);
}
var manifest = {
  projectName: projectSlug,
  domain: rootDomain,
  dnsZoneDomain,
  gcpRegion: rawManifest.gcpRegion ?? "asia-southeast1",
  manageCloudflareDns: rawManifest.manageCloudflareDns !== false,
  frontends: [],
  backends: []
};
if (rawManifest.services) {
  const services = normalizeServices(
    rawManifest.services,
    manifest.domain
  );
  manifest.frontends = services.frontends;
  manifest.backends = services.backends;
} else {
  manifest.frontends = normalizeApps(
    rawManifest.frontends ?? [],
    manifest.projectName,
    "frontend"
  );
  manifest.backends = normalizeApps(
    rawManifest.backends ?? [],
    manifest.projectName,
    "backend"
  );
}
for (const file of terraformTemplates) {
  writeFile(
    path.join(targetRoot, "terraform", file),
    readRepoFile(path.join("templates", file))
  );
}
writeFile(
  path.join(targetRoot, "terraform", "terraform.tfvars"),
  renderTfvars(manifest)
);
for (const backend of manifest.backends) {
  const dockerfile = readRepoFile(path.join("templates", "Dockerfile")).replaceAll("{{BACKEND_PACKAGE}}", backend.package).replaceAll("{{BACKEND_PORT}}", String(backend.port ?? 8080));
  writeFile(path.join(targetRoot, backend.path, "Dockerfile"), dockerfile);
}
writeFile(
  path.join(targetRoot, ".github", "workflows", "deploy.yml"),
  renderWorkflow(readRepoFile(path.join("templates", "deploy.yml")), manifest)
);
writeFile(
  path.join(targetRoot, "scripts", "build-runtime-tfvars.mjs"),
  readRepoFile(path.join("templates", "build-runtime-tfvars.mjs"))
);
writeFile(
  path.join(targetRoot, "scripts", "load-deployment-env.mjs"),
  readRepoFile(path.join("templates", "load-deployment-env.mjs"))
);
writeFile(
  path.join(targetRoot, "deployment", "apps.json"),
  `${JSON.stringify(
    {
      projectName: manifest.projectName,
      frontends: manifest.frontends,
      backends: manifest.backends
    },
    null,
    2
  )}
`
);
writeFile(
  path.join(targetRoot, ".env.production"),
  readRepoFile(path.join("templates", "env.production"))
);
writeFile(path.join(targetRoot, "secrets.json.enc"), "{\n}\n");
