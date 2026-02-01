# Storage Module Variables

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "enable_versioning" {
  description = "Enable S3 bucket versioning"
  type        = bool
  default     = true
}

variable "lifecycle_transition_ia_days" {
  description = "Days after which objects transition to IA storage class"
  type        = number
  default     = 30
}

variable "lifecycle_transition_glacier_days" {
  description = "Days after which objects transition to Glacier storage class"
  type        = number
  default     = 90
}

variable "lifecycle_expiration_days" {
  description = "Days after which objects are deleted (regulatory compliance)"
  type        = number
  default     = 2555  # 7 years
}

variable "cors_allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = ["*"]  # Should be restricted in production
}