# Configuration Improvements

## Current Issues

1. **Environment files in root directory**
2. **No environment validation**
3. **Hardcoded values in serverless configs**
4. **No configuration schema**

## Recommended Improvements

### 1. Environment Configuration Schema

Create `config/schema/environment.schema.json`:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": [
    "ENVIRONMENT",
    "AWS_REGION",
    "CLAIMS_BUCKET_NAME",
    "AURORA_CLUSTER_ARN",
    "AURORA_SECRET_ARN",
    "DATABASE_NAME",
    "AGENT_LOGS_TABLE"
  ],
  "properties": {
    "ENVIRONMENT": {
      "type": "string",
      "enum": ["dev", "staging", "prod"]
    },
    "AWS_REGION": {
      "type": "string",
      "pattern": "^[a-z]{2}-[a-z]+-[0-9]$"
    },
    "CLAIMS_BUCKET_NAME": {
      "type": "string",
      "minLength": 3,
      "maxLength": 63
    }
  }
}
```

### 2. Environment Validation Script

Create `scripts/utilities/validate-config.js`:
```javascript
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

function validateEnvironmentConfig(environment) {
  const schemaPath = path.join(__dirname, '../../config/schema/environment.schema.json');
  const configPath = path.join(__dirname, `../../config/environments/${environment}.json`);
  
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const valid = validate(config);
  
  if (!valid) {
    console.error('Configuration validation failed:');
    console.error(validate.errors);
    process.exit(1);
  }
  
  console.log(`✅ Configuration for ${environment} is valid`);
}

const environment = process.argv[2];
if (!environment) {
  console.error('Usage: node validate-config.js <environment>');
  process.exit(1);
}

validateEnvironmentConfig(environment);
```

### 3. Serverless Configuration Template

Create `config/serverless/base.yml`:
```yaml
# Base Serverless Configuration
# Extended by environment-specific configs

frameworkVersion: '3'

# Common provider settings
x-provider-defaults: &provider-defaults
  name: aws
  runtime: nodejs18.x
  memorySize: 1024
  timeout: 300
  tracing:
    lambda: true
  environment:
    ENVIRONMENT: ${self:provider.stage}
    NODE_ENV: ${self:provider.stage}
    LOG_LEVEL: ${env:LOG_LEVEL, 'info'}

# Common Lambda settings
x-lambda-defaults: &lambda-defaults
  runtime: nodejs18.x
  memorySize: 1024
  timeout: 300

# Common CORS settings
x-cors-defaults: &cors-defaults
  origin: '*'
  headers:
    - Content-Type
    - X-Amz-Date
    - Authorization
    - X-Api-Key
    - X-Amz-Security-Token
    - X-Tenant-Id
    - X-Hospital-Id
  allowCredentials: false

# Package settings
package:
  patterns:
    - '!.git/**'
    - '!.gitignore'
    - '!README.md'
    - '!docs/**'
    - '!terraform/**'
    - '!.serverless/**'
    - '!*.zip'
    - '!**/*.test.ts'
    - '!tests/**'
  individually: true

# Common plugins
plugins:
  - serverless-plugin-typescript
  - serverless-offline

# Custom settings
custom:
  serverless-plugin-typescript:
    tsConfigFileLocation: './tsconfig.json'
  
  serverless-offline:
    httpPort: 3000
    lambdaPort: 3002
    websocketPort: 3001
    noPrependStageInUrl: true
    noAuth: false
    printOutput: true
    useChildProcesses: true
```

### 4. Environment-Specific Configs

Create `config/serverless/environments/dev.yml`:
```yaml
# Development Environment Serverless Config
# Extends base configuration

service: claimiq-ingestion-dev

provider:
  <<: *provider-defaults
  stage: dev
  region: ${file(../../environments/dev.json):AWS_REGION}
  
  environment:
    <<: *provider-defaults.environment
    CLAIMS_BUCKET_NAME: ${file(../../environments/dev.json):CLAIMS_BUCKET_NAME}
    AURORA_CLUSTER_ARN: ${file(../../environments/dev.json):AURORA_CLUSTER_ARN}
    # ... other environment variables
  
  role: ${file(../../environments/dev.json):LAMBDA_EXECUTION_ROLE_ARN}
  
  vpc:
    securityGroupIds:
      - ${file(../../environments/dev.json):LAMBDA_SECURITY_GROUP_ID}
    subnetIds: ${file(../../environments/dev.json):PRIVATE_SUBNET_IDS}
  
  apiGateway:
    restApiId: ${file(../../environments/dev.json):API_GATEWAY_ID}
    restApiRootResourceId: ${file(../../environments/dev.json):API_GATEWAY_ROOT_RESOURCE_ID}

# Include base functions
functions: ${file(../base.yml):functions}

# Include base resources
resources: ${file(../base.yml):resources}
```

### 5. Configuration Loading Utility

Create `src/shared/typescript/config/index.ts`:
```typescript
import * as fs from 'fs';
import * as path from 'path';

export interface EnvironmentConfig {
  ENVIRONMENT: string;
  AWS_REGION: string;
  CLAIMS_BUCKET_NAME: string;
  AURORA_CLUSTER_ARN: string;
  AURORA_SECRET_ARN: string;
  DATABASE_NAME: string;
  AGENT_LOGS_TABLE: string;
  USER_POOL_ID: string;
  USER_POOL_CLIENT_ID: string;
  LAMBDA_EXECUTION_ROLE_ARN: string;
  LAMBDA_SECURITY_GROUP_ID: string;
  PRIVATE_SUBNET_IDS: string[];
  API_GATEWAY_ID: string;
  API_GATEWAY_ROOT_RESOURCE_ID: string;
  API_GATEWAY_URL: string;
  MAX_FILE_SIZE_MB: string;
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: EnvironmentConfig | null = null;

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public loadConfig(environment?: string): EnvironmentConfig {
    if (this.config) {
      return this.config;
    }

    const env = environment || process.env.ENVIRONMENT || 'dev';
    const configPath = path.join(__dirname, `../../../../config/environments/${env}.json`);

    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      this.config = JSON.parse(configData) as EnvironmentConfig;
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  public getConfig(): EnvironmentConfig {
    if (!this.config) {
      return this.loadConfig();
    }
    return this.config;
  }
}

export const configManager = ConfigManager.getInstance();
export const getConfig = () => configManager.getConfig();
```