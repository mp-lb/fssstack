import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const importRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cwdRoot = process.cwd();
const repoRoot = [importRoot, cwdRoot].find((candidate) =>
  fs.existsSync(path.join(candidate, "templates", "main.tf")),
) ?? importRoot;
const storeName = process.env.FSSSTACK_DEPLOYMENT_STORE ?? "fssstack-deployment";
const terraformTemplates = [
  "backend.tf",
  "budget.tf",
  "dns.tf",
  "frontend.tf",
  "main.tf",
  "outputs.tf",
  "registry.tf",
  "variables.tf",
];

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const targetRoot = path.resolve(args[0] ?? process.cwd());
const force = args.includes("--force");

const read = (file) => fs.readFileSync(file, "utf8");

const readRepoFile = (relativePath) => {
  const localPath = path.join(repoRoot, relativePath);
  if (fs.existsSync(localPath)) return read(localPath);

  try {
    return execFileSync("dx", ["--store", storeName, "read", relativePath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    });
  } catch (error) {
    throw new Error(`Could not read ${relativePath} from local files or Doctrine store ${storeName}`);
  }
};

const writeFile = (file, content) => {
  if (fs.existsSync(file) && !force) {
    console.log(`skip ${path.relative(targetRoot, file)} already exists`);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log(`write ${path.relative(targetRoot, file)}`);
};

const sanitizeName = (value) => value.replace(/[^a-zA-Z0-9_-]/g, "-");

const hclString = (value) => JSON.stringify(String(value));

const hclMap = (obj, indent = "  ") => {
  const lines = ["{"];
  for (const [key, value] of Object.entries(obj ?? {})) {
    lines.push(`${indent}${key} = ${hclString(value)}`);
  }
  lines.push("}");
  return lines.join("\n");
};

const renderTfvars = (manifest) => {
  const lines = [
    `project_name = ${hclString(manifest.projectName)}`,
    `domain       = ${hclString(manifest.domain)}`,
    `gcp_region   = ${hclString(manifest.gcpRegion ?? "asia-southeast1")}`,
    `manage_cloudflare_dns = ${manifest.manageCloudflareDns === false ? "false" : "true"}`,
    "",
    "frontends = {",
  ];

  for (const app of manifest.frontends ?? []) {
    lines.push(`  ${app.name} = {`);
    lines.push(`    path               = ${hclString(app.path)}`);
    lines.push(`    package            = ${hclString(app.package)}`);
    lines.push(`    domain             = ${hclString(app.domain)}`);
    lines.push(`    build_command      = ${hclString(app.buildCommand)}`);
    lines.push(`    output_directory   = ${hclString(app.outputDirectory)}`);
    lines.push(`    dns_record_type    = ${hclString(app.dnsRecordType ?? "CNAME")}`);
    lines.push(`    dns_record_content = ${hclString(app.dnsRecordContent ?? "cname.vercel-dns.com")}`);
    lines.push("  }");
  }

  lines.push("}", "", "backends = {");

  for (const app of manifest.backends ?? []) {
    lines.push(`  ${app.name} = {`);
    lines.push(`    path    = ${hclString(app.path)}`);
    lines.push(`    package = ${hclString(app.package)}`);
    lines.push(`    domain  = ${hclString(app.domain)}`);
    lines.push(`    port    = ${Number(app.port ?? 8080)}`);
    lines.push("    env     = {}");
    lines.push("  }");
  }

  lines.push("}", "");
  return `${lines.join("\n")}\n`;
};

const renderWorkflow = (template, manifest) => {
  const backendImageSteps = (manifest.backends ?? [])
    .map((backend) => {
      const envName = `IMAGE_${backend.name.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase()}`;
      return `      - name: Build ${backend.name} image
        run: |
          IMAGE="\${{ env.GCP_REGION }}-docker.pkg.dev/\${{ secrets.GCP_PROJECT_ID }}/\${{ env.PROJECT_NAME }}/${backend.name}:\${{ github.sha }}"
          docker build -t "$IMAGE" -f ${backend.path}/Dockerfile .
          docker push "$IMAGE"
          echo "${envName}=$IMAGE" >> "$GITHUB_ENV"`;
    })
    .join("\n\n");

  const frontendSteps = (manifest.frontends ?? [])
    .map((frontend) => {
      return `      - name: Build ${frontend.name}
        run: ${frontend.buildCommand}

      - name: Deploy ${frontend.name} to Vercel
        run: |
          PROJECT_ID=$(terraform -chdir=terraform output -json vercel_project_ids | node -e "let d=''; process.stdin.on('data', c => d += c).on('end', () => console.log(JSON.parse(d)['${frontend.name}']))")
          ORG_ID=$(curl -s -H "Authorization: Bearer \${{ secrets.VERCEL_API_TOKEN }}" https://api.vercel.com/v2/user | node -e "let d=''; process.stdin.on('data', c => d += c).on('end', () => console.log(JSON.parse(d).user.id))")
          VERCEL_PROJECT_ID="$PROJECT_ID" VERCEL_ORG_ID="$ORG_ID" npx vercel deploy ${frontend.outputDirectory} --prod --yes --token=\${{ secrets.VERCEL_API_TOKEN }}`;
    })
    .join("\n\n");

  return template
    .replaceAll("{{PROJECT_NAME}}", manifest.projectName)
    .replaceAll("{{GCP_REGION}}", manifest.gcpRegion ?? "asia-southeast1")
    .replace("{{BACKEND_IMAGE_STEPS}}", backendImageSteps)
    .replace("{{FRONTEND_DEPLOY_STEPS}}", frontendSteps);
};

const manifestPath = path.join(targetRoot, "fssstack.json");
if (!fs.existsSync(manifestPath)) {
  throw new Error(`Missing ${path.relative(targetRoot, manifestPath)}`);
}

const manifest = JSON.parse(read(manifestPath));
if (!manifest.frontends && !manifest.backends) {
  throw new Error("fssstack.json must include frontends or backends.");
}
manifest.projectName = sanitizeName(manifest.projectName ?? path.basename(targetRoot));
manifest.domain = manifest.domain ?? "example.com";

for (const file of terraformTemplates) {
  writeFile(
    path.join(targetRoot, "terraform", file),
    readRepoFile(path.join("templates", file)),
  );
}
writeFile(path.join(targetRoot, "terraform", "terraform.tfvars"), renderTfvars(manifest));

for (const backend of manifest.backends ?? []) {
  const dockerfile = readRepoFile(path.join("templates", "Dockerfile"))
    .replaceAll("{{BACKEND_PACKAGE}}", backend.package)
    .replaceAll("{{BACKEND_PORT}}", String(backend.port ?? 8080));
  writeFile(path.join(targetRoot, backend.path, "Dockerfile"), dockerfile);
}

writeFile(
  path.join(targetRoot, ".github", "workflows", "deploy.yml"),
  renderWorkflow(readRepoFile(path.join("templates", "deploy.yml")), manifest),
);

writeFile(
  path.join(targetRoot, "scripts", "build-runtime-tfvars.mjs"),
  readRepoFile(path.join("templates", "build-runtime-tfvars.mjs")),
);

writeFile(
  path.join(targetRoot, "deployment", "apps.json"),
  `${JSON.stringify(
    {
      projectName: manifest.projectName,
      frontends: manifest.frontends ?? [],
      backends: manifest.backends ?? [],
    },
    null,
    2,
  )}\n`,
);

writeFile(path.join(targetRoot, ".env.production"), "APP_ENV=production\n");
writeFile(path.join(targetRoot, "secrets.enc.json"), "{\n}\n");
