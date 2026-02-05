# Custom Authorizer Setup in Hybrid Architecture

## How Custom Authorizer Works

In our Terraform + Serverless hybrid setup, the custom authorizer provides clean separation of concerns:

### **1. Serverless Deploys the Authorizer Function**
```yaml
functions:
  authorizer:
    handler: src/lambda/authorizer/index.handler
    name: ${self:provider.stage}-claimiq-authorizer
    # No HTTP events - used as authorizer only
```

### **2. HTTP Events Reference the Authorizer by Name**
```yaml
functions:
  fileUpload:
    events:
      - http:
          path: upload
          method: post
          authorizer:
            name: authorizer                    # References function above
            type: request                       # REQUEST type authorizer
            resultTtlInSeconds: 300            # Cache for 5 minutes
            identitySource: method.request.header.Authorization
```

### **3. Serverless Automatically Handles**
- ✅ Creates the Lambda function
- ✅ Creates the API Gateway authorizer resource
- ✅ Links the authorizer to the Lambda ARN
- ✅ Grants API Gateway permission to invoke the Lambda
- ✅ Associates the authorizer with specific HTTP methods

## Benefits of Custom Authorizer Approach

### **vs Global Provider-Level Authorizer:**
✅ **Granular Control**: Can apply different authorizers to different routes
✅ **Explicit Configuration**: Clear which routes use which authorizer
✅ **Flexible**: Easy to disable authorization per route with `authorizer: false`
✅ **Debugging**: Easier to troubleshoot authorization issues

### **vs Terraform-Managed Authorizer:**
✅ **Unified Deployment**: Authorizer and routes deployed together
✅ **Automatic Wiring**: Serverless handles all the ARN references
✅ **Version Management**: Authorizer updates with application deployments

## Request Flow

```
1. Client Request
   ↓
2. API Gateway (Terraform-managed)
   ↓
3. Custom Authorizer (Serverless-deployed)
   ├─ Validates JWT token
   ├─ Extracts user/tenant context
   └─ Returns IAM policy + context
   ↓
4. API Gateway caches result (300s)
   ↓
5. Lambda Function (Serverless-deployed)
   └─ Receives user context in event.requestContext.authorizer
```

## Configuration Examples

### **YAML Anchors for DRY Configuration**
```yaml
# Define reusable configurations
x-custom-authorizer: &custom-authorizer
  name: authorizer
  type: request
  resultTtlInSeconds: 300
  identitySource: method.request.header.Authorization
  identityValidationExpression: '^Bearer [-0-9a-zA-Z\._]*$'

x-common-cors: &common-cors
  origin: '*'
  headers:
    - Content-Type
    - Authorization
    - X-Api-Key
    - X-Tenant-Id
    - X-Hospital-Id
  allowCredentials: false

x-lambda-defaults: &lambda-defaults
  runtime: nodejs18.x
  memorySize: 1024
  timeout: 300
```

### **Protected Route with Anchors**
```yaml
functions:
  fileUpload:
    <<: *lambda-defaults              # Inherit common Lambda settings
    handler: src/lambda/file_upload/index.handler
    events:
      - http:
          path: upload
          method: post
          authorizer: *custom-authorizer    # Reuse authorizer config
          cors: *common-cors               # Reuse CORS config
```

### **Public Route**
```yaml
- http:
    path: health
    method: get
    authorizer: false    # Explicitly disable
```

## Deployment Process

1. **Terraform**: Creates API Gateway infrastructure
2. **Serverless**: Deploys authorizer Lambda + associates with API Gateway
3. **Result**: Fully integrated authorization system

## Troubleshooting

### **Common Issues:**
- **401 Unauthorized**: Check JWT token format and expiration
- **403 Forbidden**: Check IAM policy returned by authorizer
- **500 Internal Error**: Check authorizer Lambda logs

### **Testing:**
```bash
# Test without authorization (should fail)
curl -X POST https://api-id.execute-api.region.amazonaws.com/dev/upload

# Test with valid JWT
curl -X POST https://api-id.execute-api.region.amazonaws.com/dev/upload \
  -H "Authorization: Bearer your-jwt-token"

# Test public endpoint (should work)
curl https://api-id.execute-api.region.amazonaws.com/dev/health
```

## Security Features

✅ **JWT Validation**: Validates tokens against Cognito User Pool
✅ **Tenant Isolation**: Enforces tenant-specific resource access
✅ **Result Caching**: Reduces authorizer invocations (performance + cost)
✅ **Request Context**: Passes user/tenant info to Lambda functions
✅ **IAM Integration**: Returns proper IAM policies for fine-grained access