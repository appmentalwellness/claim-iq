#!/bin/bash

# ClaimIQ Serverless-Only Deployment Script
# Usage: ./scripts/deploy-serverless-only.sh [environment] [region]

set -e

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}
ENV_JSON_FILE="env-${ENVIRONMENT}.json"

echo "⚡ Deploying ClaimIQ Serverless Applications ($ENVIRONMENT)"
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

# Check if environment JSON exists
if [ ! -f "config/environments/${ENVIRONMENT}.json" ]; then
    echo "❌ Environment file config/environments/${ENVIRONMENT}.json not found!"
    echo "Please run the full deployment script first or generate the environment file"
    exit 1
fi

echo "✅ Using environment file: config/environments/${ENVIRONMENT}.json"

# Deploy serverless applications
echo ""
echo "⚡ Deploying Serverless applications..."
echo "🔧 Using ${ENV_JSON_FILE} for configuration"

# Verify AWS access before deployment
echo "🔍 Verifying AWS access for Serverless deployment..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not available for Serverless deployment!"
    exit 1
fi

echo "✅ AWS credentials verified for Serverless deployment"

echo ""
echo "📦 Step 1: Deploying API service..."
cd be/services/api
serverless deploy --stage $ENVIRONMENT --region $REGION
cd ../../..

echo ""
echo "📦 Step 2: Deploying Claim Processor Workflow service..."
cd be/services/workflows/claim-processor-workflow
serverless deploy --stage $ENVIRONMENT --region $REGION
cd ../../../..

# Show results
echo ""
echo "🎉 Serverless deployment complete!"
echo ""
echo "📋 Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Region: $REGION"
echo "  Config file: ${ENV_JSON_FILE}"
echo ""

# Show key outputs
echo "🔗 Key Resources:"
if command -v jq &> /dev/null && [ -f "config/environments/${ENVIRONMENT}.json" ]; then
    echo "  API Gateway URL: $(jq -r '.API_GATEWAY_URL' config/environments/${ENVIRONMENT}.json)"
    echo "  S3 Bucket: $(jq -r '.CLAIMS_BUCKET_NAME' config/environments/${ENVIRONMENT}.json)"
    echo "  DynamoDB Table: $(jq -r '.AGENT_LOGS_TABLE' config/environments/${ENVIRONMENT}.json)"
else
    echo "  Install 'jq' to see resource details"
fi

echo ""
echo "🧪 Test your deployment:"
if [ -f "config/environments/${ENVIRONMENT}.json" ]; then
    echo "  Health check: curl \$(jq -r '.API_GATEWAY_URL' config/environments/${ENVIRONMENT}.json)/health"
else
    echo "  Health check: curl <API_GATEWAY_URL>/health"
fi

echo ""
echo "🏠 For local development:"
echo "  1. Copy config/environments/${ENVIRONMENT}.json to config/environments/local.json"
echo "  2. Run: npm run start:local"