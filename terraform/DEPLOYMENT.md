# ClaimIQ Infrastructure Deployment Guide

This guide walks you through deploying the ClaimIQ infrastructure using Terraform.

## Prerequisites

### 1. Install Required Tools

#### Terraform
```bash
# On macOS using Homebrew
./scripts/install-terraform.sh

# Or manually
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Verify installation
terraform version
```

#### AWS CLI
```bash
# Install AWS CLI
brew install awscli

# Configure AWS credentials
aws configure
```

### 2. AWS Account Setup

Ensure you have:
- AWS account with appropriate permissions
- AWS CLI configured with credentials
- Permissions to create:
  - VPC and networking resources
  - IAM roles and policies
  - S3 buckets
  - Aurora Serverless v2 clusters
  - DynamoDB tables
  - API Gateway
  - KMS keys

## Initial Setup

### 1. Backend Configuration

First, set up the Terraform backend for state management:

```bash
# Create S3 bucket and DynamoDB table for state management
make setup-backend
```

**Important**: Update the bucket name in all backend configuration files:
- `environments/dev-backend.hcl`
- `environments/staging-backend.hcl`
- `environments/prod-backend.hcl`

### 2. Environment Configuration

Copy and customize environment-specific variables:

```bash
# Development environment
cp environments/dev.tfvars.example environments/dev.tfvars
cp environments/dev-backend.hcl.example environments/dev-backend.hcl

# Edit the files to match your requirements
```

## Deployment Process

### Development Environment

1. **Initialize Terraform**:
```bash
make dev-init
```

2. **Plan the deployment**:
```bash
make dev-plan
```

3. **Review the plan** and apply:
```bash
make dev-apply
```

4. **Verify deployment**:
```bash
make output ENV=dev
```

### Staging Environment

```bash
make staging-init
make staging-plan
make staging-apply
```

### Production Environment

```bash
make prod-init
make prod-plan
make prod-apply
```

## Post-Deployment Steps

### 1. Verify Infrastructure

Check that all resources were created successfully:

```bash
# List all resources
terraform state list

# Check outputs
terraform output

# Verify in AWS Console
aws s3 ls | grep claimiq
aws rds describe-db-clusters --query 'DBClusters[?contains(DBClusterIdentifier, `claimiq`)]'
aws dynamodb list-tables --query 'TableNames[?contains(@, `claimiq`)]'
```

### 2. Database Setup

The Aurora cluster is created but needs initial schema setup:

```bash
# Get database connection details
terraform output aurora_cluster_endpoint
terraform output aurora_secret_arn

# Connect to database and run schema setup
# (This will be handled by the application deployment)
```

### 3. Integration with Serverless Framework

The Terraform outputs provide values needed for Serverless Framework deployment:

```bash
# Export outputs for Serverless Framework
terraform output -json > ../serverless-outputs.json
```

## Environment Management

### Switching Between Environments

```bash
# Switch to staging
terraform init -backend-config=environments/staging-backend.hcl -reconfigure

# Switch back to dev
terraform init -backend-config=environments/dev-backend.hcl -reconfigure
```

### Environment-Specific Configurations

| Environment | VPC CIDR | Aurora Capacity | NAT Gateways | Backup Retention |
|-------------|----------|-----------------|--------------|------------------|
| Dev         | 10.0.0.0/16 | 0.5-4 ACUs | Single | 1 day |
| Staging     | 10.1.0.0/16 | 0.5-8 ACUs | Dual | 7 days |
| Production  | 10.2.0.0/16 | 1-16 ACUs | Dual | 30 days |

## Security Considerations

### 1. Secrets Management

- Database credentials are stored in AWS Secrets Manager
- KMS keys are used for encryption at rest
- All S3 buckets enforce encryption in transit

### 2. Network Security

- Private subnets for database and Lambda functions
- Security groups with minimal required access
- VPC endpoints for AWS services

### 3. Access Control

- IAM roles follow least privilege principle
- Multi-tenant isolation enforced at all layers
- Audit logging enabled for all services

## Monitoring and Maintenance

### 1. Cost Monitoring

Monitor costs using AWS Cost Explorer:
- Development: ~$50-100/month
- Staging: ~$100-200/month
- Production: ~$300-500/month (varies with usage)

### 2. Resource Monitoring

Key metrics to monitor:
- Aurora Serverless capacity utilization
- Lambda function duration and errors
- DynamoDB read/write capacity
- S3 storage usage and requests

### 3. Backup and Recovery

- Aurora automated backups enabled
- DynamoDB point-in-time recovery enabled
- S3 versioning enabled for all buckets

## Troubleshooting

### Common Issues

1. **State Lock Issues**:
```bash
terraform force-unlock <LOCK_ID>
```

2. **Backend Configuration**:
```bash
terraform init -backend-config=environments/dev-backend.hcl -reconfigure
```

3. **Module Updates**:
```bash
terraform get -update
terraform plan
```

4. **Resource Conflicts**:
```bash
terraform import <resource_type>.<resource_name> <resource_id>
```

### Validation

Always validate before applying:
```bash
terraform validate
terraform fmt -recursive
terraform plan
```

## Cleanup

### Development Environment
```bash
make destroy ENV=dev
```

### All Environments
```bash
# Destroy in reverse order
make destroy ENV=prod
make destroy ENV=staging
make destroy ENV=dev

# Clean up backend resources (optional)
aws s3 rb s3://your-terraform-state-bucket-name --force
aws dynamodb delete-table --table-name terraform-state-lock
```

## Next Steps

After successful infrastructure deployment:

1. **Deploy Lambda Functions**: Use Serverless Framework to deploy application code
2. **Configure API Gateway**: Set up routes and authentication
3. **Set up Monitoring**: Configure CloudWatch dashboards and alerts
4. **Run Tests**: Execute integration tests to verify functionality
5. **Configure CI/CD**: Set up automated deployment pipelines

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Terraform documentation
3. Check AWS service limits and quotas
4. Verify IAM permissions