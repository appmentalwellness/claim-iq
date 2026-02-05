/**
 * ClaimIQ File Upload Lambda Function (TypeScript)
 * 
 * This function generates pre-signed URLs for direct S3 uploads and handles
 * file upload initiation. Files are uploaded directly to S3, which triggers
 * the processing workflow via S3 events.
 * 
 * KISS Principle: Simple pre-signed URL generation using shared utilities
 * 
 * Requirements validated:
 * - 1.1: Store PDF files in object storage and create processing record
 * - 1.2: Validate Excel format and store for processing  
 * - 1.3: Parse CSV structure and store with metadata
 * - 1.4: Return descriptive error for size limits
 * - 1.5: Detect duplicates and prevent reprocessing
 * - 1.6: Support files up to 50MB
 * - 1.7: Maintain audit logs with timestamps and user info
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import {
    TenantContext,
    withLambdaHandler,
    createSuccessResponse,
    createErrorResponse,
    validateEnvironment,
    parseJsonSafely,
    generatePresignedUploadUrl,
    generateTenantS3Key,
    validateFileType,
    validateFileSize,
    executeQuery,
    checkDuplicateFile,
    logAuditEvent
} from '@claimiq/shared';

// Environment variables validation
validateEnvironment([
    'CLAIMS_BUCKET_NAME',
    'AURORA_CLUSTER_ARN',
    'AURORA_SECRET_ARN',
    'AGENT_LOGS_TABLE'
]);

const CLAIMS_BUCKET_NAME = process.env.CLAIMS_BUCKET_NAME!;
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50');
const IS_OFFLINE = process.env.IS_OFFLINE === 'true';

// Supported file types
const SUPPORTED_CONTENT_TYPES: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'text/csv': '.csv'
};

// Types
interface UploadRequest {
    filename: string;
    contentType: string;
    fileSize: number;
    fileHash?: string;
}

interface UploadResult {
    claimId: string;
    uploadId: string;
    presignedUrl: string;
    s3Key: string;
    s3Bucket: string;
    expiresIn: number;
    maxFileSize: number;
    contentType: string;
    message: string;
}

/**
 * Main Lambda handler for file upload pre-signed URL generation.
 */
export const handler = withLambdaHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
    async (event, context, tenantContext) => {
        const httpMethod = event.httpMethod || event.requestContext?.httpMethod;
        
        if (httpMethod === 'POST') {
            return await handlePresignedUrlRequest(event, tenantContext!);
        } else if (httpMethod === 'GET') {
            return await handleUploadStatus(event, tenantContext!);
        } else {
            return createErrorResponse(405, 'Method not allowed');
        }
    },
    {
        requireTenant: true,
        logExecution: true,
        functionName: 'file-upload'
    }
);

/**
 * Handle pre-signed URL generation request
 */
async function handlePresignedUrlRequest(
    event: APIGatewayProxyEvent,
    tenantContext: TenantContext
): Promise<APIGatewayProxyResult> {
    try {
        // Parse and validate request
        const uploadRequest = parseUploadRequest(event);
        const validationResult = validateUploadRequest(uploadRequest);
        
        if (!validationResult.isValid) {
            return createErrorResponse(400, validationResult.error!);
        }

        // Check for duplicates if file hash is provided
        if (uploadRequest.fileHash) {
            const duplicateResult = await checkDuplicateFile(uploadRequest.fileHash, tenantContext);
            
            if (!duplicateResult.success) {
                console.warn('Duplicate check failed:', duplicateResult.error);
            } else if (duplicateResult.data) {
                return createSuccessResponse({
                    status: 'duplicate',
                    message: 'File already exists',
                    existingClaimId: duplicateResult.data.claim_id,
                    fileHash: uploadRequest.fileHash
                });
            }
        }

        // Generate pre-signed URL
        const uploadResult = await generateUploadUrl(uploadRequest, tenantContext);
        
        // Log successful request
        await logAuditEvent({
            claim_id: uploadResult.claimId,
            timestamp: new Date().toISOString(),
            agent_type: 'FILE_UPLOAD_PRESIGNED',
            tenant_id: tenantContext.tenantId,
            action: 'PRESIGNED_URL_GENERATED',
            status: 'SUCCESS',
            details: {
                filename: uploadRequest.filename,
                fileSize: uploadRequest.fileSize,
                contentType: uploadRequest.contentType,
                uploadId: uploadResult.uploadId
            }
        });

        return createSuccessResponse(uploadResult);

    } catch (error) {
        console.error('Error generating pre-signed URL:', error);
        
        // Log error
        await logAuditEvent({
            claim_id: 'unknown',
            timestamp: new Date().toISOString(),
            agent_type: 'FILE_UPLOAD_PRESIGNED',
            tenant_id: tenantContext.tenantId,
            action: 'PRESIGNED_URL_REQUEST',
            status: 'ERROR',
            error_message: (error as Error).message
        });

        return createErrorResponse(500, "Failed to generate upload URL");
    }
}

/**
 * Handle upload status check
 */
