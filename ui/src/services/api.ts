import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { 
  ApiResponse, 
  Claim, 
  FileUploadRequest, 
  FileUploadResponse,
  DashboardStats,
  User 
} from '@/types';
import { filterMockClaims, getMockClaim, delay } from './mockData';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.get('/health');
    return response.data;
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = await this.api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.post('/auth/logout');
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/auth/me');
    return response.data;
  }

  // File Upload
  async requestFileUpload(request: FileUploadRequest): Promise<ApiResponse<FileUploadResponse>> {
    const response: AxiosResponse<ApiResponse<FileUploadResponse>> = await this.api.post('/upload', request, {
      headers: {
        'X-Tenant-Id': request.tenantId,
        'X-Hospital-Id': request.hospitalId,
      },
    });
    return response.data;
  }

  async uploadFileToS3(presignedUrl: string, file: File): Promise<void> {
    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
  }

  // Claims
  async getClaims(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<{ claims: Claim[]; total: number; page: number; limit: number }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ claims: Claim[]; total: number; page: number; limit: number }>> = 
        await this.api.get('/claims', { params });
      return response.data;
    } catch (error) {
      // Fallback to mock data if API is not available
      console.warn('API not available, using mock data for claims');
      console.log('API call params:', params);
      await delay(500); // Simulate API delay
      const mockData = filterMockClaims(params);
      console.log('Mock data returned:', mockData);
      return {
        success: true,
        data: mockData,
        message: 'Claims retrieved successfully (mock data)'
      };
    }
  }

  async getClaim(claimId: string): Promise<ApiResponse<Claim>> {
    try {
      const response: AxiosResponse<ApiResponse<Claim>> = await this.api.get(`/claims/${claimId}`);
      return response.data;
    } catch (error) {
      // Fallback to mock data if API is not available
      console.warn('API not available, using mock data for claim details');
      await delay(300); // Simulate API delay
      const mockClaim = getMockClaim(claimId);
      if (mockClaim) {
        return {
          success: true,
          data: mockClaim,
          message: 'Claim retrieved successfully (mock data)'
        };
      } else {
        throw new Error('Claim not found');
      }
    }
  }

  async updateClaimStatus(claimId: string, status: string): Promise<ApiResponse<Claim>> {
    const response: AxiosResponse<ApiResponse<Claim>> = await this.api.patch(`/claims/${claimId}/status`, {
      status,
    });
    return response.data;
  }

  async bulkUpdateClaimStatus(claimIds: string[], status: string): Promise<ApiResponse<{ updated: number }>> {
    const response: AxiosResponse<ApiResponse<{ updated: number }>> = await this.api.patch('/claims/bulk/status', {
      claimIds,
      status,
    });
    return response.data;
  }

  async assignClaimsToReviewer(claimIds: string[], reviewerId: string): Promise<ApiResponse<{ assigned: number }>> {
    const response: AxiosResponse<ApiResponse<{ assigned: number }>> = await this.api.patch('/claims/bulk/assign', {
      claimIds,
      reviewerId,
    });
    return response.data;
  }

  async exportClaims(claimIds: string[], format: 'excel' | 'csv'): Promise<ApiResponse<{ downloadUrl: string }>> {
    const response: AxiosResponse<ApiResponse<{ downloadUrl: string }>> = await this.api.post('/claims/export', {
      claimIds,
      format,
    });
    return response.data;
  }

  async deleteClaims(claimIds: string[]): Promise<ApiResponse<{ deleted: number }>> {
    const response: AxiosResponse<ApiResponse<{ deleted: number }>> = await this.api.delete('/claims/bulk', {
      data: { claimIds },
    });
    return response.data;
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const response: AxiosResponse<ApiResponse<DashboardStats>> = await this.api.get('/dashboard/stats');
    return response.data;
  }

  // Generic request method
  async request<T = any>(method: string, url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.request({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;