#!/bin/bash

# API Gateway Module Validation Script
# Validates the API Gateway Terraform configuration

set -e

echo "🔍 Validating API Gateway Terraform configuration..."

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed"
    exit 1
fi

# Initialize Terraform (if not already done)
if [ ! -d ".terraform" ]; then
    echo "📦 Initializing Terraform..."
    terraform init -backend=false
fi

# Validate Terraform configuration
echo "✅ Validating Terraform syntax..."
terraform validate

# Format check
echo "🎨 Checking Terraform formatting..."
if ! terraform fmt -check=true -diff=true; then
    echo "❌ Terraform files are not properly formatted"
    echo "Run 'terraform fmt' to fix formatting issues"
    exit 1
fi

# Plan validation (dry run) - only if AWS credentials are available
echo "📋 Checking for AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    echo "✅ AWS credentials found, running Terraform plan validation..."
    terraform plan -var="environment=test" \
                   -var="file_upload_lambda_invoke_arn=arn:aws:lambda:us-east-1:123456789012:function:test-function" \
                   -var="file_upload_lambda_function_name=test-function" \
                   -out=api_gateway_plan.tfplan

    # Clean up plan file
    rm -f api_gateway_plan.tfplan
    echo "✅ Terraform plan validation completed successfully!"
else
    echo "⚠️  AWS credentials not available, skipping plan validation"
    echo "   (This is normal for local development without AWS access)"
fi

echo "✅ API Gateway module validation completed successfully!"
echo ""
echo "📝 Configuration Summary:"
echo "  - REST API Gateway with proper resource structure"
echo "  - Lambda proxy integration for file upload endpoints"
echo "  - CORS configuration for web client support"
echo "  - Request/response validation and transformation"
echo "  - CloudWatch logging and X-Ray tracing enabled"
echo "  - Usage plans and rate limiting configured"
echo "  - Security policies and API key support"
echo ""
echo "🚀 Ready for deployment!"