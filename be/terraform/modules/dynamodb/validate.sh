#!/bin/bash

# Simple DynamoDB validation
set -e

echo "🔍 Validating DynamoDB module..."

terraform validate
terraform fmt -check=true

echo "✅ DynamoDB validation complete!"