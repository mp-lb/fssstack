output "frontend_urls" {
  description = "Frontend URLs by app name."
  value = {
    for name, app in var.frontends :
    name => "https://${app.domain}"
  }
}

output "backend_urls" {
  description = "Backend URLs by app name."
  value = {
    for name, app in var.backends :
    name => "https://${app.domain}"
  }
}

output "cloud_run_urls" {
  description = "Direct Cloud Run URLs by backend app name."
  value = {
    for name, service in google_cloud_run_v2_service.backend :
    name => service.uri
  }
}

output "frontend_dns_records" {
  description = "DNS records needed for frontend domains."
  value = {
    for name, app in var.frontends :
    name => {
      name    = app.domain
      type    = app.dns_record_type
      content = app.dns_record_content
    }
  }
}

output "backend_dns_records" {
  description = "DNS records needed for backend domains."
  value = {
    for name, app in var.backends :
    name => {
      name    = app.domain
      type    = google_cloud_run_domain_mapping.backend[name].status[0].resource_records[0].type
      content = google_cloud_run_domain_mapping.backend[name].status[0].resource_records[0].rrdata
    }
  }
}

output "artifact_registry" {
  description = "Artifact Registry repository."
  value       = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.backend.repository_id}"
}

output "vercel_project_ids" {
  description = "Vercel project IDs by frontend app name."
  value = {
    for name, project in vercel_project.frontend :
    name => project.id
  }
}

