#!/bin/bash

# API Gateway Integration Test Script
# Tests the API Gateway endpoints with the file upload Lambda function

set -e

echo "🧪 Testing API Gateway Integration..."

# Configuration
API_GATEWAY_URL="${API_GATEWAY_URL:-https://your-api-id.execute-api.us-east-1.amazonaws.com/dev}"
TENANT_ID="${TENANT_ID:-test-tenant}"
HOSPITAL_ID="${HOSPITAL_ID:-test-hospital}"

# Test data
TEST_FILENAME="test-claim.pdf"
TEST_CONTENT_TYPE="application/pdf"
TEST_FILE_SIZE=1024

echo "📋 Configuration:"
echo "  API Gateway URL: $API_GATEWAY_URL"
echo "  Tenant ID: $TENANT_ID"
echo "  Hospital ID: $HOSPITAL_ID"
echo ""

# Test 1: POST /upload - Generate pre-signed URL
echo "🔄 Test 1: POST /upload (Generate pre-signed URL)"
UPLOAD_RESPONSE=$(curl -s -X POST "$API_GATEWAY_URL/upload" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "X-Hospital-Id: $HOSPITAL_ID" \
  -d "{
    \"filename\": \"$TEST_FILENAME\",
    \"contentType\": \"$TEST_CONTENT_TYPE\",
    \"fileSize\": $TEST_FILE_SIZE
  }" || echo "Request failed")

if [[ "$UPLOAD_RESPONSE" == *"success"* ]]; then
    echo "✅ POST /upload successful"
    
    # Extract claim ID for next test
    CLAIM_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"claimId":"[^"]*"' | cut -d'"' -f4 || echo "")
    
    if [ -n "$CLAIM_ID" ]; then
        echo "   Generated Claim ID: $CLAIM_ID"
        
        # Test 2: GET /upload/{claimId} - Check upload status
        echo ""
        echo "🔄 Test 2: GET /upload/$CLAIM_ID (Check upload status)"
        STATUS_RESPONSE=$(curl -s -X GET "$API_GATEWAY_URL/upload/$CLAIM_ID" \
          -H "X-Tenant-Id: $TENANT_ID" \
          -H "X-Hospital-Id: $HOSPITAL_ID" || echo "Request failed")
        
        if [[ "$STATUS_RESPONSE" == *"claimId"* ]]; then
            echo "✅ GET /upload/{claimId} successful"
        else
            echo "❌ GET /upload/{claimId} failed"
            echo "   Response: $STATUS_RESPONSE"
        fi
    else
        echo "⚠️  Could not extract claim ID from response"
    fi
else
    echo "❌ POST /upload failed"
    echo "   Response: $UPLOAD_RESPONSE"
fi

# Test 3: OPTIONS /upload - CORS preflight
echo ""
echo "🔄 Test 3: OPTIONS /upload (CORS preflight)"
OPTIONS_RESPONSE=$(curl -s -X OPTIONS "$API_GATEWAY_URL/upload" \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,X-Tenant-Id" \
  -I || echo "Request failed")

if [[ "$OPTIONS_RESPONSE" == *"Access-Control-Allow-Origin"* ]]; then
    echo "✅ OPTIONS /upload (CORS) successful"
else
    echo "❌ OPTIONS /upload (CORS) failed"
    echo "   Response: $OPTIONS_RESPONSE"
fi

# Test 4: GET /upload - List uploads (optional endpoint)
echo ""
echo "🔄 Test 4: GET /upload (List uploads)"
LIST_RESPONSE=$(curl -s -X GET "$API_GATEWAY_URL/upload" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "X-Hospital-Id: $HOSPITAL_ID" || echo "Request failed")

if [[ "$LIST_RESPONSE" != "Request failed" ]]; then
    echo "✅ GET /upload successful"
else
    echo "❌ GET /upload failed"
    echo "   Response: $LIST_RESPONSE"
fi

echo ""
echo "🏁 API Gateway integration tests completed!"
echo ""
echo "📝 Next Steps:"
echo "  1. Deploy the infrastructure: cd terraform && terraform apply"
echo "  2. Deploy Lambda functions: serverless deploy"
echo "  3. Update API_GATEWAY_URL in this script with actual URL"
echo "  4. Run this test script again with real endpoints"
echo ""
echo "💡 Note: These tests require actual AWS deployment to work fully"