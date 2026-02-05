#!/bin/bash

# Generate Environment JSON from Terraform Outputs
# Usage: ./scripts/generate-env-json.sh [environment]

set -e

ENVIRONMENT=${1:-dev}
TERRAFORM_OUTPUT_FILE="terraform-outputs-${ENVIRONMENT}.json"
ENV_JSON_FILE="config/environments/${ENVIRONMENT}.json"

echo "🔧 Generating ${ENV_JSON_FILE} from Terraform outputs..."

# Check if we're in the right directory
if [ ! -d "be/terraform" ]; then
    echo "❌ Error: be/terraform directory not found. Run this script from the project root."
    exit 1
fi

# Navigate to terraform directory
cd be/terraform

# Check if Terraform is initialized
if [ ! -d ".terraform" ]; then
    echo "⚠️  Terraform not initialized. Initializing now..."
    terraform init
fi

# Generate Terraform JSON output
echo "📄 Generating terraform outputs JSON..."
terraform output -json > "../${TERRAFORM_OUTPUT_FILE}"

# Navigate back to project root
cd ..

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "❌ Error: 'jq' is required but not installed."
    echo "💡 Install with: brew install jq"
    exit 1
fi

# Extract values and create environment JSON
echo "🔄 Converting to environment JSON format..."

cat > ${ENV_JSON_FILE} << EOF
{
  "ENVIRONMENT": "${ENVIRONMENT}",
  "AWS_REGION": "us-east-1",
  "CLAIMS_BUCKET_NAME": $(jq '.claims_bucket_name.value' ${TERRAFORM_OUTPUT_FILE}),
  "AURORA_CLUSTER_ARN": $(jq '.aurora_cluster_arn.value' ${TERRAFORM_OUTPUT_FILE}),
  "AURORA_SECRET_ARN": $(jq '.aurora_secret_arn.value' ${TERRAFORM_OUTPUT_FILE}),
  "DATABASE_NAME": "claimiq",
  "AGENT_LOGS_TABLE": $(jq '.dynamodb_table_names.value.agent_logs' ${TERRAFORM_OUTPUT_FILE}),
  "USER_POOL_ID": $(jq '.cognito_user_pool_id.value' ${TERRAFORM_OUTPUT_FILE}),
  "USER_POOL_CLIENT_ID": $(jq '.cognito_user_pool_client_id.value' ${TERRAFORM_OUTPUT_FILE}),
  "LAMBDA_EXECUTION_ROLE_ARN": $(jq '.lambda_execution_role_arn.value' ${TERRAFORM_OUTPUT_FILE}),
  "LAMBDA_SECURITY_GROUP_ID": $(jq '.lambda_security_group_id.value' ${TERRAFORM_OUTPUT_FILE}),
  "PRIVATE_SUBNET_IDS": $(jq '.private_subnet_ids.value' ${TERRAFORM_OUTPUT_FILE}),
  "API_GATEWAY_ID": $(jq '.api_gateway_id.value' ${TERRAFORM_OUTPUT_FILE}),
  "API_GATEWAY_ROOT_RESOURCE_ID": $(jq '.api_gateway_root_resource_id.value' ${TERRAFORM_OUTPUT_FILE}),
  "API_GATEWAY_URL": $(jq '.api_gateway_url.value' ${TERRAFORM_OUTPUT_FILE}),
  "MAX_FILE_SIZE_MB": "50"
}
EOF

# Clean up terraform outputs file (optional)
rm -f ${TERRAFORM_OUTPUT_FILE}

# Verify the file was created
if [ -f "${ENV_JSON_FILE}" ]; then
    echo "✅ Successfully generated ${ENV_JSON_FILE}"
    echo "📊 File contains $(jq 'keys | length' ${ENV_JSON_FILE}) environment variables"
    
    # Show a preview
    echo ""
    echo "🔍 Preview of environment variables:"
    jq 'keys[]' ${ENV_JSON_FILE} | head -8
    
    if [ $(jq 'keys | length' ${ENV_JSON_FILE}) -gt 8 ]; then
        echo "... and $(( $(jq 'keys | length' ${ENV_JSON_FILE}) - 8 )) more"
    fi
else
    echo "❌ Error: Failed to generate ${ENV_JSON_FILE}"
    exit 1
fi

echo ""
echo "🎉 Ready for serverless deployment!"
echo "💡 Run: serverless deploy --stage ${ENVIRONMENT}"
echo ""
echo "📋 For local development:"
echo "  1. Copy ${ENV_JSON_FILE} to config/environments/local.json"
echo "  2. Run: npm run start:local"