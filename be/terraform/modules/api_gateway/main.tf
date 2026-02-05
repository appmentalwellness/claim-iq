# API Gateway Module - Infrastructure Only
# Creates API Gateway structure, Serverless handles Lambda integrations

# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.environment}-${var.api_name}"
  description = "${var.api_description} for ${var.environment}"

  endpoint_configuration {
    types = [var.endpoint_type]
  }

  # Binary media types for file uploads
  binary_media_types = var.binary_media_types

  tags = var.tags
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.environment}-claimiq"
  retention_in_days = var.cloudwatch_log_retention_days
  tags              = var.tags
}

# API Gateway Account settings for CloudWatch logging
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

# IAM role for API Gateway CloudWatch logging
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.environment}-api-gateway-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM policy attachment for API Gateway CloudWatch logging
resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# Usage Plan for rate limiting
resource "aws_api_gateway_usage_plan" "main" {
  name = "${var.environment}-claimiq-usage-plan"

  quota_settings {
    limit  = var.usage_plan_quota_limit
    period = "DAY"
  }

  throttle_settings {
    rate_limit  = var.usage_plan_rate_limit
    burst_limit = var.usage_plan_burst_limit
  }

  tags = var.tags
}

# API Key for usage plan
resource "aws_api_gateway_api_key" "main" {
  name        = "${var.environment}-claimiq-api-key"
  description = "API key for ClaimIQ ${var.environment} environment"
  tags        = var.tags
}

# Usage plan key association
resource "aws_api_gateway_usage_plan_key" "main" {
  key_id        = aws_api_gateway_api_key.main.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.main.id
}

# Lambda Authorizer (if configured)
resource "aws_api_gateway_authorizer" "lambda_authorizer" {
  count = var.lambda_authorizer_invoke_arn != "" ? 1 : 0

  name                   = "${var.environment}-claimiq-authorizer"
  rest_api_id           = aws_api_gateway_rest_api.main.id
  authorizer_uri        = var.lambda_authorizer_invoke_arn
  authorizer_credentials = aws_iam_role.api_gateway_authorizer[0].arn
  type                  = "REQUEST"
  
  authorizer_result_ttl_in_seconds = 300
  identity_source = "method.request.header.Authorization"
}

# IAM role for API Gateway to invoke Lambda authorizer
resource "aws_iam_role" "api_gateway_authorizer" {
  count = var.lambda_authorizer_invoke_arn != "" ? 1 : 0
  name  = "${var.environment}-api-gateway-authorizer-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM policy for API Gateway to invoke Lambda authorizer
resource "aws_iam_role_policy" "api_gateway_authorizer" {
  count = var.lambda_authorizer_invoke_arn != "" ? 1 : 0
  name  = "${var.environment}-api-gateway-authorizer-policy"
  role  = aws_iam_role.api_gateway_authorizer[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          var.lambda_authorizer_invoke_arn
        ]
      }
    ]
  })
}

# Data source for current region
data "aws_region" "current" {}