/**
 * ClaimIQ S3 Event Processor Lambda Function (TypeScript)
 * 
 * This function is triggered by S3 bucket events when files are uploaded
 * directly to S3 via pre-signed URLs. It updates the claim status and
 * triggers the Step Functions workflow for processing.
 * 
 * KISS Principle: Simple S3 event processing using shared utilities
 * 
 * Requirements validated:
 * - Event-driven processing from S3 uploads
 * - Workflow initiation via Step Functions
 * - Claim status management
 * - File hash calculation for duplicate detection
 */

import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { S3Event, S3EventRecord, Context } from 'aws-lambda';
import {
    TenantContext,
    withLambdaHandler,
    validateEnvironment,
    getObjectMetadata,
    extractClaimInfoFromS3Metadata,
    calculateS3ObjectHash,
    updateClaimStatus,
    logAuditEvent
} from '@claimiq/shared';

// Environment variables validation
validateEnvironment([
    'AURORA_CLUSTER_ARN',
    'AURORA_SECRET_ARN',
    'AGENT_LOGS_TABLE',
    'STEP_FUNCTION_ARN'
]);

const STEP_FUNCTION_ARN = process.env.STEP_FUNCTION_ARN!;

// Initialize Step Functions client
const sfnClient = new SFNClient({});

// Types
interface ClaimInfo {
    claimId: string;
    tenantId: string;
    hospitalId: string;
    uploadId: string;
    originalFilename: string;
    requestId: string;
    s3Key: string;
    fileSize: number;
    contentType: string;
}

interface ProcessingResult {
    claimId: string;
    status: string;
    workflowExecutionArn: string;
    fileHash: string;
}

interface WorkflowResult {
    executionArn: string;
    startDate: Date;
}

/**
 * Main Lambda handler for S3 event processing.
 */
export const handler = withLambdaHandler<S3Event, any>(
    async (event, context) => {
        const results: ProcessingResult[] = [];
        
        for (const record of event.Records) {
            if (record.eventSource === 'aws:s3' && record.eventName.startsWith('ObjectCreated:')) {
                const result = await processS3Upload(record);
                results.push(result);
            }
        }
        
        return {
            statusCode: 200,
            processedRecords: results.length,
            results: results
        };
    },
    {
        requireTenant: false, // S3 events don't have tenant context in headers
        logExecution: true,
        functionName: 's3-processor'
    }
);

/**
 * Process individual S3 upload record using shared utilities
 */
async function processS3Upload(record: S3EventRecord): Promise<ProcessingResult> {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const size = record.s3.object.size;
    
    console.log(`Processing S3 upload: s3://${bucket}/${key}, size: ${size}`);
    
    try {
        // Get object metadata using shared utility
        const metadataResult = await getObjectMetadata(bucket, key);
        if (!metadataResult.success) {
            throw new Error(`Failed to get object metadata: ${metadataResult.error}`);
        }

        // Extract claim information from metadata using shared utility
        const claimInfo = extractClaimInfoFromS3Metadata(
            metadataResult.data!.metadata,
            key
        );

        // Create tenant context from metadata
        const tenantContext: TenantContext = {
            tenantId: claimInfo.tenantId,
            hospitalId: claimInfo.hospitalId
        };

        // Calculate file hash using shared utility
        const hashResult = await calculateS3ObjectHash(bucket, key);
        if (!hashResult.success) {
            throw new Error(`Failed to calculate file hash: ${hashResult.error}`);
        }
        const fileHash = hashResult.data!;

        // Update claim record with file hash and status using shared utility
        await updateClaimAfterUpload(claimInfo.claimId, fileHash, size, tenantContext);

        // Trigger Step Functions workflow
        const fullClaimInfo: any = {
            claim_id: claimInfo.claimId,
            tenant_id: claimInfo.tenantId,
            hospital_id: claimInfo.hospitalId,
            status: 'PROCESSING',
            s3_key: key,
            file_size: size,
            content_type: metadataResult.data!.contentType || 'application/octet-stream',
            original_filename: claimInfo.originalFilename
        };
        
        const workflowResult = await triggerProcessingWorkflow(fullClaimInfo, fileHash);

        // Log successful processing using shared utility
        await logAuditEvent({
            claim_id: claimInfo.claimId,
            timestamp: new Date().toISOString(),
            agent_type: 'S3_PROCESSOR',
            tenant_id: claimInfo.tenantId,
            action: 'S3_EVENT_PROCESSING',
            status: 'SUCCESS',
            details: {
                bucket,
                key,
                size,
                fileHash,
                workflowExecutionArn: workflowResult.executionArn
            }
        });

        return {
            claimId: claimInfo.claimId,
            status: 'processed',
            workflowExecutionArn: workflowResult.executionArn,
            fileHash: fileHash
        };

    } catch (error) {
        console.error(`Error processing S3 upload ${key}:`, error);

        // Try to extract claim ID for error logging
        let claimId = 'unknown';
        let tenantId = 'unknown';
        try {
            const metadataResult = await getObjectMetadata(bucket, key);
            if (metadataResult.success) {
                claimId = metadataResult.data!.metadata['claim-id'] || 'unknown';
                tenantId = metadataResult.data!.metadata['tenant-id'] || 'unknown';
            }
        } catch (metadataError) {
            console.error('Failed to get metadata for error logging:', metadataError);
        }

        // Log error using shared utility
        await logAuditEvent({
            claim_id: claimId,
            timestamp: new Date().toISOString(),
            agent_type: 'S3_PROCESSOR',
            tenant_id: tenantId,
            action: 'S3_EVENT_PROCESSING',
            status: 'ERROR',
            error_message: (error as Error).message,
            details: {
                bucket,
                key,
                size
            }
        });

        // Mark claim for manual review if we can identify it
        if (claimId !== 'unknown' && tenantId !== 'unknown') {
            const tenantContext: TenantContext = {
                tenantId,
                hospitalId: 'unknown'
            };
            await markClaimForManualReview(claimId, `S3 processing failed: ${(error as Error).message}`, tenantContext);
        }

        throw error;
    }
}

