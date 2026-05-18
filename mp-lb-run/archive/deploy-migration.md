# Deployment Migration Brief

## Background

FSS Stack used to live as a single template-style repository for a batteries-included Node monorepo. It included a basic client/server application, default configuration, project guidelines, extension documentation, and Terraform that could deploy the default stack for the organization on first push to GitHub.

Over time it became clear that the reusable value was mostly documentation and setup guidance rather than checked-in generated application code. Much of the template application was equivalent to running common scaffolding tools, such as Vite, Next.js, shadcn/ui, and related setup commands, followed by a small number of defaults and edits.

The deployment layer was also too environment-specific. The original Terraform worked well for the default organizational deployment path, but became friction when a project needed to deploy into another infrastructure environment. In those cases, the Terraform had to be removed or replaced.

The current direction is to split the system into documentation layers:

- `~/Code/fssstack`: the main Doctrine documentation repo for the core stack, standards, skills, and extensions.
- `~/Code/fssstack-deployment`: this repo, focused on deployment-specific documentation and infrastructure guidance.

The word "repo" here refers to Doctrine repositories, not GitHub repositories. Doctrine repos can reference other Doctrine repos. Some referenced Doctrine repos exist remotely but may not be present on disk locally.

## Relevant Local Repositories

### `~/Code/fssstack`

This is the main FSS Stack Doctrine repo.

Important constraints:

- Only `~/Code/fssstack/extensions` should be edited for this migration.
- Do not touch other areas of `~/Code/fssstack`.

Known Doctrine references:

- `fssstack/extensions`: present locally and contains the extension docs.
- `fssstack/standards`: may be remote-only locally.
- `fssstack/skills`: may be remote-only locally.

### `~/Code/fssstack-deployment`

This is the deployment-specific Doctrine repo.

It currently contains Terraform and deployment docs for the basic deployment target. The base deployment should be kept clean and focused on the default stack:

- frontend
- backend
- domain and routing setup needed to host the website
- supporting infrastructure that is truly part of the base deployment

Extension-specific deployment material should live separately from the base deployment docs.

### `~/Code/coderadar`

This is a fresh project generated from the latest setup process and can be used as a reference for the current expected project shape.

Important constraints:

- Do not edit `~/Code/coderadar`.
- Use it only as a read-only reference if needed.
- It already has the Clerk extension installed, so that should be taken into account when comparing extension assumptions.

## Problem

The original extension docs were written when the template repo and deployment environment were bundled together. As a result, many extensions assume they are being installed into the original deployment setup.

This creates several problems:

- Extension docs may include deployment-specific Terraform or infrastructure assumptions.
- Extension docs may prescribe stale or overly specific implementation details.
- Extension docs may not match the current project shape produced by the latest setup process.
- Deployment docs in this repo may mix base deployment concerns with extension-specific deployment concerns.

The migration needs to separate core application extension guidance from deployment-specific guidance, while keeping both layers coherent and maintainable.

## Goals

1. Move deployment-related extension material out of the core extension docs.
2. Put extension deployment guidance into clearly named deployment docs in this repo, such as `extensions/bull-deploy.md`.
3. Keep the remaining core extension docs simple, coherent, and less prescriptive where old details may be stale.
4. Make extension docs assume installation into a project shaped like the current setup output, using `~/Code/coderadar` as a read-only reference.
5. Keep this repo focused on deployment documentation.
6. Ensure the base deployment material in this repo refers only to the frontend/backend default stack and its required hosting infrastructure.

## Non-Goals

- Do not restore the old all-in-one template repository model.
- Do not make deployment assumptions mandatory for all FSS Stack users.
- Do not require Terraform as the only deployment path for extensions.
- Do not rewrite unrelated standards, skills, or core docs outside `~/Code/fssstack/extensions`.
- Do not modify the generated reference project at `~/Code/coderadar`.

## Guardrails

- Do not edit anything in `~/Code/fssstack` outside `~/Code/fssstack/extensions`.
- Do not edit anything in `~/Code/coderadar`.
- Keep changes in `~/Code/fssstack-deployment` clearly separated by concern.
- Keep base deployment docs separate from extension deployment docs.
- Preserve useful existing guidance, but remove or relocate assumptions that belong to deployment.

## Proposed Documentation Structure

This repo should distinguish between base deployment and extension deployment.

Suggested structure:

```text
fssstack-deployment/
  docs/
    deployment-setup.md
    deployment-runbook.md
    terraform.md
  extensions/
    bull-deploy.md
    database-deploy.md
    object-storage-deploy.md
    auth-deploy.md
  terraform/
    ...
```

The exact extension deployment filenames can be adjusted to match the extension names in `~/Code/fssstack/extensions`.

## Migration Workstreams

### 1. Inventory Extension Docs

Review `~/Code/fssstack/extensions` and identify:

- extension names
- deployment-specific sections
- Terraform snippets
- provider-specific infrastructure assumptions
- environment variable assumptions
- CI/CD assumptions
- references to old template paths, generated files, or obsolete project layout

### 2. Split Deployment Guidance

For each extension with deployment-specific material:

- move deployment material into this repo under `extensions/<extension>-deploy.md`
- leave a short pointer in the core extension doc when useful
- keep the core extension doc focused on app-level installation and integration

Deployment material includes:

- Terraform resources
- cloud provider configuration
- DNS/routing configuration
- secret storage conventions
- deployment pipeline changes
- production sizing or operational setup
- infrastructure-specific environment variable wiring

### 3. Simplify Core Extension Docs

After deployment material is removed, each core extension doc should:

- describe what the extension adds
- list app-level dependencies
- explain expected files or commands
- describe required environment variables without assuming a specific hosting platform
- keep implementation guidance conservative
- avoid stale generated-code assumptions

### 4. Validate Against Fresh Project Shape

Use `~/Code/coderadar` as the read-only reference for the current setup output.

Check extension docs against:

- package manager and workspace layout
- frontend/backend directories
- current config file names
- environment variable conventions
- existing Clerk extension installation
- current scripts and development commands

### 5. Clean Base Deployment Docs

Review this repo's existing deployment docs and Terraform.

The base deployment should cover only:

- frontend deployment
- backend deployment
- routing/domain setup
- baseline secrets and environment wiring
- base CI/CD flow, if applicable

Extension-specific deployment assumptions should be removed from base docs and moved into `extensions/`.

## Open Questions

- What exact naming convention should extension deployment docs use: `<extension>-deploy.md`, `<extension>-deployment.md`, or a grouped structure per extension?
- Should this repo include Terraform modules for extension infrastructure, or only deployment documentation and examples?
- How should Doctrine references link core extension docs in `~/Code/fssstack/extensions` to deployment docs in this repo?
- Which extensions are still current enough to preserve in detail, and which should be reduced to high-level guidance until refreshed?

## Initial Acceptance Criteria

- Every extension doc in `~/Code/fssstack/extensions` has been reviewed for deployment coupling.
- Deployment-specific extension material has been moved or copied into this repo under a clear `extensions/` structure.
- Core extension docs no longer assume the default Terraform deployment environment.
- Core extension docs remain useful for local app installation.
- This repo's base deployment docs describe only the frontend/backend default deployment.
- `~/Code/coderadar` has not been modified.
- No files outside `~/Code/fssstack/extensions` have been modified in `~/Code/fssstack`.

