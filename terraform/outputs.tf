# ClaimIQ Infrastructure Outputs

output "api_gateway_url" {
  description = "API Gateway URL for ClaimIQ"
  value       = module.api_gateway.api_gateway_url
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = module.api_gateway.api_gateway_id
}

output "api_gateway_root_resource_id" {
  description = "API Gateway root resource ID"
  value       = module.api_gateway.api_gateway_root_resource_id
}

output "claims_bucket_name" {
  description = "S3 bucket name for claims storage"
  value       = module.storage.claims_bucket_name
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = module.database.cluster_endpoint
  sensitive   = true
}

output "aurora_cluster_arn" {
  description = "Aurora cluster ARN"
  value       = module.database.cluster_arn
  sensitive   = true
}

output "aurora_secret_arn" {
  description = "Aurora credentials secret ARN"
  value       = module.database.secret_arn
  sensitive   = true
}

output "kms_key_arn" {
  description = "KMS key ARN for encryption"
  value       = module.security.kms_key_arn
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "lambda_function_arns" {
  description = "Lambda function ARNs (managed by Serverless Framework)"
  value = {
    note = "Lambda functions are deployed via Serverless Framework"
  }
}

# Outputs for Serverless Framework integration
output "lambda_execution_role_arn" {
  description = "Lambda execution role ARN for Serverless Framework"
  value       = module.security.lambda_execution_role_arn
}

output "lambda_security_group_id" {
  description = "Lambda security group ID for Serverless Framework"
  value       = module.networking.lambda_security_group_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs for Lambda VPC configuration"
  value       = module.networking.private_subnet_ids
}

output "dynamodb_table_names" {
  description = "DynamoDB table names"
  value = {
    agent_logs = module.dynamodb.agent_logs_table_name
  }
}
# API Gateway specific outputs
output "api_gateway_execution_arn" {
  description = "API Gateway execution ARN"
  value       = module.api_gateway.api_gateway_execution_arn
}

# Commented out until API Gateway module is complete
# output "api_gateway_stage_name" {
#   description = "API Gateway stage name"
#   value       = module.api_gateway.api_gateway_stage_name
# }

output "api_key_id" {
  description = "API Gateway API key ID"
  value       = module.api_gateway.api_key_id
}

output "api_key_value" {
  description = "API Gateway API key value"
  value       = module.api_gateway.api_key_value
  sensitive   = true
}

output "usage_plan_id" {
  description = "API Gateway usage plan ID"
  value       = module.api_gateway.usage_plan_id
}

# Commented out until API Gateway resources are added
# output "upload_resource_id" {
#   description = "API Gateway upload resource ID"
#   value       = module.api_gateway.upload_resource_id
# }

# output "upload_claim_resource_id" {
#   description = "API Gateway upload claim resource ID"
#   value       = module.api_gateway.upload_claim_resource_id
# }

# Authentication and Authorization Outputs
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.security.cognito_user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.security.cognito_user_pool_client_id
}

output "cognito_user_pool_domain" {
  description = "Cognito User Pool Domain"
  value       = module.security.cognito_user_pool_domain
}

output "cognito_user_pool_endpoint" {
  description = "Cognito User Pool Endpoint"
  value       = module.security.cognito_user_pool_endpoint
}

# Commented out since Lambda functions are deployed via Serverless Framework
# output "lambda_authorizer_function_name" {
#   description = "Lambda Authorizer Function Name"
#   value       = module.security.lambda_authorizer_function_name
# }

output "api_gateway_authorizer_id" {
  description = "API Gateway Authorizer ID"
  value       = module.api_gateway.api_gateway_authorizer_id
}