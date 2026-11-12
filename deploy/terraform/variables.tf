variable "host_name" {
  type        = string
  description = "Host name for the compute instance."
  default     = "dpathway-prod"
}

variable "region" {
  type        = string
  description = "Strettch Cloud region slug."
  default     = "KGL-1"
}

variable "image" {
  type        = string
  description = "OS image slug."
  default     = "UBUNTU-24.04"
}

variable "specification" {
  type        = string
  description = <<-EOT
    Compute spec slug (S-{vCPU}C-{RAM}G). 4 GB is the sensible floor: the VM
    builds both the NestJS API and the Next.js app and runs Postgres + Redis +
    two Node processes. Raising this later resizes in place; lowering forces a
    replace, so size up front.
  EOT
  default     = "S-2C-4G"
}

variable "ssh_public_key_path" {
  type        = string
  description = "Path to the SSH public key authorised on the VM."
  default     = "../ssh/dpathway_ed25519.pub"
}

variable "ssh_private_key_path" {
  type        = string
  description = "Path to the matching private key (written into the Ansible inventory)."
  default     = "../ssh/dpathway_ed25519"
}

variable "tags" {
  type        = list(string)
  description = "Tags applied to the compute."
  default     = ["dpathway", "production"]
}
