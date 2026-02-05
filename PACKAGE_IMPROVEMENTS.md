# Package.json Improvements

## Current Issues

1. **Missing Standard Scripts:**
   - No `precommit` hooks
   - No `format` script
   - No `type-check` script
   - No `validate` script

2. **Dependency Issues:**
   - Some dev dependencies should be dependencies
   - Missing common development tools

3. **Missing Metadata:**
   - No repository URL
   - No homepage
   - No bugs URL

## Recommended package.json Structure

```json
{
  "name": "@claimiq/ingestion-system",
  "version": "1.0.0",
  "description": "ClaimIQ AI-powered Insurance Denial Recovery System - Ingestion Layer",
  "private": true,
  "repository": {
    "type": "git",
    "url": "https://github.com/claimiq/ingestion-system.git"
  },
  "homepage": "https://github.com/claimiq/ingestion-system#readme",
  "bugs": {
    "url": "https://github.com/claimiq/ingestion-system/issues"
  },
  "scripts": {
    "// Build Scripts": "",
    "build": "npm run build:typescript && npm run build:python",
    "build:typescript": "tsc",
    "build:python": "cd src/functions/python && pip install -r requirements.txt -t ./build",
    "clean": "rm -rf dist build .serverless",
    
    "// Code Quality": "",
    "lint": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.{ts,js,json}\"",
    "type-check": "tsc --noEmit",
    "validate": "npm run type-check && npm run lint && npm run test:unit",
    
    "// Testing": "",
    "test": "jest",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:infrastructure": "jest --testPathPattern=tests/infrastructure",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    
    "// Deployment": "",
    "deploy": "npm run validate && npm run deploy:serverless",
    "deploy:serverless": "serverless deploy",
    "deploy:step-functions": "serverless deploy --config config/serverless/step-functions.yml",
    "deploy:full": "./scripts/deployment/deploy-full.sh",
    "deploy:dev": "./scripts/deployment/deploy-full.sh dev",
    "deploy:staging": "./scripts/deployment/deploy-full.sh staging",
    "deploy:prod": "./scripts/deployment/deploy-full.sh prod",
    
    "// Environment Management": "",
    "env:generate": "./scripts/deployment/generate-env.sh",
    "env:dev": "./scripts/deployment/generate-env.sh dev",
    "env:staging": "./scripts/deployment/generate-env.sh staging",
    "env:prod": "./scripts/deployment/generate-env.sh prod",
    
    "// Local Development": "",
    "dev": "npm run start:local",
    "start:local": "./scripts/development/start-local.sh",
    "offline": "serverless offline start --config config/serverless/local.yml",
    
    "// Utilities": "",
    "package": "serverless package",
    "logs": "serverless logs",
    "info": "serverless info",
    "remove": "serverless remove"
  },
  "dependencies": {
    "@aws-sdk/client-cognito-identity-provider": "^3.658.1",
    "@aws-sdk/client-dynamodb": "^3.658.1",
    "@aws-sdk/client-rds-data": "^3.658.1",
    "@aws-sdk/client-s3": "^3.658.1",
    "@aws-sdk/client-sfn": "^3.658.1",
    "@aws-sdk/lib-dynamodb": "^3.658.1",
    "@aws-sdk/s3-request-presigner": "^3.658.1",
    "data-api-client": "^2.1.3",
    "jsonwebtoken": "^9.0.2",
    "jwks-rsa": "^3.1.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.145",
    "@types/jest": "^29.5.14",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.10.0",
    "@types/uuid": "^9.0.7",
    "@typescript-eslint/eslint-plugin": "^6.12.0",
    "@typescript-eslint/parser": "^6.12.0",
    "eslint": "^8.54.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "husky": "^8.0.3",
    "jest": "^29.7.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0",
    "serverless": "^3.40.0",
    "serverless-dynamodb-local": "^0.2.40",
    "serverless-offline": "^14.4.0",
    "serverless-plugin-typescript": "^2.1.5",
    "serverless-python-requirements": "^6.1.2",
    "serverless-s3-local": "^0.8.5",
    "serverless-step-functions": "^3.23.4",
    "ts-jest": "^29.4.6",
    "typescript": "^5.3.3"
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run validate"
    }
  },
  "lint-staged": {
    "*.{ts,js}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```