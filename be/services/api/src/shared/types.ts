/**
 * Shared TypeScript types for ClaimIQ Lambda functions
 * KISS Principle: Simple, reusable type definitions
 */

// Common AWS Lambda types
export interface LambdaContext {
    awsRequestId: string;
    functionName: string;
    functionVersion: string;
    memoryLimitInMB: string;
    remainingTimeInMillis: () => number;
}

// Tenant context for multi-tenant isolation
export interface TenantContext {
    tenantId: string;
    hospitalId: string;
    userId?: string;
    role?: string;
}

// Database operation result
export interface DatabaseResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    recordsAffected?: number;
}

// Audit log entry
export interface AuditLogEntry {
    claim_id: string;
    timestamp: string;
    agent_type: string;
    tenant_id: string;
    action: string;
    status: 'SUCCESS' | 'ERROR' | 'WARNING';
    details?: Record<string, any>;
    error_message?: string;
}

// Common claim information
export interface ClaimInfo {
    claim_id: string;
    tenant_id: string;
    hospital_id: string;
    status: string;
    original_filename?: string;
    content_type?: string;
    file_size?: number;
    s3_bucket?: string;
    s3_key?: string;
    created_at?: string;
    updated_at?: string;
}

// API Gateway response
export interface ApiResponse<T = any> {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

// Standard API response body
export interface ApiResponseBody<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}