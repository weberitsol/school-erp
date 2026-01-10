import { apiClient } from '@/lib/api-client';

export type AllergenSeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLAXIS';

export interface Allergen {
  id: string;
  name: string;
  code: string;
  description?: string;
  severity: AllergenSeverity;
  isActive: boolean;
  createdAt: string;
}

export interface CreateAllergenDto {
  name: string;
  code: string;
  description?: string;
  severity?: AllergenSeverity;
}

class AllergenService {
  private endpoint = '/api/v1/mess/allergens';

  async getAll(filters?: {
    severity?: AllergenSeverity;
    isActive?: boolean;
  }): Promise<{ data: Allergen[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: Allergen[]; total: number }>(url);
    return response;
  }

  async getById(id: string): Promise<Allergen> {
    const response = await apiClient.get<{ data: Allergen }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async getCritical(): Promise<Allergen[]> {
    const response = await apiClient.get<{ data: Allergen[] }>(
      `${this.endpoint}/critical/list`
    );
    return response.data;
  }

  async getStudentAllergens(studentId: string): Promise<Allergen[]> {
    const response = await apiClient.get<{ data: Allergen[] }>(
      `/api/v1/mess/students/${studentId}/allergens`
    );
    return response.data;
  }

  async create(data: CreateAllergenDto): Promise<Allergen> {
    const response = await apiClient.post<{ data: Allergen }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateAllergenDto>): Promise<Allergen> {
    const response = await apiClient.put<{ data: Allergen }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }
}

export const allergenService = new AllergenService();
