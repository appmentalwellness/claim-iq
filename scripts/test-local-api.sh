#!/bin/bash

# Test script for local ClaimIQ API
# Tests the locally running Lambda functions

set -e

BASE_URL="http://localhost:3000"

echo "🧪 Testing ClaimIQ Local API"
echo "============================"

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s -X GET "$BASE_URL/health" | jq '.' || echo "Health endpoint test failed"

echo ""
echo "2. Testing file upload endpoint (should require auth)..."
curl -s -X POST "$BASE_URL/upload" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test-claim.pdf",
    "contentType": "application/pdf",
    "fileSize": 1024000
  }' | jq '.' || echo "Upload endpoint test completed (expected to fail without auth)"

echo ""
echo "3. Testing upload status endpoint (should require auth)..."
curl -s -X GET "$BASE_URL/upload/test-claim-123" | jq '.' || echo "Upload status test completed (expected to fail without auth)"

echo ""
echo "✅ Local API tests completed!"
echo "💡 Note: Auth-protected endpoints will return 401/403 without valid JWT tokens"