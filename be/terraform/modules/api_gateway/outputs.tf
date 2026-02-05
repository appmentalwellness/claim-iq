# API Gateway Module Outputs

output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_arn" {
  description = "ARN of the API Gateway"
  value       = aws_api_gateway_rest_api.main.arn
}

output "api_gateway_name" {
  description = "Name of the API Gateway"
  value       = aws_api_gateway_rest_api.main.name
}

output "api_gateway_root_resource_id" {
  description = "Root resource ID of the API Gateway"
  value       = aws_api_gateway_rest_api.main.root_resource_id
}

output "api_gateway_execution_arn" {
  description = "Execution ARN of the API Gateway"
  value       = aws_api_gateway_rest_api.main.execution_arn
}

output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/dev"
}

# Commented out until stage and deployment resources are added
# output "api_gateway_stage_name" {
#   description = "Name of the API Gateway stage"
#   value       = aws_api_gateway_stage.main.stage_name
# }

# output "api_gateway_deployment_id" {
#   description = "ID of the API Gateway deployment"
#   value       = aws_api_gateway_deployment.main.id
# }

output "usage_plan_id" {
  description = "ID of the API Gateway usage plan"
  value       = aws_api_gateway_usage_plan.main.id
}

output "api_key_id" {
  description = "ID of the API Gateway API key"
  value       = aws_api_gateway_api_key.main.id
}

output "api_key_value" {
  description = "Value of the API Gateway API key"
  value       = aws_api_gateway_api_key.main.value
  sensitive   = true
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group for API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway.arn
}

# Commented out until resources are added
# output "upload_resource_id" {
#   description = "ID of the upload resource"
#   value       = aws_api_gateway_resource.upload.id
# }

# output "upload_claim_resource_id" {
#   description = "ID of the upload claim resource"
#   value       = aws_api_gateway_resource.upload_claim.id
# }

# Lambda Authorizer Outputs
output "api_gateway_authorizer_id" {
  description = "ID of the API Gateway Lambda authorizer"
  value       = var.lambda_authorizer_invoke_arn != "" ? aws_api_gateway_authorizer.lambda_authorizer[0].id : null
}

output "api_gateway_authorizer_arn" {
  description = "ARN of the API Gateway authorizer IAM role"
  value       = var.lambda_authorizer_invoke_arn != "" ? aws_iam_role.api_gateway_authorizer[0].arn : null
}