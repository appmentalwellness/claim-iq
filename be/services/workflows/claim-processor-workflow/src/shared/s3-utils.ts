/**
 * Shared S3 Utilities for ClaimIQ Lambda functions
 * KISS Principle: Simple, reusable S3 operations
 */

import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { TenantContext, DatabaseResult } from './types';

// Initialize S3 client (singleton pattern)
let s3Client: S3Client;

function getS3Client(): S3Client {
    if (!s3Client) {
        s3Client = new S3Client({});
    }
    return s3Client;
}

/**
 * Generate pre-signed URL for S3 upload with tenant isolation
 */
export async function generatePresignedUploadUrl(
    bucketName: string,
    key: string,
    contentType: string,
    metadata: Record<string, string>,
    expiresIn: number = 3600
): Promise<DatabaseResult<string>> {
    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType,
            Metadata: metadata,
            ServerSideEncryption: 'aws:kms'
        });

        const presignedUrl = await getSignedUrl(getS3Client(), command, { expiresIn });

        return {
            success: true,
            data: presignedUrl
        };

    } catch (error) {
        console.error('Failed to generate pre-signed URL:', error);
        return {
            success: false,
            error: (error as Error).message
        };
    }
}

/**
 * Get S3 object metadata
 */
export async function getObjectMetadata(
    bucketName: string,
    key: string
): Promise<DatabaseResult<Record<string, any>>> {
    try {
        const command = new HeadObjectCommand({
            Bucket: bucketName,
            Key: key
        });

        const response = await getS3Client().send(command);

        return {
            success: true,
            data: {
                contentType: response.ContentType,
                contentLength: response.ContentLength,
                lastModified: response.LastModified,
                metadata: response.Metadata || {}
            }
        };

    } catch (error) {
        console.error('Failed to get object metadata:', error);
        return {
            success: false,
            error: (error as Error).message
        };
    }
}

/**
 * Generate tenant-isolated S3 key
 */
export function generateTenantS3Key(
    tenantContext: TenantContext,
    claimId: string,
    uploadId: string,
    fileExtension: string
): string {
    return `tenants/${tenantContext.tenantId}/hospitals/${tenantContext.hospitalId}/claims/${claimId}/${uploadId}${fileExtension}`;
}

/**
 * Extract claim information from S3 object metadata
 */
export function extractClaimInfoFromS3Metadata(
    metadata: Record<string, string>,
    s3Key: string
): {
    claimId: string;
    tenantId: string;
    hospitalId: string;
    uploadId: string;
    originalFilename: string;
    requestId: string;
} {
    const claimId = metadata['claim-id'];
    if (!claimId) {
        throw new Error('Missing claim-id in S3 object metadata');
    }

    return {
        claimId,
        tenantId: metadata['tenant-id'] || 'unknown',
        hospitalId: metadata['hospital-id'] || 'unknown',
        uploadId: metadata['upload-id'] || 'unknown',
        originalFilename: metadata['original-filename'] || s3Key.split('/').pop() || 'unknown',
        requestId: metadata['request-id'] || 'unknown'
    };
}

/**
 * Calculate file hash from S3 object stream
 */
export async function calculateS3ObjectHash(
    bucketName: string,
    key: string
): Promise<DatabaseResult<string>> {
    try {
        const { createHash } = await import('crypto');
        
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key
        });

        const response = await getS3Client().send(command);
        const stream = response.Body as any;

        return new Promise((resolve) => {
            const hash = createHash('sha256');

            stream.on('data', (chunk: Buffer) => {
                hash.update(chunk);
            });

            stream.on('end', () => {
                resolve({
                    success: true,
                    data: hash.digest('hex')
                });
            });

            stream.on('error', (error: Error) => {
                resolve({
                    success: false,
                    error: error.message
                });
            });
        });

    } catch (error) {
        console.error('Failed to calculate file hash:', error);
        return {
            success: false,
            error: (error as Error).message
        };
    }
}

/**
 * Validate file type against supported types
 */
export function validateFileType(
    contentType: string,
    supportedTypes: Record<string, string>
): { isValid: boolean; extension?: string; error?: string } {
    const normalizedContentType = contentType.split(';')[0].trim();
    
    if (!supportedTypes[normalizedContentType]) {
        return {
            isValid: false,
            error: `Unsupported file type: ${normalizedContentType}. Supported types: ${Object.keys(supportedTypes).join(', ')}`
        };
    }

    return {
        isValid: true,
        extension: supportedTypes[normalizedContentType]
    };
}

/**
 * Validate file size against limits
 */
export function validateFileSize(
    fileSize: number,
    maxSizeMB: number
): { isValid: boolean; error?: string } {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (fileSize > maxSizeBytes) {
        return {
            isValid: false,
            error: `File size (${(fileSize / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed size of ${maxSizeMB}MB`
        };
    }

    if (fileSize <= 0) {
        return {
            isValid: false,
            error: 'Invalid file size'
        };
    }

    return { isValid: true };
}