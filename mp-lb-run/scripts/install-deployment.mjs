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
var terraformTemplates = [
  "backend.tf",
  "budget.tf",
  "dns.tf",
  "frontend.tf",
  "main.tf",
  "outputs.tf",
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
var hclString = (value) => JSON.stringify(String(value));
var renderTfvars = (manifest2) => {
  const lines = [
    `project_name = ${hclString(manifest2.projectName)}`,
    `domain       = ${hclString(manifest2.domain)}`,
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
if (!rawManifest.frontends && !rawManifest.backends) {
  throw new Error("fssstack.json must include frontends or backends.");
}
var manifest = {
  projectName: sanitizeName(
    rawManifest.projectName ?? path.basename(targetRoot)
  ),
  domain: rawManifest.domain ?? "example.com",
  gcpRegion: rawManifest.gcpRegion ?? "asia-southeast1",
  manageCloudflareDns: rawManifest.manageCloudflareDns !== false,
  frontends: rawManifest.frontends ?? [],
  backends: rawManifest.backends ?? []
};
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
writeFile(path.join(targetRoot, "secrets.enc.json"), "{\n}\n");