async function handleUploadStatus(
    event: APIGatewayProxyEvent,
    tenantContext: TenantContext
): Promise<APIGatewayProxyResult> {
    try {
        const claimId = event.pathParameters?.claimId || event.queryStringParameters?.claimId;
        
        if (!claimId) {
            return createErrorResponse(400, 'Missing claimId parameter');
        }

        // Get claim info using shared utility
        const result = await executeQuery(
            'SELECT claim_id, status, original_filename, created_at, file_size FROM claims WHERE claim_id = :claim_id',
            [{ name: 'claim_id', value: { stringValue: claimId } }],
            tenantContext
        );

        if (!result.success || !result.data || result.data.length === 0) {
            return createErrorResponse(404, 'Claim not found');
        }

        const record = result.data[0];
        return createSuccessResponse({
            claimId: record[0]?.stringValue,
            status: record[1]?.stringValue,
            filename: record[2]?.stringValue,
            uploadedAt: record[3]?.stringValue,
            fileSize: record[4]?.longValue
        });

    } catch (error) {
        console.error('Error checking upload status:', error);
        return createErrorResponse(500, "Failed to check upload status");
    }
}

/**
 * Parse upload request from API Gateway event
 */
function parseUploadRequest(event: APIGatewayProxyEvent): UploadRequest {
    const body = parseJsonSafely(event.body || '{}', {} as any);
    
    return {
        filename: body.filename || `upload_${new Date().toISOString().replace(/[:.]/g, '_')}`,
        contentType: body.contentType || body.mimeType || 'application/octet-stream',
        fileSize: parseInt(body.fileSize || body.size || '0'),
        fileHash: body.fileHash || body.hash
    };
}

/**
 * Validate upload request
 */
function validateUploadRequest(request: UploadRequest): { isValid: boolean; error?: string } {
    // Validate file size
    const sizeValidation = validateFileSize(request.fileSize, MAX_FILE_SIZE_MB);
    if (!sizeValidation.isValid) {
        return sizeValidation;
    }

    // Validate file type
    const typeValidation = validateFileType(request.contentType, SUPPORTED_CONTENT_TYPES);
    if (!typeValidation.isValid) {
        return typeValidation;
    }

    // Validate filename
    if (!request.filename) {
        return { isValid: false, error: "Missing filename" };
    }

    return { isValid: true };
}

/**
 * Generate upload URL and create initial claim record
 */
async function generateUploadUrl(
    request: UploadRequest,
    tenantContext: TenantContext
): Promise<UploadResult> {
    // Generate unique identifiers
    const claimId = uuidv4();
    const uploadId = uuidv4();
    
    // Get file extension
    const typeValidation = validateFileType(request.contentType, SUPPORTED_CONTENT_TYPES);
    const fileExtension = typeValidation.extension!;
    
    // Generate S3 key with tenant isolation
    const s3Key = generateTenantS3Key(tenantContext, claimId, uploadId, fileExtension);
    
    // Create metadata for S3 object
    const metadata = {
        'tenant-id': tenantContext.tenantId,
        'hospital-id': tenantContext.hospitalId,
        'claim-id': claimId,
        'upload-id': uploadId,
        'original-filename': request.filename,
        'file-hash': request.fileHash || '',
        'request-id': uuidv4()
    };

    // Generate pre-signed URL
    const urlResult = await generatePresignedUploadUrl(
        CLAIMS_BUCKET_NAME,
        s3Key,
        request.contentType,
        metadata
    );

    if (!urlResult.success) {
        throw new Error(`Failed to generate pre-signed URL: ${urlResult.error}`);
    }

    // Create initial claim record
    await createInitialClaimRecord(claimId, request, s3Key, uploadId, tenantContext);

    return {
        claimId,
        uploadId,
        presignedUrl: urlResult.data!,
        s3Key,
        s3Bucket: CLAIMS_BUCKET_NAME,
        expiresIn: 3600,
        maxFileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
        contentType: request.contentType,
        message: 'Pre-signed URL generated successfully. Upload file directly to S3.'
    };
}

/**
 * Create initial claim record using shared database utilities
 */
async function createInitialClaimRecord(
    claimId: string,
    request: UploadRequest,
    s3Key: string,
    uploadId: string,
    tenantContext: TenantContext
): Promise<void> {
    const sql = `
        INSERT INTO claims (
            claim_id, tenant_id, hospital_id, status, 
            original_filename, content_type, file_size,
            s3_bucket, s3_key, upload_id,
            created_at, updated_at
        ) VALUES (
            :claim_id, :tenant_id, :hospital_id, 'UPLOAD_PENDING',
            :filename, :content_type, :file_size,
            :s3_bucket, :s3_key, :upload_id,
            NOW(), NOW()
        )
    `;

    const parameters = [
        { name: 'claim_id', value: { stringValue: claimId } },
        { name: 'tenant_id', value: { stringValue: tenantContext.tenantId } },
        { name: 'hospital_id', value: { stringValue: tenantContext.hospitalId } },
        { name: 'filename', value: { stringValue: request.filename } },
        { name: 'content_type', value: { stringValue: request.contentType } },
        { name: 'file_size', value: { longValue: request.fileSize } },
        { name: 's3_bucket', value: { stringValue: CLAIMS_BUCKET_NAME } },
        { name: 's3_key', value: { stringValue: s3Key } },
        { name: 'upload_id', value: { stringValue: uploadId } }
    ];

    const result = await executeQuery(sql, parameters);
    
    if (!result.success) {
        throw new Error(`Failed to create initial claim record: ${result.error}`);
    }

    console.log(`Initial claim record created: ${claimId}`);
}

/**
 * Health check handler for API Gateway
 */
export const healthHandler = withLambdaHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
    async (event, context) => {
        return createSuccessResponse({
            service: 'ClaimIQ File Upload Service',
            environment: process.env.ENVIRONMENT,
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            status: 'healthy'
        });
    },
    {
        requireTenant: false,
        logExecution: false,
        functionName: 'health-check'
    }
);