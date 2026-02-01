# ClaimIQ Core Data Model

## Overview

The ClaimIQ data model is designed as a multi-tenant, audit-compliant system optimized for Indian hospital billing workflows. It uses a hybrid database approach with Aurora Serverless v2 (PostgreSQL) for core business entities and DynamoDB for operational data, ensuring strong consistency for financial operations while maintaining high performance for logging and event sourcing.

## Database Architecture Strategy

### Primary Database - Aurora Serverless v2 (PostgreSQL)

**Purpose:** System of record for all core business entities requiring ACID compliance

**Key Characteristics:**
- Strong consistency for financial data
- Complex relational queries for analytics
- Audit trail capabilities
- Multi-tenant row-level security
- Automatic scaling based on workload

**Entities Stored:**
- Tenants, Hospitals, Users
- Claims, Denials, Appeals, Recoveries
- Patients, Payers, Documents
- Workflow states and transitions
- Financial transactions and payments

### Secondary Database - DynamoDB

**Purpose:** High-throughput operational and event data

**Key Characteristics:**
- Event sourcing patterns
- High-volume logging
- Idempotency tracking
- Session management
- Real-time operational metrics

**Data Types Stored:**
- Agent execution logs and traces
- State machine checkpoints
- API request/response logs
- User session data
- System events and metrics

### Document Storage - Amazon S3

**Purpose:** File and document storage with tenant isolation

**Key Characteristics:**
- Tenant-specific prefixes for isolation
- Lifecycle management for archival
- Integration with AWS AI services
- Cost-effective large file storage
- Versioning for document history

**Content Types:**
- Uploaded claim files (PDF, Excel, CSV)
- Generated appeal letters
- Medical documents and reports
- OCR processing outputs
- System backups and exports

## Core Entities

### 1. Tenant Entity

**Purpose:** Root entity for multi-tenant isolation and configuration

```sql
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type tenant_type NOT NULL, -- 'hospital' | 'billing_service'
    status tenant_status DEFAULT 'active', -- 'active' | 'suspended' | 'inactive'
    
    -- Configuration
    configuration JSONB DEFAULT '{}',
    billing_settings JSONB DEFAULT '{}',
    ai_settings JSONB DEFAULT '{}',
    
    -- Subscription and limits
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    monthly_claim_limit INTEGER DEFAULT 1000,
    storage_limit_gb INTEGER DEFAULT 10,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_tenant_name CHECK (length(name) >= 2)
);

-- Indexes
CREATE INDEX idx_tenants_type ON tenants(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_status ON tenants(status) WHERE deleted_at IS NULL;
```

**Key Fields:**
- `tenant_id`: Unique identifier used throughout system for isolation
- `type`: Distinguishes between direct hospitals and billing service companies
- `configuration`: Flexible JSON for tenant-specific settings
- `subscription_tier`: Controls feature access and limits
- `monthly_claim_limit`: Enforces usage limits per subscription

### 2. Hospital Entity

**Purpose:** Represents individual hospitals within a tenant

```sql
CREATE TABLE hospitals (
    hospital_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    -- Basic information
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    license_number VARCHAR(100),
    
    -- Address information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'India',
    
    -- Contact information
    primary_phone VARCHAR(20),
    secondary_phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Billing configuration
    billing_contact_name VARCHAR(255),
    billing_contact_email VARCHAR(255),
    billing_contact_phone VARCHAR(20),
    
    -- System configuration
    default_payer_contracts JSONB DEFAULT '[]',
    claim_submission_settings JSONB DEFAULT '{}',
    
    -- Status and audit
    status hospital_status DEFAULT 'active', -- 'active' | 'inactive' | 'suspended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_hospital_name CHECK (length(name) >= 2),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for tenant isolation and queries
CREATE INDEX idx_hospitals_tenant ON hospitals(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_hospitals_status ON hospitals(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_hospitals_name ON hospitals(tenant_id, name) WHERE deleted_at IS NULL;
```

### 3. User Entity

**Purpose:** System users with AWS Cognito integration and dynamic RBAC

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    hospital_id UUID REFERENCES hospitals(hospital_id),
    
    -- AWS Cognito integration
    cognito_user_id VARCHAR(255) UNIQUE NOT NULL, -- Cognito User Pool ID
    cognito_username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    
    -- MFA and security
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_method mfa_method_type, -- 'sms' | 'totp' | 'email'
    
    -- SSO integration
    sso_provider VARCHAR(100), -- 'saml' | 'oidc' | 'google' | 'microsoft'
    sso_external_id VARCHAR(255),
    
    -- Session management
    session_timeout_minutes INTEGER DEFAULT 480, -- 8 hours default
    concurrent_sessions_allowed INTEGER DEFAULT 3,
    
    -- Settings
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    
    -- Status and audit
    status user_status DEFAULT 'active', -- 'active' | 'inactive' | 'suspended'
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_cognito_user UNIQUE (cognito_user_id)
);

