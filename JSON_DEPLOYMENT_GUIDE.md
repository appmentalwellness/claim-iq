# ClaimIQ JSON-Based Deployment Guide

This guide explains the simplified JSON-based deployment approach for ClaimIQ, which eliminates the need for complex parameter passing.

## 🎯 Benefits

- **No complex parameters**: No need to pass 11+ parameters to serverless deploy
- **Version controlled**: Environment configs can be safely committed to git
- **Environment specific**: Separate JSON files for dev, staging, prod
- **Clean separation**: Infrastructure (Terraform) and application (Serverless) configs are separate
- **Easy local development**: Simple copy from deployed environment to local

## 📁 File Structure

```
├── env-dev.json              # Development environment config (generated)
├── env-staging.json          # Staging environment config (generated)  
├── env-prod.json             # Production environment config (generated)
├── env-local.json            # Local development config (copy from env-dev.json)
├── env-local.json.example    # Template for local development
├── serverless.yml            # Main serverless config (uses env-{stage}.json)
├── serverless.local.yml      # Local serverless config (uses env-local.json)
└── scripts/
    ├── generate-env-json.sh  # Generate env JSON from Terraform outputs
    ├── deploy-json.sh        # Full deployment with JSON generation
    └── start-local-json.sh   # Start local development with JSON
```

## 🚀 Deployment Workflow

### 1. Full Deployment (Infrastructure + Application)

```bash
# Deploy everything for development
npm run deploy:full:dev

# Or manually
./scripts/deploy-json.sh dev
```

This script:
1. Runs `terraform apply` to deploy infrastructure
2. Generates `env-dev.json` from Terraform outputs
3. Runs `serverless deploy --stage dev` using the JSON file

### 2. Application-Only Deployment

If infrastructure is already deployed:

```bash
# Generate environment JSON from existing Terraform state
npm run generate:env:dev

# Deploy serverless application
npm run deploy:dev
```

### 3. Local Development Setup

```bash
# After deploying infrastructure
cp env-dev.json env-local.json

# Start local development
npm run dev
```

## 📄 Environment JSON Format

Each `env-{environment}.json` file contains:

```json
{
  "ENVIRONMENT": "dev",
  "AWS_REGION": "us-east-1",
  "CLAIMS_BUCKET_NAME": "dev-claimiq-claims-bucket-12345",
  "AURORA_CLUSTER_ARN": "arn:aws:rds:us-east-1:123456789012:cluster:dev-claimiq-cluster",
  "AURORA_SECRET_ARN": "arn:aws:secretsmanager:us-east-1:123456789012:secret:dev-claimiq-aurora-secret-AbCdEf",
  "DATABASE_NAME": "claimiq",
  "AGENT_LOGS_TABLE": "dev-claimiq-agent-logs",
  "USER_POOL_ID": "us-east-1_AbCdEfGhI",
  "USER_POOL_CLIENT_ID": "1234567890abcdefghijklmnop",
  "LAMBDA_EXECUTION_ROLE_ARN": "arn:aws:iam::123456789012:role/dev-claimiq-lambda-execution-role",
  "LAMBDA_SECURITY_GROUP_ID": "sg-0123456789abcdef0",
  "PRIVATE_SUBNET_IDS": ["subnet-0123456789abcdef0", "subnet-0123456789abcdef1"],
  "API_GATEWAY_ID": "abcdef1234",
  "API_GATEWAY_ROOT_RESOURCE_ID": "abcdef1234",
  "API_GATEWAY_URL": "https://abcdef1234.execute-api.us-east-1.amazonaws.com/dev",
  "MAX_FILE_SIZE_MB": "50"
}
```

## 🔧 Serverless Configuration

The serverless.yml now uses JSON files instead of parameters:

```yaml
provider:
  environment:
    CLAIMS_BUCKET_NAME: ${file(env-${self:provider.stage}.json):CLAIMS_BUCKET_NAME}
    AURORA_CLUSTER_ARN: ${file(env-${self:provider.stage}.json):AURORA_CLUSTER_ARN}
    # ... other variables
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run deploy:full` | Full deployment (Terraform + Serverless) |
| `npm run deploy:full:dev` | Full deployment for dev environment |
| `npm run deploy:full:staging` | Full deployment for staging environment |
| `npm run deploy:full:prod` | Full deployment for prod environment |
| `npm run generate:env` | Generate env JSON from Terraform outputs |
| `npm run generate:env:dev` | Generate env-dev.json |
| `npm run deploy:dev` | Deploy serverless application only (dev) |
| `npm run dev` | Start local development server |

## 🏠 Local Development

1. **Deploy infrastructure** (if not already done):
   ```bash
   npm run deploy:full:dev
   ```

2. **Set up local environment**:
   ```bash
   cp env-dev.json env-local.json
   ```

3. **Start local server**:
   ```bash
   npm run dev
   ```

The local server will:
- Run Lambda functions locally on port 3000
- Connect to your deployed AWS resources (Aurora, DynamoDB, S3, Cognito)
- Use the same configuration as your deployed environment

## 🔒 Security & Git

- **Safe to commit**: Environment JSON files contain resource ARNs/names, not secrets
- **Secrets handled by AWS**: Database passwords, API keys stored in AWS Secrets Manager
- **Local files ignored**: `.env.local` and backup files are gitignored
- **Examples provided**: `env-local.json.example` shows the expected format

## 🔄 Migration from Old Approach

If you were using the parameter-based approach:

1. **Generate JSON files**:
   ```bash
   ./scripts/generate-env-json.sh dev
   ./scripts/generate-env-json.sh staging
   ./scripts/generate-env-json.sh prod
   ```

2. **Update local development**:
   ```bash
   cp env-dev.json env-local.json
   ```

3. **Use new deployment scripts**:
   ```bash
   npm run deploy:full:dev  # Instead of old deploy script
   ```

## 🧪 Testing

After deployment, test your API:

```bash
# Health check
curl $(jq -r '.API_GATEWAY_URL' env-dev.json)/health

# Or for local development
curl http://localhost:3000/health
```

## 🎉 Summary

The JSON-based approach provides:
- ✅ **Simplified deployment** - No complex parameter management
- ✅ **Environment consistency** - Same config format across all environments  
- ✅ **Easy local development** - Copy deployed config to local
- ✅ **Version control friendly** - Safe to commit environment configs
- ✅ **Clear separation** - Infrastructure and application configs are separate
- ✅ **Maintainable** - Easy to understand and modify

This approach scales well as your infrastructure grows and makes it easy for team members to set up local development environments.