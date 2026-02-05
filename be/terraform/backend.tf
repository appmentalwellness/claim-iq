# Backend Configuration for Terraform State Management
# For development, we use local state (terraform.tfstate file)
# For production teams, uncomment the S3 backend after creating the bucket manually

terraform {
  # Local state - simple and works great for development
  # State file will be stored as terraform.tfstate in this directory
  
  # For team collaboration, uncomment this after manually creating the S3 bucket:
  # backend "s3" {
  #   bucket         = "your-unique-terraform-state-bucket"
  #   key            = "claimiq/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-state-lock"  # Optional: for state locking
  #   encrypt        = true
  # }
}