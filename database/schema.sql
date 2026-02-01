-- ClaimIQ Database Schema
-- Aurora Serverless v2 PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('hospital', 'billing_service')),
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
    hospital_id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id),
    name VARCHAR(255) NOT NULL,
    address JSONB DEFAULT '{}',
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    patient_id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id),
    hospital_id VARCHAR(255) NOT NULL REFERENCES hospitals(hospital_id),
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payers table (Insurance companies and TPAs)
CREATE TABLE IF NOT EXISTS payers (
    payer_id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id),
    name VARCHAR(255) NOT NULL,
    payer_type VARCHAR(50) NOT NULL DEFAULT 'TPA' CHECK (payer_type IN ('INSURER', 'TPA')),
    contact_info JSONB DEFAULT '{}',
    rules JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
    claim_id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id),
    hospital_id VARCHAR(255) NOT NULL REFERENCES hospitals(hospital_id),
    patient_id VARCHAR(255) REFERENCES patients(patient_id),
    payer_id VARCHAR(255) REFERENCES payers(payer_id),
    denial_id VARCHAR(255),
    
    -- Claim identification
    claim_number VARCHAR(255),
    policy_number VARCHAR(255),
    
    -- Financial information
    claim_amount DECIMAL(15,2) DEFAULT 0,
    denied_amount DECIMAL(15,2) DEFAULT 0,
    recovered_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Dates
    admission_date DATE,
    discharge_date DATE,
    submission_date DATE,
    denial_date DATE,
    
    -- Status and workflow
    status VARCHAR(50) NOT NULL DEFAULT 'NEW' CHECK (status IN (
        'NEW', 'UPLOAD_PENDING', 'DENIED', 'AI_ANALYZED', 'HUMAN_REVIEW', 
        'SUBMITTED', 'RECOVERED', 'FAILED', 'MANUAL_REVIEW_REQUIRED'
    )),
    
    -- File information
    original_filename VARCHAR(255),
    content_type VARCHAR(100),
    file_size BIGINT,
    file_hash VARCHAR(64),
    s3_bucket VARCHAR(255),
    s3_key VARCHAR(500),
    upload_id VARCHAR(255),
    
    -- Request tracking
    source_ip INET,
    user_agent TEXT,
    request_id VARCHAR(255),
    error_message TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Denials table
CREATE TABLE IF NOT EXISTS denials (
    denial_id VARCHAR(255) PRIMARY KEY,
    claim_id VARCHAR(255) NOT NULL REFERENCES claims(claim_id),
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id),
    
    -- Denial information
    reason VARCHAR(255),
    denial_code VARCHAR(50),
    denial_text TEXT,
    denied_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Important dates
    denial_date DATE,
    appeal_deadline DATE,
    
    -- Classification (will be populated by AI)
    classification JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for denial_id in claims table
ALTER TABLE claims ADD CONSTRAINT fk_claims_denial 
    FOREIGN KEY (denial_id) REFERENCES denials(denial_id);

-- Appeals table
CREATE TABLE IF NOT EXISTS appeals (
    appeal_id VARCHAR(255) PRIMARY KEY,
    claim_id VARCHAR(255) NOT NULL REFERENCES claims(claim_id),
    denial_id VARCHAR(255) NOT NULL REFERENCES denials(denial_id),
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id),
    
    -- Appeal content
    appeal_letter TEXT,
    supporting_documents JSONB DEFAULT '[]',
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'
    )),
    
    -- Dates
    submission_date DATE,
    response_date DATE,
    
    -- Outcome
    outcome VARCHAR(50) CHECK (outcome IN (
        'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PENDING'
    )),
    recovered_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Actions table (for AI agent audit trail)
CREATE TABLE IF NOT EXISTS agent_actions (
    action_id VARCHAR(255) PRIMARY KEY,
    claim_id VARCHAR(255) NOT NULL REFERENCES claims(claim_id),
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id),
    
    -- Agent information
    agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN (
        'DENIAL_CLASSIFIER', 'DOCUMENT_EXTRACTOR', 
        'APPEAL_GENERATOR', 'RECOVERY_STRATEGIST'
    )),
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    reasoning TEXT,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Human oversight
    human_approved BOOLEAN DEFAULT FALSE,
    human_reviewer VARCHAR(255),
    human_notes TEXT,
    
    -- Timing
    execution_time_ms INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recovery Logs table (for tracking financial outcomes)
CREATE TABLE IF NOT EXISTS recovery_logs (
    log_id VARCHAR(255) PRIMARY KEY,
    claim_id VARCHAR(255) NOT NULL REFERENCES claims(claim_id),
    appeal_id VARCHAR(255) REFERENCES appeals(appeal_id),
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id),
    
    -- Recovery details
    recovery_type VARCHAR(50) NOT NULL CHECK (recovery_type IN (
        'FULL_RECOVERY', 'PARTIAL_RECOVERY', 'NO_RECOVERY', 'WRITE_OFF'
    )),
    
    -- Financial information
    original_denied_amount DECIMAL(15,2) NOT NULL,
    recovered_amount DECIMAL(15,2) DEFAULT 0,
    processing_cost DECIMAL(15,2) DEFAULT 0,
    net_recovery DECIMAL(15,2) GENERATED ALWAYS AS (recovered_amount - processing_cost) STORED,
    
    -- Timing
    recovery_date DATE,
    days_to_recovery INTEGER,
    
    -- Notes
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance and tenant isolation

