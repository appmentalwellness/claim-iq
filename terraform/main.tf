# ClaimIQ Infrastructure - Main Configuration
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "ClaimIQ"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values
locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  
  common_tags = {
    Project     = "ClaimIQ"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# VPC and Networking
module "networking" {
  source = "./modules/networking"
  
  environment        = var.environment
  vpc_cidr          = var.vpc_cidr
  single_nat_gateway = var.single_nat_gateway
  
  tags = local.common_tags
}

# Security and KMS
module "security" {
  source = "./modules/security"
  
  environment = var.environment
  
  # Cognito configuration
  cognito_callback_urls = var.cognito_callback_urls
  cognito_logout_urls   = var.cognito_logout_urls
  
  # Lambda authorizer configuration
  authorizer_lambda_zip_path = var.authorizer_lambda_zip_path
  log_level                 = var.log_level
  
  tags = local.common_tags
}

# S3 Storage
module "storage" {
  source = "./modules/storage"
  
  environment = var.environment
  kms_key_arn = module.security.kms_key_arn
  
  tags = local.common_tags
}

# Aurora Serverless v2 Database
module "database" {
  source = "./modules/database"
  
  environment               = var.environment
  vpc_id                   = module.networking.vpc_id
  private_subnet_ids       = module.networking.private_subnet_ids
  kms_key_arn             = module.security.kms_key_arn
  serverless_min_capacity = var.db_min_capacity
  serverless_max_capacity = var.db_max_capacity
  
  tags = local.common_tags
}

# DynamoDB Tables
module "dynamodb" {
  source = "./modules/dynamodb"
  
  environment = var.environment
  kms_key_arn = module.security.kms_key_arn
  
  tags = local.common_tags
}

# API Gateway with Lambda integration
module "api_gateway" {
  source = "./modules/api_gateway"
  
  environment = var.environment
  
  # Lambda integration variables (will be populated by Serverless Framework)
  file_upload_lambda_invoke_arn    = var.file_upload_lambda_invoke_arn
  file_upload_lambda_function_name = var.file_upload_lambda_function_name
  
  # Lambda Authorizer integration (commented out - deployed via Serverless Framework)
  # lambda_authorizer_function_name = module.security.lambda_authorizer_function_name
  # lambda_authorizer_invoke_arn    = module.security.lambda_authorizer_invoke_arn
  lambda_authorizer_function_name = ""
  lambda_authorizer_invoke_arn    = ""
  cognito_user_pool_arn          = module.security.cognito_user_pool_arn
  
  # Security settings
  allowed_ip_ranges = var.api_allowed_ip_ranges
  api_key_required  = var.api_key_required
  
  tags = local.common_tags
}

# Lambda Functions are managed by Serverless Framework
# Infrastructure outputs for Serverless Framework integration

# Step Functions (basic setup - state machines managed by Serverless Framework)
module "step_functions" {
  source = "./modules/step_functions"
  
  environment               = var.environment
  step_functions_role_arn   = module.security.step_functions_role_arn
  aurora_cluster_arn       = "arn:aws:rds:${local.region}:${local.account_id}:cluster:${module.database.cluster_identifier}"
  aurora_secret_arn        = module.database.secret_arn
  agent_logs_table_name    = module.dynamodb.agent_logs_table_name
  kms_key_arn             = module.security.kms_key_arn
  
  tags = local.common_tags
}