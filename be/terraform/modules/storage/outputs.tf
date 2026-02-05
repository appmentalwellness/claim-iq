# Storage Module Outputs

output "claims_bucket_name" {
  description = "Name of the claims S3 bucket"
  value       = aws_s3_bucket.claims.bucket
}

output "claims_bucket_arn" {
  description = "ARN of the claims S3 bucket"
  value       = aws_s3_bucket.claims.arn
}

output "claims_bucket_domain_name" {
  description = "Domain name of the claims S3 bucket"
  value       = aws_s3_bucket.claims.bucket_domain_name
}

output "appeals_bucket_name" {
  description = "Name of the appeals S3 bucket"
  value       = aws_s3_bucket.appeals.bucket
}

output "appeals_bucket_arn" {
  description = "ARN of the appeals S3 bucket"
  value       = aws_s3_bucket.appeals.arn
}

output "appeals_bucket_domain_name" {
  description = "Domain name of the appeals S3 bucket"
  value       = aws_s3_bucket.appeals.bucket_domain_name
}