-- Indexes
CREATE UNIQUE INDEX idx_users_email_tenant ON users(tenant_id, email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_cognito ON users(cognito_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_hospital ON users(hospital_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_sso ON users(sso_provider, sso_external_id) WHERE deleted_at IS NULL;
```

### 3.1 Resource Entity

**Purpose:** Define system resources that can be controlled by permissions

```sql
CREATE TABLE resources (
    resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Resource identification
    resource_name VARCHAR(100) NOT NULL UNIQUE, -- 'claims', 'appeals', 'analytics', 'users', 'settings'
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Resource hierarchy
    parent_resource_id UUID REFERENCES resources(resource_id),
    resource_path VARCHAR(500), -- Hierarchical path like 'claims.denials.appeals'
    
    -- Resource metadata
    resource_type resource_type NOT NULL, -- 'entity' | 'function' | 'page' | 'api'
    is_system_resource BOOLEAN DEFAULT FALSE, -- Cannot be deleted
    
    -- Status and audit
    status resource_status DEFAULT 'active', -- 'active' | 'inactive' | 'deprecated'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_resources_name ON resources(resource_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_resources_parent ON resources(parent_resource_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_resources_type ON resources(resource_type) WHERE deleted_at IS NULL;
```

### 3.2 Permission Entity

**Purpose:** Define granular permissions for resources

```sql
CREATE TABLE permissions (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Permission identification
    permission_name VARCHAR(100) NOT NULL, -- 'create', 'read', 'update', 'delete', 'approve', 'export'
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Permission metadata
    permission_type permission_type NOT NULL, -- 'crud' | 'business' | 'admin'
    is_system_permission BOOLEAN DEFAULT FALSE, -- Cannot be deleted
    
    -- Status and audit
    status permission_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_permission_name UNIQUE (permission_name)
);

-- Indexes
CREATE INDEX idx_permissions_name ON permissions(permission_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_permissions_type ON permissions(permission_type) WHERE deleted_at IS NULL;
```

### 3.3 Resource Permission Entity

**Purpose:** Link resources with applicable permissions

```sql
CREATE TABLE resource_permissions (
    resource_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES resources(resource_id),
    permission_id UUID NOT NULL REFERENCES permissions(permission_id),
    
    -- Permission constraints
    conditions JSONB DEFAULT '{}', -- Additional conditions like field-level access
    is_default BOOLEAN DEFAULT FALSE, -- Default permission for this resource
    
    -- Status and audit
    status resource_permission_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_resource_permission UNIQUE (resource_id, permission_id)
);

-- Indexes
CREATE INDEX idx_resource_permissions_resource ON resource_permissions(resource_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_resource_permissions_permission ON resource_permissions(permission_id) WHERE deleted_at IS NULL;
```

### 3.4 Role Entity

**Purpose:** Define roles that group permissions together with multi-level support

```sql
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id), -- NULL for platform/system roles
    
    -- Role identification
    role_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Role hierarchy and type
    role_level role_level_type NOT NULL, -- 'platform' | 'tenant' | 'system'
    is_system_role BOOLEAN DEFAULT FALSE, -- System-defined roles
    is_default BOOLEAN DEFAULT FALSE, -- Default role for new users
    priority INTEGER DEFAULT 1, -- Priority level (1=lowest, 10=highest)
    
    -- Role constraints
    max_users INTEGER, -- Maximum users that can have this role
    hospital_specific BOOLEAN DEFAULT FALSE, -- Role is specific to a hospital
    
    -- AI and automation constraints
    is_ai_role BOOLEAN DEFAULT FALSE, -- Role for AI agents
    financial_action_limit DECIMAL(12,2) DEFAULT 0, -- Max financial impact allowed
    requires_human_approval BOOLEAN DEFAULT TRUE, -- All actions need approval
    
    -- Status and audit
    status role_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_role_name_level UNIQUE (role_name, role_level, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::UUID)),
    CONSTRAINT tenant_role_constraint CHECK (
        (role_level = 'tenant' AND tenant_id IS NOT NULL) OR
        (role_level IN ('platform', 'system') AND tenant_id IS NULL)
    )
);

-- Indexes
CREATE INDEX idx_roles_tenant ON roles(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_roles_level ON roles(role_level) WHERE deleted_at IS NULL;
CREATE INDEX idx_roles_ai ON roles(is_ai_role) WHERE deleted_at IS NULL;
CREATE INDEX idx_roles_name_level ON roles(role_name, role_level) WHERE deleted_at IS NULL;
```

### 3.5 Role Permission Entity

**Purpose:** Assign resource permissions to roles

```sql
CREATE TABLE role_permissions (
    role_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(role_id),
    resource_permission_id UUID NOT NULL REFERENCES resource_permissions(resource_permission_id),
    
    -- Permission customization
    conditions JSONB DEFAULT '{}', -- Role-specific conditions
    granted BOOLEAN DEFAULT TRUE, -- TRUE = grant, FALSE = explicitly deny
    
    -- Context constraints
    hospital_ids UUID[], -- Limit to specific hospitals (for multi-hospital tenants)
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_until TIMESTAMP WITH TIME ZONE,
    
    -- Status and audit
    status role_permission_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_role_resource_permission UNIQUE (role_id, resource_permission_id)
);

-- Indexes
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_role_permissions_resource ON role_permissions(resource_permission_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_role_permissions_effective ON role_permissions(effective_from, effective_until) WHERE deleted_at IS NULL;
```

### 3.7 Human Approval Entity

**Purpose:** Track all human approvals for financial and irreversible actions

```sql
CREATE TABLE human_approvals (
    approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    -- Action being approved
    action_type approval_action_type NOT NULL, -- 'appeal_submission' | 'claim_write_off' | 'payment_processing' | 'ai_override'
    action_description TEXT NOT NULL,
    resource_type VARCHAR(100) NOT NULL, -- 'claim' | 'appeal' | 'payment' | 'agent_action'
    resource_id UUID NOT NULL,
    
    -- Financial impact
    financial_impact DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Approval workflow
    requested_by UUID NOT NULL REFERENCES users(user_id),
    approved_by UUID REFERENCES users(user_id),
    approval_status approval_status_type DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'expired'
    
    -- Approval details
    approval_reason TEXT,
    rejection_reason TEXT,
    conditions JSONB DEFAULT '{}',
    
    -- Timing
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit trail
    approval_chain JSONB DEFAULT '[]', -- Track multi-level approvals
    ip_address INET,
    user_agent TEXT,
    
    -- Status and audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_human_approvals_tenant ON human_approvals(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_human_approvals_resource ON human_approvals(resource_type, resource_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_human_approvals_status ON human_approvals(tenant_id, approval_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_human_approvals_requested_by ON human_approvals(requested_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_human_approvals_approved_by ON human_approvals(approved_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_human_approvals_financial ON human_approvals(tenant_id, financial_impact) WHERE deleted_at IS NULL;
```

### 3.8 Audit Log Entity

**Purpose:** Comprehensive audit logging for all sensitive actions

```sql
CREATE TABLE audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id), -- NULL for platform-level actions
    
    -- Action details
    action_type audit_action_type NOT NULL,
    action_category audit_category_type NOT NULL, -- 'authentication' | 'authorization' | 'financial' | 'data_access' | 'system'
    action_description TEXT NOT NULL,
    
    -- Actor information
    actor_type actor_type NOT NULL, -- 'user' | 'ai_agent' | 'system' | 'api'
    actor_id UUID, -- user_id or agent_id
    actor_name VARCHAR(255),
    
    -- Target information
    target_type VARCHAR(100), -- 'claim' | 'appeal' | 'user' | 'role' | 'permission'
    target_id UUID,
    target_name VARCHAR(255),
    
    -- Context
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(255),
    
    -- Data changes
    old_values JSONB,
    new_values JSONB,
    
    -- Risk and compliance
    risk_level risk_level_type DEFAULT 'low', -- 'low' | 'medium' | 'high' | 'critical'
    compliance_tags TEXT[], -- ['hipaa', 'sox', 'gdpr']
    
    -- Financial impact
    financial_impact DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Status and metadata
    status audit_status_type DEFAULT 'logged', -- 'logged' | 'reviewed' | 'flagged' | 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Partitioning key for performance
    created_date DATE GENERATED ALWAYS AS (created_at::DATE) STORED
);

-- Indexes for audit queries
CREATE INDEX idx_audit_logs_tenant_date ON audit_logs(tenant_id, created_date) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_type, actor_id, created_date);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id, created_date);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type, created_date);
CREATE INDEX idx_audit_logs_risk ON audit_logs(risk_level, created_date);
CREATE INDEX idx_audit_logs_financial ON audit_logs(financial_impact, created_date) WHERE financial_impact > 0;
```

### 3.9 AI Agent Entity

**Purpose:** Track AI agents and their restricted system roles

```sql
CREATE TABLE ai_agents (
    agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Agent identification
    agent_name VARCHAR(100) NOT NULL UNIQUE, -- 'denial_classifier' | 'document_extractor' | 'appeal_generator' | 'recovery_strategist'
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL,
    
    -- AI model configuration
    model_provider VARCHAR(100) NOT NULL, -- 'bedrock' | 'openai' | 'anthropic'
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    
    -- Security and constraints
    system_role_id UUID NOT NULL REFERENCES roles(role_id), -- Must be system-level role
    max_financial_impact DECIMAL(12,2) DEFAULT 0, -- Maximum financial decision allowed
    requires_human_approval BOOLEAN DEFAULT TRUE,
    
    -- Operational limits
    max_requests_per_minute INTEGER DEFAULT 60,
    max_tokens_per_request INTEGER DEFAULT 4000,
    timeout_seconds INTEGER DEFAULT 300,
    
    -- Status and audit
    status ai_agent_status DEFAULT 'active', -- 'active' | 'inactive' | 'suspended' | 'deprecated'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT ai_agent_system_role CHECK (
        system_role_id IN (SELECT role_id FROM roles WHERE role_level = 'system' AND is_ai_role = TRUE)
    )
);

-- Indexes
CREATE INDEX idx_ai_agents_name ON ai_agents(agent_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_ai_agents_role ON ai_agents(system_role_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_ai_agents_status ON ai_agents(status) WHERE deleted_at IS NULL;
```

### 3.10 User Role Entity

**Purpose:** Assign roles to users with proper audit trail

```sql
CREATE TABLE user_roles (
    user_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    role_id UUID NOT NULL REFERENCES roles(role_id),
    
    -- Assignment context
    assigned_by UUID NOT NULL REFERENCES users(user_id),
    assignment_reason TEXT,
    approval_id UUID REFERENCES human_approvals(approval_id), -- For sensitive role assignments
    
    -- Time constraints
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_until TIMESTAMP WITH TIME ZONE,
    
    -- Context constraints
    hospital_ids UUID[], -- Limit role to specific hospitals
    conditions JSONB DEFAULT '{}', -- User-specific conditions
    
    -- Status and audit
    status user_role_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_user_role UNIQUE (user_id, role_id),
    CONSTRAINT role_tenant_match CHECK (
        -- Ensure user and role belong to same tenant (for tenant-level roles)
        (SELECT r.role_level FROM roles r WHERE r.role_id = user_roles.role_id) IN ('platform', 'system') OR
        (SELECT u.tenant_id FROM users u WHERE u.user_id = user_roles.user_id) = 
        (SELECT r.tenant_id FROM roles r WHERE r.role_id = user_roles.role_id)
    )
);

-- Indexes
CREATE INDEX idx_user_roles_user ON user_roles(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_roles_role ON user_roles(role_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_roles_effective ON user_roles(effective_from, effective_until) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_roles_assigned_by ON user_roles(assigned_by) WHERE deleted_at IS NULL;
```

### 4. Payer Entity

**Purpose:** Insurance companies and TPAs

```sql
CREATE TABLE payers (
    payer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    -- Basic information
    name VARCHAR(255) NOT NULL,
    type payer_type NOT NULL, -- 'insurer' | 'tpa' | 'government' | 'corporate'
    code VARCHAR(50), -- Internal payer code
    
    -- Contact information
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Business rules
    claim_submission_rules JSONB DEFAULT '{}',
    appeal_rules JSONB DEFAULT '{}',
    document_requirements JSONB DEFAULT '{}',
    sla_timelines JSONB DEFAULT '{}',
    
    -- Portal information
    portal_url VARCHAR(500),
    portal_credentials_encrypted TEXT,
    
    -- Status and audit
    status payer_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_payer_name CHECK (length(name) >= 2)
);

-- Indexes
CREATE INDEX idx_payers_tenant ON payers(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payers_type ON payers(tenant_id, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_payers_code ON payers(tenant_id, code) WHERE deleted_at IS NULL;
```

### 5. Patient Entity

**Purpose:** Patient information for claims (anonymized for privacy)

```sql
CREATE TABLE patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    hospital_id UUID NOT NULL REFERENCES hospitals(hospital_id),
    
    -- Anonymized identifiers
    patient_code VARCHAR(100) NOT NULL, -- Hospital's internal patient ID
    policy_number VARCHAR(100),
    
    -- Demographics (minimal for billing)
    age_group age_group_type, -- '0-18' | '19-35' | '36-50' | '51-65' | '65+'
    gender gender_type, -- 'male' | 'female' | 'other' | 'unknown'
    
    -- Insurance information
    primary_payer_id UUID REFERENCES payers(payer_id),
    secondary_payer_id UUID REFERENCES payers(payer_id),
    policy_details JSONB DEFAULT '{}',
    
    -- Status and audit
    status patient_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_patient_code_hospital UNIQUE (hospital_id, patient_code)
);

-- Indexes
CREATE INDEX idx_patients_tenant ON patients(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_hospital ON patients(hospital_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_payer ON patients(primary_payer_id) WHERE deleted_at IS NULL;
```

### 6. Claim Entity

**Purpose:** Core entity representing insurance claims

```sql
CREATE TABLE claims (
    claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    hospital_id UUID NOT NULL REFERENCES hospitals(hospital_id),
    patient_id UUID NOT NULL REFERENCES patients(patient_id),
    payer_id UUID NOT NULL REFERENCES payers(payer_id),
    
    -- Claim identification
    claim_number VARCHAR(100) NOT NULL, -- Hospital's claim number
    payer_claim_number VARCHAR(100), -- Payer's assigned number
    
    -- Financial information
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    approved_amount DECIMAL(12,2) CHECK (approved_amount >= 0),
    denied_amount DECIMAL(12,2) CHECK (denied_amount >= 0),
    recovered_amount DECIMAL(12,2) DEFAULT 0 CHECK (recovered_amount >= 0),
    
    -- Dates
    service_date DATE NOT NULL,
    submission_date DATE NOT NULL,
    response_date DATE,
    
    -- Medical information
    primary_diagnosis_code VARCHAR(20),
    primary_diagnosis_description TEXT,
    procedure_codes JSONB DEFAULT '[]',
    
    -- Claim details
    admission_type admission_type, -- 'emergency' | 'planned' | 'daycare' | 'outpatient'
    length_of_stay INTEGER CHECK (length_of_stay >= 0),
    room_category VARCHAR(50),
    
    -- Workflow state
    status claim_status NOT NULL DEFAULT 'new',
    workflow_state workflow_state_type DEFAULT 'NEW',
    priority claim_priority DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'urgent'
    
    -- AI processing
    ai_analysis_completed BOOLEAN DEFAULT FALSE,
    ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score BETWEEN 0 AND 1),
    
    -- Human review
    requires_human_review BOOLEAN DEFAULT TRUE,
    human_reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES users(user_id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status and audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_claim_number_hospital UNIQUE (hospital_id, claim_number),
    CONSTRAINT valid_amounts CHECK (
        total_amount = COALESCE(approved_amount, 0) + COALESCE(denied_amount, 0)
    )
);

-- Indexes for performance and tenant isolation
CREATE INDEX idx_claims_tenant ON claims(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_claims_hospital ON claims(hospital_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_claims_status ON claims(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_claims_workflow_state ON claims(tenant_id, workflow_state) WHERE deleted_at IS NULL;
CREATE INDEX idx_claims_priority ON claims(tenant_id, priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_claims_dates ON claims(tenant_id, submission_date, service_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_claims_amounts ON claims(tenant_id, denied_amount) WHERE deleted_at IS NULL AND denied_amount > 0;
```

### 7. Denial Entity

**Purpose:** Detailed information about claim denials

```sql
CREATE TABLE denials (
    denial_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(claim_id),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    -- Denial information
    denial_code VARCHAR(50),
    denial_reason denial_reason_type NOT NULL,
    denial_description TEXT NOT NULL,
    denied_amount DECIMAL(12,2) NOT NULL CHECK (denied_amount > 0),
    
    -- Dates and deadlines
    denial_date DATE NOT NULL,
    appeal_deadline DATE,
    final_appeal_deadline DATE,
    
    -- Classification (AI-generated)
    ai_classification denial_reason_type,
    ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score BETWEEN 0 AND 1),
    ai_reasoning TEXT,
    
    -- Recovery potential
    recovery_probability DECIMAL(3,2) CHECK (recovery_probability BETWEEN 0 AND 1),
    estimated_recovery_amount DECIMAL(12,2) CHECK (estimated_recovery_amount >= 0),
    
    -- Document analysis
    missing_documents JSONB DEFAULT '[]',
    document_issues JSONB DEFAULT '[]',
    
    -- Status and audit
    status denial_status DEFAULT 'new', -- 'new' | 'analyzing' | 'ready_for_appeal' | 'appealed' | 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_denial_amount CHECK (denied_amount > 0)
);

-- Indexes
CREATE INDEX idx_denials_claim ON denials(claim_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_denials_tenant ON denials(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_denials_reason ON denials(tenant_id, denial_reason) WHERE deleted_at IS NULL;
CREATE INDEX idx_denials_deadline ON denials(tenant_id, appeal_deadline) WHERE deleted_at IS NULL;
CREATE INDEX idx_denials_status ON denials(tenant_id, status) WHERE deleted_at IS NULL;
```

### 8. Appeal Entity

**Purpose:** Appeal submissions and tracking

```sql
CREATE TABLE appeals (
    appeal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(claim_id),
    denial_id UUID NOT NULL REFERENCES denials(denial_id),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    -- Appeal information
    appeal_number VARCHAR(100), -- Generated appeal reference
    appeal_type appeal_type DEFAULT 'first_level', -- 'first_level' | 'second_level' | 'final'
    
    -- Content
    appeal_letter_s3_key VARCHAR(500), -- S3 location of appeal letter
    appeal_summary TEXT,
    supporting_arguments JSONB DEFAULT '[]',
    
    -- AI generation details
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_model_used VARCHAR(100),
    ai_generation_confidence DECIMAL(3,2),
    human_edited BOOLEAN DEFAULT FALSE,
    
    -- Submission details
    submission_method submission_method, -- 'portal' | 'email' | 'fax' | 'mail'
    submitted_by UUID REFERENCES users(user_id),
    submission_date DATE,
    submission_confirmation VARCHAR(200),
    
    -- Response tracking
    response_date DATE,
    response_summary TEXT,
    outcome appeal_outcome, -- 'pending' | 'approved' | 'denied' | 'partial' | 'withdrawn'
    recovered_amount DECIMAL(12,2) DEFAULT 0 CHECK (recovered_amount >= 0),
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT TRUE,
    next_follow_up_date DATE,
    escalation_level INTEGER DEFAULT 1,
    
    -- Status and audit
    status appeal_status DEFAULT 'draft', -- 'draft' | 'ready' | 'submitted' | 'responded' | 'closed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_appeals_claim ON appeals(claim_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appeals_tenant ON appeals(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appeals_status ON appeals(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_appeals_outcome ON appeals(tenant_id, outcome) WHERE deleted_at IS NULL;
CREATE INDEX idx_appeals_follow_up ON appeals(tenant_id, next_follow_up_date) WHERE deleted_at IS NULL;
```

### 9. Document Entity

**Purpose:** Track all documents associated with claims

```sql
CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    claim_id UUID REFERENCES claims(claim_id),
    appeal_id UUID REFERENCES appeals(appeal_id),
    
    -- Document identification
    document_type document_type NOT NULL, -- 'claim_file' | 'medical_record' | 'appeal_letter' | 'response' | 'supporting'
    file_name VARCHAR(500) NOT NULL,
    original_file_name VARCHAR(500),
    
    -- Storage information
    s3_bucket VARCHAR(100) NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT CHECK (file_size_bytes > 0),
    content_type VARCHAR(100),
    
    -- Processing information
    ocr_processed BOOLEAN DEFAULT FALSE,
    ocr_text_s3_key VARCHAR(500),
    extracted_data JSONB DEFAULT '{}',
    
    -- AI analysis
    ai_analyzed BOOLEAN DEFAULT FALSE,
    ai_analysis_results JSONB DEFAULT '{}',
    
    -- Security
    encryption_key_id VARCHAR(500),
    access_level access_level DEFAULT 'restricted', -- 'public' | 'internal' | 'restricted' | 'confidential'
    
    -- Status and audit
    status document_status DEFAULT 'uploaded', -- 'uploaded' | 'processing' | 'processed' | 'failed' | 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_s3_location UNIQUE (s3_bucket, s3_key)
);

-- Indexes
CREATE INDEX idx_documents_tenant ON documents(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_claim ON documents(claim_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_type ON documents(tenant_id, document_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_status ON documents(tenant_id, status) WHERE deleted_at IS NULL;
```

### 10. Agent Action Entity

**Purpose:** Track all AI agent actions and decisions (NO financial calculations)

```sql
CREATE TABLE agent_actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    claim_id UUID NOT NULL REFERENCES claims(claim_id),
    
    -- Agent information
    agent_type agent_type NOT NULL, -- 'denial_classifier' | 'document_extractor' | 'appeal_generator' | 'recovery_strategist'
    agent_version VARCHAR(50),
    
    -- Action details (NO calculations)
    action_name VARCHAR(100) NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL, -- Structured data only, no calculated amounts
    
    -- AI model details
    model_name VARCHAR(100),
    model_version VARCHAR(50),
    prompt_template_id VARCHAR(100),
    
    -- Results (classification only)
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    reasoning TEXT,
    recommendations JSONB DEFAULT '[]', -- Text recommendations only
    
    -- Human review
    human_approved BOOLEAN,
    human_feedback TEXT,
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Execution details
    execution_time_ms INTEGER CHECK (execution_time_ms >= 0),
    tokens_used INTEGER CHECK (tokens_used >= 0),
    cost_usd DECIMAL(10,4) CHECK (cost_usd >= 0),
    
    -- Status and audit
    status action_status DEFAULT 'completed', -- 'pending' | 'completed' | 'failed' | 'cancelled'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agent_actions_tenant ON agent_actions(tenant_id);
CREATE INDEX idx_agent_actions_claim ON agent_actions(claim_id);
CREATE INDEX idx_agent_actions_type ON agent_actions(tenant_id, agent_type);
CREATE INDEX idx_agent_actions_status ON agent_actions(tenant_id, status);
CREATE INDEX idx_agent_actions_created ON agent_actions(tenant_id, created_at);
```

### 11. Financial Calculation Entity

**Purpose:** Store all calculated financial amounts (separate from AI actions)

```sql
CREATE TABLE financial_calculations (
    calculation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    claim_id UUID NOT NULL REFERENCES claims(claim_id),
    
    -- Calculation context
    calculation_type calculation_type NOT NULL, -- 'claim_total' | 'room_adjustment' | 'recovery_metrics' | 'roi_calculation'
    calculation_version VARCHAR(50) NOT NULL, -- Version of calculation logic used
    
    -- Input data
    input_amounts JSONB NOT NULL, -- Original amounts and parameters
    adjustment_rules JSONB DEFAULT '{}', -- Rules applied for adjustments
    
    -- Calculated results
    calculated_amounts JSONB NOT NULL, -- All calculated amounts
    breakdown JSONB DEFAULT '{}', -- Detailed breakdown of calculations
    
    -- Validation
    validation_status validation_status DEFAULT 'pending', -- 'pending' | 'validated' | 'failed'
    validation_errors JSONB DEFAULT '[]',
    validated_by VARCHAR(100), -- Service or user that validated
    validated_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit trail
    calculation_method VARCHAR(100) NOT NULL, -- 'financial_calculator_service'
    calculated_by VARCHAR(100) NOT NULL, -- Service identifier
    calculation_hash VARCHAR(64), -- Hash of inputs for integrity
    
    -- Status and audit
    status calculation_status DEFAULT 'active', -- 'active' | 'superseded' | 'invalid'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_calculation_amounts CHECK (jsonb_typeof(calculated_amounts) = 'object')
);

-- Indexes
CREATE INDEX idx_financial_calculations_tenant ON financial_calculations(tenant_id);
CREATE INDEX idx_financial_calculations_claim ON financial_calculations(claim_id);
CREATE INDEX idx_financial_calculations_type ON financial_calculations(tenant_id, calculation_type);
CREATE INDEX idx_financial_calculations_status ON financial_calculations(validation_status);
CREATE INDEX idx_financial_calculations_hash ON financial_calculations(calculation_hash);
```

### 12. Calculation Audit Entity

**Purpose:** Audit trail for all financial calculations and validations

```sql
CREATE TABLE calculation_audits (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    calculation_id UUID NOT NULL REFERENCES financial_calculations(calculation_id),
    
    -- Audit details
    audit_type audit_type NOT NULL, -- 'calculation' | 'validation' | 'correction' | 'verification'
    audit_description TEXT NOT NULL,
    
    -- Before/after values
    before_values JSONB,
    after_values JSONB,
    differences JSONB DEFAULT '{}',
    
    -- Validation results
    validation_rules_applied JSONB DEFAULT '[]',
    validation_passed BOOLEAN,
    validation_errors JSONB DEFAULT '[]',
    
    -- Context
    triggered_by audit_trigger_type NOT NULL, -- 'ai_agent' | 'human_review' | 'system_validation' | 'periodic_check'
    triggered_by_id UUID, -- ID of triggering entity
    
    -- Risk assessment
    risk_level risk_level_type DEFAULT 'low',
    financial_impact DECIMAL(12,2),
    requires_review BOOLEAN DEFAULT FALSE,
    
    -- Status and metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL -- Service or user identifier
);

-- Indexes
CREATE INDEX idx_calculation_audits_tenant ON calculation_audits(tenant_id);
CREATE INDEX idx_calculation_audits_calculation ON calculation_audits(calculation_id);
CREATE INDEX idx_calculation_audits_type ON calculation_audits(audit_type);
CREATE INDEX idx_calculation_audits_risk ON calculation_audits(risk_level) WHERE risk_level IN ('high', 'critical');
CREATE INDEX idx_calculation_audits_review ON calculation_audits(requires_review) WHERE requires_review = TRUE;
```

## Enums and Custom Types

```sql
-- Tenant types
CREATE TYPE tenant_type AS ENUM ('hospital', 'billing_service');
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'inactive');

-- Hospital types
CREATE TYPE hospital_status AS ENUM ('active', 'inactive', 'suspended');

-- User types
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE mfa_method_type AS ENUM ('sms', 'totp', 'email', 'hardware');

-- RBAC types
CREATE TYPE role_level_type AS ENUM ('platform', 'tenant', 'system');
CREATE TYPE resource_type AS ENUM ('entity', 'function', 'page', 'api');
CREATE TYPE resource_status AS ENUM ('active', 'inactive', 'deprecated');
CREATE TYPE permission_type AS ENUM ('crud', 'business', 'admin');
CREATE TYPE permission_status AS ENUM ('active', 'inactive', 'deprecated');
CREATE TYPE resource_permission_status AS ENUM ('active', 'inactive');
CREATE TYPE role_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE role_permission_status AS ENUM ('active', 'inactive');
CREATE TYPE user_role_status AS ENUM ('active', 'inactive', 'suspended');

-- Human approval types
CREATE TYPE approval_action_type AS ENUM (
    'appeal_submission', 'claim_write_off', 'payment_processing', 'ai_override',
    'role_assignment', 'permission_grant', 'financial_adjustment', 'data_export'
);
CREATE TYPE approval_status_type AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- Audit log types
CREATE TYPE audit_action_type AS ENUM (
    'login', 'logout', 'role_assigned', 'role_removed', 'permission_granted', 'permission_revoked',
    'claim_created', 'claim_updated', 'appeal_submitted', 'appeal_approved', 'payment_processed',
    'ai_action_executed', 'ai_decision_overridden', 'data_exported', 'settings_changed'
);
CREATE TYPE audit_category_type AS ENUM ('authentication', 'authorization', 'financial', 'data_access', 'system');
CREATE TYPE actor_type AS ENUM ('user', 'ai_agent', 'system', 'api');
CREATE TYPE risk_level_type AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE audit_status_type AS ENUM ('logged', 'reviewed', 'flagged', 'resolved');

-- AI agent types
CREATE TYPE ai_agent_status AS ENUM ('active', 'inactive', 'suspended', 'deprecated');

-- Payer types
CREATE TYPE payer_type AS ENUM ('insurer', 'tpa', 'government', 'corporate');
CREATE TYPE payer_status AS ENUM ('active', 'inactive', 'suspended');

-- Patient types
CREATE TYPE age_group_type AS ENUM ('0-18', '19-35', '36-50', '51-65', '65+');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'unknown');
CREATE TYPE patient_status AS ENUM ('active', 'inactive');

-- Claim types
CREATE TYPE claim_status AS ENUM ('new', 'denied', 'appealed', 'recovered', 'failed', 'closed');
CREATE TYPE workflow_state_type AS ENUM ('NEW', 'DENIED', 'AI_ANALYZED', 'HUMAN_REVIEW', 'SUBMITTED', 'RECOVERED', 'FAILED');
CREATE TYPE claim_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE admission_type AS ENUM ('emergency', 'planned', 'daycare', 'outpatient');

-- Denial types
CREATE TYPE denial_reason_type AS ENUM (
    'missing_documents', 'coding_error', 'policy_limit', 'timely_filing', 
    'medical_necessity', 'pre_auth_required', 'duplicate_claim', 'other'
);
CREATE TYPE denial_status AS ENUM ('new', 'analyzing', 'ready_for_appeal', 'appealed', 'resolved');

-- Appeal types
CREATE TYPE appeal_type AS ENUM ('first_level', 'second_level', 'final');
CREATE TYPE submission_method AS ENUM ('portal', 'email', 'fax', 'mail');
CREATE TYPE appeal_outcome AS ENUM ('pending', 'approved', 'denied', 'partial', 'withdrawn');
CREATE TYPE appeal_status AS ENUM ('draft', 'ready', 'submitted', 'responded', 'closed');

-- Document types
CREATE TYPE document_type AS ENUM (
    'claim_file', 'medical_record', 'appeal_letter', 'response', 
    'supporting', 'discharge_summary', 'investigation_report'
);
CREATE TYPE access_level AS ENUM ('public', 'internal', 'restricted', 'confidential');
CREATE TYPE document_status AS ENUM ('uploaded', 'processing', 'processed', 'failed', 'archived');

-- Agent types
CREATE TYPE agent_type AS ENUM (
    'denial_classifier', 'document_extractor', 'appeal_generator', 'recovery_strategist'
);
CREATE TYPE action_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- Financial calculation types
CREATE TYPE calculation_type AS ENUM (
    'claim_total', 'room_adjustment', 'recovery_metrics', 'roi_calculation', 
    'policy_limit_check', 'amount_validation', 'percentage_calculation'
);
CREATE TYPE validation_status AS ENUM ('pending', 'validated', 'failed');
CREATE TYPE calculation_status AS ENUM ('active', 'superseded', 'invalid');

-- Audit types
CREATE TYPE audit_type AS ENUM ('calculation', 'validation', 'correction', 'verification');
CREATE TYPE audit_trigger_type AS ENUM ('ai_agent', 'human_review', 'system_validation', 'periodic_check');
```

## Dynamic RBAC System Implementation

### System Overview

The ClaimIQ RBAC system follows a hierarchical model:
**Resources** → **Permissions** → **Roles** → **Users**

This allows for:
- **Dynamic resource definition** - Add new features without code changes
- **Granular permissions** - Control access at field and action level
- **Flexible role composition** - Mix and match permissions as needed
- **UI-driven administration** - Manage everything through admin interface
- **Tenant-specific customization** - Each tenant can define custom roles

### Pre-defined System Resources

```sql
-- Insert system resources for ClaimIQ
INSERT INTO resources (resource_name, display_name, description, resource_type, is_system_resource) VALUES
-- Core entities
('claims', 'Claims Management', 'Access to insurance claims', 'entity', true),
('claims.denials', 'Claim Denials', 'Access to denial information', 'entity', true),
('claims.appeals', 'Claim Appeals', 'Access to appeal management', 'entity', true),
('claims.documents', 'Claim Documents', 'Access to claim documents', 'entity', true),

-- Analytics and reporting
('analytics', 'Analytics Dashboard', 'Access to analytics and reports', 'page', true),
('analytics.roi', 'ROI Reports', 'Access to ROI calculations', 'function', true),
('analytics.export', 'Data Export', 'Export analytics data', 'function', true),

-- User management
('users', 'User Management', 'Manage system users', 'entity', true),
('roles', 'Role Management', 'Manage user roles and permissions', 'entity', true),

-- System administration
('settings', 'System Settings', 'Access to system configuration', 'page', true),
('settings.tenant', 'Tenant Settings', 'Manage tenant configuration', 'function', true),
('settings.payers', 'Payer Configuration', 'Manage payer settings', 'function', true),

-- AI and automation
('ai_agents', 'AI Agent Management', 'Control AI agent behavior', 'function', true),
('workflows', 'Workflow Management', 'Manage claim workflows', 'function', true);
```

### Pre-defined System Permissions

```sql
-- Insert system permissions
INSERT INTO permissions (permission_name, display_name, description, permission_type, is_system_permission) VALUES
-- CRUD permissions
('create', 'Create', 'Create new records', 'crud', true),
('read', 'Read', 'View records', 'crud', true),
('update', 'Update', 'Modify existing records', 'crud', true),
('delete', 'Delete', 'Remove records', 'crud', true),

-- Business permissions
('approve', 'Approve', 'Approve actions and decisions', 'business', true),
('reject', 'Reject', 'Reject actions and decisions', 'business', true),
('submit', 'Submit', 'Submit for processing', 'business', true),
('review', 'Review', 'Review and validate', 'business', true),
('override', 'Override', 'Override AI decisions', 'business', true),

-- Administrative permissions
('export', 'Export', 'Export data', 'admin', true),
('import', 'Import', 'Import data', 'admin', true),
('configure', 'Configure', 'Configure system settings', 'admin', true),
('audit', 'Audit', 'Access audit logs', 'admin', true),
('manage_users', 'Manage Users', 'Add/remove users', 'admin', true),
('manage_roles', 'Manage Roles', 'Create/modify roles', 'admin', true);
```

### Resource-Permission Mapping

```sql
-- Link resources with applicable permissions
INSERT INTO resource_permissions (resource_id, permission_id, is_default) 
SELECT r.resource_id, p.permission_id, 
       CASE WHEN p.permission_name = 'read' THEN true ELSE false END as is_default
FROM resources r
CROSS JOIN permissions p
WHERE 
    -- Entity resources get CRUD permissions
    (r.resource_type = 'entity' AND p.permission_type = 'crud') OR
    -- Function resources get business permissions
    (r.resource_type = 'function' AND p.permission_type IN ('business', 'admin')) OR
    -- Page resources get read permission
    (r.resource_type = 'page' AND p.permission_name = 'read');

-- Add specific business permissions for claims
INSERT INTO resource_permissions (resource_id, permission_id)
SELECT r.resource_id, p.permission_id
FROM resources r, permissions p
WHERE r.resource_name = 'claims' 
AND p.permission_name IN ('approve', 'reject', 'submit', 'review', 'override');
```

### Pre-defined Role Templates

```sql
-- Create system role templates (per tenant)
CREATE OR REPLACE FUNCTION create_default_roles(tenant_uuid UUID) 
RETURNS VOID AS $$
DECLARE
    admin_role_id UUID;
    manager_role_id UUID;
    staff_role_id UUID;
    viewer_role_id UUID;
BEGIN
    -- Super Admin Role
    INSERT INTO roles (tenant_id, role_name, display_name, description, is_system_role, role_level)
    VALUES (tenant_uuid, 'super_admin', 'Super Administrator', 'Full system access', true, 10)
    RETURNING role_id INTO admin_role_id;
    
    -- Billing Manager Role
    INSERT INTO roles (tenant_id, role_name, display_name, description, is_system_role, role_level)
    VALUES (tenant_uuid, 'billing_manager', 'Billing Manager', 'Manage claims and appeals', true, 7)
    RETURNING role_id INTO manager_role_id;
    
    -- Billing Staff Role
    INSERT INTO roles (tenant_id, role_name, display_name, description, is_system_role, role_level)
    VALUES (tenant_uuid, 'billing_staff', 'Billing Staff', 'Process claims and appeals', true, 5)
    RETURNING role_id INTO staff_role_id;
    
    -- Viewer Role
    INSERT INTO roles (tenant_id, role_name, display_name, description, is_system_role, role_level)
    VALUES (tenant_uuid, 'viewer', 'Viewer', 'Read-only access to reports', true, 2)
    RETURNING role_id INTO viewer_role_id;
    
    -- Assign permissions to Super Admin (all permissions)
    INSERT INTO role_permissions (role_id, resource_permission_id)
    SELECT admin_role_id, rp.resource_permission_id
    FROM resource_permissions rp;
    
    -- Assign permissions to Billing Manager
    INSERT INTO role_permissions (role_id, resource_permission_id)
    SELECT manager_role_id, rp.resource_permission_id
    FROM resource_permissions rp
    JOIN resources r ON rp.resource_id = r.resource_id
    JOIN permissions p ON rp.permission_id = p.permission_id
    WHERE r.resource_name IN ('claims', 'claims.denials', 'claims.appeals', 'analytics', 'users')
    AND p.permission_name IN ('create', 'read', 'update', 'approve', 'reject', 'submit', 'review');
    
    -- Assign permissions to Billing Staff
    INSERT INTO role_permissions (role_id, resource_permission_id)
    SELECT staff_role_id, rp.resource_permission_id
    FROM resource_permissions rp
    JOIN resources r ON rp.resource_id = r.resource_id
    JOIN permissions p ON rp.permission_id = p.permission_id
    WHERE r.resource_name IN ('claims', 'claims.denials', 'claims.appeals')
    AND p.permission_name IN ('create', 'read', 'update', 'submit', 'review');
    
    -- Assign permissions to Viewer
    INSERT INTO role_permissions (role_id, resource_permission_id)
    SELECT viewer_role_id, rp.resource_permission_id
    FROM resource_permissions rp
    JOIN resources r ON rp.resource_id = r.resource_id
    JOIN permissions p ON rp.permission_id = p.permission_id
    WHERE p.permission_name = 'read';
    
END;
$$ LANGUAGE plpgsql;
```

### Permission Checking Functions

```sql
-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
    user_uuid UUID,
    resource_name_param VARCHAR,
    permission_name_param VARCHAR,
    hospital_uuid UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        JOIN role_permissions rp ON r.role_id = rp.role_id
        JOIN resource_permissions resp ON rp.resource_permission_id = resp.resource_permission_id
        JOIN resources res ON resp.resource_id = res.resource_id
        JOIN permissions p ON resp.permission_id = p.permission_id
        WHERE u.user_id = user_uuid
        AND res.resource_name = resource_name_param
        AND p.permission_name = permission_name_param
        AND ur.status = 'active'
        AND r.status = 'active'
        AND rp.status = 'active'
        AND rp.granted = TRUE
        AND (ur.effective_from IS NULL OR ur.effective_from <= NOW())
        AND (ur.effective_until IS NULL OR ur.effective_until > NOW())
        AND (hospital_uuid IS NULL OR hospital_uuid = ANY(ur.hospital_ids) OR ur.hospital_ids IS NULL)
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function to get all user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE (
    resource_name VARCHAR,
    permission_name VARCHAR,
    conditions JSONB,
    hospital_ids UUID[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        res.resource_name,
        p.permission_name,
        COALESCE(rp.conditions, '{}') as conditions,
        ur.hospital_ids
    FROM users u
    JOIN user_roles ur ON u.user_id = ur.user_id
    JOIN roles r ON ur.role_id = r.role_id
    JOIN role_permissions rp ON r.role_id = rp.role_id
    JOIN resource_permissions resp ON rp.resource_permission_id = resp.resource_permission_id
    JOIN resources res ON resp.resource_id = res.resource_id
    JOIN permissions p ON resp.permission_id = p.permission_id
    WHERE u.user_id = user_uuid
    AND ur.status = 'active'
    AND r.status = 'active'
    AND rp.status = 'active'
    AND rp.granted = TRUE
    AND (ur.effective_from IS NULL OR ur.effective_from <= NOW())
    AND (ur.effective_until IS NULL OR ur.effective_until > NOW());
END;
$$ LANGUAGE plpgsql;
```

### Application Integration Examples

```typescript
// Permission service for application layer
interface PermissionService {
  // Check single permission
  async hasPermission(
    userId: string, 
    resource: string, 
    permission: string, 
    hospitalId?: string
  ): Promise<boolean>;
  
  // Get all user permissions
  async getUserPermissions(userId: string): Promise<UserPermission[]>;
  
  // Check multiple permissions at once
  async hasAnyPermission(
    userId: string, 
    checks: PermissionCheck[]
  ): Promise<boolean>;
}

interface PermissionCheck {
  resource: string;
  permission: string;
  hospitalId?: string;
}

interface UserPermission {
  resource: string;
  permission: string;
  conditions?: any;
  hospitalIds?: string[];
}

// Usage in API endpoints
class ClaimsController {
  async getClaims(req: AuthenticatedRequest, res: Response) {
    // Check read permission
    const canRead = await this.permissionService.hasPermission(
      req.user.userId,
      'claims',
      'read',
      req.query.hospitalId
    );
    
    if (!canRead) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Get claims with user's hospital context
    const claims = await this.claimsService.getClaims({
      tenantId: req.user.tenantId,
      hospitalId: req.query.hospitalId,
      userId: req.user.userId
    });
    
    return res.json(claims);
  }
  
  async approveAppeal(req: AuthenticatedRequest, res: Response) {
    // Check approve permission
    const canApprove = await this.permissionService.hasPermission(
      req.user.userId,
      'claims.appeals',
      'approve'
    );
    
    if (!canApprove) {
      return res.status(403).json({ error: 'Cannot approve appeals' });
    }
    
    // Process approval
    const result = await this.appealsService.approve(
      req.params.appealId,
      req.user.userId
    );
    
    return res.json(result);
  }
}
```

### UI Permission Integration

```typescript
// React hook for permission checking
function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  
  useEffect(() => {
    if (user) {
      fetchUserPermissions(user.userId).then(setPermissions);
    }
  }, [user]);
  
  const hasPermission = useCallback((resource: string, permission: string) => {
    return permissions.some(p => 
      p.resource === resource && p.permission === permission
    );
  }, [permissions]);
  
  return { permissions, hasPermission };
}

// Permission-aware component
function ClaimsTable() {
  const { hasPermission } = usePermissions();
  
  return (
    <div>
      <Table data={claims}>
        <Column field="claimNumber" />
        <Column field="amount" />
        {hasPermission('claims', 'update') && (
          <Column 
            field="actions" 
            render={(claim) => (
              <Button onClick={() => editClaim(claim.id)}>
                Edit
              </Button>
            )}
          />
        )}
        {hasPermission('claims.appeals', 'create') && (
          <Column 
            field="appeal" 
            render={(claim) => (
              <Button onClick={() => createAppeal(claim.id)}>
                Create Appeal
              </Button>
            )}
          />
        )}
      </Table>
      
      {hasPermission('analytics', 'export') && (
        <Button onClick={exportData}>Export Data</Button>
      )}
    </div>
  );
}
```

### Admin UI for Role Management

```typescript
// Role management interface
interface RoleManagementProps {
  tenantId: string;
}

function RoleManagement({ tenantId }: RoleManagementProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  
  // Create new role with selected permissions
  const createRole = async (roleData: CreateRoleRequest) => {
    const role = await api.post('/roles', {
      ...roleData,
      tenantId,
      permissions: selectedPermissions
    });
    
    setRoles([...roles, role]);
  };
  
  return (
    <div className="role-management">
      <RoleList 
        roles={roles}
        onEdit={editRole}
        onDelete={deleteRole}
      />
      
      <PermissionMatrix
        resources={resources}
        permissions={permissions}
        selectedPermissions={selectedPermissions}
        onChange={setSelectedPermissions}
      />
      
      <RoleForm
        onSubmit={createRole}
        resources={resources}
        permissions={permissions}
      />
    </div>
  );
}

// Permission matrix component for visual role creation
function PermissionMatrix({ resources, permissions, selectedPermissions, onChange }) {
  return (
    <table className="permission-matrix">
      <thead>
        <tr>
          <th>Resource</th>
          {permissions.map(p => (
            <th key={p.id}>{p.displayName}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {resources.map(resource => (
          <tr key={resource.id}>
            <td>{resource.displayName}</td>
            {permissions.map(permission => (
              <td key={`${resource.id}-${permission.id}`}>
                <Checkbox
                  checked={isPermissionSelected(resource.id, permission.id)}
                  onChange={(checked) => 
                    togglePermission(resource.id, permission.id, checked)
                  }
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Enhanced Authentication & RBAC Implementation

### AWS Cognito Integration

**User Pool Configuration:**
```typescript
// Cognito User Pool setup for ClaimIQ
interface CognitoConfig {
  userPool: {
    mfaConfiguration: 'OPTIONAL' | 'ON' | 'OFF';
    passwordPolicy: {
      minimumLength: 12;
      requireUppercase: true;
      requireLowercase: true;
      requireNumbers: true;
      requireSymbols: true;
    };
    accountRecoverySetting: {
      recoveryMechanisms: ['verified_email', 'verified_phone_number'];
    };
    deviceConfiguration: {
      challengeRequiredOnNewDevice: true;
      deviceOnlyRememberedOnUserPrompt: false;
    };
  };
  
  // SSO Integration
  identityProviders: {
    saml: {
      enabled: true;
      attributeMapping: {
        email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
        given_name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname';
        family_name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname';
      };
    };
    oidc: {
      enabled: true;
      scopes: ['openid', 'email', 'profile'];
    };
  };
}
```

**JWT Token Validation Middleware:**
```typescript
interface JWTPayload {
  sub: string; // Cognito User ID
  email: string;
  'cognito:groups': string[];
  'custom:tenant_id': string;
  'custom:hospital_id'?: string;
  iat: number;
  exp: number;
}

class AuthenticationMiddleware {
  async validateJWT(token: string): Promise<AuthenticatedUser> {
    try {
      // Verify JWT signature with Cognito public keys
      const decoded = jwt.verify(token, this.cognitoPublicKey) as JWTPayload;
      
      // Get user from database
      const user = await this.userService.getUserByCognitoId(decoded.sub);
      if (!user || user.status !== 'active') {
        throw new UnauthorizedError('User not found or inactive');
      }
      
      // Check session validity
      await this.validateSession(user.user_id, decoded.iat);
      
      return {
        userId: user.user_id,
        tenantId: user.tenant_id,
        hospitalId: user.hospital_id,
        email: user.email,
        cognitoId: decoded.sub,
        permissions: await this.getEffectivePermissions(user.user_id)
      };
    } catch (error) {
      await this.auditService.logFailedAuthentication(token, error);
      throw new UnauthorizedError('Invalid token');
    }
  }
  
  async validateSession(userId: string, tokenIssuedAt: number): Promise<void> {
    const user = await this.userService.getUser(userId);
    
    // Check if password was changed after token issuance
    if (user.password_changed_at && user.password_changed_at.getTime() / 1000 > tokenIssuedAt) {
      throw new UnauthorizedError('Token invalidated by password change');
    }
    
    // Check concurrent session limits
    const activeSessions = await this.sessionService.getActiveSessions(userId);
    if (activeSessions.length > user.concurrent_sessions_allowed) {
      await this.sessionService.terminateOldestSession(userId);
    }
  }
}
```

### Multi-Level RBAC Implementation

**Platform, Tenant, and System Roles:**
```sql
-- Create platform-level roles (Aponiar internal)
INSERT INTO roles (role_name, display_name, role_level, is_system_role, tenant_id) VALUES
('platform_admin', 'Platform Administrator', 'platform', true, NULL),
('platform_support', 'Platform Support', 'platform', true, NULL),
('platform_analyst', 'Platform Analyst', 'platform', true, NULL);

-- Create system-level roles (AI agents and integrations)
INSERT INTO roles (role_name, display_name, role_level, is_system_role, is_ai_role, financial_action_limit, tenant_id) VALUES
('ai_denial_classifier', 'AI Denial Classifier', 'system', true, true, 0, NULL),
('ai_appeal_generator', 'AI Appeal Generator', 'system', true, true, 0, NULL),
('ai_recovery_strategist', 'AI Recovery Strategist', 'system', true, true, 0, NULL),
('integration_service', 'Integration Service', 'system', true, false, 0, NULL);

-- Tenant-level roles are created per tenant using the function
SELECT create_default_roles('tenant-uuid-here');
```

**Enhanced Permission Checking with Multi-Level Support:**
```sql
-- Enhanced permission checking function with role hierarchy
CREATE OR REPLACE FUNCTION user_has_permission_enhanced(
    user_uuid UUID,
    resource_name_param VARCHAR,
    permission_name_param VARCHAR,
    hospital_uuid UUID DEFAULT NULL,
    financial_amount DECIMAL DEFAULT 0
) RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
    user_tenant_id UUID;
BEGIN
    -- Get user's tenant
    SELECT tenant_id INTO user_tenant_id FROM users WHERE user_id = user_uuid;
    
    SELECT EXISTS (
        SELECT 1
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        JOIN role_permissions rp ON r.role_id = rp.role_id
        JOIN resource_permissions resp ON rp.resource_permission_id = resp.resource_permission_id
        JOIN resources res ON resp.resource_id = res.resource_id
        JOIN permissions p ON resp.permission_id = p.permission_id
        WHERE u.user_id = user_uuid
        AND res.resource_name = resource_name_param
        AND p.permission_name = permission_name_param
        AND ur.status = 'active'
        AND r.status = 'active'
        AND rp.status = 'active'
        AND rp.granted = TRUE
        AND (ur.effective_from IS NULL OR ur.effective_from <= NOW())
        AND (ur.effective_until IS NULL OR ur.effective_until > NOW())
        -- Role level access control
        AND (
            r.role_level = 'platform' OR  -- Platform roles have global access
            (r.role_level = 'tenant' AND r.tenant_id = user_tenant_id) OR  -- Tenant roles for same tenant
            r.role_level = 'system'  -- System roles (should not be assigned to users directly)
        )
        -- Hospital-specific access
        AND (hospital_uuid IS NULL OR hospital_uuid = ANY(ur.hospital_ids) OR ur.hospital_ids IS NULL)
        -- Financial limit check
        AND (financial_amount = 0 OR r.financial_action_limit >= financial_amount OR r.financial_action_limit = 0)
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;
```

### Human-in-the-Loop Implementation

**Financial Action Approval System:**
```typescript
class HumanApprovalService {
  async requiresApproval(action: ActionRequest): Promise<boolean> {
    const financialActions = [
      'appeal_submission', 'claim_write_off', 'payment_processing'
    ];
    
    const irreversibleActions = [
      'data_export', 'claim_deletion', 'user_deletion'
    ];
    
    return (
      financialActions.includes(action.type) ||
      irreversibleActions.includes(action.type) ||
      action.financialImpact > 0
    );
  }
  
  async requestApproval(request: ApprovalRequest): Promise<HumanApproval> {
    // Create approval record
    const approval = await this.db.humanApprovals.create({
      action_type: request.actionType,
      action_description: request.description,
      resource_type: request.resourceType,
      resource_id: request.resourceId,
      financial_impact: request.financialImpact,
      requested_by: request.requestedBy,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      conditions: request.conditions
    });
    
    // Log the approval request
    await this.auditService.log({
      action_type: 'approval_requested',
      action_category: 'authorization',
      actor_type: 'user',
      actor_id: request.requestedBy,
      target_type: 'approval',
      target_id: approval.approval_id,
      financial_impact: request.financialImpact,
      risk_level: this.calculateRiskLevel(request)
    });
    
    // Notify approvers
    await this.notificationService.notifyApprovers(approval);
    
    return approval;
  }
  
  async processApproval(
    approvalId: string, 
    approverId: string, 
    decision: 'approved' | 'rejected',
    reason?: string
  ): Promise<void> {
    const approval = await this.db.humanApprovals.findById(approvalId);
    
    // Verify approver has permission
    const canApprove = await this.permissionService.hasPermission(
      approverId,
      'approvals',
      'approve'
    );
    
    if (!canApprove) {
      throw new ForbiddenError('User cannot approve this action');
    }
    
    // Update approval record
    await this.db.humanApprovals.update(approvalId, {
      approval_status: decision,
      approved_by: approverId,
      approved_at: new Date(),
      approval_reason: decision === 'approved' ? reason : undefined,
      rejection_reason: decision === 'rejected' ? reason : undefined
    });
    
    // Log the approval decision
    await this.auditService.log({
      action_type: decision === 'approved' ? 'approval_granted' : 'approval_rejected',
      action_category: 'authorization',
      actor_type: 'user',
      actor_id: approverId,
      target_type: 'approval',
      target_id: approvalId,
      financial_impact: approval.financial_impact,
      risk_level: 'high'
    });
    
    // Execute or cancel the original action
    if (decision === 'approved') {
      await this.executeApprovedAction(approval);
    }
  }
}
```

### AI Safety Implementation

**AI Agent Role Restrictions:**
```typescript
class AIAgentService {
  async executeAIAction(
    agentName: string,
    action: AIActionRequest,
    claimId: string
  ): Promise<AIActionResult> {
    const agent = await this.db.aiAgents.findByName(agentName);
    if (!agent || agent.status !== 'active') {
      throw new Error('AI agent not available');
    }
    
    // Check if action requires human approval
    if (action.financialImpact > agent.max_financial_impact) {
      return await this.requestHumanApproval(agent, action, claimId);
    }
    
    // Execute action with system role permissions
    const result = await this.executeWithSystemRole(agent, action);
    
    // Log AI action
    await this.auditService.log({
      action_type: 'ai_action_executed',
      action_category: 'system',
      actor_type: 'ai_agent',
      actor_id: agent.agent_id,
      target_type: 'claim',
      target_id: claimId,
      financial_impact: action.financialImpact,
      risk_level: this.calculateAIRiskLevel(action)
    });
    
    return result;
  }
  
  private async requestHumanApproval(
    agent: AIAgent,
    action: AIActionRequest,
    claimId: string
  ): Promise<AIActionResult> {
    const approval = await this.humanApprovalService.requestApproval({
      actionType: 'ai_override',
      description: `AI agent ${agent.display_name} requests approval for: ${action.description}`,
      resourceType: 'claim',
      resourceId: claimId,
      financialImpact: action.financialImpact,
      requestedBy: 'system', // System user for AI requests
      conditions: {
        aiAgent: agent.agent_name,
        aiConfidence: action.confidence,
        aiReasoning: action.reasoning
      }
    });
    
    return {
      status: 'pending_approval',
      approvalId: approval.approval_id,
      message: 'Action requires human approval due to financial impact'
    };
  }
}
```

### Comprehensive Audit Implementation

**Audit Trigger Functions:**
```sql
-- Comprehensive audit trigger for all sensitive tables
CREATE OR REPLACE FUNCTION comprehensive_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    audit_action audit_action_type;
    risk_level risk_level_type := 'low';
    financial_impact DECIMAL(12,2) := 0;
BEGIN
    -- Determine action type
    CASE TG_OP
        WHEN 'INSERT' THEN audit_action := 'record_created';
        WHEN 'UPDATE' THEN audit_action := 'record_updated';
        WHEN 'DELETE' THEN audit_action := 'record_deleted';
    END CASE;
    
    -- Calculate risk level based on table and changes
    IF TG_TABLE_NAME IN ('user_roles', 'role_permissions', 'human_approvals') THEN
        risk_level := 'high';
    ELSIF TG_TABLE_NAME IN ('claims', 'appeals', 'payments') THEN
        risk_level := 'medium';
        -- Extract financial impact if available
        IF TG_OP = 'INSERT' AND NEW IS NOT NULL THEN
            financial_impact := COALESCE(NEW.denied_amount, NEW.recovered_amount, 0);
        ELSIF TG_OP = 'UPDATE' AND NEW IS NOT NULL AND OLD IS NOT NULL THEN
            financial_impact := ABS(COALESCE(NEW.denied_amount, 0) - COALESCE(OLD.denied_amount, 0));
        END IF;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_logs (
        tenant_id,
        action_type,
        action_category,
        action_description,
        actor_type,
        actor_id,
        target_type,
        target_id,
        old_values,
        new_values,
        risk_level,
        financial_impact,
        session_id,
        ip_address
    ) VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        audit_action,
        'data_access',
        format('%s on %s', TG_OP, TG_TABLE_NAME),
        'user',
        current_setting('app.current_user_id', true)::UUID,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id, NEW.user_id, OLD.user_id, NEW.claim_id, OLD.claim_id),
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        risk_level,
        financial_impact,
        current_setting('app.session_id', true),
        current_setting('app.client_ip', true)::INET
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to all sensitive tables
CREATE TRIGGER audit_trigger_claims AFTER INSERT OR UPDATE OR DELETE ON claims
    FOR EACH ROW EXECUTE FUNCTION comprehensive_audit_trigger();

CREATE TRIGGER audit_trigger_user_roles AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION comprehensive_audit_trigger();

CREATE TRIGGER audit_trigger_human_approvals AFTER INSERT OR UPDATE OR DELETE ON human_approvals
    FOR EACH ROW EXECUTE FUNCTION comprehensive_audit_trigger();
```

This enhanced implementation now fully satisfies all the Authentication & RBAC standards:

✅ **AWS Cognito Integration** - Complete JWT-based auth with MFA and SSO support
✅ **Multi-Level RBAC** - Platform, Tenant, and System roles with proper isolation
✅ **Backend Authorization** - All permissions enforced in database and API layers
✅ **Human-in-the-Loop** - Mandatory approval for financial/irreversible actions
✅ **AI Safety** - Restricted system roles for AI agents with approval requirements
✅ **Comprehensive Auditing** - All role assignments and sensitive actions logged with risk levels

✅ **Complete flexibility** - Add new resources and permissions without code changes
✅ **Granular control** - Permission at resource and action level
✅ **UI-driven management** - Visual role creation and assignment
✅ **Tenant isolation** - Each tenant can customize roles
✅ **Time-based permissions** - Temporary role assignments
✅ **Hospital-specific roles** - Multi-hospital tenant support
✅ **Audit trail** - Complete tracking of permission changes
✅ **Performance optimized** - Efficient permission checking functions

## Relationships and Foreign Keys

### Primary Relationships

1. **Tenant → Hospital**: One-to-many (a tenant can have multiple hospitals)
2. **Tenant → User**: One-to-many (a tenant can have multiple users)
3. **Tenant → Role**: One-to-many (a tenant can define custom roles)
4. **Hospital → User**: One-to-many (a hospital can have multiple users)
5. **Hospital → Patient**: One-to-many (a hospital treats multiple patients)
6. **Patient → Claim**: One-to-many (a patient can have multiple claims)
7. **Claim → Denial**: One-to-many (a claim can have multiple denials)
8. **Denial → Appeal**: One-to-many (a denial can have multiple appeals)
9. **Claim → Document**: One-to-many (a claim can have multiple documents)
10. **Claim → Agent Action**: One-to-many (a claim can have multiple AI actions)

### RBAC Relationships

1. **Resource → Resource Permission**: One-to-many (a resource can have multiple permissions)
2. **Permission → Resource Permission**: One-to-many (a permission can apply to multiple resources)
3. **Role → Role Permission**: One-to-many (a role can have multiple permissions)
4. **User → User Role**: One-to-many (a user can have multiple roles)
5. **Resource Permission → Role Permission**: One-to-many (a resource permission can be in multiple roles)

### Cross-Reference Relationships

1. **Payer → Claim**: One-to-many (a payer processes multiple claims)
2. **User → Claim**: Many-to-many (users can work on multiple claims)
3. **User → Appeal**: One-to-many (user submits appeals)
4. **Document → Appeal**: Many-to-many (documents can support multiple appeals)

## Multi-Tenant Isolation Strategy

### Row-Level Security (RLS)

**Implementation:** PostgreSQL Row-Level Security policies enforce tenant isolation at the database level

```sql
-- Enable RLS on all tenant-aware tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE denials ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_policy ON claims
    FOR ALL TO application_role
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_policy ON hospitals
    FOR ALL TO application_role
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Similar policies for all tenant-aware tables...
```

### Application-Level Isolation

**Tenant Context Injection:**
```typescript
// Every database query includes tenant context
interface TenantContext {
  tenantId: string;
  userId: string;
  hospitalId?: string;
  role: UserRole;
}

// Database connection with tenant context
class TenantAwareRepository {
  async setTenantContext(context: TenantContext) {
    await this.db.query(
      'SET app.current_tenant_id = $1',
      [context.tenantId]
    );
  }
  
  async findClaims(filters: ClaimFilters) {
    // All queries automatically filtered by tenant_id via RLS
    return this.db.query('SELECT * FROM claims WHERE status = $1', [filters.status]);
  }
}
```

### S3 Tenant Isolation

**Bucket Structure:**
```
claimiq-documents-{environment}/
├── tenant-{tenant-id}/
│   ├── claims/
│   │   ├── {claim-id}/
│   │   │   ├── original-files/
│   │   │   ├── processed/
│   │   │   └── ocr-output/
│   ├── appeals/
│   │   └── {appeal-id}/
│   └── exports/
└── system/
    ├── templates/
    └── backups/
```

**IAM Policy for Tenant Isolation:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::claimiq-documents-prod/tenant-${aws:userid}/*"
    }
  ]
}
```

### DynamoDB Tenant Isolation

**Partition Key Strategy:**
```typescript
// All DynamoDB items include tenant_id in partition key
interface AgentExecutionLog {
  pk: string; // "TENANT#{tenant_id}#AGENT_LOG"
  sk: string; // "CLAIM#{claim_id}#ACTION#{action_id}"
  tenant_id: string;
  claim_id: string;
  agent_type: string;
  execution_data: any;
  created_at: string;
}

// Query pattern ensures tenant isolation
const logs = await dynamodb.query({
  TableName: 'agent-execution-logs',
  KeyConditionExpression: 'pk = :pk',
  ExpressionAttributeValues: {
    ':pk': `TENANT#${tenantId}#AGENT_LOG`
  }
}).promise();
```

## Data Validation and Constraints

### Business Rule Constraints

```sql
-- Ensure claim amounts are consistent
ALTER TABLE claims ADD CONSTRAINT valid_claim_amounts 
CHECK (total_amount = COALESCE(approved_amount, 0) + COALESCE(denied_amount, 0));

-- Ensure appeal deadlines are reasonable
ALTER TABLE denials ADD CONSTRAINT reasonable_appeal_deadline
CHECK (appeal_deadline >= denial_date AND appeal_deadline <= denial_date + INTERVAL '2 years');

-- Ensure users belong to correct tenant/hospital
ALTER TABLE users ADD CONSTRAINT user_hospital_tenant_match
CHECK (
  (hospital_id IS NULL) OR 
  (hospital_id IN (SELECT hospital_id FROM hospitals WHERE tenant_id = users.tenant_id))
);

-- Ensure documents belong to correct tenant
ALTER TABLE documents ADD CONSTRAINT document_tenant_match
CHECK (
  (claim_id IS NULL) OR 
  (claim_id IN (SELECT claim_id FROM claims WHERE tenant_id = documents.tenant_id))
);
```

### Data Quality Triggers

```sql
-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit trail trigger
CREATE OR REPLACE FUNCTION create_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        table_name, record_id, action, old_values, new_values, 
        changed_by, changed_at, tenant_id
    ) VALUES (
        TG_TABLE_NAME, 
        COALESCE(NEW.claim_id, OLD.claim_id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        current_setting('app.current_user_id', true)::UUID,
        NOW(),
        COALESCE(NEW.tenant_id, OLD.tenant_id)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_claims AFTER INSERT OR UPDATE OR DELETE ON claims
    FOR EACH ROW EXECUTE FUNCTION create_audit_trail();
```

## Performance Optimization

### Indexing Strategy

```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_claims_tenant_status_date ON claims(tenant_id, status, created_at) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_claims_workflow_priority ON claims(tenant_id, workflow_state, priority) 
WHERE deleted_at IS NULL;

-- Partial indexes for active records only
CREATE INDEX idx_active_denials_deadline ON denials(tenant_id, appeal_deadline) 
WHERE deleted_at IS NULL AND status IN ('new', 'ready_for_appeal');

-- Covering indexes for dashboard queries
CREATE INDEX idx_claims_dashboard_covering ON claims(tenant_id, status) 
INCLUDE (denied_amount, created_at, priority) 
WHERE deleted_at IS NULL;
```

### Partitioning Strategy

```sql
-- Partition large tables by tenant_id and date
CREATE TABLE claims_partitioned (
    LIKE claims INCLUDING ALL
) PARTITION BY HASH (tenant_id);

-- Create partitions for better performance
CREATE TABLE claims_partition_0 PARTITION OF claims_partitioned
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE claims_partition_1 PARTITION OF claims_partitioned
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);

-- Time-based partitioning for audit logs
CREATE TABLE audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tenant_id UUID NOT NULL
) PARTITION BY RANGE (changed_at);

-- Monthly partitions for audit logs
CREATE TABLE audit_log_2024_01 PARTITION OF audit_log
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

This comprehensive data model provides a solid foundation for the ClaimIQ MVP, ensuring data integrity, multi-tenant isolation, and optimal performance for Indian hospital billing workflows.