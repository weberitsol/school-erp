import { apiClient } from '@/lib/api-client';

export interface MealVariant {
  id: string;
  mealId: string;
  recipeId: string;
  variantType: 'VEG' | 'NON_VEG' | 'VEGAN';
  cost: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMealVariantDto {
  mealId: string;
  recipeId: string;
  variantType: 'VEG' | 'NON_VEG' | 'VEGAN';
  cost?: number;
}

class MealVariantService {
  private endpoint = '/api/v1/mess/meal-variants';

  async getAll(filters?: {
    mealId?: string;
    variantType?: string;
    recipeId?: string;
  }): Promise<{ data: MealVariant[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.mealId) params.append('mealId', filters.mealId);
    if (filters?.variantType) params.append('variantType', filters.variantType);
    if (filters?.recipeId) params.append('recipeId', filters.recipeId);

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: MealVariant[]; total: number }>(url);
    return response;
  }

  async getById(id: string): Promise<MealVariant> {
    const response = await apiClient.get<{ data: MealVariant }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async getByMeal(mealId: string): Promise<MealVariant[]> {
    const response = await apiClient.get<{ data: MealVariant[] }>(
      `${this.endpoint}/by-meal/${mealId}`
    );
    return response.data;
  }

  async getVariantsByMealGrouped(mealId: string): Promise<{
    VEG?: MealVariant;
    NON_VEG?: MealVariant;
    VEGAN?: MealVariant;
  }> {
    const response = await apiClient.get<{ data: any }>(
      `${this.endpoint}/grouped/${mealId}`
    );
    return response.data;
  }

  async create(data: CreateMealVariantDto): Promise<MealVariant> {
    const response = await apiClient.post<{ data: MealVariant }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateMealVariantDto>): Promise<MealVariant> {
    const response = await apiClient.put<{ data: MealVariant }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async getVariantWithAllergens(id: string): Promise<{
    variant: MealVariant;
    allergens: string[];
  }> {
    const response = await apiClient.get<{ data: any }>(`${this.endpoint}/${id}/allergens`);
    return response.data;
  }

  async getVariantStatistics(variantId: string): Promise<{
    totalChoices: number;
    uniqueStudents: number;
    avgRating?: number;
    cost: number;
    recipe: string;
  }> {
    const response = await apiClient.get<{ data: any }>(
      `${this.endpoint}/${variantId}/statistics`
    );
    return response.data;
  }

  async cloneToMeal(fromVariantId: string, toMealId: string): Promise<MealVariant> {
    const response = await apiClient.post<{ data: MealVariant }>(
      `${this.endpoint}/${fromVariantId}/clone-to-meal`,
      { toMealId }
    );
    return response.data;
  }
}

export const mealVariantService = new MealVariantService();
