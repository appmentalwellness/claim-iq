#!/bin/bash

# Validate Terraform configuration structure
# This script checks the configuration without requiring Terraform to be installed

set -e

echo "🔍 Validating ClaimIQ Terraform configuration..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0

# Function to print status
print_status() {
    local status=$1
    local message=$2
    case $status in
        "OK")
            echo -e "${GREEN}✓${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠${NC} $message"
            ((WARNINGS++))
            ;;
        "ERROR")
            echo -e "${RED}✗${NC} $message"
            ((ERRORS++))
            ;;
        "INFO")
            echo -e "${BLUE}ℹ${NC} $message"
            ;;
    esac
}

# Check if we're in the terraform directory
if [[ ! -f "main.tf" ]]; then
    print_status "ERROR" "Not in terraform directory. Please run from terraform/ directory."
    exit 1
fi

print_status "INFO" "Checking Terraform configuration structure..."

# Check main configuration files
echo ""
echo "📁 Main Configuration Files:"
for file in main.tf variables.tf outputs.tf backend.tf; do
    if [[ -f "$file" ]]; then
        print_status "OK" "$file exists"
    else
        print_status "ERROR" "$file is missing"
    fi
done

# Check modules
echo ""
echo "📦 Terraform Modules:"
modules=("networking" "security" "storage" "database" "dynamodb" "api_gateway" "step_functions")
for module in "${modules[@]}"; do
    if [[ -d "modules/$module" ]]; then
        print_status "OK" "Module $module exists"
        
        # Check module files
        for file in main.tf variables.tf outputs.tf; do
            if [[ -f "modules/$module/$file" ]]; then
                print_status "OK" "  $module/$file exists"
            else
                print_status "ERROR" "  $module/$file is missing"
            fi
        done
    else
        print_status "ERROR" "Module $module is missing"
    fi
done

# Check environment configurations
echo ""
echo "🌍 Environment Configurations:"
environments=("dev" "staging" "prod")
for env in "${environments[@]}"; do
    if [[ -f "environments/$env.tfvars" ]]; then
        print_status "OK" "$env.tfvars exists"
    else
        print_status "WARNING" "$env.tfvars is missing (will use example)"
    fi
    
    if [[ -f "environments/$env-backend.hcl" ]]; then
        print_status "OK" "$env-backend.hcl exists"
    else
        print_status "WARNING" "$env-backend.hcl is missing (will use example)"
    fi
done

# Check example files
echo ""
echo "📋 Example Files:"
example_files=("terraform.tfvars.example" "backend.hcl.example")
for file in "${example_files[@]}"; do
    if [[ -f "$file" ]]; then
        print_status "OK" "$file exists"
    else
        print_status "WARNING" "$file is missing"
    fi
done

# Check scripts
echo ""
echo "🔧 Scripts:"
if [[ -d "scripts" ]]; then
    print_status "OK" "Scripts directory exists"
    for script in scripts/*.sh; do
        if [[ -f "$script" ]]; then
            if [[ -x "$script" ]]; then
                print_status "OK" "$(basename "$script") is executable"
            else
                print_status "WARNING" "$(basename "$script") is not executable"
            fi
        fi
    done
else
    print_status "WARNING" "Scripts directory is missing"
fi

# Check documentation
echo ""
echo "📚 Documentation:"
docs=("README.md" "DEPLOYMENT.md")
for doc in "${docs[@]}"; do
    if [[ -f "$doc" ]]; then
        print_status "OK" "$doc exists"
    else
        print_status "WARNING" "$doc is missing"
    fi
done

# Check Makefile
echo ""
echo "🛠 Build Tools:"
if [[ -f "Makefile" ]]; then
    print_status "OK" "Makefile exists"
else
    print_status "WARNING" "Makefile is missing"
fi

# Check .gitignore
if [[ -f ".gitignore" ]]; then
    print_status "OK" ".gitignore exists"
else
    print_status "WARNING" ".gitignore is missing"
fi

# Syntax check for key files (basic)
echo ""
echo "🔍 Basic Syntax Checks:"

# Check for common Terraform syntax patterns
if grep -q "terraform {" main.tf; then
    print_status "OK" "Terraform block found in main.tf"
else
    print_status "ERROR" "Terraform block missing in main.tf"
fi

if grep -q "provider \"aws\"" main.tf; then
    print_status "OK" "AWS provider configuration found"
else
    print_status "ERROR" "AWS provider configuration missing"
fi

# Check for module declarations
module_count=$(grep -c "module \"" main.tf || echo "0")
if [[ $module_count -gt 0 ]]; then
    print_status "OK" "Found $module_count module declarations"
else
    print_status "WARNING" "No module declarations found"
fi

# Check for backend configuration
if grep -q "backend \"s3\"" backend.tf; then
    print_status "OK" "S3 backend configuration found"
else
    print_status "ERROR" "S3 backend configuration missing"
fi

# Summary
echo ""
echo "📊 Validation Summary:"
echo "======================================"
if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
    print_status "OK" "Configuration validation passed with no issues!"
elif [[ $ERRORS -eq 0 ]]; then
    print_status "WARNING" "Configuration validation passed with $WARNINGS warnings"
    echo ""
    echo "Warnings are typically about missing optional files or configurations."
    echo "The infrastructure should deploy successfully."
else
    print_status "ERROR" "Configuration validation failed with $ERRORS errors and $WARNINGS warnings"
    echo ""
    echo "Please fix the errors before proceeding with deployment."
    exit 1
fi

echo ""
echo "🚀 Next Steps:"
echo "1. Install Terraform: ./scripts/install-terraform.sh"
echo "2. Configure AWS CLI: aws configure"
echo "3. Set up backend: make setup-backend"
echo "4. Initialize environment: make dev-init"
echo "5. Plan deployment: make dev-plan"