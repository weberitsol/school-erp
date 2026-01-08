import { apiClient } from '@/lib/api-client';

export interface EmployeePromotion {
  id: string;
  employeeId: string;
  employee?: { id: string; firstName: string; lastName: string };
  previousDesignationId: string;
  previousDesignation?: { id: string; name: string };
  newDesignationId: string;
  newDesignation?: { id: string; name: string };
  newSalary: number;
  promotionDate: string;
  promotionReason?: string;
  effectiveFrom: string;
  status: 'PROPOSED' | 'APPROVED' | 'ACTIVE';
  approvedById?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromotionDto {
  employeeId: string;
  previousDesignationId: string;
  newDesignationId: string;
  newSalary: number;
  promotionDate: string;
  promotionReason?: string;
  effectiveFrom: string;
  approvedById?: string;
  remarks?: string;
}

class EmployeePromotionService {
  private endpoint = '/api/v1/hr/promotions';

  async getAll(filters?: {
    employeeId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: EmployeePromotion[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{
      data: EmployeePromotion[];
      total: number;
      pagination: any;
    }>(url);
    return {
      data: response.data,
      total: response.pagination?.total || 0,
    };
  }

  async getById(id: string): Promise<EmployeePromotion> {
    const response = await apiClient.get<{ data: EmployeePromotion }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: CreatePromotionDto): Promise<EmployeePromotion> {
    const response = await apiClient.post<{ data: EmployeePromotion }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreatePromotionDto>): Promise<EmployeePromotion> {
    const response = await apiClient.put<{ data: EmployeePromotion }>(
      `${this.endpoint}/${id}`,
      data
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async approve(id: string, approvedById: string): Promise<EmployeePromotion> {
    const response = await apiClient.post<{ data: EmployeePromotion }>(
      `${this.endpoint}/${id}/approve`,
      { approvedById }
    );
    return response.data;
  }

  async getByDateRange(startDate: string, endDate: string): Promise<EmployeePromotion[]> {
    const response = await apiClient.post<{ data: EmployeePromotion[] }>(
      `${this.endpoint}/date-range`,
      { startDate, endDate }
    );
    return response.data;
  }

  async getStats(): Promise<any> {
    const response = await apiClient.get<{ data: any }>(`${this.endpoint}/stats/by-designation`);
    return response.data;
  }
}

export const employeePromotionService = new EmployeePromotionService();
