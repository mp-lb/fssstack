resource "google_artifact_registry_repository" "backend" {
  location      = var.gcp_region
  repository_id = var.project_name
  format        = "DOCKER"
  description   = "Docker images for ${var.project_name}"
}

