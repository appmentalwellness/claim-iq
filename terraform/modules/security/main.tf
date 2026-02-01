# Security Module - KMS and IAM

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "ClaimIQ encryption key for ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.environment}-claimiq-kms-key"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.environment}-claimiq"
  target_key_id = aws_kms_key.main.key_id
}

# IAM Role for Lambda functions
resource "aws_iam_role" "lambda_execution" {
  name = "${var.environment}-claimiq-lambda-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM Policy for Lambda basic execution
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# IAM Policy for Lambda to access AWS services
resource "aws_iam_role_policy" "lambda_services" {
  name = "${var.environment}-claimiq-lambda-services"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.environment}-claimiq-*",
          "arn:aws:s3:::${var.environment}-claimiq-*/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${var.environment}-claimiq-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "rds-data:ExecuteStatement",
          "rds-data:BatchExecuteStatement",
          "rds-data:BeginTransaction",
          "rds-data:CommitTransaction",
          "rds-data:RollbackTransaction"
        ]
        Resource = [
          "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster:${var.environment}-claimiq-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${var.environment}/claimiq/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.main.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = [
          "arn:aws:bedrock:${data.aws_region.current.name}::foundation-model/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "textract:DetectDocumentText",
          "textract:AnalyzeDocument"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = [
          "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${var.environment}-claimiq-*"
        ]
      }
    ]
  })
}

# IAM Role for Step Functions
resource "aws_iam_role" "step_functions" {
  name = "${var.environment}-claimiq-step-functions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "step_functions" {
  name = "${var.environment}-claimiq-step-functions"
  role = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${var.environment}-claimiq-*"
        ]
      }
    ]
  })
}

# =============================================================================
# AWS Cognito User Pool for Authentication
# =============================================================================

# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "${var.environment}-claimiq-users"

  # User attributes
  alias_attributes = ["email"]
  
  # Password policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = "ENFORCED"
  }

  # Schema for custom attributes (custom attributes cannot be required)
  schema {
    attribute_data_type = "String"
    name               = "tenant_id"
    required           = false
    mutable            = false

    string_attribute_constraints {
      min_length = 1
      max_length = 100
    }
  }

  schema {
    attribute_data_type = "String"
    name               = "hospital_id"
    required           = false
    mutable            = true

    string_attribute_constraints {
      min_length = 1
      max_length = 100
    }
  }

  schema {
    attribute_data_type = "String"
    name               = "role"
    required           = false
    mutable            = true

    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  # Auto-verified attributes
  auto_verified_attributes = ["email"]

  # Username configuration
  username_configuration {
    case_sensitive = false
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-claimiq-user-pool"
  })
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.environment}-claimiq-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Client settings
  generate_secret                      = false
  prevent_user_existence_errors        = "ENABLED"
  enable_token_revocation             = true
  enable_propagate_additional_user_context_data = false

  # Token validity
  access_token_validity  = 1  # 1 hour
  id_token_validity     = 1  # 1 hour
  refresh_token_validity = 30 # 30 days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # OAuth settings
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  
  # Callback URLs (will be updated based on environment)
  callback_urls = var.cognito_callback_urls
  logout_urls   = var.cognito_logout_urls

  # Supported identity providers
  supported_identity_providers = ["COGNITO"]

  # Read and write attributes
  read_attributes = [
    "email",
    "email_verified",
    "custom:tenant_id",
    "custom:hospital_id",
    "custom:role"
  ]

  write_attributes = [
    "email",
    "custom:hospital_id",
    "custom:role"
  ]

  # Explicit auth flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}

# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.environment}-claimiq-${random_string.domain_suffix.result}"
  user_pool_id = aws_cognito_user_pool.main.id
}

# Random string for unique domain
resource "random_string" "domain_suffix" {
  length  = 8
  special = false
  upper   = false
}

# =============================================================================
# Lambda Authorizer for API Gateway
# =============================================================================

# Lambda function for JWT authorization
# Note: Commented out - Lambda functions are deployed via Serverless Framework
# resource "aws_lambda_function" "authorizer" {
#   filename         = var.authorizer_lambda_zip_path
#   function_name    = "${var.environment}-claimiq-authorizer"
#   role            = aws_iam_role.lambda_authorizer.arn
#   handler         = "index.handler"
#   runtime         = "python3.11"
#   timeout         = 30

#   source_code_hash = var.authorizer_lambda_zip_path != null ? filebase64sha256(var.authorizer_lambda_zip_path) : null

#   environment {
#     variables = {
#       USER_POOL_ID     = aws_cognito_user_pool.main.id
#       USER_POOL_CLIENT_ID = aws_cognito_user_pool_client.main.id
#       AWS_REGION       = data.aws_region.current.name
#       LOG_LEVEL        = var.log_level
#     }
#   }

#   tags = merge(var.tags, {
#     Name = "${var.environment}-claimiq-authorizer"
#   })
# }

# IAM role for Lambda authorizer
resource "aws_iam_role" "lambda_authorizer" {
  name = "${var.environment}-claimiq-lambda-authorizer"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM policy for Lambda authorizer
resource "aws_iam_role_policy" "lambda_authorizer" {
  name = "${var.environment}-claimiq-lambda-authorizer"
  role = aws_iam_role.lambda_authorizer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:GetUser",
          "cognito-idp:DescribeUserPool",
          "cognito-idp:DescribeUserPoolClient"
        ]
        Resource = [
          aws_cognito_user_pool.main.arn
        ]
      }
    ]
  })
}

# CloudWatch Log Group for authorizer Lambda
# Note: Commented out since Lambda function is deployed via Serverless Framework
# resource "aws_cloudwatch_log_group" "authorizer" {
#   name              = "/aws/lambda/${aws_lambda_function.authorizer.function_name}"
#   retention_in_days = var.cloudwatch_log_retention_days

#   tags = var.tags
# }

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}