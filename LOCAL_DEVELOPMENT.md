# ClaimIQ Local Development Guide

This guide explains how to run ClaimIQ Lambda functions locally while connecting to deployed AWS resources.

## Prerequisites

1. **Node.js 18+** and npm installed
2. **AWS CLI** configured with appropriate credentials
3. **Deployed AWS infrastructure** (Aurora, DynamoDB, S3, Cognito)
4. **jq** for JSON parsing in test scripts (optional)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and update with your deployed resource ARNs:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and update the following values with your deployed resources:

- `CLAIMS_BUCKET_NAME`: Your S3 bucket name
- `AURORA_CLUSTER_ARN`: Your Aurora cluster ARN
- `AURORA_SECRET_ARN`: Your Aurora secret ARN  
- `AGENT_LOGS_TABLE`: Your DynamoDB table name
- `USER_POOL_ID`: Your Cognito User Pool ID
- `USER_POOL_CLIENT_ID`: Your Cognito User Pool Client ID
- `STEP_FUNCTION_ARN`: Your Step Functions state machine ARN

### 3. Get Resource ARNs

You can get the ARNs from your Terraform outputs:

```bash
cd terraform
terraform output
```

Or from the AWS Console:
- **S3**: AWS Console → S3 → Your bucket name
- **Aurora**: AWS Console → RDS → Your cluster ARN
- **DynamoDB**: AWS Console → DynamoDB → Your table name
- **Cognito**: AWS Console → Cognito → User Pools → Your pool ID
- **Step Functions**: AWS Console → Step Functions → Your state machine ARN

## Running Locally

### Start the Local Development Server

```bash
npm run start:local
```

This will:
1. Load environment variables from `.env.local`
2. Validate required configuration
3. Build TypeScript code
4. Start serverless-offline on `http://localhost:3000`

### Alternative Start Methods

```bash
# Direct serverless offline
npm run offline

# Or using the dev alias
npm run dev
```

## API Endpoints

When running locally, the following endpoints are available:

### Health Check (No Auth Required)
```bash
GET http://localhost:3000/health
```

### File Upload (Auth Required)
```bash
POST http://localhost:3000/upload
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
X-Tenant-Id: <TENANT_ID>
X-Hospital-Id: <HOSPITAL_ID>

{
  "filename": "claim-document.pdf",
  "contentType": "application/pdf",
  "fileSize": 1024000,
  "fileHash": "optional-hash"
}
```

### Upload Status (Auth Required)
```bash
GET http://localhost:3000/upload/{claimId}
Authorization: Bearer <JWT_TOKEN>
X-Tenant-Id: <TENANT_ID>
X-Hospital-Id: <HOSPITAL_ID>
```

## Testing

### Run Test Script

```bash
./scripts/test-local-api.sh
```

This tests basic connectivity to the local API endpoints.

### Manual Testing with curl

```bash
# Test health endpoint
curl -X GET http://localhost:3000/health

# Test upload endpoint (will fail without auth)
curl -X POST http://localhost:3000/upload \
  -H "Content-Type: application/json" \
  -d '{"filename": "test.pdf", "contentType": "application/pdf", "fileSize": 1024000}'
```

## Authentication for Testing

To test authenticated endpoints, you'll need a valid JWT token from your Cognito User Pool:

1. **Create a test user** in your Cognito User Pool
2. **Get a JWT token** using AWS CLI or Cognito SDK
3. **Use the token** in Authorization header: `Bearer <token>`

### Getting a JWT Token (Example)

```bash
aws cognito-idp admin-initiate-auth \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-id YOUR_CLIENT_ID \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=testuser,PASSWORD=TempPassword123!
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Local Client  │───▶│  Serverless      │───▶│  Deployed AWS   │
│   (Browser/API) │    │  Offline         │    │  Resources      │
│                 │    │  (Port 3000)     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                          │
                              ▼                          ▼
                       ┌──────────────┐         ┌──────────────┐
                       │   Lambda     │         │   Aurora     │
                       │  Functions   │         │   DynamoDB   │
                       │  (Local)     │         │   S3         │
                       └──────────────┘         │   Cognito    │
                                               └──────────────┘
```

## Benefits

- **Fast Development**: No deployment needed for Lambda changes
- **Real Data**: Connect to actual AWS resources
- **Cost Effective**: Only pay for AWS resource usage, not Lambda invocations
- **Debugging**: Full debugging capabilities with local Lambda functions
- **Isolation**: Test without affecting deployed Lambda functions

## Troubleshooting

### Common Issues

1. **AWS Credentials Not Found**
   ```bash
   aws configure
   # or set environment variables
   export AWS_ACCESS_KEY_ID=your_key
   export AWS_SECRET_ACCESS_KEY=your_secret
   ```

2. **Environment Variables Missing**
   - Check `.env.local` file exists and has correct values
   - Verify ARNs are correct and resources exist

3. **Port Already in Use**
   ```bash
   # Kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

4. **TypeScript Build Errors**
   ```bash
   npm run build
   # Fix any TypeScript errors before starting
   ```

5. **Database Connection Issues**
   - Verify Aurora cluster is running
   - Check security groups allow access
   - Ensure secret exists and is accessible

### Logs

Local Lambda function logs appear in the terminal where you started the server. AWS service logs (Aurora, DynamoDB) are in CloudWatch.

## Production Deployment

When ready to deploy to production:

```bash
npm run deploy:prod
```

This deploys the Lambda functions to AWS while keeping the infrastructure managed by Terraform.

---

**Happy Coding!** 🚀