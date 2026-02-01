# Implementation Plan: ClaimIQ System Architecture

## Overview

This implementation plan converts the ClaimIQ system architecture design into a series of discrete coding tasks for building an AWS-native, serverless-first insurance denial recovery system. The plan follows an incremental approach, building core infrastructure first, then adding AI agents, workflow orchestration, and human-in-the-loop interfaces.

## Tasks

- [ ] 1. Infrastructure Foundation and Database Setup
  - [x] 1.1 Create Terraform modules for AWS infrastructure
    - Set up Terraform project structure with modules for networking, security, and data storage
    - Create reusable modules for dev/staging/prod environments
    - Configure AWS provider and backend state management
    - _Requirements: 8.9_

  - [x] 1.2 Deploy Aurora Serverless v2 PostgreSQL cluster
    - Create Aurora Serverless v2 cluster with PostgreSQL engine
    - Configure VPC, subnets, and security groups for database access
    - Set up database credentials in AWS Secrets Manager
    - Create initial database schema for core entities (Tenant, Hospital, Claim, Denial)
    - _Requirements: 8.5, 9.3_

  - [x] 1.3 Deploy DynamoDB tables for operational data
    - Create DynamoDB tables for agent execution logs, state machine checkpoints, and idempotency keys
    - Configure table schemas with proper partition and sort keys
    - Set up auto-scaling policies and backup configurations
    - _Requirements: 8.6_

  - [x] 1.4 Set up S3 buckets for file storage
    - Create S3 buckets with tenant-specific prefixes for file isolation
    - Configure bucket policies, encryption with KMS, and lifecycle management
    - Set up CORS policies for web uploads
    - _Requirements: 8.4, 9.1, 6.3_

  - [ ]* 1.5 Write property test for multi-tenant data isolation
    - **Property 10: Multi-Tenant Data Isolation**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [ ] 2. Core API Infrastructure and Authentication
  - [x] 2.1 Create API Gateway with Lambda integration
    - Set up REST API Gateway with proper resource structure
    - Configure Lambda proxy integration and CORS settings
    - Implement request/response transformations and validation
    - _Requirements: 8.7_

  - [x] 2.2 Implement authentication and authorization
    - Set up AWS Cognito user pools for tenant user management
    - Create Lambda authorizer for API Gateway with tenant isolation
    - Implement JWT token validation and user context extraction
    - _Requirements: 9.4_

  - [x] 2.3 Create base Lambda function template and utilities
    - Develop reusable Lambda function template with error handling, logging, and database connections
    - Create utility functions for Aurora and DynamoDB operations
    - Implement tenant context middleware for all Lambda functions
    - _Requirements: 8.1, 6.1_

  - [ ]* 2.4 Write property test for API security and tenant isolation
    - **Property 10: Multi-Tenant Data Isolation (API Layer)**
    - **Validates: Requirements 6.4**

- [x] 3. File Ingestion Service Implementation (S3 Pre-signed URL Architecture)
  - [x] 3.1 Implement pre-signed URL generation Lambda function
    - Create Lambda function to generate S3 pre-signed URLs for direct client uploads
    - Implement file metadata validation (format, size limits up to 50MB)
    - Create initial claim records in Aurora with UPLOAD_PENDING status
    - Support optional file hash for duplicate detection
    - _Requirements: 1.1, 1.2, 1.3, 1.6, File Upload & Ingestion Standard_

  - [x] 3.2 Implement S3 event processor Lambda function
    - Create Lambda function triggered by S3 bucket events (ObjectCreated:*)
    - Calculate file hash from uploaded S3 objects
    - Update claim status from UPLOAD_PENDING to NEW
    - Extract metadata from S3 object tags and validate tenant isolation
    - Trigger Step Functions workflow for claim processing
    - _Requirements: 1.1, File Upload & Ingestion Standard_

  - [x] 3.3 Add comprehensive error handling and audit logging
    - Implement error handling for pre-signed URL generation failures
    - Add S3 event processing error handling with manual review flagging
    - Create audit logging for all operations with timestamps and user information
    - Handle duplicate detection based on file hash comparison
    - _Requirements: 1.4, 1.5, 1.7_

  - [ ]* 3.4 Write property test for S3 pre-signed URL workflow
    - **Property 1: S3 Pre-signed URL Upload Consistency**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.7, File Upload & Ingestion Standard**

  - [ ]* 3.5 Write property test for event-driven processing
    - **Property 2: S3 Event Processing and Workflow Triggering**
    - **Validates: Requirements 1.5, File Upload & Ingestion Standard**

