/**
 * Database utilities validation tests
 * Tests core database operations and tenant isolation
 */

import { 
  executeQuery, 
  getClaimById, 
  updateClaimStatus, 
  logAuditEvent, 
  checkDuplicateFile 
} from '../../src/shared/database';
import { TenantContext, ClaimInfo, AuditLogEntry } from '../../src/shared/types';

// Mock the data-api-client
const mockDataApiClient = {
  query: jest.fn()
};

jest.mock('data-api-client', () => ({
  DataAPIClient: jest.fn(() => mockDataApiClient)
}));

// Mock DynamoDB
const mockDynamoClient = {
  send: jest.fn()
};

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => mockDynamoClient)
  },
  PutCommand: jest.fn()
}));

describe('Database Utilities', () => {
  const mockTenantContext: TenantContext = {
    tenantId: 'test-tenant',
    hospitalId: 'test-hospital',
    userId: 'test-user'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeQuery', () => {
    it('should execute query with tenant filtering', async () => {
      const mockResult = {
        records: [{ id: '123', name: 'Test' }],
        numberOfRecordsUpdated: 1
      };
      mockDataApiClient.query.mockResolvedValue(mockResult);

      const result = await executeQuery(
        'SELECT * FROM claims WHERE status = :status',
        { status: 'NEW' },
        mockTenantContext
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult.records);
      expect(mockDataApiClient.query).toHaveBeenCalledWith(
        'SELECT * FROM claims WHERE status = :status AND tenant_id = :tenant_id',
        { status: 'NEW', tenant_id: 'test-tenant' }
      );
    });

    it('should handle query errors gracefully', async () => {
      mockDataApiClient.query.mockRejectedValue(new Error('Database error'));

      const result = await executeQuery('SELECT * FROM claims');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getClaimById', () => {
    it('should retrieve claim with tenant isolation', async () => {
      const mockClaim = {
        claim_id: 'test-claim',
        tenant_id: 'test-tenant',
        hospital_id: 'test-hospital',
        status: 'NEW'
      };
      mockDataApiClient.query.mockResolvedValue({ records: [mockClaim] });

      const result = await getClaimById('test-claim', mockTenantContext);

      expect(result.success).toBe(true);
      expect(result.data?.claim_id).toBe('test-claim');
      expect(mockDataApiClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE claim_id = :claim_id AND tenant_id = :tenant_id'),
        { claim_id: 'test-claim', tenant_id: 'test-tenant' }
      );
    });

    it('should return error when claim not found', async () => {
      mockDataApiClient.query.mockResolvedValue({ records: [] });

      const result = await getClaimById('nonexistent-claim', mockTenantContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Claim not found');
    });
  });

  describe('updateClaimStatus', () => {
    it('should update claim status with tenant isolation', async () => {
      mockDataApiClient.query.mockResolvedValue({ numberOfRecordsUpdated: 1 });

      const result = await updateClaimStatus(
        'test-claim',
        'PROCESSED',
        mockTenantContext,
        { processing_result: 'success' }
      );

      expect(result.success).toBe(true);
      expect(mockDataApiClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE claim_id = :claim_id AND tenant_id = :tenant_id'),
        expect.objectContaining({
          status: 'PROCESSED',
          claim_id: 'test-claim',
          tenant_id: 'test-tenant'
        })
      );
    });
  });

  describe('logAuditEvent', () => {
    it('should log audit event to DynamoDB', async () => {
      mockDynamoClient.send.mockResolvedValue({});

      const auditEntry: AuditLogEntry = {
        claim_id: 'test-claim',
        timestamp: '2024-01-01T00:00:00Z',
        agent_type: 'TEST_AGENT',
        tenant_id: 'test-tenant',
        action: 'TEST_ACTION',
        status: 'SUCCESS'
      };

      const result = await logAuditEvent(auditEntry);

      expect(result.success).toBe(true);
      expect(mockDynamoClient.send).toHaveBeenCalled();
    });
  });

  describe('checkDuplicateFile', () => {
    it('should check for duplicate files within tenant', async () => {
      const mockDuplicate = {
        claim_id: 'existing-claim',
        status: 'PROCESSED',
        created_at: '2024-01-01T00:00:00Z'
      };
      mockDataApiClient.query.mockResolvedValue({ records: [mockDuplicate] });

      const result = await checkDuplicateFile('test-hash', mockTenantContext);

      expect(result.success).toBe(true);
      expect(result.data?.claim_id).toBe('existing-claim');
      expect(mockDataApiClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE tenant_id = :tenant_id AND file_hash = :file_hash'),
        { tenant_id: 'test-tenant', file_hash: 'test-hash' }
      );
    });

    it('should return null when no duplicates found', async () => {
      mockDataApiClient.query.mockResolvedValue({ records: [] });

      const result = await checkDuplicateFile('unique-hash', mockTenantContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle empty file hash', async () => {
      const result = await checkDuplicateFile('', mockTenantContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(mockDataApiClient.query).not.toHaveBeenCalled();
    });
  });
});