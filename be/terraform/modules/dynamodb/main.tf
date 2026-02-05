# DynamoDB Tables Module

# Agent Execution Logs Table
resource "aws_dynamodb_table" "agent_logs" {
  name           = "${var.environment}-claimiq-agent-logs"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "claim_id"
  range_key      = "timestamp"

  attribute {
    name = "claim_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "agent_type"
    type = "S"
  }

  attribute {
    name = "tenant_id"
    type = "S"
  }

  # Global Secondary Index for querying by agent type
  global_secondary_index {
    name               = "AgentTypeIndex"
    hash_key           = "agent_type"
    range_key          = "timestamp"
    projection_type    = "ALL"
  }

  # Global Secondary Index for tenant isolation
  global_secondary_index {
    name               = "TenantIndex"
    hash_key           = "tenant_id"
    range_key          = "timestamp"
    projection_type    = "ALL"
  }

  # Server-side encryption
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-claimiq-agent-logs"
    Type = "Agent Execution Logs"
  })
}

# State Machine Checkpoints Table
resource "aws_dynamodb_table" "state_checkpoints" {
  name           = "${var.environment}-claimiq-state-checkpoints"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "execution_arn"
  range_key      = "state_name"

  attribute {
    name = "execution_arn"
    type = "S"
  }

  attribute {
    name = "state_name"
    type = "S"
  }

  attribute {
    name = "claim_id"
    type = "S"
  }

  # Global Secondary Index for querying by claim
  global_secondary_index {
    name               = "ClaimIndex"
    hash_key           = "claim_id"
    range_key          = "execution_arn"
    projection_type    = "ALL"
  }

  # Server-side encryption
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # TTL for automatic cleanup of old checkpoints
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-claimiq-state-checkpoints"
    Type = "State Machine Checkpoints"
  })
}

# Idempotency Keys Table
resource "aws_dynamodb_table" "idempotency_keys" {
  name           = "${var.environment}-claimiq-idempotency"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "idempotency_key"

  attribute {
    name = "idempotency_key"
    type = "S"
  }

  # Server-side encryption
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  # TTL for automatic cleanup (24 hours)
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-claimiq-idempotency"
    Type = "Idempotency Keys"
  })
}

# System Events Table
resource "aws_dynamodb_table" "system_events" {
  name           = "${var.environment}-claimiq-system-events"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "event_id"
  range_key      = "timestamp"

  attribute {
    name = "event_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "event_type"
    type = "S"
  }

  attribute {
    name = "tenant_id"
    type = "S"
  }

  # Global Secondary Index for querying by event type
  global_secondary_index {
    name               = "EventTypeIndex"
    hash_key           = "event_type"
    range_key          = "timestamp"
    projection_type    = "ALL"
  }

  # Global Secondary Index for tenant isolation
  global_secondary_index {
    name               = "TenantEventIndex"
    hash_key           = "tenant_id"
    range_key          = "timestamp"
    projection_type    = "ALL"
  }

  # Server-side encryption
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-claimiq-system-events"
    Type = "System Events"
  })
}