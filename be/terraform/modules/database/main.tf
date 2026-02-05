# Aurora Serverless v2 Database Module

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-claimiq-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.tags, {
    Name = "${var.environment}-claimiq-db-subnet-group"
  })
}

# Random password for database
resource "random_password" "master" {
  length  = 16
  special = true
}

# Secrets Manager secret for database credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.environment}/claimiq/database"
  description             = "Database credentials for ClaimIQ ${var.environment}"
  kms_key_id              = var.kms_key_arn
  recovery_window_in_days = 7

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "claimiq_admin"
    password = random_password.master.result
  })
}

# Aurora Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "${var.environment}-claimiq-cluster"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "15.8"
  database_name           = "claimiq"
  master_username         = "claimiq_admin"
  master_password         = random_password.master.result
  
  # Serverless v2 scaling configuration
  serverlessv2_scaling_configuration {
    max_capacity = var.serverless_max_capacity
    min_capacity = var.serverless_min_capacity
  }

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]

  # Backup configuration
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"

  # Encryption
  storage_encrypted = true
  kms_key_id       = var.kms_key_arn

  # Other settings
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.environment}-claimiq-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  deletion_protection       = var.environment == "prod"

  # Enable logging
  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.tags, {
    Name = "${var.environment}-claimiq-cluster"
  })
}

# Aurora Cluster Instance
resource "aws_rds_cluster_instance" "main" {
  identifier         = "${var.environment}-claimiq-instance"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn

  tags = merge(var.tags, {
    Name = "${var.environment}-claimiq-instance"
  })
}

# Security Group for Database
resource "aws_security_group" "database" {
  name_prefix = "${var.environment}-claimiq-db-"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # VPC CIDR
    description = "PostgreSQL access from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-claimiq-database-sg"
  })
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.environment}-claimiq-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# IAM Role for Database Initialization Lambda
resource "aws_iam_role" "db_init_lambda_role" {
  name = "${var.environment}-claimiq-db-init-lambda-role"

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

# IAM Policy for Database Initialization Lambda
resource "aws_iam_role_policy" "db_init_lambda_policy" {
  name = "${var.environment}-claimiq-db-init-lambda-policy"
  role = aws_iam_role.db_init_lambda_role.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AttachNetworkInterface",
          "ec2:DetachNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda function for database initialization (temporarily disabled due to psycopg2 platform compatibility)
# Will be handled through Serverless Framework deployment instead
# resource "aws_lambda_function" "db_init" {
#   filename         = "${path.module}/db_init.zip"
#   function_name    = "${var.environment}-claimiq-db-init"
#   role            = aws_iam_role.db_init_lambda_role.arn
#   handler         = "lambda_function.lambda_handler"
#   runtime         = "python3.11"
#   timeout         = 300
#   memory_size     = 512

#   source_code_hash = data.archive_file.db_init_zip.output_base64sha256

#   vpc_config {
#     subnet_ids         = var.private_subnet_ids
#     security_group_ids = [aws_security_group.lambda_db_init.id]
#   }

#   environment {
#     variables = {
#       ENVIRONMENT = var.environment
#     }
#   }

#   depends_on = [
#     aws_rds_cluster_instance.main,
#     aws_secretsmanager_secret_version.db_credentials
#   ]

#   tags = var.tags
# }

# Security Group for Database Initialization Lambda
resource "aws_security_group" "lambda_db_init" {
  name_prefix = "${var.environment}-claimiq-lambda-db-init-"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-claimiq-lambda-db-init-sg"
  })
}

# Allow Lambda to connect to database
resource "aws_security_group_rule" "lambda_to_db" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda_db_init.id
  security_group_id        = aws_security_group.database.id
}

# Archive the Lambda function code (pre-built package)
data "archive_file" "db_init_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../src/lambda/db_init"
  output_path = "${path.module}/db_init.zip"
  excludes    = ["build", "__pycache__", "*.pyc"]
}

# Lambda invocation to initialize database schema (temporarily disabled)
# Will be handled through Serverless Framework deployment instead
# resource "aws_lambda_invocation" "db_init" {
#   function_name = aws_lambda_function.db_init.function_name

#   input = jsonencode({
#     secret_name      = aws_secretsmanager_secret.db_credentials.name
#     cluster_endpoint = aws_rds_cluster.main.endpoint
#     database_name    = aws_rds_cluster.main.database_name
#   })

#   depends_on = [
#     aws_rds_cluster_instance.main,
#     aws_secretsmanager_secret_version.db_credentials
#   ]

#   triggers = {
#     cluster_id = aws_rds_cluster.main.cluster_identifier
#     secret_version = aws_secretsmanager_secret_version.db_credentials.version_id
#   }
# }