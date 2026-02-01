# ClaimIQ Terraform Makefile
# Simplifies common Terraform operations across environments

.PHONY: help init plan apply destroy validate format clean

# Default environment
ENV ?= dev

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)ClaimIQ Terraform Management$(NC)"
	@echo ""
	@echo "$(YELLOW)Usage:$(NC)"
	@echo "  make <target> [ENV=<environment>]"
	@echo ""
	@echo "$(YELLOW)Environments:$(NC)"
	@echo "  dev      - Development environment (default)"
	@echo "  staging  - Staging environment"
	@echo "  prod     - Production environment"
	@echo ""
	@echo "$(YELLOW)Targets:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-12s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

init: ## Initialize Terraform with backend configuration
	@echo "$(BLUE)Initializing Terraform for $(ENV) environment...$(NC)"
	@if [ ! -f "environments/$(ENV)-backend.hcl" ]; then \
		echo "$(RED)Error: Backend configuration file environments/$(ENV)-backend.hcl not found$(NC)"; \
		echo "$(YELLOW)Please copy and customize from environments/dev-backend.hcl$(NC)"; \
		exit 1; \
	fi
	terraform init -backend-config=environments/$(ENV)-backend.hcl -reconfigure

validate: ## Validate Terraform configuration
	@echo "$(BLUE)Validating Terraform configuration...$(NC)"
	terraform validate

format: ## Format Terraform files
	@echo "$(BLUE)Formatting Terraform files...$(NC)"
	terraform fmt -recursive

plan: validate ## Plan Terraform changes
	@echo "$(BLUE)Planning Terraform changes for $(ENV) environment...$(NC)"
	@if [ ! -f "environments/$(ENV).tfvars" ]; then \
		echo "$(RED)Error: Environment file environments/$(ENV).tfvars not found$(NC)"; \
		exit 1; \
	fi
	terraform plan -var-file=environments/$(ENV).tfvars -out=$(ENV).tfplan

apply: ## Apply Terraform changes
	@echo "$(BLUE)Applying Terraform changes for $(ENV) environment...$(NC)"
	@if [ ! -f "$(ENV).tfplan" ]; then \
		echo "$(RED)Error: Plan file $(ENV).tfplan not found. Run 'make plan ENV=$(ENV)' first$(NC)"; \
		exit 1; \
	fi
	terraform apply $(ENV).tfplan
	@rm -f $(ENV).tfplan

destroy: ## Destroy Terraform resources (with confirmation)
	@echo "$(RED)WARNING: This will destroy all resources in the $(ENV) environment!$(NC)"
	@echo "$(YELLOW)Type 'yes' to continue:$(NC)"
	@read -r CONFIRM; \
	if [ "$$CONFIRM" = "yes" ]; then \
		terraform destroy -var-file=environments/$(ENV).tfvars; \
	else \
		echo "$(GREEN)Destruction cancelled$(NC)"; \
	fi

output: ## Show Terraform outputs
	@echo "$(BLUE)Terraform outputs for $(ENV) environment:$(NC)"
	terraform output

state-list: ## List resources in Terraform state
	@echo "$(BLUE)Resources in Terraform state:$(NC)"
	terraform state list

clean: ## Clean up plan files
	@echo "$(BLUE)Cleaning up plan files...$(NC)"
	rm -f *.tfplan

# Environment-specific shortcuts
dev-init: ## Initialize development environment
	@$(MAKE) init ENV=dev

dev-plan: ## Plan development environment
	@$(MAKE) plan ENV=dev

dev-apply: ## Apply development environment
	@$(MAKE) apply ENV=dev

staging-init: ## Initialize staging environment
	@$(MAKE) init ENV=staging

staging-plan: ## Plan staging environment
	@$(MAKE) plan ENV=staging

staging-apply: ## Apply staging environment
	@$(MAKE) apply ENV=staging

prod-init: ## Initialize production environment
	@$(MAKE) init ENV=prod

prod-plan: ## Plan production environment
	@$(MAKE) plan ENV=prod

prod-apply: ## Apply production environment
	@$(MAKE) apply ENV=prod

# Utility targets
check-env: ## Check if environment files exist
	@echo "$(BLUE)Checking environment configuration for $(ENV)...$(NC)"
	@if [ -f "environments/$(ENV).tfvars" ]; then \
		echo "$(GREEN)✓ Environment file exists: environments/$(ENV).tfvars$(NC)"; \
	else \
		echo "$(RED)✗ Environment file missing: environments/$(ENV).tfvars$(NC)"; \
	fi
	@if [ -f "environments/$(ENV)-backend.hcl" ]; then \
		echo "$(GREEN)✓ Backend config exists: environments/$(ENV)-backend.hcl$(NC)"; \
	else \
		echo "$(RED)✗ Backend config missing: environments/$(ENV)-backend.hcl$(NC)"; \
	fi

setup-backend: ## Setup S3 bucket and DynamoDB table for state management
	@echo "$(BLUE)Setting up Terraform backend resources...$(NC)"
	@echo "$(YELLOW)This will create:$(NC)"
	@echo "  - S3 bucket: your-terraform-state-bucket-name"
	@echo "  - DynamoDB table: terraform-state-lock"
	@echo ""
	@echo "$(RED)Make sure to update the bucket name in backend configuration files!$(NC)"
	@echo "$(YELLOW)Continue? (y/N):$(NC)"
	@read -r CONFIRM; \
	if [ "$$CONFIRM" = "y" ] || [ "$$CONFIRM" = "Y" ]; then \
		aws s3 mb s3://your-terraform-state-bucket-name || true; \
		aws s3api put-bucket-versioning --bucket your-terraform-state-bucket-name --versioning-configuration Status=Enabled; \
		aws s3api put-bucket-encryption --bucket your-terraform-state-bucket-name --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'; \
		aws dynamodb create-table --table-name terraform-state-lock --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 || true; \
		echo "$(GREEN)Backend resources created successfully!$(NC)"; \
	else \
		echo "$(GREEN)Setup cancelled$(NC)"; \
	fi