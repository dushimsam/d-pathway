terraform {
  required_version = ">= 1.6"

  required_providers {
    strettchcloud = {
      source  = "strettch-cloud/strettchcloud"
      version = "~> 1.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

provider "strettchcloud" {
  # api_key is read from the STRETTCH_CLOUD_API_KEY environment variable.
  # Keep it in terraform/.env (git-ignored) and load it via the Makefile.
}
