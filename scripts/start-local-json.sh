#!/bin/bash

# ClaimIQ Local Development Startup Script (JSON Version)
# Runs Lambda functions locally while connecting to deployed AWS resources

set -e

echo "🚀 Starting ClaimIQ Local Development Environment"
echo "================================================"

# Check if env-local.json exists
if [ ! -f env-local.json ]; then
    echo "❌ env-local.json file not found!"
    echo ""
    echo "💡 Create it by:"
    echo "  1. Deploy infrastructure: ./scripts/deploy-json.sh dev"
    echo "  2. Copy environment file: cp env-dev.json env-local.json"
    echo "  3. Or generate from existing deployment: ./scripts/generate-env-json.sh dev && cp env-dev.json env-local.json"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "❌ 'jq' is required but not installed."
    echo "💡 Install with: brew install jq"
    exit 1
fi

echo "📋 Loading environment variables from env-local.json..."

# Validate key environment variables
CLAIMS_BUCKET_NAME=$(jq -r '.CLAIMS_BUCKET_NAME' env-local.json)
AURORA_CLUSTER_ARN=$(jq -r '.AURORA_CLUSTER_ARN' env-local.json)
AURORA_SECRET_ARN=$(jq -r '.AURORA_SECRET_ARN' env-local.json)
AGENT_LOGS_TABLE=$(jq -r '.AGENT_LOGS_TABLE' env-local.json)
USER_POOL_ID=$(jq -r '.USER_POOL_ID' env-local.json)
USER_POOL_CLIENT_ID=$(jq -r '.USER_POOL_CLIENT_ID' env-local.json)

echo "🔍 Validating environment variables..."
echo "✅ CLAIMS_BUCKET_NAME: $CLAIMS_BUCKET_NAME"
echo "✅ AURORA_CLUSTER_ARN: ${AURORA_CLUSTER_ARN:0:50}..."
echo "✅ AURORA_SECRET_ARN: ${AURORA_SECRET_ARN:0:50}..."
echo "✅ AGENT_LOGS_TABLE: $AGENT_LOGS_TABLE"
echo "✅ USER_POOL_ID: $USER_POOL_ID"
echo "✅ USER_POOL_CLIENT_ID: $USER_POOL_CLIENT_ID"

# Check for null values
if [ "$CLAIMS_BUCKET_NAME" = "null" ] || [ "$AURORA_CLUSTER_ARN" = "null" ]; then
    echo "❌ Some environment variables are null. Please check your env-local.json file."
    exit 1
fi

echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured!"
    echo "Please run 'aws configure' or set AWS environment variables"
    exit 1
fi

echo "✅ AWS credentials configured"

echo "🔨 Building TypeScript..."
npm run build

echo "🚀 Starting serverless offline..."
echo "📡 Local API will be available at: http://localhost:3000"
echo "⚡ Lambda functions will connect to your deployed AWS resources"
echo ""
echo "Available endpoints:"
echo "  GET  http://localhost:3000/health"
echo "  POST http://localhost:3000/upload"
echo "  GET  http://localhost:3000/upload/{claimId}"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start serverless offline
npx serverless offline start --config serverless.local.yml