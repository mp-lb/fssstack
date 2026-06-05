# Env Mapper Rollout

This mp-lb-run shape is meant to replace custom env plumbing in existing projects after `@mp-lb/tools-env-mapper` is available and published.

Do not migrate these projects as part of base mp-lb-run adoption. Use this as the follow-up checklist:

- `doctrine`: replace `env-map.yaml`, `scripts/load-deployment-env.mjs`, and `scripts/build-runtime-env-vars.mjs` with the generated `deployment/apps.json` inventory, mapper-backed GitHub env loading, and mapper-rendered Terraform runtime env vars.
- `coderadar`: replace the copied `scripts/build-runtime-tfvars.mjs` flow with mapper-rendered `terraform/runtime.auto.tfvars.json` from `deployment/apps.json`.
- `linnea`: replace the copied `scripts/build-runtime-tfvars.mjs` flow with mapper-rendered `terraform/runtime.auto.tfvars.json` from `deployment/apps.json`.
- `mdkit`: replace inline GitHub Actions extraction, masking, and GCP credential normalization with the mapper-backed mp-lb-run workflow shape.
- `zapper`: replace inline GitHub Actions extraction, masking, and GCP credential normalization with the mapper-backed mp-lb-run workflow shape.

The boundary stays the same for each migration: `@mp-lb/tools-env-mapper` owns env parsing/rendering, while mp-lb-run owns generated files, target-project deployment inventory, Terraform variables, and workflow composition.
