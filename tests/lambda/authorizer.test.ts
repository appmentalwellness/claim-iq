/**
 * Lambda Authorizer validation tests
 * Tests JWT validation and tenant-based authorization
 */

import { APIGatewayRequestAuthorizerEvent, Context } from 'aws-lambda';
import { handler } from '../../src/lambda/authorizer/index';
import jwt from 'jsonwebtoken';

// Mock JWT and JWKS client
jest.mock('jsonwebtoken');
jest.mock('jwks-rsa');

// Mock AWS Cognito client
const mockCognitoClient = {
  send: jest.fn()
};

jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn(() => mockCognitoClient),
  GetUserCommand: jest.fn()
}));

// Mock shared utilities
jest.mock('@claimiq/shared', () => ({
  validateEnvironment: jest.fn(),
  logAuditEvent: jest.fn().mockResolvedValue({ success: true })
}));

const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockJwksClient = require('jwks-rsa');

describe('Lambda Authorizer', () => {
  const mockContext: Context = {
    awsRequestId: 'test-request-id',
    functionName: 'test-authorizer',
    functionVersion: '1',
    memoryLimitInMB: '512',
    remainingTimeInMillis: () => 30000
  };

  const mockJwksClientInstance = {
    getSigningKey: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup JWKS client mock
    mockJwksClient.mockReturnValue(mockJwksClientInstance);
    mockJwksClientInstance.getSigningKey.mockResolvedValue({
      getPublicKey: () => 'mock-public-key'
    });
  });

  describe('Token Validation', () => {
    it('should authorize valid JWT token with tenant context', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        'cognito:username': 'testuser',
        'custom:tenant_id': 'test-tenant',
        'custom:hospital_id': 'test-hospital',
        'custom:role': 'admin'
      };

      mockJwt.decode.mockReturnValue({
        header: { kid: 'test-key-id' },
        payload: mockPayload
      } as any);

      mockJwt.verify.mockReturnValue(mockPayload as any);

      const event: APIGatewayRequestAuthorizerEvent = {
        type: 'REQUEST',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/test/GET/upload',
        resource: '/upload',
        path: '/upload',
        httpMethod: 'GET',
        headers: {
          Authorization: 'Bearer valid-jwt-token'
        },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {
          accountId: '123456789012',
          apiId: 'abcdef123',
          protocol: 'HTTP/1.1',
          httpMethod: 'GET',
          path: '/test/upload',
          stage: 'test',
          requestId: 'test-request-id',
          requestTime: '01/Jan/2024:00:00:00 +0000',
          requestTimeEpoch: 1704067200,
          identity: {
            cognitoIdentityPoolId: null,
            accountId: null,
            cognitoIdentityId: null,
            caller: null,
            sourceIp: '127.0.0.1',
            principalOrgId: null,
            accessKey: null,
            cognitoAuthenticationType: null,
            cognitoAuthenticationProvider: null,
            userArn: null,
            userAgent: 'test-agent',
            user: null
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.principalId).toBe('user-123');
      expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
      expect(result.context).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        tenantId: 'test-tenant',
        hospitalId: 'test-hospital',
        role: 'admin'
      });
    });

    it('should deny access when no authorization header is provided', async () => {
      const event: APIGatewayRequestAuthorizerEvent = {
        type: 'REQUEST',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/test/GET/upload',
        resource: '/upload',
        path: '/upload',
        httpMethod: 'GET',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {} as any
      };

      const result = await handler(event, mockContext);

      expect(result.principalId).toBe('user');
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
      expect(result.context).toBeUndefined();
    });

    it('should deny access for invalid JWT token', async () => {
      mockJwt.decode.mockReturnValue({
        header: { kid: 'test-key-id' }
      } as any);

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const event: APIGatewayRequestAuthorizerEvent = {
        type: 'REQUEST',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/test/GET/upload',
        resource: '/upload',
        path: '/upload',
        httpMethod: 'GET',
        headers: {
          Authorization: 'Bearer invalid-jwt-token'
        },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {} as any
      };

      const result = await handler(event, mockContext);

      expect(result.principalId).toBe('user');
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('should handle malformed authorization header', async () => {
      const event: APIGatewayRequestAuthorizerEvent = {
        type: 'REQUEST',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/test/GET/upload',
        resource: '/upload',
        path: '/upload',
        httpMethod: 'GET',
        headers: {
          Authorization: 'InvalidFormat token'
        },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {} as any
      };

      const result = await handler(event, mockContext);

      expect(result.principalId).toBe('user');
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('should use default tenant values when custom attributes are missing', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        'cognito:username': 'testuser'
        // Missing custom:tenant_id, custom:hospital_id, custom:role
      };

      mockJwt.decode.mockReturnValue({
        header: { kid: 'test-key-id' },
        payload: mockPayload
      } as any);

      mockJwt.verify.mockReturnValue(mockPayload as any);

      const event: APIGatewayRequestAuthorizerEvent = {
        type: 'REQUEST',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/test/GET/upload',
        resource: '/upload',
        path: '/upload',
        httpMethod: 'GET',
        headers: {
          Authorization: 'Bearer valid-jwt-token'
        },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {} as any
      };

      const result = await handler(event, mockContext);

      expect(result.context).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        tenantId: 'default-tenant',
        hospitalId: 'default-hospital',
        role: 'user'
      });
    });

    it('should handle JWKS key retrieval errors', async () => {
      mockJwt.decode.mockReturnValue({
        header: { kid: 'test-key-id' }
      } as any);

      mockJwksClientInstance.getSigningKey.mockRejectedValue(new Error('Key not found'));

      const event: APIGatewayRequestAuthorizerEvent = {
        type: 'REQUEST',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/test/GET/upload',
        resource: '/upload',
        path: '/upload',
        httpMethod: 'GET',
        headers: {
          Authorization: 'Bearer jwt-token-with-invalid-kid'
        },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {} as any
      };

      const result = await handler(event, mockContext);

      expect(result.principalId).toBe('user');
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });
  });

  describe('Policy Generation', () => {
    it('should generate Allow policy with user context for valid token', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        'cognito:username': 'testuser',
        'custom:tenant_id': 'test-tenant',
        'custom:hospital_id': 'test-hospital',
        'custom:role': 'admin'
      };

      mockJwt.decode.mockReturnValue({
        header: { kid: 'test-key-id' }
      } as any);

      mockJwt.verify.mockReturnValue(mockPayload as any);

      const event: APIGatewayRequestAuthorizerEvent = {
        type: 'REQUEST',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/test/GET/upload',
        resource: '/upload',
        path: '/upload',
        httpMethod: 'GET',
        headers: {
          Authorization: 'Bearer valid-jwt-token'
        },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {} as any
      };

      const result = await handler(event, mockContext);

      expect(result.policyDocument).toEqual({
        Version: '2012-10-17',
        Statement: [{
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/test/GET/upload'
        }]
      });
    });

    it('should generate Deny policy for invalid token', async () => {
      const event: APIGatewayRequestAuthorizerEvent = {
        type: 'REQUEST',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/test/GET/upload',
        resource: '/upload',
        path: '/upload',
        httpMethod: 'GET',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {} as any
      };

      const result = await handler(event, mockContext);

      expect(result.policyDocument).toEqual({
        Version: '2012-10-17',
        Statement: [{
          Action: 'execute-api:Invoke',
          Effect: 'Deny',
          Resource: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/test/GET/upload'
        }]
      });
    });
  });
});