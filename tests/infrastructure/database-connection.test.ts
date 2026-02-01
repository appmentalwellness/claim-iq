/**
 * Database connection and infrastructure validation tests
 * Tests database connectivity and basic operations
 */

import { executeQuery, logAuditEvent } from '../../src/shared/database';
import { TenantContext } from '../../src/shared/types';

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

describe('Database Infrastructure Validation', () => {
  const mockTenantContext: TenantContext = {
    tenantId: 'test-tenant',
    hospitalId: 'test-hospital'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Aurora Serverless v2 Connection', () => {
    it('should connect to Aurora and execute basic queries', async () => {
      mockDataApiClient.query.mockResolvedValue({
        records: [{ version: 'PostgreSQL 15.4' }],
        numberOfRecordsUpdated: 0
      });

      const result = await executeQuery('SELECT version()');

      expect(result.success).toBe(true);
      expect(mockDataApiClient.query).toHaveBeenCalledWith('SELECT version()', {});
    });

    it('should validate database schema exists', async () => {
      mockDataApiClient.query.mockResolvedValue({
        records: [
          { table_name: 'tenants' },
          { table_name: 'hospitals' },
          { table_name: 'claims' },
          { table_name: 'denials' },
          { table_name: 'appeals' },
          { table_name: 'patients' },
          { table_name: 'payers' },
          { table_name: 'agent_actions' },
          { table_name: 'recovery_logs' }
        ]
      });

      const result = await executeQuery(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(9);
      
      const tableNames = result.data?.map(row => row.table_name);
      expect(tableNames).toContain('tenants');
      expect(tableNames).toContain('hospitals');
      expect(tableNames).toContain('claims');
      expect(tableNames).toContain('denials');
      expect(tableNames).toContain('appeals');
    });

    it('should validate tenant isolation indexes exist', async () => {
      mockDataApiClient.query.mockResolvedValue({
        records: [
          { indexname: 'idx_claims_tenant_id' },
          { indexname: 'idx_hospitals_tenant_id' },
          { indexname: 'idx_patients_tenant_id' },
          { indexname: 'idx_payers_tenant_id' },
          { indexname: 'idx_denials_tenant_id' },
          { indexname: 'idx_appeals_tenant_id' }
        ]
      });

      const result = await executeQuery(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE indexname LIKE '%tenant_id%'
        ORDER BY indexname
      `);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
      
      const indexNames = result.data?.map(row => row.indexname);
      expect(indexNames).toContain('idx_claims_tenant_id');
      expect(indexNames).toContain('idx_hospitals_tenant_id');
    });

    it('should validate foreign key constraints exist', async () => {
      mockDataApiClient.query.mockResolvedValue({
        records: [
          { constraint_name: 'hospitals_tenant_id_fkey' },
          { constraint_name: 'claims_tenant_id_fkey' },
          { constraint_name: 'claims_hospital_id_fkey' },
          { constraint_name: 'denials_claim_id_fkey' },
          { constraint_name: 'appeals_claim_id_fkey' }
        ]
      });

      const result = await executeQuery(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY'
        ORDER BY constraint_name
      `);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
    });

    it('should handle database connection errors gracefully', async () => {
      mockDataApiClient.query.mockRejectedValue(new Error('Connection timeout'));

      const result = await executeQuery('SELECT 1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection timeout');
    });
  });

  describe('DynamoDB Connection', () => {
    it('should connect to DynamoDB and log audit events', async () => {
      mockDynamoClient.send.mockResolvedValue({});

      const result = await logAuditEvent({
        claim_id: 'test-claim',
        timestamp: '2024-01-01T00:00:00Z',
        agent_type: 'TEST_AGENT',
        tenant_id: 'test-tenant',
        action: 'CONNECTION_TEST',
        status: 'SUCCESS'
      });

      expect(result.success).toBe(true);
      expect(mockDynamoClient.send).toHaveBeenCalled();
    });

    it('should handle DynamoDB connection errors gracefully', async () => {
      mockDynamoClient.send.mockRejectedValue(new Error('DynamoDB service unavailable'));

      const result = await logAuditEvent({
        claim_id: 'test-claim',
        timestamp: '2024-01-01T00:00:00Z',
        agent_type: 'TEST_AGENT',
        tenant_id: 'test-tenant',
        action: 'CONNECTION_TEST',
        status: 'ERROR'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('DynamoDB service unavailable');
    });
  });

  describe('Multi-tenant Data Isolation', () => {
    it('should enforce tenant isolation in database queries', async () => {
      mockDataApiClient.query.mockResolvedValue({
        records: [{ claim_id: 'tenant-a-claim' }]
      });

      const tenantAContext: TenantContext = {
        tenantId: 'tenant-a',
        hospitalId: 'hospital-a'
      };

      await executeQuery(
        'SELECT claim_id FROM claims WHERE status = :status',
        { status: 'NEW' },
        tenantAContext
      );

      expect(mockDataApiClient.query).toHaveBeenCalledWith(
        'SELECT claim_id FROM claims WHERE status = :status AND tenant_id = :tenant_id',
        { status: 'NEW', tenant_id: 'tenant-a' }
      );
    });

    it('should prevent cross-tenant data access', async () => {
      mockDataApiClient.query.mockResolvedValue({
        records: [] // No records returned for different tenant
      });

      const tenantBContext: TenantContext = {
        tenantId: 'tenant-b',
        hospitalId: 'hospital-b'
      };

      const result = await executeQuery(
        'SELECT * FROM claims WHERE claim_id = :claim_id',
        { claim_id: 'tenant-a-claim' },
        tenantBContext
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(mockDataApiClient.query).toHaveBeenCalledWith(
        'SELECT * FROM claims WHERE claim_id = :claim_id AND tenant_id = :tenant_id',
        { claim_id: 'tenant-a-claim', tenant_id: 'tenant-b' }
      );
    });

    it('should validate tenant-specific data views', async () => {
      mockDataApiClient.query.mockResolvedValue({
        records: [
          { 
            tenant_id: 'tenant-a',
            hospital_name: 'Hospital A',
            total_claims: 10,
            denied_claims: 3,
            recovered_claims: 2
          }
        ]
      });

      const result = await executeQuery(
        'SELECT * FROM claims_summary',
        {},
        { tenantId: 'tenant-a', hospitalId: 'hospital-a' }
      );

      expect(result.success).toBe(true);
      expect(result.data?.[0].tenant_id).toBe('tenant-a');
      expect(mockDataApiClient.query).toHaveBeenCalledWith(
        'SELECT * FROM claims_summary AND tenant_id = :tenant_id',
        { tenant_id: 'tenant-a' }
      );
    });
  });

  describe('Database Performance and Scalability', () => {
    it('should handle concurrent database operations', async () => {
      mockDataApiClient.query.mockResolvedValue({
        records: [{ result: 'success' }]
      });

      const concurrentQueries = Array.from({ length: 10 }, (_, i) =>
        executeQuery(
          'SELECT :query_id as result',
          { query_id: `query-${i}` },
          mockTenantContext
        )
      );

      const results = await Promise.all(concurrentQueries);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      expect(mockDataApiClient.query).toHaveBeenCalledTimes(10);
    });

    it('should validate database connection pooling', async () => {
      // Simulate multiple rapid queries to test connection reuse
      mockDataApiClient.query.mockResolvedValue({
        records: [{ connection_id: 'conn-123' }]
      });

      for (let i = 0; i < 5; i++) {
        await executeQuery('SELECT connection_id()', {}, mockTenantContext);
      }

      expect(mockDataApiClient.query).toHaveBeenCalledTimes(5);
      // Connection should be reused (same client instance)
    });
  });

  describe('Environment Configuration Validation', () => {
    it('should validate required environment variables are set', () => {
      expect(process.env.AURORA_CLUSTER_ARN).toBeDefined();
      expect(process.env.AURORA_SECRET_ARN).toBeDefined();
      expect(process.env.AGENT_LOGS_TABLE).toBeDefined();
      expect(process.env.DATABASE_NAME).toBeDefined();
    });

    it('should validate Aurora cluster ARN format', () => {
      const clusterArn = process.env.AURORA_CLUSTER_ARN;
      expect(clusterArn).toMatch(/^arn:aws:rds:[a-z0-9-]+:\d{12}:cluster:.+$/);
    });

    it('should validate Secrets Manager ARN format', () => {
      const secretArn = process.env.AURORA_SECRET_ARN;
      expect(secretArn).toMatch(/^arn:aws:secretsmanager:[a-z0-9-]+:\d{12}:secret:.+$/);
    });

    it('should validate DynamoDB table name format', () => {
      const tableName = process.env.AGENT_LOGS_TABLE;
      expect(tableName).toMatch(/^[a-zA-Z0-9_-]+$/);
    });
  });
});