#!/bin/bash

# Simple storage validation
set -e

echo "🔍 Validating storage module..."

terraform validate
terraform fmt -check=true

echo "✅ Storage validation complete!"