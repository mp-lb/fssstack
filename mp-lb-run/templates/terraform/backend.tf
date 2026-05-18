locals {
  backend_images = {
    for name, app in var.backends :
    name => lookup(var.backend_images, name, app.image != "" ? app.image : "gcr.io/cloudrun/hello")
  }

  backend_env = {
    for name, app in var.backends :
    name => merge(app.env, lookup(var.backend_env, name, {}))
  }
}

resource "google_cloud_run_v2_service" "backend" {
  for_each = var.backends

  name     = "${var.project_name}-${each.key}"
  location = var.gcp_region

  template {
    containers {
      image = local.backend_images[each.key]

      ports {
        container_port = each.value.port
      }

      dynamic "env" {
        for_each = local.backend_env[each.key]
        content {
          name  = env.key
          value = env.value
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
}

resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  for_each = google_cloud_run_v2_service.backend

  project  = each.value.project
  location = each.value.location
  name     = each.value.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_domain_mapping" "backend" {
  for_each = var.backends

  name     = each.value.domain
  location = var.gcp_region

  metadata {
    namespace = var.gcp_project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.backend[each.key].name
  }
}
