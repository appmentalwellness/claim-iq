/**
 * File Upload Lambda function validation tests
 * Tests pre-signed URL generation and file upload workflow
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { handler } from '../../src/lambda/file_upload/index';

// Mock shared utilities
jest.mock('@claimiq/shared', () => ({
  ...jest.requireActual('../../src/shared/types'),
  withLambdaHandler: jest.fn((handlerFn, options) => handlerFn),
  createSuccessResponse: jest.fn((data) => ({
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, data })
  })),
  createErrorResponse: jest.fn((statusCode, error) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: false, error })
  })),
  validateEnvironment: jest.fn(),
  parseJsonSafely: jest.fn((json, defaultValue) => {
    try {
      return JSON.parse(json);
    } catch {
      return defaultValue;
    }
  }),
  generatePresignedUploadUrl: jest.fn(),
  generateTenantS3Key: jest.fn(),
  validateFileType: jest.fn(),
  validateFileSize: jest.fn(),
  executeQuery: jest.fn(),
  checkDuplicateFile: jest.fn(),
  logAuditEvent: jest.fn()
}));

const mockShared = require('@claimiq/shared');

describe('File Upload Lambda', () => {
  const mockContext: Context = {
    awsRequestId: 'test-request-id',
    functionName: 'test-function',
    functionVersion: '1',
    memoryLimitInMB: '1024',
    remainingTimeInMillis: () => 30000
  };

  const mockTenantContext = {
    tenantId: 'test-tenant',
    hospitalId: 'test-hospital',
    userId: 'test-user'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockShared.validateFileType.mockReturnValue({ isValid: true, extension: '.pdf' });
    mockShared.validateFileSize.mockReturnValue({ isValid: true });
    mockShared.checkDuplicateFile.mockResolvedValue({ success: true, data: null });
    mockShared.generatePresignedUploadUrl.mockResolvedValue({ 
      success: true, 
      data: 'https://s3.amazonaws.com/test-bucket/test-key?signature=abc123' 
    });
    mockShared.generateTenantS3Key.mockReturnValue('tenants/test-tenant/hospitals/test-hospital/claims/test-claim/test-upload.pdf');
    mockShared.executeQuery.mockResolvedValue({ success: true, recordsAffected: 1 });
    mockShared.logAuditEvent.mockResolvedValue({ success: true });
  });

  describe('POST /upload', () => {
    it('should generate presigned URL for valid file upload request', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({
          filename: 'test-claim.pdf',
          contentType: 'application/pdf',
          fileSize: 1024000
        }),
        headers: {
          'x-tenant-id': 'test-tenant',
          'x-hospital-id': 'test-hospital'
        },
        requestContext: {
          authorizer: {
            tenantId: 'test-tenant',
            hospitalId: 'test-hospital',
            userId: 'test-user'
          }
        }
      } as any;

      const result = await handler(event, mockContext, mockTenantContext);

      expect(result.statusCode).toBe(200);
      expect(mockShared.generatePresignedUploadUrl).toHaveBeenCalled();
      expect(mockShared.executeQuery).toHaveBeenCalled(); // Initial claim record creation
      expect(mockShared.logAuditEvent).toHaveBeenCalled();
    });

    it('should reject files exceeding size limit', async () => {
      mockShared.validateFileSize.mockReturnValue({ 
        isValid: false, 
        error: 'File size exceeds maximum allowed size' 
      });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({
          filename: 'large-file.pdf',
          contentType: 'application/pdf',
          fileSize: 100 * 1024 * 1024 // 100MB
        }),
        headers: {
          'x-tenant-id': 'test-tenant',
          'x-hospital-id': 'test-hospital'
        }
      } as any;

      const result = await handler(event, mockContext, mockTenantContext);

      expect(result.statusCode).toBe(400);
      expect(mockShared.createErrorResponse).toHaveBeenCalledWith(400, 'File size exceeds maximum allowed size');
    });

    it('should reject unsupported file types', async () => {
      mockShared.validateFileType.mockReturnValue({ 
        isValid: false, 
        error: 'Unsupported file type: image/jpeg' 
      });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({
          filename: 'image.jpg',
          contentType: 'image/jpeg',
          fileSize: 1024000
        }),
        headers: {
          'x-tenant-id': 'test-tenant',
          'x-hospital-id': 'test-hospital'
        }
      } as any;

      const result = await handler(event, mockContext, mockTenantContext);

      expect(result.statusCode).toBe(400);
      expect(mockShared.createErrorResponse).toHaveBeenCalledWith(400, 'Unsupported file type: image/jpeg');
    });

    it('should detect duplicate files and return appropriate response', async () => {
      mockShared.checkDuplicateFile.mockResolvedValue({
        success: true,
        data: { claim_id: 'existing-claim-123' }
      });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({
          filename: 'duplicate-file.pdf',
          contentType: 'application/pdf',
          fileSize: 1024000,
          fileHash: 'abc123hash'
        }),
        headers: {
          'x-tenant-id': 'test-tenant',
          'x-hospital-id': 'test-hospital'
        }
      } as any;

      const result = await handler(event, mockContext, mockTenantContext);

      expect(result.statusCode).toBe(200);
      expect(mockShared.createSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'duplicate',
          existingClaimId: 'existing-claim-123'
        })
      );
    });
  });

  describe('GET /upload/{claimId}', () => {
    it('should return upload status for valid claim', async () => {
      mockShared.executeQuery.mockResolvedValue({
        success: true,
        data: [[
          { stringValue: 'test-claim-123' },
          { stringValue: 'UPLOAD_PENDING' },
          { stringValue: 'test-file.pdf' },
          { stringValue: '2024-01-01T00:00:00Z' },
          { longValue: 1024000 }
        ]]
      });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        pathParameters: { claimId: 'test-claim-123' },
        headers: {
          'x-tenant-id': 'test-tenant',
          'x-hospital-id': 'test-hospital'
        }
      } as any;

      const result = await handler(event, mockContext, mockTenantContext);

      expect(result.statusCode).toBe(200);
      expect(mockShared.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT claim_id, status'),
        expect.any(Array),
        mockTenantContext
      );
    });

    it('should return 404 for non-existent claim', async () => {
      mockShared.executeQuery.mockResolvedValue({
        success: true,
        data: []
      });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        pathParameters: { claimId: 'non-existent-claim' },
        headers: {
          'x-tenant-id': 'test-tenant',
          'x-hospital-id': 'test-hospital'
        }
      } as any;

      const result = await handler(event, mockContext, mockTenantContext);

      expect(result.statusCode).toBe(404);
      expect(mockShared.createErrorResponse).toHaveBeenCalledWith(404, 'Claim not found');
    });

    it('should return 400 for missing claimId parameter', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        pathParameters: null,
        queryStringParameters: null,
        headers: {
          'x-tenant-id': 'test-tenant',
          'x-hospital-id': 'test-hospital'
        }
      } as any;

      const result = await handler(event, mockContext, mockTenantContext);

      expect(result.statusCode).toBe(400);
      expect(mockShared.createErrorResponse).toHaveBeenCalledWith(400, 'Missing claimId parameter');
    });
  });

  describe('Unsupported HTTP methods', () => {
    it('should return 405 for unsupported HTTP methods', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'DELETE',
        headers: {
          'x-tenant-id': 'test-tenant',
          'x-hospital-id': 'test-hospital'
        }
      } as any;

      const result = await handler(event, mockContext, mockTenantContext);

      expect(result.statusCode).toBe(405);
      expect(mockShared.createErrorResponse).toHaveBeenCalledWith(405, 'Method not allowed');
    });
  });
});