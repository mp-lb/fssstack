resource "cloudflare_record" "frontend" {
  for_each = var.manage_cloudflare_dns ? var.frontends : {}

  zone_id = var.cloudflare_zone_id
  name    = each.value.domain
  content = each.value.dns_record_content
  type    = each.value.dns_record_type
  proxied = false
  ttl     = 1
}

resource "cloudflare_record" "backend" {
  for_each = var.manage_cloudflare_dns ? var.backends : {}

  zone_id = var.cloudflare_zone_id
  name    = each.value.domain
  content = google_cloud_run_domain_mapping.backend[each.key].status[0].resource_records[0].rrdata
  type    = google_cloud_run_domain_mapping.backend[each.key].status[0].resource_records[0].type
  proxied = false
  ttl     = 1
}

