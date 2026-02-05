/**
 * S3 utilities validation tests
 * Tests S3 operations and tenant isolation
 */

import {
  generatePresignedUploadUrl,
  getObjectMetadata,
  generateTenantS3Key,
  extractClaimInfoFromS3Metadata,
  calculateS3ObjectHash,
  validateFileType,
  validateFileSize
} from '../../src/shared/s3-utils';
import { TenantContext } from '../../src/shared/types';

// Mock AWS S3 client
const mockS3Client = {
  send: jest.fn()
};

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => mockS3Client),
  GetObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn()
}));

// Mock S3 request presigner
const mockGetSignedUrl = jest.fn();
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl
}));

describe('S3 Utilities', () => {
  const mockTenantContext: TenantContext = {
    tenantId: 'test-tenant',
    hospitalId: 'test-hospital'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePresignedUploadUrl', () => {
    it('should generate presigned URL with proper metadata', async () => {
      const mockUrl = 'https://s3.amazonaws.com/test-bucket/test-key?signature=abc123';
      mockGetSignedUrl.mockResolvedValue(mockUrl);

      const result = await generatePresignedUploadUrl(
        'test-bucket',
        'test-key',
        'application/pdf',
        { 'tenant-id': 'test-tenant' }
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockUrl);
      expect(mockGetSignedUrl).toHaveBeenCalled();
    });

    it('should handle presigned URL generation errors', async () => {
      mockGetSignedUrl.mockRejectedValue(new Error('S3 error'));

      const result = await generatePresignedUploadUrl(
        'test-bucket',
        'test-key',
        'application/pdf',
        {}
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('S3 error');
    });
  });

  describe('getObjectMetadata', () => {
    it('should retrieve object metadata', async () => {
      const mockMetadata = {
        ContentType: 'application/pdf',
        ContentLength: 1024,
        LastModified: new Date(),
        Metadata: { 'tenant-id': 'test-tenant' }
      };
      mockS3Client.send.mockResolvedValue(mockMetadata);

      const result = await getObjectMetadata('test-bucket', 'test-key');

      expect(result.success).toBe(true);
      expect(result.data?.contentType).toBe('application/pdf');
      expect(result.data?.metadata).toEqual({ 'tenant-id': 'test-tenant' });
    });
  });

  describe('generateTenantS3Key', () => {
    it('should generate tenant-isolated S3 key', () => {
      const key = generateTenantS3Key(
        mockTenantContext,
        'claim-123',
        'upload-456',
        '.pdf'
      );

      expect(key).toBe('tenants/test-tenant/hospitals/test-hospital/claims/claim-123/upload-456.pdf');
    });
  });

  describe('extractClaimInfoFromS3Metadata', () => {
    it('should extract claim info from S3 metadata', () => {
      const metadata = {
        'claim-id': 'test-claim',
        'tenant-id': 'test-tenant',
        'hospital-id': 'test-hospital',
        'upload-id': 'test-upload',
        'original-filename': 'test.pdf',
        'request-id': 'test-request'
      };

      const result = extractClaimInfoFromS3Metadata(metadata, 'test/path/file.pdf');

      expect(result.claimId).toBe('test-claim');
      expect(result.tenantId).toBe('test-tenant');
      expect(result.hospitalId).toBe('test-hospital');
      expect(result.originalFilename).toBe('test.pdf');
    });

    it('should throw error when claim-id is missing', () => {
      const metadata = { 'tenant-id': 'test-tenant' };

      expect(() => {
        extractClaimInfoFromS3Metadata(metadata, 'test/path/file.pdf');
      }).toThrow('Missing claim-id in S3 object metadata');
    });
  });

  describe('calculateS3ObjectHash', () => {
    it('should calculate file hash from S3 object', async () => {
      const mockStream = {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from('test data'));
          } else if (event === 'end') {
            callback();
          }
        })
      };

      mockS3Client.send.mockResolvedValue({ Body: mockStream });

      const result = await calculateS3ObjectHash('test-bucket', 'test-key');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('validateFileType', () => {
    const supportedTypes = {
      'application/pdf': '.pdf',
      'text/csv': '.csv',
      'application/vnd.ms-excel': '.xls'
    };

    it('should validate supported file types', () => {
      const result = validateFileType('application/pdf', supportedTypes);

      expect(result.isValid).toBe(true);
      expect(result.extension).toBe('.pdf');
    });

    it('should reject unsupported file types', () => {
      const result = validateFileType('image/jpeg', supportedTypes);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('should handle content type with charset', () => {
      const result = validateFileType('text/csv; charset=utf-8', supportedTypes);

      expect(result.isValid).toBe(true);
      expect(result.extension).toBe('.csv');
    });
  });

  describe('validateFileSize', () => {
    it('should validate file size within limits', () => {
      const result = validateFileSize(1024 * 1024, 50); // 1MB file, 50MB limit

      expect(result.isValid).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      const result = validateFileSize(100 * 1024 * 1024, 50); // 100MB file, 50MB limit

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    it('should reject zero or negative file sizes', () => {
      const result = validateFileSize(0, 50);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid file size');
    });
  });
});