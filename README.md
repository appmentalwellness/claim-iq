# ClaimIQ Ingestion Layer

AI-powered Insurance Denial Recovery System - Ingestion Layer Implementation

## Overview

This repository contains the implementation of the ClaimIQ Ingestion Layer, built using AWS Lambda, S3, and API Gateway with Terraform for infrastructure as code. The system processes denied insurance claims for Indian hospitals, providing automated file ingestion, data normalization, and multi-tenant isolation.

## Architecture

The ingestion layer follows the **File Upload & Ingestion Standard** with S3 pre-signed URLs:

**Infrastructure (Terraform)**:
- VPC, subnets, security groups
- Aurora Serverless v2 PostgreSQL database  
- DynamoDB tables for operational data
- S3 buckets with tenant isolation and event triggers
- KMS encryption and IAM roles
- Basic API Gateway setup

**Application (Serverless Framework)**:
- Lambda functions with optimized runtimes
- S3 event triggers for processing
- Step Functions state machines
- Environment configuration

**New Upload Flow**:
1. **Client requests pre-signed URL** from API Gateway → File Upload Lambda
2. **Lambda generates S3 pre-signed URL** with metadata and creates claim record (UPLOAD_PENDING)
3. **Client uploads directly to S3** using pre-signed URL (bypasses API Gateway)
4. **S3 event triggers S3 Processor Lambda** when upload completes
5. **S3 Processor calculates file hash**, updates claim status (NEW), and triggers Step Functions workflow

**Runtime Decisions**:
- **File Upload**: Node.js 18.x (optimal for HTTP/S3/DB operations and pre-signed URL generation)
- **S3 Processor**: Node.js 18.x (optimal for S3 event handling and workflow triggering)
- **Normalization**: Python 3.11 (justified for heavy PDF/OCR processing with Textract)

## Features

### File Upload Service
- ✅ Supports PDF, Excel (.xls, .xlsx), and CSV files
- ✅ File size validation (up to 50MB)
- ✅ Duplicate detection using SHA-256 hashing
- ✅ Multi-tenant isolation with S3 prefixes
- ✅ Comprehensive audit logging
- ✅ Error handling with descriptive messages

### Data Normalization Service
- ✅ PDF text extraction using Amazon Textract
- ✅ CSV parsing with field mapping
- ✅ Excel file handling (basic support)
- ✅ Entity creation (Tenant, Hospital, Claim, Denial, Patient, Payer)
- ✅ Data validation and error handling
- ✅ Manual review flagging for failed processing

### Security & Compliance
- ✅ KMS encryption for all data at rest
- ✅ TLS 1.2+ for data in transit
- ✅ IAM roles with least privilege
- ✅ Multi-tenant data isolation
- ✅ Comprehensive audit trails

## Requirements Validation

This implementation validates the following system requirements:

### File Ingestion (Requirements 1.1-1.7)
- **1.1**: ✅ Store PDF files in S3 and create processing records
- **1.2**: ✅ Validate Excel format and store for processing
- **1.3**: ✅ Parse CSV structure and store with metadata
- **1.4**: ✅ Return descriptive errors for size limits
- **1.5**: ✅ Detect duplicates and prevent reprocessing
- **1.6**: ✅ Support files up to 50MB
- **1.7**: ✅ Maintain audit logs with timestamps and user info

### Data Normalization (Requirements 2.1-2.5)
- **2.1**: ✅ Create all required entities with proper relationships
- **2.2**: ✅ Ensure tenantId inclusion for multi-tenant isolation
- **2.3**: ✅ Log errors and mark records for manual review
- **2.4**: ✅ Validate required fields before entity creation
- **2.5**: ✅ Handle duplicate claims with version history

### Security (Requirements 9.1-9.7)
- **9.1**: ✅ KMS encryption for data at rest
- **9.2**: ✅ TLS 1.2+ for data in transit
- **9.3**: ✅ Secrets stored in AWS Secrets Manager
- **9.4**: ✅ IAM roles with least privilege
- **9.5**: ✅ Comprehensive audit logging

