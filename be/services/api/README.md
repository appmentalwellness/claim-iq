# ClaimIQ API Service

This service handles HTTP endpoints and API Gateway integration for the ClaimIQ system.

## Functions

- **authorizer**: JWT token validation for API Gateway
- **file-upload**: Pre-signed URL generation for direct S3 uploads
- **health-check**: API health monitoring endpoint

## Local Development

```bash
# From project root
npm run offline:api

# Or from this directory
serverless offline start
```

## Deployment

```bash
# From project root
npm run deploy:api

# Or from this directory
serverless deploy --stage dev
```

## Testing

```bash
# Run tests for this service
npm run test:api
```

## Environment Variables

This service uses environment configuration from `config/environments/{stage}.json`.

Key variables:
- `CLAIMS_BUCKET_NAME`: S3 bucket for file uploads
- `USER_POOL_ID`: Cognito User Pool ID for authentication
- `API_GATEWAY_ID`: Existing API Gateway ID from Terraform