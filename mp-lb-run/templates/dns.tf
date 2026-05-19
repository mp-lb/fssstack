data "cloudflare_zone" "managed" {
  count = var.manage_cloudflare_dns ? 1 : 0

  name       = var.dns_zone_domain
  account_id = var.cloudflare_account_id != "" ? var.cloudflare_account_id : null
}

locals {
  managed_dns_zone_id = var.manage_cloudflare_dns ? data.cloudflare_zone.managed[0].id : ""
}

resource "cloudflare_record" "frontend" {
  for_each = var.manage_cloudflare_dns ? var.frontends : {}

  zone_id = local.managed_dns_zone_id
  name    = each.value.domain
  content = each.value.dns_record_content
  type    = each.value.dns_record_type
  proxied = false
  ttl     = 1
}

resource "cloudflare_record" "backend" {
  for_each = var.manage_cloudflare_dns ? var.backends : {}

  zone_id = local.managed_dns_zone_id
  name    = each.value.domain
  content = google_cloud_run_domain_mapping.backend[each.key].status[0].resource_records[0].rrdata
  type    = google_cloud_run_domain_mapping.backend[each.key].status[0].resource_records[0].type
  proxied = false
  ttl     = 1
}
