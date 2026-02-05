# Step Functions Module Outputs

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for Step Functions"
  value       = aws_cloudwatch_log_group.step_functions.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group for Step Functions"
  value       = aws_cloudwatch_log_group.step_functions.arn
}

# Note: State machine resources are managed by Serverless Framework
# This module only provides the basic infrastructure setup