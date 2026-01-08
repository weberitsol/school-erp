import { apiClient } from '@/lib/api-client';

export interface SalaryRevision {
  id: string;
  employeeId: string;
  employee?: { id: string; firstName: string; lastName: string };
  previousBasicSalary: number;
  newBasicSalary: number;
  percentageIncrease?: number;
  amountIncrease?: number;
  revisionReason: 'PROMOTION' | 'INCREMENT' | 'MARKET_ADJUSTMENT' | 'POLICY_CHANGE' | 'PERFORMANCE';
  effectiveFrom: string;
  approvedById?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSalaryRevisionDto {
  employeeId: string;
  previousBasicSalary: number;
  newBasicSalary: number;
  revisionReason: string;
  effectiveFrom: string;
  approvedById?: string;
  remarks?: string;
}

class SalaryRevisionService {
  private endpoint = '/api/v1/hr/salary-revisions';

  async getAll(filters?: {
    employeeId?: string;
    revisionReason?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: SalaryRevision[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.revisionReason) params.append('revisionReason', filters.revisionReason);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{
      data: SalaryRevision[];
      total: number;
      pagination: any;
    }>(url);
    return {
      data: response.data,
      total: response.pagination?.total || 0,
    };
  }

  async getById(id: string): Promise<SalaryRevision> {
    const response = await apiClient.get<{ data: SalaryRevision }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: CreateSalaryRevisionDto): Promise<SalaryRevision> {
    const response = await apiClient.post<{ data: SalaryRevision }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateSalaryRevisionDto>): Promise<SalaryRevision> {
    const response = await apiClient.put<{ data: SalaryRevision }>(
      `${this.endpoint}/${id}`,
      data
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async getLatest(employeeId: string): Promise<SalaryRevision> {
    const response = await apiClient.get<{ data: SalaryRevision }>(
      `${this.endpoint}/employee/${employeeId}/latest`
    );
    return response.data;
  }

  async getTotalIncrease(employeeId: string): Promise<{
    totalIncrease: number;
    percentageIncrease: number;
    revisionCount: number;
  }> {
    const response = await apiClient.get<{
      data: {
        totalIncrease: number;
        percentageIncrease: number;
        revisionCount: number;
      };
    }>(`${this.endpoint}/employee/${employeeId}/increase`);
    return response.data;
  }

  async getStatsByReason(): Promise<Array<{ reason: string; count: number }>> {
    const response = await apiClient.get<{ data: Array<{ reason: string; count: number }> }>(
      `${this.endpoint}/stats/by-reason`
    );
    return response.data;
  }
}

export const salaryRevisionService = new SalaryRevisionService();
