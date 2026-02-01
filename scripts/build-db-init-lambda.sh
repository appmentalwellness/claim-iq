#!/bin/bash

# Build script for database initialization Lambda function
# This script creates a deployment package with all Python dependencies

set -e

echo "🔨 Building database initialization Lambda function..."

# Navigate to the Lambda function directory
cd src/lambda/db_init

# Clean up any previous builds
rm -rf build/
mkdir -p build/

echo "📦 Installing Python dependencies..."

# Install dependencies to build directory
pip3 install -r requirements.txt -t build/

# Copy the Lambda function code
cp lambda_function.py build/

# Ensure target directory exists
mkdir -p ../../../terraform/modules/database/

# Create the deployment package
cd build/
zip -r ../../../terraform/modules/database/db_init.zip .

cd ../../../

echo "✅ Lambda deployment package created: terraform/modules/database/db_init.zip"
echo "📊 Package size: $(du -h terraform/modules/database/db_init.zip | cut -f1)"

# Verify the package contents
echo "📋 Package contents:"
unzip -l terraform/modules/database/db_init.zip | head -20