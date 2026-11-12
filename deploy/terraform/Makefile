# Loads terraform/.env (which holds STRETTCH_CLOUD_API_KEY) before each command,
# so the key never lands on the CLI or in version control.

SHELL := /bin/bash
LOAD_ENV := set -a; [ -f .env ] && . ./.env; set +a

.PHONY: check-env init plan apply destroy output ip

check-env:
	@if [ ! -f .env ]; then echo "Missing .env — run: cp .env.example .env and add STRETTCH_CLOUD_API_KEY"; exit 1; fi
	@$(LOAD_ENV); if [ -z "$$STRETTCH_CLOUD_API_KEY" ]; then echo "STRETTCH_CLOUD_API_KEY is empty in .env"; exit 1; fi

init: check-env
	@$(LOAD_ENV); terraform init

plan: check-env
	@$(LOAD_ENV); terraform plan

apply: check-env
	@$(LOAD_ENV); terraform apply -auto-approve

destroy: check-env
	@$(LOAD_ENV); terraform destroy -auto-approve

output: check-env
	@$(LOAD_ENV); terraform output

# Print just the public IP (for DNS records).
ip: check-env
	@$(LOAD_ENV); terraform output -raw public_ip