- [x] 4. Data Normalization Service
  - [x] 4.1 Create normalization Lambda function
    - Implement Lambda function to process uploaded files and extract structured data
    - Integrate with Amazon Textract for PDF text extraction
    - Create parsers for Excel and CSV file formats
    - _Requirements: 2.1_

  - [x] 4.2 Implement entity creation and validation
    - Create all required entities (Tenant, Hospital, Claim, Denial, Patient, Payer) in Aurora
    - Implement data validation rules and ensure tenantId inclusion in all records
    - Add error handling for malformed data with manual review flagging
    - Handle duplicate claim detection and merging with version history
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.3 Write property test for entity creation completeness
    - **Property 3: Entity Creation Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.4**

  - [ ]* 4.4 Write property test for error handling and manual review flagging
    - **Property 4: Error Handling and Manual Review Flagging**
    - **Validates: Requirements 2.3**

- [x] 5. Checkpoint - Core Infrastructure Validation
  - Ensure all tests pass, verify database connections, and validate file upload workflow
  - Test multi-tenant isolation across all components
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Workflow Engine with Step Functions
  - [ ] 6.1 Create Step Functions state machine definition
    - Design and implement Step Functions state machine for claim workflow
    - Define states: NEW → DENIED → AI_ANALYZED → HUMAN_REVIEW → SUBMITTED → RECOVERED/FAILED
    - Configure error handling, retry logic, and timeout settings
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.9_

  - [ ] 6.2 Implement workflow controller Lambda function
    - Create Lambda function to manage state transitions and trigger Step Functions
    - Implement SLA timer management and escalation logic
    - Add comprehensive audit logging for all state transitions
    - _Requirements: 3.7, 3.8_

  - [ ]* 6.3 Write property test for workflow state machine correctness
    - **Property 5: Workflow State Machine Correctness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

- [ ] 7. AI Agent Core Implementation
  - [ ] 7.1 Create Denial Classifier Agent Lambda
    - Implement Lambda function using Amazon Bedrock Claude model
    - Create denial text analysis and categorization logic (NO calculations)
    - Store classification results in Aurora and execution logs in DynamoDB
    - Include reasoning explanations and confidence scores only
    - _Requirements: 4.1, 4.5_

  - [ ] 7.2 Create Financial Calculation Service Lambda
    - Implement deterministic financial calculation algorithms
    - Create recovery estimation based on AI classifications
    - Implement room rent adjustments and policy limit calculations
    - Store all calculation results with validation status in Aurora
    - _Requirements: Numerical Computation Rules_

  - [ ] 7.3 Create Document Extractor Agent Lambda
    - Implement Lambda function integrating Amazon Textract and Bedrock
    - Create logic to identify missing documents and extract key fields (NO calculations)
    - Store extraction results in Aurora and execution logs in DynamoDB
    - Maintain context from previous agent analysis
    - _Requirements: 4.2, 4.6_

  - [ ] 7.4 Create Appeal Generator Agent Lambda
    - Implement Lambda function using Bedrock for appeal letter generation (NO calculations)
    - Create templates and logic for formal Indian business communication
    - Store appeal drafts in S3 and metadata in Aurora
    - Include medical and financial justification logic (qualitative only)
    - _Requirements: 4.3_

  - [ ] 7.5 Create Recovery Strategist Agent Lambda
    - Implement Lambda function for claim prioritization and strategy optimization (NO calculations)
    - Create qualitative assessment logic for recovery probability categories
    - Store strategy recommendations in Aurora and execution logs in DynamoDB
    - Implement next action suggestion algorithms (qualitative only)
    - _Requirements: 4.4_

  - [ ] 7.6 Integrate Financial Calculation Service with AI Workflow
    - Create Step Functions integration between AI agents and financial calculations
    - Implement validation rules to ensure AI agents never perform arithmetic
    - Add financial calculation triggers based on AI agent outputs
    - Create audit trail for AI reasoning vs financial calculations separation
    - _Requirements: Numerical Computation Rules_

  - [ ]* 7.7 Write property test for AI agent processing chain
    - **Property 6: AI Agent Processing Chain (No Calculations)**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, Numerical Computation Rules**

  - [ ]* 7.8 Write property test for financial calculation service accuracy
    - **Property 16: Financial Calculation Service Accuracy**
    - **Validates: Numerical Computation Rules**

  - [ ]* 7.9 Write property test for AI-Financial separation compliance
    - **Property 17: AI-Financial Separation Compliance**
    - **Validates: Numerical Computation Rules**

  - [ ]* 7.10 Write property test for AI error handling and escalation
    - **Property 7: AI Error Handling and Escalation**
    - **Validates: Requirements 4.7**

