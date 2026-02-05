/**
 * ClaimIQ Lambda Authorizer Function (TypeScript)
 * 
 * This function validates JWT tokens and provides tenant-based authorization
 * for API Gateway requests. It implements custom authorization logic with
 * tenant isolation and role-based access control.
 * 
 * KISS Principle: Simple JWT validation using shared utilities for logging
 * 
 * Requirements validated:
 * - 2.2: Implement authentication and authorization
 * - 6.1: Tenant isolation at API level
 * - 8.1: Secure API endpoints with proper authorization
 */

import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { 
    APIGatewayRequestAuthorizerEvent, 
    APIGatewayAuthorizerResult, 
    Context 
} from 'aws-lambda';
import {
    validateEnvironment,
    logAuditEvent
} from '@claimiq/shared';

// Environment variables validation
validateEnvironment([
    'USER_POOL_ID',
    'USER_POOL_CLIENT_ID',
    'AWS_REGION'
]);

// Types
interface UserClaims {
    sub: string;
    email: string;
    'cognito:username': string;
    'custom:tenant_id'?: string;
    'custom:hospital_id'?: string;
    'custom:role'?: string;
}

interface AuthorizerContext {
    userId: string;
    email: string;
    username: string;
    tenantId: string;
    hospitalId: string;
    role: string;
}

// Environment variables
const USER_POOL_ID = process.env.USER_POOL_ID!;
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;
const AWS_REGION = process.env.AWS_REGION!;

// Cognito client (lightweight v3)
const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_REGION });

// JWK client for token validation
const jwksUri = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`;
const client = jwksClient({
    jwksUri,
    requestHeaders: {},
    timeout: 30000,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 600000 // 10 minutes
});

/**
 * Lambda authorizer handler for API Gateway
 * Validates JWT tokens and returns IAM policy with user context
 */
export const handler = async (
    event: APIGatewayRequestAuthorizerEvent,
    context: Context
): Promise<APIGatewayAuthorizerResult> => {
    const requestId = context.awsRequestId;
    
    try {
        console.info(`[${requestId}] Authorizer invoked for method: ${event.httpMethod} ${event.path}`);
        
        // Extract token from Authorization header
        const token = extractToken(event);
        if (!token) {
            console.warn(`[${requestId}] No authorization token provided`);
            await logAuthorizationEvent('unknown', 'unknown', 'TOKEN_MISSING', 'ERROR');
            throw new Error('Unauthorized');
        }
        
        // Validate and decode JWT token
        const userClaims = await validateJwtToken(token);
        if (!userClaims) {
            console.warn(`[${requestId}] Invalid JWT token`);
            await logAuthorizationEvent('unknown', 'unknown', 'TOKEN_INVALID', 'ERROR');
            throw new Error('Unauthorized');
        }
        
        // Extract user context with tenant isolation
        const authContext = extractUserContext(userClaims);
        
        // Log successful authorization using shared utility
        await logAuthorizationEvent(
            authContext.userId,
            authContext.tenantId,
            'AUTHORIZATION_SUCCESS',
            'SUCCESS',
            {
                username: authContext.username,
                role: authContext.role,
                hospitalId: authContext.hospitalId,
                method: event.httpMethod,
                path: event.path
            }
        );
        
        // Generate IAM policy
        const policy = generatePolicy(
            authContext.userId,
            'Allow',
            event.methodArn,
            authContext
        );
        
        console.info(`[${requestId}] Authorization successful for user: ${authContext.username}, tenant: ${authContext.tenantId}`);
        return policy;
        
    } catch (error) {
        console.error(`[${requestId}] Authorization failed:`, error);
        
        // Return explicit deny policy
        return generatePolicy('user', 'Deny', event.methodArn);
    }
};

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(event: APIGatewayRequestAuthorizerEvent): string | null {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    
    if (!authHeader) {
        return null;
    }
    
    const match = authHeader.match(/^Bearer\s+(.+)$/);
    return match ? match[1] : null;
}

/**
 * Validate JWT token using Cognito JWKS
 */
async function validateJwtToken(token: string): Promise<UserClaims | null> {
    try {
        // Decode token header to get key ID
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
            throw new Error('Invalid token structure');
        }
        
        // Get signing key from JWKS
        const key = await client.getSigningKey(decoded.header.kid);
        const signingKey = key.getPublicKey();
        
        // Verify token
        const payload = jwt.verify(token, signingKey, {
            audience: USER_POOL_CLIENT_ID,
            issuer: `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`,
            algorithms: ['RS256']
        }) as UserClaims;
        
        return payload;
        
    } catch (error) {
        console.error('JWT validation failed:', error);
        return null;
    }
}

/**
 * Extract user context with tenant isolation
 */
function extractUserContext(claims: UserClaims): AuthorizerContext {
    return {
        userId: claims.sub,
        email: claims.email,
        username: claims['cognito:username'],
        tenantId: claims['custom:tenant_id'] || 'default-tenant',
        hospitalId: claims['custom:hospital_id'] || 'default-hospital',
        role: claims['custom:role'] || 'user'
    };
}

/**
 * Generate IAM policy for API Gateway
 */
function generatePolicy(
    principalId: string,
    effect: 'Allow' | 'Deny',
    resource: string,
    context?: AuthorizerContext
): APIGatewayAuthorizerResult {
    const policy: APIGatewayAuthorizerResult = {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource
                }
            ]
        }
    };
    
    // Add user context for downstream Lambda functions
    if (context && effect === 'Allow') {
        policy.context = {
            userId: context.userId,
            email: context.email,
            username: context.username,
            tenantId: context.tenantId,
            hospitalId: context.hospitalId,
            role: context.role
        };
    }
    
    return policy;
}

/**
 * Log authorization event using shared utility
 */
async function logAuthorizationEvent(
    userId: string,
    tenantId: string,
    action: string,
    status: 'SUCCESS' | 'ERROR',
    details?: Record<string, any>
): Promise<void> {
    try {
        await logAuditEvent({
            claim_id: 'auth',
            timestamp: new Date().toISOString(),
            agent_type: 'AUTHORIZER',
            tenant_id: tenantId,
            action: action,
            status: status,
            details: {
                userId,
                ...details
            }
        });
    } catch (error) {
        console.error('Failed to log authorization event:', error);
        // Don't throw - authorization logging failure shouldn't block auth
    }
}