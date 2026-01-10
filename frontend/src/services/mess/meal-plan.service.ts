import { apiClient } from '@/lib/api-client';

export interface MealPlan {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  annualPrice?: number;
  includeBreakfast: boolean;
  includeLunch: boolean;
  includeDinner: boolean;
  includeSnacks: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateMealPlanDto {
  name: string;
  messId: string;
  monthlyPrice: number;
  description?: string;
  annualPrice?: number;
  includeBreakfast?: boolean;
  includeLunch?: boolean;
  includeDinner?: boolean;
  includeSnacks?: boolean;
}

class MealPlanService {
  private endpoint = '/api/v1/mess/meal-plans';

  async getAll(filters?: {
    messId?: string;
    isActive?: boolean;
  }): Promise<{ data: MealPlan[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.messId) params.append('messId', filters.messId);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: MealPlan[]; total: number }>(url);
    return response;
  }

  async getById(id: string): Promise<MealPlan> {
    const response = await apiClient.get<{ data: MealPlan }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async getByMess(messId: string): Promise<MealPlan[]> {
    const response = await apiClient.get<{ data: MealPlan[] }>(
      `/api/v1/mess/messes/${messId}/meal-plans`
    );
    return response.data;
  }

  async create(data: CreateMealPlanDto): Promise<MealPlan> {
    const response = await apiClient.post<{ data: MealPlan }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateMealPlanDto>): Promise<MealPlan> {
    const response = await apiClient.put<{ data: MealPlan }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }
}

export const mealPlanService = new MealPlanService();
