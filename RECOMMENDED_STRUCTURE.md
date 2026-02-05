# Recommended Project Structure

## Current Issues and Proposed Structure

### 1. Root Directory Cleanup
```
# CURRENT (cluttered)
├── env-dev.json
├── serverless.yml
├── serverless-stepfunctions.yml
├── AWS_SDK_V3_MIGRATION_SUMMARY.md
├── CLEANUP_SUMMARY.md
├── INFRASTRUCTURE_VALIDATION_SUMMARY.md
├── ... (many more summary files)

# RECOMMENDED (clean)
├── README.md
├── package.json
├── tsconfig.json
├── .gitignore
├── .eslintrc.js
├── jest.config.js
```

### 2. Configuration Directory
```
# RECOMMENDED
├── config/
│   ├── environments/
│   │   ├── dev.json
│   │   ├── staging.json
│   │   └── prod.json
│   ├── serverless/
│   │   ├── main.yml
│   │   └── step-functions.yml
│   └── terraform/
│       └── (existing terraform structure)
```

### 3. Source Code Organization
```
# CURRENT (inconsistent naming)
├── src/
│   ├── lambda/
│   │   ├── file_upload/          # snake_case
│   │   ├── s3_processor/         # snake_case
│   │   ├── db_update/            # snake_case
│   │   └── normalization/        # camelCase

# RECOMMENDED (consistent naming)
├── src/
│   ├── functions/
│   │   ├── typescript/
│   │   │   ├── file-upload/
│   │   │   ├── s3-processor/
│   │   │   ├── db-update/
│   │   │   └── authorizer/
│   │   └── python/
│   │       ├── normalization/
│   │       └── db-init/
│   ├── shared/
│   │   ├── typescript/
│   │   │   ├── utils/
│   │   │   ├── types/
│   │   │   └── database/
│   │   └── python/
│   │       └── utils/
│   └── types/
│       └── global.d.ts
```

### 4. Documentation Organization
```
# RECOMMENDED
├── docs/
│   ├── architecture/
│   │   ├── ARCHITECTURE.md
│   │   └── diagrams/
│   ├── deployment/
│   │   ├── TERRAFORM_SERVERLESS_INTEGRATION.md
│   │   ├── JSON_DEPLOYMENT_GUIDE.md
│   │   └── LOCAL_DEVELOPMENT.md
│   ├── migration-summaries/
│   │   ├── AWS_SDK_V3_MIGRATION_SUMMARY.md
│   │   ├── TYPESCRIPT_MIGRATION_SUMMARY.md
│   │   └── CLEANUP_SUMMARY.md
│   └── api/
│       └── openapi.yml
```

### 5. Testing Structure
```
# RECOMMENDED
├── tests/
│   ├── unit/
│   │   ├── functions/
│   │   └── shared/
│   ├── integration/
│   │   ├── api/
│   │   └── workflows/
│   ├── infrastructure/
│   │   ├── database/
│   │   └── aws-resources/
│   ├── fixtures/
│   │   ├── sample-files/
│   │   └── mock-data/
│   └── helpers/
│       └── test-utils.ts
```

### 6. Scripts Organization
```
# RECOMMENDED
├── scripts/
│   ├── deployment/
│   │   ├── deploy-full.sh
│   │   ├── deploy-serverless.sh
│   │   └── generate-env.sh
│   ├── development/
│   │   ├── start-local.sh
│   │   ├── test-api.sh
│   │   └── refresh-credentials.sh
│   └── utilities/
│       └── cleanup.sh
```

### 7. Build and Distribution
```
# RECOMMENDED
├── build/
│   ├── functions/
│   └── shared/
├── dist/
│   ├── typescript/
│   └── python/
└── .serverless/
    ├── main/
    └── step-functions/
```