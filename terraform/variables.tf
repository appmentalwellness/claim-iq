# ClaimIQ Infrastructure Variables

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "claimiq"
}

# Database configuration
variable "db_min_capacity" {
  description = "Minimum Aurora Serverless v2 capacity"
  type        = number
  default     = 0.5
}

variable "db_max_capacity" {
  description = "Maximum Aurora Serverless v2 capacity"
  type        = number
  default     = 16
}

# Lambda configuration
variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "python3.11"
}

variable "lambda_timeout" {
  description = "Default Lambda timeout in seconds"
  type        = number
  default     = 300
}

# File upload limits
variable "max_file_size_mb" {
  description = "Maximum file size for uploads in MB"
  type        = number
  default     = 50
}

# Multi-tenant configuration
variable "enable_tenant_isolation" {
  description = "Enable strict tenant isolation"
  type        = bool
  default     = true
}

# Cost optimization
variable "single_nat_gateway" {
  description = "Use a single NAT Gateway for all private subnets (cost optimization)"
  type        = bool
  default     = false
}

# Performance monitoring
variable "enable_performance_insights" {
  description = "Enable Performance Insights for Aurora"
  type        = bool
  default     = true
}

variable "monitoring_interval" {
  description = "Enhanced monitoring interval in seconds (0 to disable)"
  type        = number
  default     = 60
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}
# API Gateway configuration
variable "api_allowed_ip_ranges" {
  description = "List of allowed IP ranges for API access"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Allow all by default, restrict in production
}

variable "api_key_required" {
  description = "Whether API key is required for endpoints"
  type        = bool
  default     = false
}

# Lambda function integration (populated by Serverless Framework)
variable "file_upload_lambda_invoke_arn" {
  description = "ARN for invoking the file upload Lambda function"
  type        = string
  default     = ""
}

variable "file_upload_lambda_function_name" {
  description = "Name of the file upload Lambda function"
  type        = string
  default     = ""
}

# Authentication and Authorization Configuration
variable "cognito_callback_urls" {
  description = "List of allowed callback URLs for Cognito"
  type        = list(string)
  default     = ["http://localhost:3000/callback"]
}

variable "cognito_logout_urls" {
  description = "List of allowed logout URLs for Cognito"
  type        = list(string)
  default     = ["http://localhost:3000/logout"]
}

variable "authorizer_lambda_zip_path" {
  description = "Path to the Lambda authorizer zip file"
  type        = string
  default     = null
}

variable "log_level" {
  description = "Log level for Lambda functions"
  type        = string
  default     = "INFO"
}