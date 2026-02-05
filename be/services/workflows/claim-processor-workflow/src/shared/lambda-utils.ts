/**
 * Shared Lambda Utilities for ClaimIQ functions
 * KISS Principle: Simple, reusable Lambda patterns and helpers
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TenantContext, ApiResponseBody, LambdaContext } from './types';
import { logAuditEvent } from './database';

/**
 * Extract tenant context from API Gateway event
 */
export function extractTenantContext(event: APIGatewayProxyEvent): TenantContext {
    const headers = event.headers || {};
    const authorizer = event.requestContext?.authorizer;

    return {
        tenantId: headers['x-tenant-id'] || authorizer?.tenantId || 'default-tenant',
        hospitalId: headers['x-hospital-id'] || authorizer?.hospitalId || 'default-hospital',
        userId: authorizer?.userId,
        role: authorizer?.role
    };
}

/**
 * Create standardized API Gateway success response
 */
export function createSuccessResponse<T>(
    data: T,
    statusCode: number = 200,
    additionalHeaders?: Record<string, string>
): APIGatewayProxyResult {
    const responseBody: ApiResponseBody<T> = {
        success: true,
        data
    };

    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Tenant-Id,X-Hospital-Id',
            ...additionalHeaders
        },
        body: JSON.stringify(responseBody)
    };
}

/**
 * Create standardized API Gateway error response
 */
export function createErrorResponse(
    statusCode: number,
    error: string,
    additionalHeaders?: Record<string, string>
): APIGatewayProxyResult {
    const responseBody: ApiResponseBody = {
        success: false,
        error
    };

    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Tenant-Id,X-Hospital-Id',
            ...additionalHeaders
        },
        body: JSON.stringify(responseBody)
    };
}

/**
 * Lambda function wrapper with error handling and logging
 */
export function withLambdaHandler<TEvent, TResult>(
    handler: (event: TEvent, context: LambdaContext, tenantContext?: TenantContext) => Promise<TResult>,
    options: {
        requireTenant?: boolean;
        logExecution?: boolean;
        functionName?: string;
    } = {}
) {
    return async (event: TEvent, context: LambdaContext): Promise<TResult> => {
        const startTime = Date.now();
        const requestId = context.awsRequestId;
        const functionName = options.functionName || context.functionName;

        try {
            // Extract tenant context if this is an API Gateway event
            let tenantContext: TenantContext | undefined;
            if (event && typeof event === 'object' && 'headers' in event) {
                tenantContext = extractTenantContext(event as any);
            }

            // Validate tenant context if required
            if (options.requireTenant && (!tenantContext || !tenantContext.tenantId)) {
                throw new Error('Tenant context required but not found');
            }

            console.log(`[${requestId}] ${functionName} started`, {
                tenantContext,
                event: options.logExecution ? event : '[event logging disabled]'
            });

            // Execute the handler
            const result = await handler(event, context, tenantContext);

            const executionTime = Date.now() - startTime;
            console.log(`[${requestId}] ${functionName} completed successfully in ${executionTime}ms`);

            // Log successful execution if enabled
            if (options.logExecution && tenantContext) {
                await logAuditEvent({
                    claim_id: 'system',
                    timestamp: new Date().toISOString(),
                    agent_type: functionName.toUpperCase(),
                    tenant_id: tenantContext.tenantId,
                    action: 'FUNCTION_EXECUTION',
                    status: 'SUCCESS',
                    details: {
                        executionTimeMs: executionTime,
                        requestId
                    }
                });
            }

            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[${requestId}] ${functionName} failed after ${executionTime}ms:`, error);

            // Log error if tenant context available
            if (options.logExecution) {
                try {
                    let tenantContext: TenantContext | undefined;
                    if (event && typeof event === 'object' && 'headers' in event) {
                        tenantContext = extractTenantContext(event as any);
                    }

                    if (tenantContext) {
                        await logAuditEvent({
                            claim_id: 'system',
                            timestamp: new Date().toISOString(),
                            agent_type: functionName.toUpperCase(),
                            tenant_id: tenantContext.tenantId,
                            action: 'FUNCTION_EXECUTION',
                            status: 'ERROR',
                            error_message: (error as Error).message,
                            details: {
                                executionTimeMs: executionTime,
                                requestId
                            }
                        });
                    }
                } catch (logError) {
                    console.error('Failed to log error event:', logError);
                }
            }

            throw error;
        }
    };
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(requiredVars: string[]): void {
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

/**
 * Parse JSON safely with error handling
 */
export function parseJsonSafely<T>(jsonString: string, defaultValue: T): T {
    try {
        return JSON.parse(jsonString) as T;
    } catch (error) {
        console.warn('Failed to parse JSON, using default value:', error);
        return defaultValue;
    }
}

/**
 * Generate correlation ID for request tracking
 */
export function generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            
            if (attempt === maxRetries) {
                break;
            }

            const delay = baseDelayMs * Math.pow(2, attempt);
            console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
}