- [ ] 8. Human Review Interface Backend
  - [ ] 8.1 Create human review API Lambda functions
    - Implement Lambda functions for retrieving claims in HUMAN_REVIEW state
    - Create APIs for displaying AI analysis, reasoning, and proposed actions
    - Add endpoints for editing appeal content and recording approvals/rejections
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 8.2 Implement financial action authorization controls
    - Create middleware to prevent financial actions without explicit human approval
    - Implement approval workflow with detailed authorization records
    - Add claim priority display based on financial impact and deadlines
    - Create complete audit trail display for all claim actions
    - _Requirements: 5.5, 5.6, 5.7_

  - [ ]* 8.3 Write property test for human review interface completeness
    - **Property 8: Human Review Interface Completeness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.7**

  - [ ]* 8.4 Write property test for financial action authorization
    - **Property 9: Financial Action Authorization**
    - **Validates: Requirements 5.5**

- [ ] 9. Analytics and ROI Dashboard Backend
  - [ ] 9.1 Create Financial Analytics Calculation Service
    - Implement deterministic algorithms for calculating denied amounts, recovered amounts, and recovery percentages
    - Create time savings calculation logic for automated processing
    - Add AI vs human success rate comparison algorithms (qualitative assessment by AI, calculations by code)
    - Store calculated metrics in ElastiCache for performance
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, Numerical Computation Rules_

  - [ ] 9.2 Implement reporting and export functionality
    - Create Lambda functions for generating filtered reports by date ranges and categories
    - Implement PDF and Excel export functionality with calculated financial data
    - Add real-time dashboard data APIs with proper tenant filtering
    - Ensure all financial metrics are calculated by deterministic services, not AI
    - _Requirements: 7.6, 7.7, Numerical Computation Rules_

  - [ ]* 9.3 Write property test for analytics calculation accuracy
    - **Property 11: Analytics Calculation Accuracy (Deterministic)**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.6, Numerical Computation Rules**

- [ ] 10. Security and Compliance Implementation
  - [ ] 10.1 Implement encryption and secret management
    - Configure KMS encryption for all data at rest (Aurora, DynamoDB, S3)
    - Ensure TLS 1.2+ for all data in transit
    - Migrate all secrets to AWS Secrets Manager with proper IAM access
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 10.2 Add comprehensive audit logging and rate limiting
    - Implement CloudWatch logging for all API calls and data access
    - Add rate limiting to API Gateway to prevent abuse
    - Create HIPAA-compliant PHI data handling procedures
    - Configure proper IAM roles with least privilege access
    - _Requirements: 9.4, 9.5, 9.6, 9.7_

  - [ ]* 10.3 Write property test for security and encryption compliance
    - **Property 12: Security and Encryption Compliance**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

  - [ ]* 10.4 Write property test for audit logging completeness
    - **Property 13: Audit Logging Completeness**
    - **Validates: Requirements 9.5**

- [ ] 11. Performance Optimization and Monitoring
  - [ ] 11.1 Implement performance monitoring and auto-scaling
    - Configure CloudWatch metrics and alarms for all Lambda functions
    - Set up auto-scaling policies for Aurora Serverless v2 and DynamoDB
    - Implement circuit breakers for external API calls (Bedrock, Textract)
    - Add performance optimization with ElastiCache for frequently accessed data
    - _Requirements: 10.5, 10.6, 10.7_

  - [ ] 11.2 Add performance validation and load testing
    - Create performance benchmarks for file processing (30 seconds for <10MB files)
    - Implement AI analysis time validation (2 minutes per claim)
    - Add concurrent processing validation (100 claims per tenant)
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 11.3 Write property test for performance and scalability requirements
    - **Property 14: Performance and Scalability Requirements**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.5, 10.6**

  - [ ]* 11.4 Write property test for caching and performance optimization
    - **Property 15: Caching and Performance Optimization**
    - **Validates: Requirements 10.7**

- [ ] 12. Integration and End-to-End Testing
  - [ ] 12.1 Create integration test suite
    - Implement end-to-end tests for complete claim processing workflow
    - Test file upload → normalization → AI analysis → human review → appeal generation
    - Validate multi-tenant isolation across the entire system
    - Test error handling and recovery scenarios
    - _Requirements: All requirements integration_

  - [ ] 12.2 Create deployment and monitoring setup
    - Finalize Terraform deployment scripts for all environments
    - Set up CI/CD pipeline with automated testing and deployment
    - Configure comprehensive monitoring dashboards and alerting
    - Create operational runbooks and troubleshooting guides
    - _Requirements: 8.9_

- [ ] 13. Final Checkpoint - System Validation
  - Run complete test suite including all property-based tests
  - Validate system performance under load
  - Verify security controls and compliance requirements
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP deployment
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties across all inputs
- Integration tests ensure components work together correctly
- The implementation follows AWS serverless-first principles throughout
- All financial actions require explicit human approval as per business requirements
- Multi-tenant data isolation is enforced at every layer of the system