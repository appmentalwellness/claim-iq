/**
 * Jest test setup for ClaimIQ infrastructure validation
 */

// Mock AWS SDK clients to prevent actual AWS calls during testing
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-rds-data');
jest.mock('@aws-sdk/client-sfn');
jest.mock('@aws-sdk/client-cognito-identity-provider');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('data-api-client');

// Set up environment variables for testing
process.env.ENVIRONMENT = 'test';
process.env.CLAIMS_BUCKET_NAME = 'test-claimiq-claims';
process.env.AURORA_CLUSTER_ARN = 'arn:aws:rds:us-east-1:123456789012:cluster:test-claimiq-cluster';
process.env.AURORA_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-claimiq-secret';
process.env.AGENT_LOGS_TABLE = 'test-claimiq-agent-logs';
process.env.DATABASE_NAME = 'claimiq';
process.env.MAX_FILE_SIZE_MB = '50';
process.env.USER_POOL_ID = 'us-east-1_testpool';
process.env.USER_POOL_CLIENT_ID = 'test-client-id';
process.env.STEP_FUNCTION_ARN = 'arn:aws:states:us-east-1:123456789012:stateMachine:test-claimiq-workflow';
process.env.AWS_REGION = 'us-east-1';

// Global test timeout
jest.setTimeout(30000);