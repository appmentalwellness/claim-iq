# ClaimIQ Claim Processor Workflow Service

This service handles the claim processing workflow including S3 event processing, data normalization, and Step Functions orchestration.

## Functions

- **s3-processor**: Processes S3 upload events and triggers workflows
- **normalization**: Python-based PDF/OCR processing and data extraction
- **db-update**: Database operations for workflow steps

## Step Functions

- **claimProcessing**: Main workflow that orchestrates claim processing from file upload to completion

## Local Development

```bash
# From project root (Step Functions cannot run locally)
npm run test:workflows
```

## Deployment

```bash
# From project root
npm run deploy:workflows

# Or from this directory
serverless deploy --stage dev
```

## Testing

```bash
# Run tests for this service
npm run test:workflows
```

## Environment Variables

This service uses environment configuration from `config/environments/{stage}.json`.

Key variables:
- `CLAIMS_BUCKET_NAME`: S3 bucket for file processing
- `AURORA_CLUSTER_ARN`: Database cluster for data storage
- `AGENT_LOGS_TABLE`: DynamoDB table for audit logging

## Workflow Triggers

The workflow is triggered by:
1. S3 upload events (configured post-deployment)
2. Manual Step Functions execution
3. API calls to the s3-processor function