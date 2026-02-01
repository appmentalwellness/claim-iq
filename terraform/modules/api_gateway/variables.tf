# API Gateway Module Variables

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "api_name" {
  description = "Name of the API Gateway"
  type        = string
  default     = "claimiq-api"
}

variable "api_description" {
  description = "Description of the API Gateway"
  type        = string
  default     = "ClaimIQ API Gateway"
}

variable "endpoint_type" {
  description = "API Gateway endpoint type"
  type        = string
  default     = "REGIONAL"
}

variable "binary_media_types" {
  description = "List of binary media types supported by the API"
  type        = list(string)
  default = [
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "multipart/form-data"
  ]
}

variable "cloudwatch_log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 14
}

variable "usage_plan_quota_limit" {
  description = "API usage plan quota limit per day"
  type        = number
  default     = 10000
}

variable "usage_plan_rate_limit" {
  description = "API usage plan rate limit (requests per second)"
  type        = number
  default     = 100
}

variable "usage_plan_burst_limit" {
  description = "API usage plan burst limit"
  type        = number
  default     = 200
}

variable "allowed_ip_ranges" {
  description = "List of allowed IP ranges for API access"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Allow all by default, restrict in production
}

variable "api_key_required" {
  description = "Whether API key is required for endpoints"
  type        = bool
  default     = false
}

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

# Lambda Authorizer Variables
variable "lambda_authorizer_function_name" {
  description = "Name of the Lambda authorizer function"
  type        = string
  default     = ""
}

variable "lambda_authorizer_invoke_arn" {
  description = "Invoke ARN of the Lambda authorizer function"
  type        = string
  default     = ""
}

variable "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  type        = string
  default     = ""
}