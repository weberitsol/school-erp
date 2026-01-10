import { apiClient } from '@/lib/api-client';

export type MealVariantType = 'VEG' | 'NON_VEG' | 'VEGAN';

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  cuisineType?: string;
  cookingInstructions?: string;
  cookingTimeMinutes?: number;
  servings: number;
  totalRecipeCost: number;
  caloriesPerServing?: number;
  mealVariantType: MealVariantType;
  isActive: boolean;
  createdAt: string;
}

export interface CreateRecipeDto {
  name: string;
  mealVariantType: MealVariantType;
  description?: string;
  cuisineType?: string;
  cookingInstructions?: string;
  cookingTimeMinutes?: number;
  servings?: number;
}

class RecipeService {
  private endpoint = '/api/v1/mess/recipes';

  async getAll(filters?: {
    mealVariantType?: MealVariantType;
    isActive?: boolean;
  }): Promise<{ data: Recipe[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.mealVariantType) params.append('mealVariantType', filters.mealVariantType);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: Recipe[]; total: number }>(url);
    return response;
  }

  async getById(id: string): Promise<Recipe> {
    const response = await apiClient.get<{ data: Recipe }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async search(query: string): Promise<Recipe[]> {
    const response = await apiClient.get<{ data: Recipe[] }>(
      `${this.endpoint}/search/by-name?search=${encodeURIComponent(query)}`
    );
    return response.data;
  }

  async create(data: CreateRecipeDto): Promise<Recipe> {
    const response = await apiClient.post<{ data: Recipe }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateRecipeDto>): Promise<Recipe> {
    const response = await apiClient.put<{ data: Recipe }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async addIngredient(
    recipeId: string,
    data: {
      foodItemId: string;
      quantity: number;
      unit: string;
      ingredientCost: number;
    }
  ): Promise<any> {
    const response = await apiClient.post<{ data: any }>(
      `${this.endpoint}/${recipeId}/ingredients`,
      data
    );
    return response.data;
  }

  async calculateCost(id: string): Promise<{ totalCost: number }> {
    const response = await apiClient.post<{ data: { totalCost: number } }>(
      `${this.endpoint}/${id}/calculate-cost`,
      {}
    );
    return response.data;
  }
}

export const recipeService = new RecipeService();
