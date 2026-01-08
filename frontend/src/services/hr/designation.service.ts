import { apiClient } from '@/lib/api-client';

export interface Designation {
  id: string;
  name: string;
  code: string;
  level: number;
  parentDesignationId?: string;
  minSalary?: number;
  maxSalary?: number;
  standardSalary?: number;
  description?: string;
  subordinates?: Designation[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDesignationDto {
  name: string;
  code: string;
  level: number;
  parentDesignationId?: string;
  minSalary?: number;
  maxSalary?: number;
  standardSalary?: number;
  description?: string;
}

export interface UpdateDesignationDto extends Partial<CreateDesignationDto> {
  id: string;
}

class DesignationService {
  private endpoint = '/api/v1/hr/designations';

  async getAll(filters?: {
    search?: string;
    level?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: Designation[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.level !== undefined) params.append('level', filters.level.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: Designation[]; total: number; pagination: any }>(
      url
    );
    return {
      data: response.data,
      total: response.pagination?.total || 0,
    };
  }

  async getById(id: string): Promise<Designation> {
    const response = await apiClient.get<{ data: Designation }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: CreateDesignationDto): Promise<Designation> {
    const response = await apiClient.post<{ data: Designation }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateDesignationDto>): Promise<Designation> {
    const response = await apiClient.put<{ data: Designation }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async getHierarchy(): Promise<Designation[]> {
    const response = await apiClient.get<{ data: Designation[] }>(
      `${this.endpoint}/hierarchy`
    );
    return response.data;
  }

  async validateSalaryRange(designationId: string, salary: number): Promise<boolean> {
    const response = await apiClient.post<{ data: { isValid: boolean } }>(
      `${this.endpoint}/validate-salary`,
      { designationId, salary }
    );
    return response.data.isValid;
  }

  async getByLevel(level: number): Promise<Designation[]> {
    const response = await apiClient.get<{ data: Designation[] }>(
      `${this.endpoint}/level/${level}`
    );
    return response.data;
  }
}

export const designationService = new DesignationService();