## Quick Start

### Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **Terraform** >= 1.0
3. **AWS Account** with permissions for:
   - Lambda, API Gateway, S3, Aurora, DynamoDB
   - IAM, KMS, Secrets Manager, CloudWatch

### Deployment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd claimiq-ingestion
   ```

2. **Install prerequisites**
   ```bash
   # Install Serverless Framework
   npm install -g serverless
   
   # Ensure you have Terraform and AWS CLI installed
   ```

3. **Deploy the system**
   ```bash
   npm run deploy:full:dev
   
   # Or manually
   ./scripts/deploy-json.sh dev us-east-1
   ```

   This script will:
   - Deploy infrastructure with Terraform
   - Install Lambda dependencies (Node.js and Python)
   - Deploy functions with Serverless Framework
   - Provide connection details for database setup

4. **Initialize database schema**: Aurora Serverless v2 cluster is created and schema is initialized automatically via Lambda function
   ```bash
   # Schema is automatically initialized during deployment
   # To connect manually for verification (optional):
   psql -h <aurora-endpoint> -U claimiq_admin -d claimiq
   # Credentials are stored in AWS Secrets Manager: {environment}/claimiq/database
   ```

### Testing

**Upload a test file using the new S3 pre-signed URL flow:**
```bash
# The test script now handles the complete pre-signed URL workflow
./test-upload.sh https://<api-gateway-id>.execute-api.us-east-1.amazonaws.com/dev

# This will:
# 1. Request a pre-signed URL from the API
# 2. Upload the file directly to S3
# 3. Verify the S3 event processing
# 4. Check the claim status
```

**Expected Response Flow:**
```json
// 1. Pre-signed URL Request Response
{
  "success": true,
  "data": {
    "claimId": "uuid-here",
    "uploadId": "uuid-here", 
    "presignedUrl": "https://s3.amazonaws.com/bucket/key?...",
    "expiresIn": 3600,
    "message": "Pre-signed URL generated successfully"
  }
}

// 2. S3 Upload: Direct PUT to pre-signed URL (HTTP 200)
// 3. S3 Event triggers processing automatically
// 4. Claim status updated and workflow started
```

## Project Structure

```
├── be/                        # Backend code
│   ├── services/              # Microservices
│   │   ├── api/              # HTTP API service
│   │   └── workflows/        # Workflow services
│   │       └── claim-processor-workflow/
│   ├── libs/                 # Shared backend libraries
│   │   └── shared/           # Common utilities
│   └── terraform/            # Infrastructure as Code
├── ui/                       # Frontend application
│   ├── src/                  # Frontend source code
│   ├── public/               # Static assets
│   └── docs/                 # Frontend documentation
├── config/                   # Configuration files
│   └── environments/         # Environment-specific configs
├── docs/                     # Project documentation
│   ├── architecture/         # Architecture documentation
│   ├── deployment/           # Deployment guides
│   └── migration-summaries/  # Migration documentation
├── scripts/                  # Deployment and utility scripts
└── README.md                 # This file
```

## API Endpoints

### POST /upload

Upload a claim file for processing.

**Headers:**
- `Content-Type`: File MIME type (application/pdf, text/csv, etc.)
- `X-Tenant-Id`: Tenant identifier for multi-tenant isolation
- `X-Hospital-Id`: Hospital identifier
- `X-Filename`: Original filename

**Body:** Binary file data

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "uploaded|duplicate",
    "claim_id": "uuid",
    "upload_id": "uuid", 
    "file_hash": "sha256-hash",
    "s3_location": "s3://bucket/key",
    "file_size": 1024,
    "content_type": "application/pdf",
    "message": "File uploaded successfully"
  }
}
```

## Database Schema

The system uses Aurora Serverless v2 PostgreSQL with the following key tables:

