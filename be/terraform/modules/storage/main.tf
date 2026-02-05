# S3 Storage Module

# S3 Bucket for Claims Files
resource "aws_s3_bucket" "claims" {
  bucket = "${var.environment}-claimiq-claims-${random_id.bucket_suffix.hex}"

  tags = merge(var.tags, {
    Name = "${var.environment}-claimiq-claims"
    Type = "Claims Storage"
  })
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "claims" {
  bucket = aws_s3_bucket.claims.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "claims" {
  bucket = aws_s3_bucket.claims.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "claims" {
  bucket = aws_s3_bucket.claims.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy for tenant isolation
resource "aws_s3_bucket_policy" "claims" {
  bucket = aws_s3_bucket.claims.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.claims.arn,
          "${aws_s3_bucket.claims.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# S3 Bucket CORS Configuration
resource "aws_s3_bucket_cors_configuration" "claims" {
  bucket = aws_s3_bucket.claims.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "POST", "PUT"]
    allowed_origins = ["*"] # Should be restricted to actual domain in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3 Bucket Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "claims" {
  bucket = aws_s3_bucket.claims.id

  rule {
    id     = "claims_lifecycle"
    status = "Enabled"

    # Apply to all objects
    filter {}

    # Move to IA after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Move to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Delete after 7 years (regulatory compliance)
    expiration {
      days = 2555
    }

    # Clean up incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 Bucket for Generated Appeals
resource "aws_s3_bucket" "appeals" {
  bucket = "${var.environment}-claimiq-appeals-${random_id.appeals_suffix.hex}"

  tags = merge(var.tags, {
    Name = "${var.environment}-claimiq-appeals"
    Type = "Appeals Storage"
  })
}

resource "random_id" "appeals_suffix" {
  byte_length = 4
}

# Appeals bucket configuration (similar to claims)
resource "aws_s3_bucket_versioning" "appeals" {
  bucket = aws_s3_bucket.appeals.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "appeals" {
  bucket = aws_s3_bucket.appeals.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "appeals" {
  bucket = aws_s3_bucket.appeals.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}