# Terraform + Serverless Integration Pattern

This project uses a hybrid approach where **Terraform manages infrastructure** and **Serverless manages application logic**.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Terraform     │    │   Serverless    │
│                 │    │                 │
│ • API Gateway   │◄──►│ • Lambda Code   │
│ • VPC/Security  │    │ • API Routes    │
│ • Database      │    │ • Step Functions│
│ • S3 Buckets    │    │ • Event Triggers│
│ • IAM Roles     │    │                 │
└─────────────────┘    └─────────────────┘
```

## How It Works

### 1. Terraform Creates Infrastructure
- API Gateway REST API (empty structure)
- VPC, subnets, security groups
- RDS Aurora cluster
- S3 buckets
- IAM roles and policies
- DynamoDB tables

### 2. Serverless References Existing Infrastructure
- Deploys Lambda functions
- Adds routes to existing API Gateway using `restApiId`
- Configures Step Functions
- Sets up S3 event triggers

### 3. Key Integration Points

#### API Gateway Integration with Authorization
```yaml
# serverless.yml - Provider level configuration
provider:
  apiGateway:
    restApiId: ${param:apiGatewayId}                    # From Terraform
    restApiRootResourceId: ${param:apiGatewayRootResourceId}  # From Terraform
    # Global authorizer for all HTTP events
    request:
      authorizer:
        name: authorizer                                # References authorizer function
        type: request
        resultTtlInSeconds: 300
        identitySource: method.request.header.Authorization

functions:
  authorizer:                          # JWT authorizer function
    handler: src/lambda/authorizer/index.handler
    
  fileUpload:
    events:
      - http:                          # Automatically uses global authorizer
          path: upload
          method: post
          
  healthCheck:
    events:
      - http:
          path: health
          method: get
          authorizer: false            # Explicitly disable for public endpoints
```

#### Infrastructure Parameters
```bash
# Deployment script passes Terraform outputs to Serverless
serverless deploy \
  --param="apiGatewayId=$API_GATEWAY_ID" \
  --param="claimsBucketName=$CLAIMS_BUCKET" \
  --param="lambdaExecutionRoleArn=$LAMBDA_ROLE_ARN"
```

## Deployment Process

### Option 1: Integrated Script (Recommended)
```bash
./deploy-integrated.sh dev us-east-1
```

This script:
1. Deploys Terraform infrastructure
2. Extracts Terraform outputs
3. Deploys Serverless with infrastructure parameters
4. Shows final API Gateway URL and API key

### Option 2: Manual Steps
```bash
# 1. Deploy infrastructure
cd terraform
terraform apply -var="environment=dev"

# 2. Get outputs
API_GATEWAY_ID=$(terraform output -raw api_gateway_id)
CLAIMS_BUCKET=$(terraform output -raw claims_bucket_name)
# ... other outputs

# 3. Deploy Serverless
cd ..
serverless deploy --stage dev \
  --param="apiGatewayId=$API_GATEWAY_ID" \
  --param="claimsBucketName=$CLAIMS_BUCKET"
```

## Benefits

✅ **Clean Separation**: Infrastructure vs application logic
✅ **No Conflicts**: Single API Gateway managed by both tools
✅ **DRY Principle**: API Gateway config defined once at provider level
✅ **No Repetition**: No need to specify `restApiId` in every function event
✅ **Terraform Strengths**: Complex infrastructure, state management
✅ **Serverless Strengths**: Lambda deployment, event configuration
✅ **Flexibility**: Can modify either side independently

## File Structure

```
├── terraform/
│   ├── modules/api_gateway/     # API Gateway infrastructure only
│   ├── modules/database/        # RDS Aurora
│   ├── modules/storage/         # S3 buckets
│   └── main.tf                  # Root module
├── src/lambda/                  # Lambda function code
├── serverless.yml               # Serverless configuration
└── deploy-integrated.sh         # Deployment orchestration
```

## Environment Variables Flow

```
Terraform Outputs → Deployment Script → Serverless Parameters → Lambda Environment
```

Example:
```
claims_bucket_name → CLAIMS_BUCKET → claimsBucketName → CLAIMS_BUCKET_NAME
```

## Troubleshooting

### Common Issues

1. **API Gateway conflicts**: Ensure Terraform doesn't create Lambda integrations
2. **Missing parameters**: Check deployment script parameter passing
3. **Permission errors**: Verify IAM roles are created by Terraform first

### Verification

```bash
# Check API Gateway exists
aws apigateway get-rest-apis --query 'items[?name==`dev-claimiq-api`]'

# Check Lambda functions
serverless info --stage dev

# Test integration
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/upload
```