- **tenants**: Multi-tenant organization data
- **hospitals**: Hospital information per tenant
- **claims**: Core claim records with file references
- **denials**: Denial information and classification
- **patients**: Patient information (tenant-isolated)
- **payers**: Insurance companies and TPAs
- **appeals**: Appeal letters and outcomes
- **agent_actions**: AI agent execution audit trail
- **recovery_logs**: Financial recovery tracking

All tables include `tenant_id` for multi-tenant isolation and Row Level Security (RLS) policies.

## Monitoring & Logging

### CloudWatch Logs
- API Gateway access logs
- Lambda function execution logs
- Step Functions execution logs

### DynamoDB Operational Logs
- File upload events
- Data processing events
- Agent execution logs
- Error tracking

### Metrics
- File upload success/failure rates
- Processing times
- Error rates by tenant
- Storage utilization

## Security Considerations

### Multi-Tenant Isolation
- S3 objects stored with tenant-specific prefixes
- Database queries filtered by `tenant_id`
- Row Level Security (RLS) policies
- IAM policies scoped to tenant resources

### Data Protection
- All data encrypted at rest using KMS
- TLS 1.2+ for data in transit
- Secrets stored in AWS Secrets Manager
- No hardcoded credentials

### Access Control
- Lambda functions use least privilege IAM roles
- API Gateway rate limiting
- VPC isolation for database access
- Security groups restrict network access

## Cost Optimization

### Serverless Architecture
- Lambda functions scale to zero when not in use
- Aurora Serverless v2 auto-scales based on demand
- S3 lifecycle policies for long-term storage
- DynamoDB on-demand pricing

### Resource Efficiency
- Lambda memory optimized per function
- S3 Intelligent Tiering for cost optimization
- CloudWatch log retention policies
- Efficient database indexing

## Troubleshooting

### Common Issues

**File Upload Fails:**
- Check file size (max 50MB)
- Verify content type is supported
- Ensure tenant/hospital IDs are provided
- Check CloudWatch logs for detailed errors

**Database Connection Issues:**
- Verify Aurora cluster is running
- Check security group rules
- Validate Secrets Manager credentials
- Ensure Lambda is in correct VPC subnets

**Processing Failures:**
- Check Textract service limits
- Verify S3 permissions
- Review DynamoDB capacity
- Monitor Step Functions execution

### Logs Location
- Lambda logs: `/aws/lambda/<function-name>`
- API Gateway logs: `/aws/apigateway/<environment>-claimiq`
- Step Functions logs: `/aws/stepfunctions/<state-machine-name>`

## Development

### Local Testing
```bash
# Test Lambda functions locally using SAM
sam local start-api

# Run unit tests
python -m pytest tests/

# Validate Terraform
terraform validate
terraform plan
```

### Adding New Features
1. Update Terraform modules for infrastructure changes
2. Modify Lambda functions for business logic
3. Update database schema if needed
4. Add appropriate tests
5. Update documentation

## Production Considerations

### Before Production Deployment

1. **Authentication**: Implement AWS Cognito for user authentication
2. **Authorization**: Set up proper RBAC with JWT token validation
3. **Monitoring**: Configure comprehensive CloudWatch alarms
4. **Backup**: Enable automated backups for Aurora and DynamoDB
5. **Disaster Recovery**: Set up cross-region replication
6. **Performance**: Load test the system with realistic data volumes
7. **Security**: Conduct security review and penetration testing
8. **Compliance**: Ensure HIPAA compliance for healthcare data

### Scaling Considerations

- Lambda concurrency limits
- Aurora Serverless v2 scaling configuration
- DynamoDB capacity planning
- S3 request rate optimization
- API Gateway throttling limits

## Support

For issues and questions:
1. Check CloudWatch logs for error details
2. Review this documentation
3. Check AWS service limits and quotas
4. Contact the development team

## License

This project is proprietary software for ClaimIQ system implementation.