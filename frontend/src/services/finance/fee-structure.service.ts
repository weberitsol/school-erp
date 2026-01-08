import { apiClient } from '@/lib/api-client';
import { FeeStructure } from '@/lib/api';

interface FeeStructureFilters {
  search?: string;
  classId?: string;
  academicYearId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

interface FeeStructureResponse {
  data: FeeStructure[];
  total: number;
}

class FeeStructureService {
  private endpoint = '/api/v1/fees/structure';

  /**
   * Get all fee structures with optional filters
   */
  async getAll(filters?: FeeStructureFilters): Promise<FeeStructureResponse> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.academicYearId) params.append('academicYearId', filters.academicYearId);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.limit !== undefined) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ success: boolean; data: FeeStructure[]; total: number }>(url);
    return { data: response.data, total: response.total };
  }

  /**
   * Get a specific fee structure by ID
   */
  async getById(id: string): Promise<FeeStructure> {
    const response = await apiClient.get<{ success: boolean; data: FeeStructure }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  /**
   * Create a new fee structure
   */
  async create(data: Partial<FeeStructure>): Promise<FeeStructure> {
    const response = await apiClient.post<{ success: boolean; data: FeeStructure }>(this.endpoint, data);
    return response.data;
  }

  /**
   * Update an existing fee structure
   */
  async update(id: string, data: Partial<FeeStructure>): Promise<FeeStructure> {
    const response = await apiClient.put<{ success: boolean; data: FeeStructure }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  /**
   * Delete a fee structure
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.endpoint}/${id}`);
  }
}

export const feeStructureService = new FeeStructureService();
