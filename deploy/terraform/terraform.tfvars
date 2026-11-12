# Non-secret deployment inputs. The API key is NOT here — it lives in .env
# (git-ignored) and is read from the STRETTCH_CLOUD_API_KEY environment variable.

host_name     = "dpathway-prod"
region        = "KGL-1"
image         = "UBUNTU-24.04"
specification = "S-2C-4G"
tags          = ["dpathway", "production"]
