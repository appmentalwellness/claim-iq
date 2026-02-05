/**
 * Shared Database Utilities for ClaimIQ Lambda functions
 * KISS Principle: Simple, reusable database operations with tenant isolation
 * 
 * Updated to use data-api-client for cleaner Aurora Serverless Data API operations
 */

import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import DataAPIClient from 'data-api-client';
import { TenantContext, DatabaseResult, ClaimInfo, AuditLogEntry } from './types';

// Initialize AWS clients (singleton pattern)
let rdsClient: RDSDataClient;
let dynamoClient: DynamoDBDocumentClient;
let dataApiClient: any;

function getRdsClient(): RDSDataClient {
    if (!rdsClient) {
        rdsClient = new RDSDataClient({});
    }
    return rdsClient;
}

function getDynamoClient(): DynamoDBDocumentClient {
    if (!dynamoClient) {
        const client = new DynamoDBClient({});
        dynamoClient = DynamoDBDocumentClient.from(client);
    }
    return dynamoClient;
}

function getDataApiClient(): any {
    if (!dataApiClient) {
        dataApiClient = new (DataAPIClient as any)({
            resourceArn: process.env.AURORA_CLUSTER_ARN!,
            secretArn: process.env.AURORA_SECRET_ARN!,
            database: process.env.DATABASE_NAME || 'claimiq',
            region: process.env.AWS_REGION || 'us-east-1'
        });
    }
    return dataApiClient;
}

// Environment variables
const AURORA_CLUSTER_ARN = process.env.AURORA_CLUSTER_ARN!;
const AURORA_SECRET_ARN = process.env.AURORA_SECRET_ARN!;
const DATABASE_NAME = process.env.DATABASE_NAME || 'claimiq';
const AGENT_LOGS_TABLE = process.env.AGENT_LOGS_TABLE!;

/**
 * Execute SQL query with automatic tenant filtering using data-api-client
 */
export async function executeQuery<T = any>(
    sql: string,
    parameters: Record<string, any> = {},
    tenantContext?: TenantContext
): Promise<DatabaseResult<T[]>> {
    try {
        // Add tenant filtering if context provided and not already in query
        let finalSql = sql;
        let finalParams = { ...parameters };

        if (tenantContext && !sql.toLowerCase().includes('tenant_id')) {
            if (sql.toLowerCase().includes('where')) {
                finalSql += ' AND tenant_id = :tenant_id';
            } else {
                finalSql += ' WHERE tenant_id = :tenant_id';
            }
            finalParams.tenant_id = tenantContext.tenantId;
        }

        const client = getDataApiClient();
        const result = await client.query(finalSql, finalParams);

        return {
            success: true,
            data: result.records as T[],
            recordsAffected: result.numberOfRecordsUpdated || 0
        };

    } catch (error) {
        console.error('Database query failed:', error);
        return {
            success: false,
            error: (error as Error).message
        };
    }
}

/**
 * Get claim information by ID with tenant isolation using data-api-client
 */
export async function getClaimById(
    claimId: string,
    tenantContext: TenantContext
): Promise<DatabaseResult<ClaimInfo>> {
    const sql = `
        SELECT claim_id, tenant_id, hospital_id, status, original_filename,
               content_type, file_size, s3_bucket, s3_key, created_at, updated_at
        FROM claims 
        WHERE claim_id = :claim_id AND tenant_id = :tenant_id
    `;

    try {
        const client = getDataApiClient();
        const result = await client.query(sql, {
            claim_id: claimId,
            tenant_id: tenantContext.tenantId
        });
        
        if (!result.records || result.records.length === 0) {
            return {
                success: false,
                error: 'Claim not found'
            };
        }

        const record = result.records[0];
        const claimInfo: ClaimInfo = {
            claim_id: record.claim_id,
            tenant_id: record.tenant_id,
            hospital_id: record.hospital_id,
            status: record.status,
            original_filename: record.original_filename,
            content_type: record.content_type,
            file_size: record.file_size,
            s3_bucket: record.s3_bucket,
            s3_key: record.s3_key,
            created_at: record.created_at,
            updated_at: record.updated_at
        };

        return {
            success: true,
            data: claimInfo
        };

    } catch (error) {
        return {
            success: false,
            error: (error as Error).message
        };
    }
}

/**
 * Update claim status with tenant isolation using data-api-client
 */
export async function updateClaimStatus(
    claimId: string,
    status: string,
    tenantContext: TenantContext,
    additionalData?: Record<string, any>
): Promise<DatabaseResult<void>> {
    let sql = `
        UPDATE claims 
        SET status = :status, updated_at = NOW()
    `;

    const parameters: Record<string, any> = {
        status,
        claim_id: claimId,
        tenant_id: tenantContext.tenantId
    };

    // Add additional data if provided
    if (additionalData) {
        sql += ', processing_result = :processing_result';
        parameters.processing_result = JSON.stringify(additionalData);
    }

    sql += ' WHERE claim_id = :claim_id AND tenant_id = :tenant_id';

    try {
        const client = getDataApiClient();
        await client.query(sql, parameters);
        
        return {
            success: true
        };
    } catch (error) {
        return {
            success: false,
            error: (error as Error).message
        };
    }
}

/**
 * Log audit event to DynamoDB
 */
export async function logAuditEvent(
    logEntry: AuditLogEntry
): Promise<DatabaseResult<void>> {
    try {
        const command = new PutCommand({
            TableName: AGENT_LOGS_TABLE,
            Item: {
                ...logEntry,
                timestamp: logEntry.timestamp || new Date().toISOString()
            }
        });

        await getDynamoClient().send(command);

        return { success: true };

    } catch (error) {
        console.error('Failed to log audit event:', error);
        return {
            success: false,
            error: (error as Error).message
        };
    }
}

/**
 * Check for duplicate files by hash within tenant using data-api-client
 */
export async function checkDuplicateFile(
    fileHash: string,
    tenantContext: TenantContext
): Promise<DatabaseResult<ClaimInfo | null>> {
    if (!fileHash) {
        return { success: true, data: null };
    }

    const sql = `
        SELECT claim_id, status, created_at 
        FROM claims 
        WHERE tenant_id = :tenant_id AND file_hash = :file_hash
        LIMIT 1
    `;

    try {
        const client = getDataApiClient();
        const result = await client.query(sql, {
            tenant_id: tenantContext.tenantId,
            file_hash: fileHash
        });

        if (!result.records || result.records.length === 0) {
            return { success: true, data: null };
        }

        const record = result.records[0];
        const duplicateInfo: ClaimInfo = {
            claim_id: record.claim_id,
            tenant_id: tenantContext.tenantId,
            hospital_id: tenantContext.hospitalId,
            status: record.status,
            created_at: record.created_at
        };

        return {
            success: true,
            data: duplicateInfo
        };

    } catch (error) {
        return {
            success: false,
            error: (error as Error).message
        };
    }
}