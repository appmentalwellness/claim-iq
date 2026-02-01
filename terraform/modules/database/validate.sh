#!/bin/bash

# Simple database validation
set -e

echo "🔍 Validating database module..."

terraform validate
terraform fmt -check=true

echo "✅ Database validation complete!"