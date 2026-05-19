locals {
  redis_enabled = var.redis_backend_name != ""

  redis_url = var.redis_url_override != "" ? var.redis_url_override : (
    local.redis_enabled
    ? "rediss://default:${upstash_redis_database.main[0].password}@${upstash_redis_database.main[0].endpoint}:${upstash_redis_database.main[0].port}"
    : ""
  )
}

resource "upstash_redis_database" "main" {
  count = local.redis_enabled && var.redis_url_override == "" ? 1 : 0

  database_name  = "${var.project_name}-redis"
  region         = "global"
  primary_region = "us-east-1"
  tls            = true
}
