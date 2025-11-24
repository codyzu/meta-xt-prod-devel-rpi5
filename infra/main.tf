terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Persistent build disk that survives VM churn
resource "google_compute_disk" "build_disk" {
  name  = "xen-build-cache"
  type  = "pd-ssd"
  size  = 200      # GB - adjust to taste
  zone  = var.zone
}

# Spot VM used as the build machine
resource "google_compute_instance" "builder" {
  name         = "xen-yocto-builder"
  machine_type = "n2-standard-8"   # 8 vCPU, 32 GB RAM - tune later
  zone         = var.zone

  # Ubuntu LTS boot disk
  boot_disk {
    initialize_params {
      # Ubuntu 22.04 LTS family on GCP
      image = "projects/ubuntu-os-cloud/global/images/family/ubuntu-2404-lts-amd64"
      size  = 20
      type  = "pd-ssd"
    }
  }

  # Attach the persistent build disk
  attached_disk {
    source      = google_compute_disk.build_disk.id
    device_name = "xen-build-cache"
    mode        = "READ_WRITE"
  }

  network_interface {
    network = "default"

    # External IP so you can SSH in
    access_config {}
  }

  # Spot VM (preemptible) settings
  scheduling {
    preemptible                 = true
    automatic_restart           = false
    provisioning_model          = "SPOT"
    instance_termination_action = "STOP"
  }

  service_account {
    email  = "xen-builder-sa@xen-rpi-builder.iam.gserviceaccount.com"
    scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }

  # Use external script file instead of inline heredoc
  metadata_startup_script = file("${path.module}/startup.sh")
  
  tags = ["xen-yocto-builder"]
}