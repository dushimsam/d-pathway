output "public_ip" {
  description = "Public IPv4 of the VM — point dpathway.site and api.dpathway.site A records here."
  value       = strettchcloud_compute.dpathway.ipv4
}

output "private_ip" {
  description = "Private IPv4 of the VM."
  value       = strettchcloud_compute.dpathway.private_ipv4
}

output "compute_id" {
  description = "Strettch Cloud compute id."
  value       = strettchcloud_compute.dpathway.id
}

output "ssh_command" {
  description = "SSH into the VM (Strettch Cloud exposes SSH on port 222)."
  value       = "ssh -i ${var.ssh_private_key_path} -p 222 root@${strettchcloud_compute.dpathway.ipv4}"
}
