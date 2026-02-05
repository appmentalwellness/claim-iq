# ClaimIQ Terraform Infrastructure

This directory contains the Terraform configuration for deploying the ClaimIQ AWS infrastructure across multiple environments (dev, staging, prod).

## Architecture Overview

The infrastructure is organized into reusable modules:

- **networking**: VPC, subnets, security groups, NAT gateways, VPC endpoints
- **security**: KMS encryption, IAM roles and policies
- **storage**: S3 buckets for claims and appeals with encryption and lifecycle policies
- **database**: Aurora Serverless v2 PostgreSQL cluster with secrets management
- **dynamodb**: DynamoDB tables for operational data and logging
- **api_gateway**: API Gateway basic setup (routes managed by Serverless Framework)
- **step_functions**: CloudWatch logging setup (state machines managed by Serverless Framework)

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.0 installed
3. **S3 bucket** for Terraform state storage
4. **DynamoDB table** for state locking

### Setting up State Management

1. Create an S3 bucket for Terraform state:
```bash
aws s3 mb s3://your-terraform-state-bucket-name
aws s3api put-bucket-versioning --bucket your-terraform-state-bucket-name --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket your-terraform-state-bucket-name --server-side-encryption-configuration '{
  "Rules": [
    {
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }
  ]
}'
```

2. Create a DynamoDB table for state locking:
```bash
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

## Environment Setup

### Development Environment

1. Copy and customize the backend configuration:
```bash
cp environments/dev-backend.hcl.example environments/dev-backend.hcl
# Edit the file to set your actual S3 bucket name
```

2. Initialize Terraform:
```bash
terraform init -backend-config=environments/dev-backend.hcl
```

3. Plan and apply:
```bash
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

### Staging Environment

```bash
terraform init -backend-config=environments/staging-backend.hcl -reconfigure
terraform plan -var-file=environments/staging.tfvars
terraform apply -var-file=environments/staging.tfvars
```

### Production Environment

```bash
terraform init -backend-config=environments/prod-backend.hcl -reconfigure
terraform plan -var-file=environments/prod.tfvars
terraform apply -var-file=environments/prod.tfvars
```

## Module Structure

Each module follows a consistent structure:
- `main.tf` - Main resource definitions
- `variables.tf` - Input variables
- `outputs.tf` - Output values

### Module Dependencies

```
networking (base)
├── security (depends on: none)
├── storage (depends on: security)
├── database (depends on: networking, security)
├── dynamodb (depends on: security)
├── api_gateway (depends on: none)
└── step_functions (depends on: security)
```

## Environment-Specific Configurations

### Development
- Single NAT Gateway for cost optimization
- Minimal Aurora capacity (0.5-4 ACUs)
- Reduced backup retention (1 day)
- Performance Insights disabled

### Staging
- Dual NAT Gateways for availability
- Moderate Aurora capacity (0.5-8 ACUs)
- Standard backup retention (7 days)
- Performance Insights enabled

### Production
- Dual NAT Gateways for high availability
- Full Aurora capacity (1-16 ACUs)
- Extended backup retention (30 days)
- Performance Insights enabled
- Extended KMS key deletion window

## Security Features

- **Encryption at Rest**: All data encrypted using AWS KMS
- **Encryption in Transit**: TLS 1.2+ enforced for all communications
- **Network Security**: Private subnets, security groups, NACLs
- **Access Control**: IAM roles with least privilege principles
- **Secrets Management**: Database credentials stored in AWS Secrets Manager
- **Multi-tenant Isolation**: Tenant-specific prefixes and access controls

## Outputs

The Terraform configuration outputs key values needed by the Serverless Framework:

- API Gateway ID and URL
- S3 bucket names
- Aurora cluster endpoints and credentials
- Lambda execution role ARN
- VPC and subnet IDs
- Security group IDs
- DynamoDB table names

## Integration with Serverless Framework

This Terraform configuration provides the foundational infrastructure. The Serverless Framework handles:

- Lambda function deployments
- API Gateway routes and methods
- Step Functions state machine definitions
- Event triggers and integrations

## Troubleshooting

### Common Issues

1. **State Lock**: If Terraform gets stuck with a state lock:
```bash
terraform force-unlock <LOCK_ID>
```

2. **Backend Reconfiguration**: When switching environments:
```bash
terraform init -backend-config=environments/<env>-backend.hcl -reconfigure
```

3. **Module Updates**: After updating modules:
```bash
terraform get -update
terraform plan
```

### Validation

Validate the configuration:
```bash
terraform validate
terraform fmt -recursive
```

## Cost Optimization

### Development Environment
- Uses single NAT Gateway
- Minimal Aurora Serverless capacity
- Reduced backup retention
- Disabled enhanced monitoring

### Production Environment
- Optimized for availability and performance
- Auto-scaling enabled for all services
- Lifecycle policies for S3 storage classes
- Reserved capacity where applicable

## Compliance and Governance

- **Tagging Strategy**: All resources tagged with Environment, Project, ManagedBy
- **Backup Strategy**: Automated backups with appropriate retention
- **Monitoring**: CloudWatch logging enabled for all services
- **Audit Trail**: All API calls logged via CloudTrail (configured separately)

## Next Steps

After deploying the infrastructure:

1. Deploy Lambda functions using Serverless Framework
2. Configure API Gateway routes and methods
3. Set up monitoring dashboards
4. Configure alerting and notifications
5. Run integration tests