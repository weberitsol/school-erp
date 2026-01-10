import { apiClient } from '@/lib/api-client';

export interface KitchenHygieneChecklist {
  id: string;
  messId: string;
  checkDate: string;
  inspectorName: string;
  status: 'PENDING' | 'PASSED' | 'FAILED';
  totalScore: number;
  kitchenCleanliness: number;
  handHygiene: number;
  foodStorage: number;
  cookingArea: number;
  wasteManagement: number;
  equipmentMaintenance: number;
  temperatureControl: number;
  pestControl: number;
  staffUniforms: number;
  waterQuality: number;
  approvedForMealService: boolean;
  issuesIdentified: string[];
  correctionsPending: string[];
  notes?: string;
  createdAt: string;
}

export interface CreateKitchenHygieneDto {
  messId: string;
  checkDate: string;
  inspectorName: string;
  kitchenCleanliness: number;
  handHygiene: number;
  foodStorage: number;
  cookingArea: number;
  wasteManagement: number;
  equipmentMaintenance: number;
  temperatureControl: number;
  pestControl: number;
  staffUniforms: number;
  waterQuality: number;
  issuesIdentified?: string[];
  correctionsPending?: string[];
  notes?: string;
  photoUrls?: string[];
}

class KitchenHygieneService {
  private endpoint = '/api/v1/mess/hygiene-checks';

  async getAll(filters?: {
    messId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: KitchenHygieneChecklist[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.messId) params.append('messId', filters.messId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: KitchenHygieneChecklist[]; total: number }>(url);
    return response;
  }

  async getById(id: string): Promise<KitchenHygieneChecklist> {
    const response = await apiClient.get<{ data: KitchenHygieneChecklist }>(
      `${this.endpoint}/${id}`
    );
    return response.data;
  }

  async getTodayCheck(messId: string): Promise<KitchenHygieneChecklist | null> {
    try {
      const response = await apiClient.get<{ data: KitchenHygieneChecklist }>(
        `/api/v1/mess/messes/${messId}/today-check`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async create(data: CreateKitchenHygieneDto): Promise<KitchenHygieneChecklist> {
    const response = await apiClient.post<{ data: KitchenHygieneChecklist }>(
      this.endpoint,
      data
    );
    return response.data;
  }

  async update(id: string, data: Partial<CreateKitchenHygieneDto>): Promise<KitchenHygieneChecklist> {
    const response = await apiClient.put<{ data: KitchenHygieneChecklist }>(
      `${this.endpoint}/${id}`,
      data
    );
    return response.data;
  }

  async recordCorrection(id: string, correction: string): Promise<KitchenHygieneChecklist> {
    const response = await apiClient.post<{ data: KitchenHygieneChecklist }>(
      `${this.endpoint}/${id}/record-correction`,
      { correction }
    );
    return response.data;
  }

  async getComplianceReport(
    messId: string,
    months: number = 3
  ): Promise<{
    messId: string;
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    compliancePercentage: number;
    averageScore: number;
    trend: string;
    latestCheck: any;
  }> {
    const response = await apiClient.get<{
      data: {
        messId: string;
        totalChecks: number;
        passedChecks: number;
        failedChecks: number;
        compliancePercentage: number;
        averageScore: number;
        trend: string;
        latestCheck: any;
      };
    }>(`/api/v1/mess/messes/${messId}/compliance-report?months=${months}`);
    return response.data;
  }

  /**
   * CRITICAL: Check if meals can be served
   * Returns { allowed: false } if check failed or missing
   */
  async canServeMeals(messId: string): Promise<{ allowed: boolean; message: string }> {
    try {
      const response = await apiClient.get<{ allowed: boolean; message: string }>(
        `/api/v1/mess/messes/${messId}/can-serve`
      );
      return { allowed: true, message: response.message || 'Meal service allowed' };
    } catch (error: any) {
      if (error.response?.status === 403) {
        return {
          allowed: false,
          message: error.response?.data?.error || 'Meal service blocked - check hygiene requirements',
        };
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }
}

export const kitchenHygieneService = new KitchenHygieneService();
