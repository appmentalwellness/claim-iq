#!/bin/bash

# ClaimIQ Deployment Script with JSON Environment Files
# Usage: ./scripts/deploy-json.sh [environment] [region]

set -e

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}
ENV_JSON_FILE="env-${ENVIRONMENT}.json"

echo "🚀 Deploying ClaimIQ ($ENVIRONMENT) with JSON environment files"
echo "📍 Region: $REGION"
echo ""

# Clear any existing AWS credentials first
echo "🧹 Clearing any cached AWS credentials..."
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
unset AWS_SESSION_TOKEN
unset AWS_SECURITY_TOKEN
unset AWS_CREDENTIAL_EXPIRATION

# Set region
export AWS_DEFAULT_REGION=$REGION
export AWS_REGION=$REGION

# Test AWS CLI access with default profile
echo "🔐 Testing AWS CLI access..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured!"
    echo "Please run 'aws configure' or set AWS environment variables"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS credentials configured for account: $AWS_ACCOUNT_ID"

# Step 1: Deploy infrastructure
echo "📦 Step 1: Deploying Terraform infrastructure..."
cd be/terraform

# Initialize if needed
if [ ! -d ".terraform" ]; then
    echo "⚠️  Initializing Terraform..."
    terraform init
fi

# Plan and apply with explicit AWS region
echo "🔍 Planning infrastructure changes..."
terraform plan -var-file=environments/${ENVIRONMENT}.tfvars

echo "🏗️  Applying infrastructure changes..."
terraform apply -var-file=environments/${ENVIRONMENT}.tfvars -auto-approve

cd ..

# Step 2: Generate environment JSON
echo ""
echo "📄 Step 2: Generating ${ENV_JSON_FILE}..."
./scripts/generate-env-json.sh ${ENVIRONMENT}

# Step 3: Deploy serverless
echo ""
echo "⚡ Step 3: Deploying Serverless applications..."
echo "🔧 Using ${ENV_JSON_FILE} for configuration"

# Clear credentials again and ensure we're using the default profile
echo "🧹 Clearing any session credentials for Serverless..."
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
unset AWS_SESSION_TOKEN
unset AWS_SECURITY_TOKEN
unset AWS_CREDENTIAL_EXPIRATION

# Ensure region is set
export AWS_DEFAULT_REGION=$REGION
export AWS_REGION=$REGION

# Verify AWS access before deployment
echo "🔍 Verifying AWS access for Serverless deployment..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not available for Serverless deployment!"
    exit 1
fi

echo "✅ AWS credentials verified for Serverless deployment"

echo ""
echo "📦 Step 3a: Deploying Lambda functions..."
serverless deploy --stage $ENVIRONMENT --region $REGION

echo ""
echo "📦 Step 3b: Deploying Step Functions..."
serverless deploy --config serverless-stepfunctions.yml --stage $ENVIRONMENT --region $REGION

# Step 4: Show results
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Region: $REGION"
echo "  Config file: ${ENV_JSON_FILE}"
echo ""

# Show key outputs
echo "🔗 Key Resources:"
if command -v jq &> /dev/null && [ -f "${ENV_JSON_FILE}" ]; then
    echo "  API Gateway URL: $(jq -r '.API_GATEWAY_URL' ${ENV_JSON_FILE})"
    echo "  S3 Bucket: $(jq -r '.CLAIMS_BUCKET_NAME' ${ENV_JSON_FILE})"
    echo "  DynamoDB Table: $(jq -r '.AGENT_LOGS_TABLE' ${ENV_JSON_FILE})"
else
    echo "  Install 'jq' to see resource details"
fi

echo ""
echo "🧪 Test your deployment:"
if [ -f "${ENV_JSON_FILE}" ]; then
    echo "  Health check: curl \$(jq -r '.API_GATEWAY_URL' ${ENV_JSON_FILE})/health"
else
    echo "  Health check: curl <API_GATEWAY_URL>/health"
fi

echo ""
echo "🏠 For local development:"
echo "  1. Copy ${ENV_JSON_FILE} to env-local.json"
echo "  2. Run: npm run start:local"