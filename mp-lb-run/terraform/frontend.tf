resource "vercel_project" "frontend" {
  for_each = var.frontends

  name             = "${var.project_name}-${each.key}"
  build_command    = null
  output_directory = null
  root_directory   = null
}

resource "vercel_project_domain" "frontend" {
  for_each = var.frontends

  project_id = vercel_project.frontend[each.key].id
  domain     = each.value.domain
}
