import { apiClient } from '@/lib/api-client';

export interface Vendor {
  id: string;
  name: string;
  code: string;
  vendorType: string;
  schoolId: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  performanceRating?: number;
  qualityScore?: number;
  deliveryScore?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorFilters {
  vendorType?: string;
  isActive?: boolean;
  skip?: number;
  take?: number;
}

export interface VendorStats {
  totalVendors: number;
  activeVendors: number;
  inactiveVendors: number;
  averagePerformanceRating: number;
}

class VendorService {
  private apiBase = '/api/v1/mess';

  /**
   * Create vendor
   */
  async createVendor(data: {
    name: string;
    code: string;
    vendorType: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
  }): Promise<Vendor> {
    const response = await apiClient.post(`${this.apiBase}/vendors`, data);
    return response.data;
  }

  /**
   * Get vendors list
   */
  async getVendors(filters?: VendorFilters): Promise<{
    data: Vendor[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.vendorType) params.append('vendorType', filters.vendorType);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const queryString = params.toString();
    const url = queryString
      ? `${this.apiBase}/vendors?${queryString}`
      : `${this.apiBase}/vendors`;

    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Get vendor by ID
   */
  async getVendorById(id: string): Promise<Vendor> {
    const response = await apiClient.get(`${this.apiBase}/vendors/${id}`);
    return response.data;
  }

  /**
   * Update vendor
   */
  async updateVendor(id: string, data: any): Promise<Vendor> {
    const response = await apiClient.put(`${this.apiBase}/vendors/${id}`, data);
    return response.data;
  }

  /**
   * Delete vendor
   */
  async deleteVendor(id: string): Promise<void> {
    await apiClient.delete(`${this.apiBase}/vendors/${id}`);
  }

  /**
   * Get vendors by type
   */
  async getVendorsByType(vendorType: string): Promise<Vendor[]> {
    const response = await apiClient.get(`${this.apiBase}/vendors/type/${vendorType}`);
    return response.data;
  }

  /**
   * Get active vendors
   */
  async getActiveVendors(filters?: VendorFilters): Promise<{
    data: Vendor[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.vendorType) params.append('vendorType', filters.vendorType);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const queryString = params.toString();
    const url = queryString
      ? `${this.apiBase}/vendors/active/list?${queryString}`
      : `${this.apiBase}/vendors/active/list`;

    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Deactivate vendor
   */
  async deactivateVendor(id: string): Promise<Vendor> {
    const response = await apiClient.put(`${this.apiBase}/vendors/${id}/deactivate`);
    return response.data;
  }

  /**
   * Reactivate vendor
   */
  async reactivateVendor(id: string): Promise<Vendor> {
    const response = await apiClient.put(`${this.apiBase}/vendors/${id}/reactivate`);
    return response.data;
  }

  /**
   * Update performance rating
   */
  async updatePerformanceRating(id: string, rating: number): Promise<Vendor> {
    const response = await apiClient.put(
      `${this.apiBase}/vendors/${id}/performance-rating`,
      { rating }
    );
    return response.data;
  }

  /**
   * Update quality score
   */
  async updateQualityScore(id: string, score: number): Promise<Vendor> {
    const response = await apiClient.put(`${this.apiBase}/vendors/${id}/quality-score`, {
      score,
    });
    return response.data;
  }

  /**
   * Update delivery score
   */
  async updateDeliveryScore(id: string, score: number): Promise<Vendor> {
    const response = await apiClient.put(`${this.apiBase}/vendors/${id}/delivery-score`, {
      score,
    });
    return response.data;
  }

  /**
   * Get vendor types
   */
  async getVendorTypes(): Promise<string[]> {
    const response = await apiClient.get(`${this.apiBase}/vendors/types/list`);
    return response.data;
  }

  /**
   * Get vendor stats
   */
  async getVendorStats(): Promise<VendorStats> {
    const response = await apiClient.get(`${this.apiBase}/vendors/stats/summary`);
    return response.data;
  }

  /**
   * Get top rated vendors
   */
  async getTopRatedVendors(limit?: number): Promise<Vendor[]> {
    const url = limit
      ? `${this.apiBase}/vendors/top-rated/list?limit=${limit}`
      : `${this.apiBase}/vendors/top-rated/list`;
    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Format rating
   */
  formatRating(rating?: number): string {
    if (!rating) return 'N/A';
    return rating.toFixed(1);
  }

  /**
   * Get rating color
   */
  getRatingColor(rating?: number): string {
    if (!rating) return 'bg-gray-100 text-gray-800';
    if (rating >= 4.5) return 'bg-green-100 text-green-800';
    if (rating >= 3.5) return 'bg-blue-100 text-blue-800';
    if (rating >= 2.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }
}

export const vendorService = new VendorService();
