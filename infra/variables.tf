variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "region" {
  type        = string
  description = "GCP region"
  default     = "europe-west1"
}

variable "zone" {
  type        = string
  description = "GCP zone"
  default     = "europe-west1-b"
}