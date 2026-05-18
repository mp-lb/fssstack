# Custom Domains

Custom domains are cloud deployment configuration.

Set each app domain in `fssstack.json`, then rerun setup if `terraform/terraform.tfvars` needs regeneration.

For external DNS, set `manage_cloudflare_dns = false` in `terraform/terraform.tfvars` and copy DNS records from:

```bash
terraform output frontend_dns_records
terraform output backend_dns_records
```

Verify:

- Vercel shows frontend domains as valid
- Cloud Run shows backend domain mappings as active
- each backend `/health` URL responds
