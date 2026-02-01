#!/bin/bash

# ClaimIQ File Upload Test Script
# Tests the new S3 pre-signed URL based ingestion layer

set -e

# Configuration
API_GATEWAY_URL=${1:-""}
TENANT_ID=${2:-"default-tenant"}
HOSPITAL_ID=${3:-"default-hospital"}

if [ -z "$API_GATEWAY_URL" ]; then
    echo "Usage: $0 <API_GATEWAY_URL> [TENANT_ID] [HOSPITAL_ID]"
    echo "Example: $0 https://abc123.execute-api.us-east-1.amazonaws.com/dev"
    echo ""
    echo "Note: The API Gateway URL should include the stage (e.g., /dev)"
    exit 1
fi

echo "🧪 Testing ClaimIQ File Upload API (S3 Pre-signed URL Architecture)"
echo "API URL: $API_GATEWAY_URL"
echo "Tenant ID: $TENANT_ID"
echo "Hospital ID: $HOSPITAL_ID"
echo ""

# Create a test CSV file
TEST_FILE="test-claim.csv"
cat > $TEST_FILE << EOF
claim_number,patient_name,hospital_name,claim_amount,denied_amount,denial_reason
CLM001,John Doe,City Hospital,50000,15000,Missing discharge summary
EOF

echo "📄 Created test file: $TEST_FILE"
FILE_SIZE=$(wc -c < "$TEST_FILE")
FILE_HASH=$(shasum -a 256 "$TEST_FILE" | cut -d' ' -f1)

# Test 1: Request pre-signed URL
echo ""
echo "🔄 Test 1: Requesting pre-signed URL..."
PRESIGNED_RESPONSE=$(curl -s -X POST "$API_GATEWAY_URL/upload" \
  -H 'Content-Type: application/json' \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "X-Hospital-Id: $HOSPITAL_ID" \
  -d "{
    \"filename\": \"$TEST_FILE\",
    \"contentType\": \"text/csv\",
    \"fileSize\": $FILE_SIZE,
    \"fileHash\": \"$FILE_HASH\"
  }")

echo "Pre-signed URL Response: $PRESIGNED_RESPONSE"

if echo "$PRESIGNED_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Test 1 PASSED: Pre-signed URL generated successfully"
    
    # Extract pre-signed URL and claim ID
    PRESIGNED_URL=$(echo "$PRESIGNED_RESPONSE" | grep -o '"presignedUrl":"[^"]*"' | cut -d'"' -f4)
    CLAIM_ID=$(echo "$PRESIGNED_RESPONSE" | grep -o '"claimId":"[^"]*"' | cut -d'"' -f4)
    
    echo "   Claim ID: $CLAIM_ID"
    echo "   Pre-signed URL: ${PRESIGNED_URL:0:100}..."
    
    # Test 2: Upload file directly to S3
    echo ""
    echo "🔄 Test 2: Uploading file directly to S3..."
    
    S3_RESPONSE=$(curl -s -X PUT "$PRESIGNED_URL" \
      -H "Content-Type: text/csv" \
      --data-binary @$TEST_FILE \
      -w "HTTP_STATUS:%{http_code}")
    
    HTTP_STATUS=$(echo "$S3_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Test 2 PASSED: File uploaded to S3 successfully"
        
        # Test 3: Check upload status
        echo ""
        echo "🔄 Test 3: Checking upload status..."
        sleep 2  # Wait for S3 event processing
        
        STATUS_RESPONSE=$(curl -s -X GET "$API_GATEWAY_URL/upload/$CLAIM_ID")
        echo "Status Response: $STATUS_RESPONSE"
        
        if echo "$STATUS_RESPONSE" | grep -q '"success":true'; then
            echo "✅ Test 3 PASSED: Upload status retrieved successfully"
        else
            echo "❌ Test 3 FAILED: Could not retrieve upload status"
        fi
        
    else
        echo "❌ Test 2 FAILED: S3 upload failed with status $HTTP_STATUS"
        echo "   Response: $S3_RESPONSE"
    fi
    
else
    echo "❌ Test 1 FAILED: Pre-signed URL generation failed"
    echo "   Response: $PRESIGNED_RESPONSE"
fi

# Test 4: Request pre-signed URL for duplicate file
echo ""
echo "🔄 Test 4: Testing duplicate detection..."
DUPLICATE_RESPONSE=$(curl -s -X POST "$API_GATEWAY_URL/upload" \
  -H 'Content-Type: application/json' \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "X-Hospital-Id: $HOSPITAL_ID" \
  -d "{
    \"filename\": \"duplicate-$TEST_FILE\",
    \"contentType\": \"text/csv\",
    \"fileSize\": $FILE_SIZE,
    \"fileHash\": \"$FILE_HASH\"
  }")

echo "Duplicate Response: $DUPLICATE_RESPONSE"

if echo "$DUPLICATE_RESPONSE" | grep -q '"status":"duplicate"'; then
    echo "✅ Test 4 PASSED: Duplicate detection working"
else
    echo "❌ Test 4 FAILED: Duplicate not detected"
fi

# Test 5: Test file size limit
echo ""
echo "🔄 Test 5: Testing file size limit..."

LARGE_FILE_RESPONSE=$(curl -s -X POST "$API_GATEWAY_URL/upload" \
  -H 'Content-Type: application/json' \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "X-Hospital-Id: $HOSPITAL_ID" \
  -d "{
    \"filename\": \"large-file.csv\",
    \"contentType\": \"text/csv\",
    \"fileSize\": 53477376
  }")

echo "Large file Response: $LARGE_FILE_RESPONSE"

if echo "$LARGE_FILE_RESPONSE" | grep -q "exceeds maximum allowed size"; then
    echo "✅ Test 5 PASSED: File size limit enforced"
else
    echo "❌ Test 5 FAILED: File size limit not enforced"
fi

# Test 6: Test unsupported file type
echo ""
echo "🔄 Test 6: Testing unsupported file type..."

UNSUPPORTED_RESPONSE=$(curl -s -X POST "$API_GATEWAY_URL/upload" \
  -H 'Content-Type: application/json' \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "X-Hospital-Id: $HOSPITAL_ID" \
  -d "{
    \"filename\": \"test.json\",
    \"contentType\": \"application/json\",
    \"fileSize\": 100
  }")

echo "Unsupported type Response: $UNSUPPORTED_RESPONSE"

if echo "$UNSUPPORTED_RESPONSE" | grep -q "Unsupported file type"; then
    echo "✅ Test 6 PASSED: Unsupported file type rejected"
else
    echo "❌ Test 6 FAILED: Unsupported file type not rejected"
fi

# Cleanup
rm -f $TEST_FILE

echo ""
echo "🎉 Testing completed!"
echo ""
echo "📊 Summary:"
echo "- Pre-signed URL generation"
echo "- Direct S3 upload"
echo "- Upload status checking"
echo "- Duplicate detection"
echo "- File size validation"
echo "- Content type validation"
echo ""
echo "💡 Next steps:"
echo "1. Check CloudWatch logs for S3 processor execution"
echo "2. Verify Step Functions workflow execution"
echo "3. Check Aurora database for claim records"
echo "4. Monitor DynamoDB for audit logs"