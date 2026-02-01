/**
 * S3 Processor Lambda function validation tests
 * Tests S3 event processing and workflow triggering
 */

import { S3Event, S3EventRecord, Context } from 'aws-lambda';
import { handler } from '../../src/lambda/s3_processor/index';

// Mock AWS SDK
const mockSFNClient = {
  send: jest.fn()
};

jest.mock('@aws-sdk/client-sfn', () => ({
  SFNClient: jest.fn(() => mockSFNClient),
  StartExecutionCommand: jest.fn()
}));

// Mock shared utilities
jest.mock('@claimiq/shared', () => ({
  ...jest.requireActual('../../src/shared/types'),
  withLambdaHandler: jest.fn((handlerFn, options) => handlerFn),
  validateEnvironment: jest.fn(),
  getObjectMetadata: jest.fn(),
  extractClaimInfoFromS3Metadata: jest.fn(),
  calculateS3ObjectHash: jest.fn(),
  updateClaimStatus: jest.fn(),
  logAuditEvent: jest.fn()
}));

const mockShared = require('@claimiq/shared');

describe('S3 Processor Lambda', () => {
  const mockContext: Context = {
    awsRequestId: 'test-request-id',
    functionName: 'test-function',
    functionVersion: '1',
    memoryLimitInMB: '1024',
    remainingTimeInMillis: () => 30000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
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
          'original-filename': 'test-file.pdf',
          'request-id': 'test-request'
        }
      }
    });

    mockShared.extractClaimInfoFromS3Metadata.mockReturnValue({
      claimId: 'test-claim-123',
      tenantId: 'test-tenant',
      hospitalId: 'test-hospital',
      uploadId: 'test-upload',
      originalFilename: 'test-file.pdf',
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

    mockShared.logAuditEvent.mockResolvedValue({ success: true });

    mockSFNClient.send.mockResolvedValue({
      executionArn: 'arn:aws:states:us-east-1:123456789012:execution:test-workflow:test-execution',
      startDate: new Date()
    });
  });

  describe('S3 Event Processing', () => {
    it('should process S3 ObjectCreated event successfully', async () => {
      const s3Event: S3Event = {
        Records: [{
          eventVersion: '2.1',
          eventSource: 'aws:s3',
          eventName: 'ObjectCreated:Put',
          eventTime: '2024-01-01T00:00:00.000Z',
          s3: {
            bucket: {
              name: 'test-claimiq-claims'
            },
            object: {
              key: 'tenants/test-tenant/hospitals/test-hospital/claims/test-claim/test-upload.pdf',
              size: 1024000
            }
          }
        } as S3EventRecord]
      };

      const result = await handler(s3Event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.processedRecords).toBe(1);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].status).toBe('processed');
      
      // Verify all processing steps were called
      expect(mockShared.getObjectMetadata).toHaveBeenCalledWith(
        'test-claimiq-claims',
        'tenants/test-tenant/hospitals/test-hospital/claims/test-claim/test-upload.pdf'
      );
      expect(mockShared.extractClaimInfoFromS3Metadata).toHaveBeenCalled();
      expect(mockShared.calculateS3ObjectHash).toHaveBeenCalled();
      expect(mockShared.updateClaimStatus).toHaveBeenCalledWith(
        'test-claim-123',
        'NEW',
        expect.objectContaining({ tenantId: 'test-tenant' }),
        expect.objectContaining({ file_hash: 'abc123hash' })
      );
      expect(mockSFNClient.send).toHaveBeenCalled();
      expect(mockShared.logAuditEvent).toHaveBeenCalled();
    });

    it('should handle multiple S3 events in batch', async () => {
      const s3Event: S3Event = {
        Records: [
          {
            eventVersion: '2.1',
            eventSource: 'aws:s3',
            eventName: 'ObjectCreated:Put',
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'file1.pdf', size: 1024 }
            }
          } as S3EventRecord,
          {
            eventVersion: '2.1',
            eventSource: 'aws:s3',
            eventName: 'ObjectCreated:Post',
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'file2.pdf', size: 2048 }
            }
          } as S3EventRecord
        ]
      };

      const result = await handler(s3Event, mockContext);

      expect(result.processedRecords).toBe(2);
      expect(result.results).toHaveLength(2);
      expect(mockShared.getObjectMetadata).toHaveBeenCalledTimes(2);
    });

    it('should handle metadata extraction errors gracefully', async () => {
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
        } as S3EventRecord]
      };

      await expect(handler(s3Event, mockContext)).rejects.toThrow('Failed to get object metadata: Object not found');
      
      // Should still log error event
      expect(mockShared.logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ERROR',
          error_message: expect.stringContaining('Failed to get object metadata')
        })
      );
    });

    it('should handle file hash calculation errors', async () => {
      mockShared.calculateS3ObjectHash.mockResolvedValue({
        success: false,
        error: 'Hash calculation failed'
      });

      const s3Event: S3Event = {
        Records: [{
          eventVersion: '2.1',
          eventSource: 'aws:s3',
          eventName: 'ObjectCreated:Put',
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'test-file.pdf', size: 1024 }
          }
        } as S3EventRecord]
      };

      await expect(handler(s3Event, mockContext)).rejects.toThrow('Failed to calculate file hash: Hash calculation failed');
    });

    it('should handle Step Functions workflow trigger errors', async () => {
      mockSFNClient.send.mockRejectedValue(new Error('Step Functions error'));

      const s3Event: S3Event = {
        Records: [{
          eventVersion: '2.1',
          eventSource: 'aws:s3',
          eventName: 'ObjectCreated:Put',
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'test-file.pdf', size: 1024 }
          }
        } as S3EventRecord]
      };

      await expect(handler(s3Event, mockContext)).rejects.toThrow('Failed to trigger workflow: Step Functions error');
    });

    it('should handle claim status update errors', async () => {
      mockShared.updateClaimStatus.mockResolvedValue({
        success: false,
        error: 'Database update failed'
      });

      const s3Event: S3Event = {
        Records: [{
          eventVersion: '2.1',
          eventSource: 'aws:s3',
          eventName: 'ObjectCreated:Put',
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'test-file.pdf', size: 1024 }
          }
        } as S3EventRecord]
      };

      await expect(handler(s3Event, mockContext)).rejects.toThrow('Failed to update claim: Database update failed');
    });

    it('should ignore non-S3 events', async () => {
      const nonS3Event: S3Event = {
        Records: [{
          eventVersion: '2.1',
          eventSource: 'aws:sns',
          eventName: 'Notification',
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'test-file.pdf', size: 1024 }
          }
        } as S3EventRecord]
      };

      const result = await handler(nonS3Event, mockContext);

      expect(result.processedRecords).toBe(0);
      expect(result.results).toHaveLength(0);
      expect(mockShared.getObjectMetadata).not.toHaveBeenCalled();
    });

    it('should ignore non-ObjectCreated events', async () => {
      const deleteEvent: S3Event = {
        Records: [{
          eventVersion: '2.1',
          eventSource: 'aws:s3',
          eventName: 'ObjectRemoved:Delete',
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'test-file.pdf', size: 1024 }
          }
        } as S3EventRecord]
      };

      const result = await handler(deleteEvent, mockContext);

      expect(result.processedRecords).toBe(0);
      expect(result.results).toHaveLength(0);
      expect(mockShared.getObjectMetadata).not.toHaveBeenCalled();
    });
  });

  describe('Workflow Integration', () => {
    it('should trigger Step Functions workflow with correct input', async () => {
      const s3Event: S3Event = {
        Records: [{
          eventVersion: '2.1',
          eventSource: 'aws:s3',
          eventName: 'ObjectCreated:Put',
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'test-file.pdf', size: 1024000 }
          }
        } as S3EventRecord]
      };

      await handler(s3Event, mockContext);

      expect(mockSFNClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.stringContaining('"claim_id":"test-claim-123"')
        })
      );
    });
  });
});