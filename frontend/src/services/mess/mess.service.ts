import { apiClient } from '@/lib/api-client';

export interface Mess {
  id: string;
  name: string;
  code: string;
  capacity: number;
  location?: string;
  manager?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessDto {
  name: string;
  code: string;
  capacity: number;
  description?: string;
  location?: string;
  manager?: string;
  contactPhone?: string;
  contactEmail?: string;
}

class MessService {
  private endpoint = '/api/v1/mess/messes';

  async getAll(filters?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Mess[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: Mess[]; total: number }>(url);
    return response;
  }

  async getById(id: string): Promise<Mess> {
    const response = await apiClient.get<{ data: Mess }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async getStatistics(id: string): Promise<{
    totalEnrollments: number;
    activeEnrollments: number;
    totalStaff: number;
    capacity: number;
    utilizationPercentage: number;
  }> {
    const response = await apiClient.get<{
      data: {
        totalEnrollments: number;
        activeEnrollments: number;
        totalStaff: number;
        capacity: number;
        utilizationPercentage: number;
      };
    }>(`${this.endpoint}/${id}/statistics`);
    return response.data;
  }

  async create(data: CreateMessDto): Promise<Mess> {
    const response = await apiClient.post<{ data: Mess }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateMessDto>): Promise<Mess> {
    const response = await apiClient.put<{ data: Mess }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }
}

export const messService = new MessService();
