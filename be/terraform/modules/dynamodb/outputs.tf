# DynamoDB Module Outputs

output "agent_logs_table_name" {
  description = "Name of the agent logs DynamoDB table"
  value       = aws_dynamodb_table.agent_logs.name
}

output "agent_logs_table_arn" {
  description = "ARN of the agent logs DynamoDB table"
  value       = aws_dynamodb_table.agent_logs.arn
}

output "state_checkpoints_table_name" {
  description = "Name of the state checkpoints DynamoDB table"
  value       = aws_dynamodb_table.state_checkpoints.name
}

output "state_checkpoints_table_arn" {
  description = "ARN of the state checkpoints DynamoDB table"
  value       = aws_dynamodb_table.state_checkpoints.arn
}

output "idempotency_keys_table_name" {
  description = "Name of the idempotency keys DynamoDB table"
  value       = aws_dynamodb_table.idempotency_keys.name
}

output "idempotency_keys_table_arn" {
  description = "ARN of the idempotency keys DynamoDB table"
  value       = aws_dynamodb_table.idempotency_keys.arn
}

output "system_events_table_name" {
  description = "Name of the system events DynamoDB table"
  value       = aws_dynamodb_table.system_events.name
}

output "system_events_table_arn" {
  description = "ARN of the system events DynamoDB table"
  value       = aws_dynamodb_table.system_events.arn
}

output "all_table_names" {
  description = "Map of all DynamoDB table names"
  value = {
    agent_logs        = aws_dynamodb_table.agent_logs.name
    state_checkpoints = aws_dynamodb_table.state_checkpoints.name
    idempotency_keys  = aws_dynamodb_table.idempotency_keys.name
    system_events     = aws_dynamodb_table.system_events.name
  }
}

output "all_table_arns" {
  description = "Map of all DynamoDB table ARNs"
  value = {
    agent_logs        = aws_dynamodb_table.agent_logs.arn
    state_checkpoints = aws_dynamodb_table.state_checkpoints.arn
    idempotency_keys  = aws_dynamodb_table.idempotency_keys.arn
    system_events     = aws_dynamodb_table.system_events.arn
  }
}