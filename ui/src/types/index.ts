// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'hospital_admin' | 'user';
  tenantId: string;
  hospitalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Claim Types
export interface Claim {
  claimId: string;
  claimNumber?: string;
  tenantId: string;
  hospitalId: string;
  patientId?: string;
  payerId?: string;
  denialId?: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  s3Bucket: string;
  s3Key: string;
  fileHash: string;
  status: ClaimStatus;
  claimAmount?: number;
  deniedAmount?: number;
  approvedAmount?: number;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
  metadata?: {
    patientName?: string;
    patientAge?: number;
    diagnosis?: string;
    treatmentDate?: string;
    payerName?: string;
    policyNumber?: string;
    hospitalName?: string;
    doctorName?: string;
    denialReason?: string;
    errorMessage?: string;
  };
}

export type ClaimStatus = 
  | 'UPLOAD_PENDING'
  | 'NEW' 
  | 'PROCESSING'
  | 'DENIED'
  | 'MANUAL_REVIEW_REQUIRED'
  | 'COMPLETED'
  | 'ERROR';

// File Upload Types
export interface FileUploadRequest {
  filename: string;
  contentType: string;
  fileSize: number;
  tenantId: string;
  hospitalId: string;
}

export interface FileUploadResponse {
  claimId: string;
  uploadId: string;
  presignedUrl: string;
  expiresIn: number;
  message: string;
}

// Patient Types
export interface Patient {
  patientId: string;
  tenantId: string;
  hospitalId: string;
  name: string;
  dateOfBirth?: string;
  gender?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Payer Types
export interface Payer {
  payerId: string;
  tenantId: string;
  name: string;
  payerType: 'INSURANCE' | 'TPA' | 'GOVERNMENT' | 'OTHER';
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Denial Types
export interface Denial {
  denialId: string;
  claimId: string;
  tenantId: string;
  reason: string;
  deniedAmount: number;
  denialText: string;
  denialDate?: string;
  appealDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Types
export interface DashboardStats {
  totalClaims: number;
  pendingClaims: number;
  deniedClaims: number;
  completedClaims: number;
  totalDeniedAmount: number;
  averageProcessingTime: number;
  successRate: number;
}

// Navigation Types
export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  disabled?: boolean;
  external?: boolean;
  children?: NavItem[];
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'file' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

// Re-export store types
export type * from '../stores/types';