/**
 * Update claim record after successful upload using shared utilities
 */
async function updateClaimAfterUpload(
    claimId: string,
    fileHash: string,
    actualFileSize: number,
    tenantContext: TenantContext
): Promise<void> {
    console.log(`Updating claim ${claimId} with file hash and status NEW`);

    // Use shared utility to update claim status with additional data
    const result = await updateClaimStatus(
        claimId,
        'NEW',
        tenantContext,
        {
            file_hash: fileHash,
            actual_file_size: actualFileSize
        }
    );

    if (!result.success) {
        throw new Error(`Failed to update claim: ${result.error}`);
    }

    if (result.recordsAffected === 0) {
        throw new Error(`No claim found with ID ${claimId} in UPLOAD_PENDING status`);
    }
}

/**
 * Trigger Step Functions workflow for claim processing
 */
async function triggerProcessingWorkflow(claimInfo: ClaimInfo, fileHash: string): Promise<WorkflowResult> {
    try {
        const input = {
            claim_id: claimInfo.claimId,
            tenant_id: claimInfo.tenantId,
            hospital_id: claimInfo.hospitalId,
            s3_key: claimInfo.s3Key,
            file_hash: fileHash,
            file_size: claimInfo.fileSize,
            content_type: claimInfo.contentType,
            original_filename: claimInfo.originalFilename,
            trigger_source: 'S3_EVENT'
        };

        const command = new StartExecutionCommand({
            stateMachineArn: STEP_FUNCTION_ARN,
            name: `claim-processing-${claimInfo.claimId}-${Date.now()}`,
            input: JSON.stringify(input)
        });

        const response = await sfnClient.send(command);

        console.log(`Step Functions workflow started: ${response.executionArn}`);

        return {
            executionArn: response.executionArn!,
            startDate: response.startDate!
        };

    } catch (error) {
        console.error('Error triggering Step Functions workflow:', error);
        throw new Error(`Failed to trigger workflow: ${(error as Error).message}`);
    }
}

/**
 * Mark claim for manual review using shared utilities
 */
async function markClaimForManualReview(
    claimId: string,
    errorMessage: string,
    tenantContext: TenantContext
): Promise<void> {
    try {
        const result = await updateClaimStatus(
            claimId,
            'MANUAL_REVIEW_REQUIRED',
            tenantContext,
            { error_message: errorMessage }
        );

        if (result.success) {
            console.log(`Claim ${claimId} marked for manual review`);
        } else {
            console.error(`Failed to mark claim for manual review: ${result.error}`);
        }

    } catch (error) {
        console.error('Error marking claim for manual review:', error);
    }
}