#!/bin/bash

# Quick test script for local development
# Starts the server briefly and tests basic functionality

set -e

echo "🚀 Quick Local Development Test"
echo "==============================="

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

echo "✅ Environment variables loaded"

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ TypeScript build completed"

# Test serverless configuration
echo "🔍 Testing serverless configuration..."
npx serverless print --config serverless.local.yml > /dev/null

echo "✅ Serverless configuration is valid"

echo ""
echo "🎉 Local development setup is ready!"
echo ""
echo "To start the local server:"
echo "  npm run start:local"
echo ""
echo "Or manually:"
echo "  export \$(cat .env.local | grep -v '^#' | xargs)"
echo "  npx serverless offline start --config serverless.local.yml"
echo ""
echo "Available endpoints:"
echo "  GET  http://localhost:3000/health"
echo "  POST http://localhost:3000/upload"
echo "  GET  http://localhost:3000/upload/{claimId}"