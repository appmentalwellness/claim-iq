/**
 * ClaimIQ Database Update Lambda Function (TypeScript)
 * Handles database operations for Step Functions workflow
 * 
 * KISS Principle: Simple database operations using shared utilities
 */

import { Context } from 'aws-lambda';
import {
    TenantContext,
    withLambdaHandler,
    validateEnvironment,
    executeQuery,
    updateClaimStatus,
    logAuditEvent
} from '@claimiq/shared';

// Environment variables validation
validateEnvironment([
    'AURORA_CLUSTER_ARN',
    'AURORA_SECRET_ARN',
    'DATABASE_NAME'
]);

// Types
interface DatabaseUpdateEvent {
    operation: 'updateClaimStatus' | 'insertProcessingLog';
    claimId: string;
    tenantId?: string;
    hospitalId?: string;
    status?: string;
    data?: Record<string, any>;
}

interface UpdateClaimStatusResult {
    success: boolean;
    claimId: string;
    status: string;
    updatedRecords: number;
}

interface InsertProcessingLogResult {
    success: boolean;
    claimId: string;
    logId?: number;
}

interface LogData {
    step?: string;
    status?: string;
    details?: Record<string, any>;
}

/**
 * Main handler for database update operations
 */
export const handler = withLambdaHandler<DatabaseUpdateEvent, UpdateClaimStatusResult | InsertProcessingLogResult>(
    async (event, context, tenantContext) => {
        const { operation, claimId, status, data } = event;
        
        // Create tenant context from event if not provided by API Gateway
        const effectiveTenantContext: TenantContext = tenantContext || {
            tenantId: event.tenantId || 'default-tenant',
            hospitalId: event.hospitalId || 'default-hospital'
        };

        switch (operation) {
            case 'updateClaimStatus':
                if (!status) {
                    throw new Error('Status is required for updateClaimStatus operation');
                }
                return await handleUpdateClaimStatus(claimId, status, effectiveTenantContext, data);
                
            case 'insertProcessingLog':
                if (!data) {
                    throw new Error('Data is required for insertProcessingLog operation');
                }
                return await handleInsertProcessingLog(claimId, effectiveTenantContext, data as LogData);
                
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }
    },
    {
        requireTenant: false, // Tenant context can come from event
        logExecution: true,
        functionName: 'db-update'
    }
);

/**
 * Handle claim status update using shared utilities
 */
async function handleUpdateClaimStatus(
    claimId: string,
    status: string,
    tenantContext: TenantContext,
    data?: Record<string, any>
): Promise<UpdateClaimStatusResult> {
    console.log(`Updating claim ${claimId} to status: ${status}`);

    // Use shared utility for status update
    const result = await updateClaimStatus(claimId, status, tenantContext, data);

    if (!result.success) {
        throw new Error(`Failed to update claim status: ${result.error}`);
    }

    // Log the operation
    await logAuditEvent({
        claim_id: claimId,
        timestamp: new Date().toISOString(),
        agent_type: 'DB_UPDATE',
        tenant_id: tenantContext.tenantId,
        action: 'UPDATE_CLAIM_STATUS',
        status: 'SUCCESS',
        details: {
            newStatus: status,
            additionalData: data,
            recordsUpdated: result.recordsAffected
        }
    });

    return {
        success: true,
        claimId: claimId,
        status: status,
        updatedRecords: result.recordsAffected || 0
    };
}

/**
 * Handle processing log insertion using shared utilities
 */
async function handleInsertProcessingLog(
    claimId: string,
    tenantContext: TenantContext,
    logData: LogData
): Promise<InsertProcessingLogResult> {
    console.log(`Inserting processing log for claim ${claimId}`);

    const sql = `
        INSERT INTO processing_logs (claim_id, step, status, details, created_at)
        VALUES (:claimId, :step, :status, :details, NOW())
    `;

    const parameters = [
        { name: 'claimId', value: { stringValue: claimId } },
        { name: 'step', value: { stringValue: logData.step || 'unknown' } },
        { name: 'status', value: { stringValue: logData.status || 'completed' } },
        { name: 'details', value: { stringValue: JSON.stringify(logData.details || {}) } }
    ];

    // Use shared utility for database operation
    const result = await executeQuery(sql, parameters, tenantContext);

    if (!result.success) {
        throw new Error(`Failed to insert processing log: ${result.error}`);
    }

    // Log the operation
    await logAuditEvent({
        claim_id: claimId,
        timestamp: new Date().toISOString(),
        agent_type: 'DB_UPDATE',
        tenant_id: tenantContext.tenantId,
        action: 'INSERT_PROCESSING_LOG',
        status: 'SUCCESS',
        details: {
            step: logData.step,
            logStatus: logData.status,
            logDetails: logData.details
        }
    });

    return {
        success: true,
        claimId: claimId,
        logId: result.data?.[0]?.generatedFields?.[0]?.longValue
    };
}