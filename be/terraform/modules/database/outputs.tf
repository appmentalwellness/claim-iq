# Database Module Outputs

output "cluster_identifier" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
  sensitive   = true
}

output "cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
  sensitive   = true
}

output "cluster_port" {
  description = "Aurora cluster port"
  value       = aws_rds_cluster.main.port
}

output "cluster_arn" {
  description = "Aurora cluster ARN"
  value       = aws_rds_cluster.main.arn
}

output "database_name" {
  description = "Name of the database"
  value       = aws_rds_cluster.main.database_name
}

output "master_username" {
  description = "Master username"
  value       = aws_rds_cluster.main.master_username
  sensitive   = true
}

output "secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "secret_name" {
  description = "Name of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "security_group_id" {
  description = "Security group ID for the database"
  value       = aws_security_group.database.id
}

output "subnet_group_name" {
  description = "DB subnet group name"
  value       = aws_db_subnet_group.main.name
}

# Database initialization Lambda outputs (temporarily disabled)
# output "db_init_lambda_arn" {
#   description = "ARN of the database initialization Lambda function"
#   value       = aws_lambda_function.db_init.arn
# }

# output "db_init_lambda_name" {
#   description = "Name of the database initialization Lambda function"
#   value       = aws_lambda_function.db_init.function_name
# }

# output "db_init_result" {
#   description = "Result of database initialization"
#   value       = aws_lambda_invocation.db_init.result
#   sensitive   = true
# }