-- Tenant isolation indexes (critical for multi-tenant queries)
CREATE INDEX IF NOT EXISTS idx_hospitals_tenant_id ON hospitals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_tenant_id ON patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payers_tenant_id ON payers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_claims_tenant_id ON claims(tenant_id);
CREATE INDEX IF NOT EXISTS idx_denials_tenant_id ON denials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appeals_tenant_id ON appeals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_tenant_id ON agent_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recovery_logs_tenant_id ON recovery_logs(tenant_id);

-- Claims workflow indexes
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_tenant_status ON claims(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_claims_hospital_status ON claims(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at);
CREATE INDEX IF NOT EXISTS idx_claims_file_hash ON claims(file_hash);

-- Denial and appeal indexes
CREATE INDEX IF NOT EXISTS idx_denials_claim_id ON denials(claim_id);
CREATE INDEX IF NOT EXISTS idx_appeals_claim_id ON appeals(claim_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeals(status);

-- Agent actions indexes
CREATE INDEX IF NOT EXISTS idx_agent_actions_claim_id ON agent_actions(claim_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_agent_type ON agent_actions(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_actions_timestamp ON agent_actions(timestamp);

-- Recovery tracking indexes
CREATE INDEX IF NOT EXISTS idx_recovery_logs_claim_id ON recovery_logs(claim_id);
CREATE INDEX IF NOT EXISTS idx_recovery_logs_recovery_date ON recovery_logs(recovery_date);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_claims_tenant_hospital_status ON claims(tenant_id, hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_claims_tenant_created ON claims(tenant_id, created_at DESC);

-- Row Level Security (RLS) for tenant isolation
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE denials ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (will be created based on application user context)
-- Note: In production, these would be more sophisticated based on JWT claims

-- Example policy for claims (would be customized per application role)
CREATE POLICY tenant_isolation_claims ON claims
    FOR ALL
    TO PUBLIC
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payers_updated_at BEFORE UPDATE ON payers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_denials_updated_at BEFORE UPDATE ON denials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appeals_updated_at BEFORE UPDATE ON appeals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recovery_logs_updated_at BEFORE UPDATE ON recovery_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default tenant and hospital for development
INSERT INTO tenants (tenant_id, name, type) 
VALUES ('default-tenant', 'Default Hospital Group', 'hospital')
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO hospitals (hospital_id, tenant_id, name, address, contact_info)
VALUES (
    'default-hospital', 
    'default-tenant', 
    'Default Hospital', 
    '{"street": "123 Hospital Street", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001"}',
    '{"phone": "+91-22-12345678", "email": "admin@defaulthospital.com"}'
)
ON CONFLICT (hospital_id) DO NOTHING;

-- Create views for common queries

-- Claims summary view
CREATE OR REPLACE VIEW claims_summary AS
SELECT 
    c.tenant_id,
    c.hospital_id,
    h.name as hospital_name,
    COUNT(*) as total_claims,
    COUNT(CASE WHEN c.status = 'DENIED' THEN 1 END) as denied_claims,
    COUNT(CASE WHEN c.status = 'RECOVERED' THEN 1 END) as recovered_claims,
    SUM(c.claim_amount) as total_claim_amount,
    SUM(c.denied_amount) as total_denied_amount,
    SUM(c.recovered_amount) as total_recovered_amount,
    ROUND(
        CASE 
            WHEN SUM(c.denied_amount) > 0 
            THEN (SUM(c.recovered_amount) / SUM(c.denied_amount)) * 100 
            ELSE 0 
        END, 2
    ) as recovery_percentage
FROM claims c
JOIN hospitals h ON c.hospital_id = h.hospital_id
GROUP BY c.tenant_id, c.hospital_id, h.name;

-- Active denials view (for human review queue)
CREATE OR REPLACE VIEW active_denials AS
SELECT 
    c.claim_id,
    c.tenant_id,
    c.hospital_id,
    h.name as hospital_name,
    p.name as patient_name,
    py.name as payer_name,
    c.claim_number,
    c.denied_amount,
    d.reason as denial_reason,
    d.appeal_deadline,
    c.status,
    c.created_at,
    CASE 
        WHEN d.appeal_deadline IS NOT NULL 
        THEN d.appeal_deadline - CURRENT_DATE 
        ELSE NULL 
    END as days_until_deadline
FROM claims c
JOIN hospitals h ON c.hospital_id = h.hospital_id
LEFT JOIN patients p ON c.patient_id = p.patient_id
LEFT JOIN payers py ON c.payer_id = py.payer_id
LEFT JOIN denials d ON c.denial_id = d.denial_id
WHERE c.status IN ('DENIED', 'AI_ANALYZED', 'HUMAN_REVIEW')
ORDER BY 
    CASE WHEN d.appeal_deadline IS NOT NULL THEN d.appeal_deadline - CURRENT_DATE END ASC,
    c.denied_amount DESC;