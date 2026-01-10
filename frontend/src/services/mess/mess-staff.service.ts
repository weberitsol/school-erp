import { apiClient } from '@/lib/api-client';

export interface MessStaff {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  email?: string;
  phone?: string;
  department?: string;
  dateOfJoining: string;
  dateOfLeaving?: string;
  certifications: string[];
  trainingsCompleted: string[];
  isActive: boolean;
  createdAt: string;
}

export interface CreateMessStaffDto {
  firstName: string;
  lastName: string;
  position: string;
  messId: string;
  dateOfJoining: string;
  email?: string;
  phone?: string;
  department?: string;
  certifications?: string[];
  trainingsCompleted?: string[];
}

class MessStaffService {
  private endpoint = '/api/v1/mess/staff';

  async getAll(filters?: {
    messId?: string;
    position?: string;
    isActive?: boolean;
  }): Promise<{ data: MessStaff[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.messId) params.append('messId', filters.messId);
    if (filters?.position) params.append('position', filters.position);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: MessStaff[]; total: number }>(url);
    return response;
  }

  async getById(id: string): Promise<MessStaff> {
    const response = await apiClient.get<{ data: MessStaff }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async getByMess(messId: string): Promise<MessStaff[]> {
    const response = await apiClient.get<{ data: MessStaff[] }>(
      `/api/v1/mess/messes/${messId}/staff`
    );
    return response.data;
  }

  async create(data: CreateMessStaffDto): Promise<MessStaff> {
    const response = await apiClient.post<{ data: MessStaff }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateMessStaffDto>): Promise<MessStaff> {
    const response = await apiClient.put<{ data: MessStaff }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async addCertification(id: string, certification: string): Promise<MessStaff> {
    const response = await apiClient.post<{ data: MessStaff }>(
      `${this.endpoint}/${id}/certification`,
      { certification }
    );
    return response.data;
  }

  async recordTraining(id: string, training: string): Promise<MessStaff> {
    const response = await apiClient.post<{ data: MessStaff }>(
      `${this.endpoint}/${id}/training`,
      { training }
    );
    return response.data;
  }

  async getStatistics(messId: string): Promise<any> {
    const response = await apiClient.get<{ data: any }>(
      `/api/v1/mess/messes/${messId}/staff-stats`
    );
    return response.data;
  }
}

export const messStaffService = new MessStaffService();
