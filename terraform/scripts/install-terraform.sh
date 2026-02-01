#!/bin/bash

# Install Terraform on macOS
# This script installs Terraform using Homebrew

set -e

echo "🚀 Installing Terraform..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is not installed. Please install Homebrew first:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

# Install Terraform
echo "📦 Installing Terraform via Homebrew..."
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Verify installation
if command -v terraform &> /dev/null; then
    echo "✅ Terraform installed successfully!"
    terraform version
else
    echo "❌ Terraform installation failed"
    exit 1
fi

echo ""
echo "🎉 Terraform is ready to use!"
echo "Next steps:"
echo "1. Configure AWS CLI: aws configure"
echo "2. Set up backend: make setup-backend"
echo "3. Initialize environment: make dev-init"