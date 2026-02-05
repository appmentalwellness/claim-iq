import { Claim, ClaimStatus } from '@/types';

// Mock claims data for development
export const mockClaims: Claim[] = [
  {
    claimId: 'claim-001',
    claimNumber: 'CLM-2024-001',
    tenantId: 'tenant-1',
    hospitalId: 'hospital-1',
    patientId: 'patient-001',
    status: 'NEW' as ClaimStatus,
    originalFilename: 'claim_001_medical_report.pdf',
    contentType: 'application/pdf',
    s3Bucket: 'claimiq-documents',
    s3Key: 'claims/2024/01/claim_001_medical_report.pdf',
    claimAmount: 125000,
    deniedAmount: 0,
    approvedAmount: 0,
    fileSize: 2048576, // 2MB
    fileHash: 'sha256:a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    processedAt: null,
    metadata: {
      patientName: 'Rajesh Kumar',
      patientAge: 45,
      diagnosis: 'Cardiac Surgery',
      treatmentDate: '2024-01-10',
      payerName: 'Star Health Insurance',
      policyNumber: 'SH-2024-001',
      hospitalName: 'Apollo Hospital',
      doctorName: 'Dr. Priya Sharma'
    }
  },
  {
    claimId: 'claim-002',
    claimNumber: 'CLM-2024-002',
    tenantId: 'tenant-1',
    hospitalId: 'hospital-2',
    patientId: 'patient-002',
    status: 'PROCESSING' as ClaimStatus,
    originalFilename: 'claim_002_surgery_report.pdf',
    contentType: 'application/pdf',
    s3Bucket: 'claimiq-documents',
    s3Key: 'claims/2024/01/claim_002_surgery_report.pdf',
    claimAmount: 85000,
    deniedAmount: 0,
    approvedAmount: 0,
    fileSize: 1536000, // 1.5MB
    fileHash: 'sha256:b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-15T09:15:00Z',
    processedAt: null,
    metadata: {
      patientName: 'Priya Patel',
      patientAge: 32,
      diagnosis: 'Orthopedic Surgery',
      treatmentDate: '2024-01-12',
      payerName: 'HDFC ERGO Health',
      policyNumber: 'HE-2024-002',
      hospitalName: 'Fortis Hospital',
      doctorName: 'Dr. Amit Singh'
    }
  },
  {
    claimId: 'claim-003',
    claimNumber: 'CLM-2024-003',
    tenantId: 'tenant-1',
    hospitalId: 'hospital-1',
    patientId: 'patient-003',
    status: 'DENIED' as ClaimStatus,
    originalFilename: 'claim_003_consultation.pdf',
    contentType: 'application/pdf',
    s3Bucket: 'claimiq-documents',
    s3Key: 'claims/2024/01/claim_003_consultation.pdf',
    claimAmount: 45000,
    deniedAmount: 45000,
    approvedAmount: 0,
    fileSize: 1024000, // 1MB
    fileHash: 'sha256:c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
    createdAt: '2024-01-13T11:45:00Z',
    updatedAt: '2024-01-15T16:30:00Z',
    processedAt: '2024-01-15T16:30:00Z',
    metadata: {
      patientName: 'Suresh Reddy',
      patientAge: 58,
      diagnosis: 'Diabetes Consultation',
      treatmentDate: '2024-01-11',
      payerName: 'ICICI Lombard',
      policyNumber: 'IL-2024-003',
      hospitalName: 'Apollo Hospital',
      doctorName: 'Dr. Meera Joshi',
      denialReason: 'Pre-existing condition not covered'
    }
  },
  {
    claimId: 'claim-004',
    claimNumber: 'CLM-2024-004',
    tenantId: 'tenant-1',
    hospitalId: 'hospital-3',
    patientId: 'patient-004',
    status: 'COMPLETED' as ClaimStatus,
    originalFilename: 'claim_004_emergency.pdf',
    contentType: 'application/pdf',
    s3Bucket: 'claimiq-documents',
    s3Key: 'claims/2024/01/claim_004_emergency.pdf',
    claimAmount: 95000,
    deniedAmount: 0,
    approvedAmount: 95000,
    fileSize: 3072000, // 3MB
    fileHash: 'sha256:d4e5f6789012345678901234567890abcdef1234567890abcdef123456789',
    createdAt: '2024-01-12T08:15:00Z',
    updatedAt: '2024-01-14T12:00:00Z',
    processedAt: '2024-01-14T12:00:00Z',
    metadata: {
      patientName: 'Anita Sharma',
      patientAge: 28,
      diagnosis: 'Emergency Surgery',
      treatmentDate: '2024-01-10',
      payerName: 'Bajaj Allianz',
      policyNumber: 'BA-2024-004',
      hospitalName: 'Max Hospital',
      doctorName: 'Dr. Ravi Kumar'
    }
  },
  {
    claimId: 'claim-005',
    claimNumber: 'CLM-2024-005',
    tenantId: 'tenant-1',
    hospitalId: 'hospital-2',
    patientId: 'patient-005',
    status: 'MANUAL_REVIEW_REQUIRED' as ClaimStatus,
    originalFilename: 'claim_005_complex_case.pdf',
    contentType: 'application/pdf',
    s3Bucket: 'claimiq-documents',
    s3Key: 'claims/2024/01/claim_005_complex_case.pdf',
    claimAmount: 250000,
    deniedAmount: 0,
    approvedAmount: 0,
    fileSize: 4096000, // 4MB
    fileHash: 'sha256:e5f6789012345678901234567890abcdef1234567890abcdef1234567890a',
    createdAt: '2024-01-11T16:30:00Z',
    updatedAt: '2024-01-15T10:45:00Z',
    processedAt: null,
    metadata: {
      patientName: 'Vikram Singh',
      patientAge: 62,
      diagnosis: 'Complex Cardiac Procedure',
      treatmentDate: '2024-01-09',
      payerName: 'New India Assurance',
      policyNumber: 'NIA-2024-005',
      hospitalName: 'Fortis Hospital',
      doctorName: 'Dr. Sunita Gupta'
    }
  },
  {
    claimId: 'claim-006',
    claimNumber: 'CLM-2024-006',
    tenantId: 'tenant-1',
    hospitalId: 'hospital-1',
    patientId: 'patient-006',
    status: 'ERROR' as ClaimStatus,
    originalFilename: 'claim_006_incomplete.pdf',
    contentType: 'application/pdf',
    s3Bucket: 'claimiq-documents',
    s3Key: 'claims/2024/01/claim_006_incomplete.pdf',
    claimAmount: 75000,
    deniedAmount: 0,
    approvedAmount: 0,
    fileSize: 1280000, // 1.25MB
    fileHash: 'sha256:f6789012345678901234567890abcdef1234567890abcdef1234567890ab',
    createdAt: '2024-01-10T13:20:00Z',
    updatedAt: '2024-01-15T08:30:00Z',
    processedAt: null,
    metadata: {
      patientName: 'Deepika Agarwal',
      patientAge: 35,
      diagnosis: 'Maternity Care',
      treatmentDate: '2024-01-08',
      payerName: 'Oriental Insurance',
      policyNumber: 'OI-2024-006',
      hospitalName: 'Apollo Hospital',
      doctorName: 'Dr. Kavita Rao',
      errorMessage: 'Missing required documentation'
    }
  },
  {
    claimId: 'claim-007',
    claimNumber: 'CLM-2024-007',
    tenantId: 'tenant-1',
    hospitalId: 'hospital-3',
    patientId: 'patient-007',
    status: 'NEW' as ClaimStatus,
    originalFilename: 'claim_007_routine_checkup.pdf',
    contentType: 'application/pdf',
    s3Bucket: 'claimiq-documents',
    s3Key: 'claims/2024/01/claim_007_routine_checkup.pdf',
    claimAmount: 15000,
    deniedAmount: 0,
    approvedAmount: 0,
    fileSize: 768000, // 0.75MB
    fileHash: 'sha256:789012345678901234567890abcdef1234567890abcdef1234567890abc',
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T09:00:00Z',
    processedAt: null,
    metadata: {
      patientName: 'Arjun Mehta',
      patientAge: 40,
      diagnosis: 'Routine Health Checkup',
      treatmentDate: '2024-01-15',
      payerName: 'Reliance General',
      policyNumber: 'RG-2024-007',
      hospitalName: 'Max Hospital',
      doctorName: 'Dr. Neha Verma'
    }
  },
  {
    claimId: 'claim-008',
    claimNumber: 'CLM-2024-008',
    tenantId: 'tenant-1',
    hospitalId: 'hospital-2',
    patientId: 'patient-008',
    status: 'PROCESSING' as ClaimStatus,
    originalFilename: 'claim_008_dental_surgery.pdf',
    contentType: 'application/pdf',
    s3Bucket: 'claimiq-documents',
    s3Key: 'claims/2024/01/claim_008_dental_surgery.pdf',
    claimAmount: 35000,
    deniedAmount: 0,
    approvedAmount: 0,
    fileSize: 1792000, // 1.75MB
    fileHash: 'sha256:89012345678901234567890abcdef1234567890abcdef1234567890abcd',
    createdAt: '2024-01-15T15:45:00Z',
    updatedAt: '2024-01-16T11:20:00Z',
    processedAt: null,
    metadata: {
      patientName: 'Sonia Kapoor',
      patientAge: 29,
      diagnosis: 'Dental Surgery',
      treatmentDate: '2024-01-14',
      payerName: 'Tata AIG',
      policyNumber: 'TA-2024-008',
      hospitalName: 'Fortis Hospital',
      doctorName: 'Dr. Rajesh Dental'
    }
  }
];

// Mock function to simulate API delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock function to filter claims based on parameters
export const filterMockClaims = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  let filteredClaims = [...mockClaims];

  // Filter by status
  if (params?.status) {
    const statuses = params.status.split(',');
    filteredClaims = filteredClaims.filter(claim => 
      statuses.includes(claim.status)
    );
  }

  // Filter by search
  if (params?.search) {
    const searchLower = params.search.toLowerCase();
    filteredClaims = filteredClaims.filter(claim => 
      claim.claimNumber?.toLowerCase().includes(searchLower) ||
      claim.originalFilename.toLowerCase().includes(searchLower) ||
      claim.metadata?.patientName?.toLowerCase().includes(searchLower) ||
      claim.metadata?.payerName?.toLowerCase().includes(searchLower) ||
      claim.metadata?.diagnosis?.toLowerCase().includes(searchLower)
    );
  }

  // Pagination
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedClaims = filteredClaims.slice(startIndex, endIndex);

  return {
    claims: paginatedClaims,
    total: filteredClaims.length,
    page,
    limit
  };
};

// Mock function to get a single claim
export const getMockClaim = (claimId: string): Claim | null => {
  return mockClaims.find(claim => claim.claimId === claimId) || null;
};