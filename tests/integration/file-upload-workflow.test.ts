/**
 * Integration tests for file upload workflow
 * Tests end-to-end file upload process from pre-signed URL to S3 processing
 */

import { APIGatewayProxyEvent, S3Event, Context } from 'aws-lambda';
import { handler as fileUploadHandler } from '../../src/lambda/file_upload/index';
import { handler as s3ProcessorHandler } from '../../src/lambda/s3_processor/index';

// Mock all external dependencies
jest.mock('@claimiq/shared');
jest.mock('@aws-sdk/client-sfn');

const mockShared = require('@claimiq/shared');
const mockSFNClient = { send: jest.fn() };

describe('File Upload Workflow Integration', () => {
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
    
    // Setup shared utility mocks
    mockShared.withLambdaHandler = jest.fn((handlerFn) => handlerFn);
    mockShared.createSuccessResponse = jest.fn((data) => ({
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    }));
    mockShared.createErrorResponse = jest.fn((statusCode, error) => ({
      statusCode,
      body: JSON.stringify({ success: false, error })
    }));
    mockShared.validateEnvironment = jest.fn();
    mockShared.parseJsonSafely = jest.fn((json, defaultValue) => {
      try { return JSON.parse(json); } catch { return defaultValue; }
    });
    mockShared.validateFileType = jest.fn(() => ({ isValid: true, extension: '.pdf' }));
    mockShared.validateFileSize = jest.fn(() => ({ isValid: true }));
    mockShared.checkDuplicateFile = jest.fn(() => Promise.resolve({ success: true, data: null }));
    mockShared.generatePresignedUploadUrl = jest.fn(() => Promise.resolve({ 
      success: true, 
      data: 'https://s3.amazonaws.com/test-bucket/test-key?signature=abc123' 
    }));
    mockShared.generateTenantS3Key = jest.fn(() => 'tenants/test-tenant/hospitals/test-hospital/claims/test-claim/test-upload.pdf');
    mockShared.executeQuery = jest.fn(() => Promise.resolve({ success: true, recordsAffected: 1 }));
    mockShared.logAuditEvent = jest.fn(() => Promise.resolve({ success: true }));
    mockShared.getObjectMetadata = jest.fn();
    mockShared.extractClaimInfoFromS3Metadata = jest.fn();
    mockShared.calculateS3ObjectHash = jest.fn();
    mockShared.updateClaimStatus = jest.fn();

    // Setup SFN mock
    require('@aws-sdk/client-sfn').SFNClient.mockImplementation(() => mockSFNClient);
    mockSFNClient.send.mockResolvedValue({
      executionArn: 'arn:aws:states:us-east-1:123456789012:execution:test-workflow:test-execution',
      startDate: new Date()
    });
  });

  describe('Complete File Upload Workflow', () => {
    it('should handle complete workflow from upload request to S3 processing', async () => {
      // Step 1: File upload request
      const uploadEvent: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({
          filename: 'test-claim.pdf',
          contentType: 'application/pdf',
          fileSize: 1024000
        }),
        headers: {
          'x-tenant-id': 'test-tenant',
          'x-hospital-id': 'test-hospital'
        }
      } as any;

      const uploadResult = await fileUploadHandler(uploadEvent, mockContext, mockTenantContext);

      expect(uploadResult.statusCode).toBe(200);
      expect(mockShared.generatePresignedUploadUrl).toHaveBeenCalled();
      expect(mockShared.executeQuery).toHaveBeenCalled(); // Initial claim record creation

      // Step 2: Simulate S3 upload completion event
      mockShared.getObjectMetadata.mockResolvedValue({
        success: true,
        data: {
          contentType: 'application/pdf',
          contentLength: 1024000,
          metadata: {
            'claim-id': 'test-claim-123',
            'tenant-id': 'test-tenant',
            'hospital-id': 'test-hospital',
            'upload-id': 'test-upload',
            'original-filename': 'test-claim.pdf',
            'request-id': 'test-request'
          }
        }
      });

      mockShared.extractClaimInfoFromS3Metadata.mockReturnValue({
        claimId: 'test-claim-123',
        tenantId: 'test-tenant',
        hospitalId: 'test-hospital',
        uploadId: 'test-upload',
        originalFilename: 'test-claim.pdf',
        requestId: 'test-request'
      });

      mockShared.calculateS3ObjectHash.mockResolvedValue({
        success: true,
        data: 'abc123hash'
      });

      mockShared.updateClaimStatus.mockResolvedValue({
        success: true,
        recordsAffected: 1
      });

      const s3Event: S3Event = {
        Records: [{
          eventVersion: '2.1',
          eventSource: 'aws:s3',
          eventName: 'ObjectCreated:Put',
          s3: {
            bucket: { name: 'test-claimiq-claims' },
            object: { 
              key: 'tenants/test-tenant/hospitals/test-hospital/claims/test-claim-123/test-upload.pdf',
              size: 1024000 
            }
          }
        } as any]
      };

      const s3Result = await s3ProcessorHandler(s3Event, mockContext);

      expect(s3Result.statusCode).toBe(200);
      expect(s3Result.processedRecords).toBe(1);
      expect(s3Result.results[0].status).toBe('processed');

      // Verify workflow progression
      expect(mockShared.updateClaimStatus).toHaveBeenCalledWith(
        'test-claim-123',
        'NEW',
        expect.objectContaining({ tenantId: 'test-tenant' }),
        expect.objectContaining({ file_hash: 'abc123hash' })
      );

      expect(mockSFNClient.send).toHaveBeenCalled();
      expect(mockShared.logAuditEvent).toHaveBeenCalledTimes(2); // Once for upload, once for S3 processing
    });

    it('should handle duplicate file detection in workflow', async () => {
      // Setup duplicate detection
      mockShared.checkDuplicateFile.mockResolvedValue({
        success: true,
        data: { claim_id: 'existing-claim-123' }
      });

      const uploadEvent: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({
          filename: 'duplicate-file.pdf',
          contentType: 'application/pdf',
          fileSize: 1024000,
          fileHash: 'duplicate-hash'
        }),
        headers: {
          'x-tenant-id': 'test-tenant',
          'x-hospital-id': 'test-hospital'
        }
      } as any;

      const result = await fileUploadHandler(uploadEvent, mockContext, mockTenantContext);

      expect(result.statusCode).toBe(200);
      expect(mockShared.createSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'duplicate',
          existingClaimId: 'existing-claim-123'
        })
      );

      // Should not create new presigned URL for duplicate
      expect(mockShared.generatePresignedUploadUrl).not.toHaveBeenCalled();
    });

    it('should handle tenant isolation throughout workflow', async () => {
      const uploadEvent: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({
          filename: 'tenant-isolated-file.pdf',
          contentType: 'application/pdf',
          fileSize: 1024000
        }),
        headers: {
          'x-tenant-id': 'tenant-a',
          'x-hospital-id': 'hospital-a'
        }
      } as any;

      const tenantAContext = {
        tenantId: 'tenant-a',
        hospitalId: 'hospital-a',
        userId: 'user-a'
      };

      await fileUploadHandler(uploadEvent, mockContext, tenantAContext);

      // Verify tenant isolation in S3 key generation
      expect(mockShared.generateTenantS3Key).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-a', hospitalId: 'hospital-a' }),
        expect.any(String),
        expect.any(String),
        '.pdf'
      );

      // Verify tenant isolation in database operations
      expect(mockShared.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO claims'),
        expect.arrayContaining([
          expect.objectContaining({ 
            name: 'tenant_id', 
            value: { stringValue: 'tenant-a' } 
          }),
          expect.objectContaining({ 
            name: 'hospital_id', 
            value: { stringValue: 'hospital-a' } 
          })
        ])
      );
    });

    it('should handle file validation errors in workflow', async () => {
      // Setup file validation to fail
      mockShared.validateFileSize.mockReturnValue({
        isValid: false,
        error: 'File size exceeds maximum allowed size of 50MB'
      });

      const uploadEvent: APIGatewayProxyEvent = {
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

      const result = await fileUploadHandler(uploadEvent, mockContext, mockTenantContext);

      expect(result.statusCode).toBe(400);
      expect(mockShared.createErrorResponse).toHaveBeenCalledWith(
        400, 
        'File size exceeds maximum allowed size of 50MB'
      );

      // Should not proceed with presigned URL generation
      expect(mockShared.generatePresignedUploadUrl).not.toHaveBeenCalled();
    });

    it('should handle S3 processing errors gracefully', async () => {
      // Setup S3 metadata retrieval to fail
      mockShared.getObjectMetadata.mockResolvedValue({
        success: false,
        error: 'Object not found'
      });

      const s3Event: S3Event = {
        Records: [{
          eventVersion: '2.1',
          eventSource: 'aws:s3',
          eventName: 'ObjectCreated:Put',
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'missing-file.pdf', size: 1024 }
          }
        } as any]
      };

      await expect(s3ProcessorHandler(s3Event, mockContext)).rejects.toThrow(
        'Failed to get object metadata: Object not found'
      );

      // Should still log error event
      expect(mockShared.logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ERROR',
          error_message: expect.stringContaining('Failed to get object metadata')
        })
      );
    });
  });

  describe('Multi-tenant Isolation Validation', () => {
    it('should maintain tenant isolation across workflow steps', async () => {
      const tenantBContext = {
        tenantId: 'tenant-b',
        hospitalId: 'hospital-b',
        userId: 'user-b'
      };

      // Upload request for tenant B
      const uploadEvent: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({
          filename: 'tenant-b-file.pdf',
          contentType: 'application/pdf',
          fileSize: 1024000
        }),
        headers: {
          'x-tenant-id': 'tenant-b',
          'x-hospital-id': 'hospital-b'
        }
      } as any;

      await fileUploadHandler(uploadEvent, mockContext, tenantBContext);

      // Verify tenant B isolation in all operations
      expect(mockShared.checkDuplicateFile).toHaveBeenCalledWith(
        undefined, // No hash provided
        expect.objectContaining({ tenantId: 'tenant-b' })
      );

      expect(mockShared.generateTenantS3Key).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-b', hospitalId: 'hospital-b' }),
        expect.any(String),
        expect.any(String),
        '.pdf'
      );

      // Verify database operations include tenant B context
      expect(mockShared.executeQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ 
            name: 'tenant_id', 
            value: { stringValue: 'tenant-b' } 
          })
        ])
      );
    });
  });
});