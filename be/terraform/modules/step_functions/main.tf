# Step Functions Module (Basic Setup)
# State machines are managed by Serverless Framework

# CloudWatch Log Group for Step Functions
resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/stepfunctions/${var.environment}-claimiq"
  retention_in_days = 14
  kms_key_id       = var.kms_key_arn

  tags = var.tags
}