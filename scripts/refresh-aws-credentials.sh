#!/bin/bash

# ClaimIQ AWS Credentials Refresh Script
# This script clears cached AWS credentials and verifies CLI access

echo "🔐 Refreshing AWS credentials..."

# Clear all AWS environment variables
echo "🧹 Clearing cached AWS credentials..."
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
unset AWS_SESSION_TOKEN
unset AWS_SECURITY_TOKEN
unset AWS_CREDENTIAL_EXPIRATION

# Verify credentials are cleared
echo "✅ Cleared AWS environment variables"

# Test AWS CLI access with default profile
echo "🔍 Testing AWS CLI access..."
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "✅ AWS CLI is working with default profile"
    
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    AWS_USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
    echo "📋 Account ID: $AWS_ACCOUNT_ID"
    echo "📋 User: $AWS_USER_ARN"
    echo "📋 Region: ${AWS_DEFAULT_REGION:-us-east-1}"
    echo ""
    echo "🎉 AWS credentials verified successfully!"
else
    echo "❌ AWS CLI is not configured or credentials are invalid"
    echo "Please run 'aws configure' or set up your AWS credentials"
    exit 1
fi