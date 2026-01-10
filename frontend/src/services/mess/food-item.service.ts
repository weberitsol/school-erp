import { apiClient } from '@/lib/api-client';

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  costPerUnit: number;
  unitOfMeasurement: string;
  description?: string;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  allergenIds: string[];
  isActive: boolean;
  createdAt: string;
}

export interface CreateFoodItemDto {
  name: string;
  category: string;
  costPerUnit: number;
  unitOfMeasurement: string;
  description?: string;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  allergenIds?: string[];
}

class FoodItemService {
  private endpoint = '/api/v1/mess/food-items';

  async getAll(filters?: {
    category?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<{ data: FoodItem[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: FoodItem[]; total: number }>(url);
    return response;
  }

  async getById(id: string): Promise<FoodItem> {
    const response = await apiClient.get<{ data: FoodItem }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: CreateFoodItemDto): Promise<FoodItem> {
    const response = await apiClient.post<{ data: FoodItem }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateFoodItemDto>): Promise<FoodItem> {
    const response = await apiClient.put<{ data: FoodItem }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async getByCategory(category: string): Promise<FoodItem[]> {
    const response = await apiClient.get<{ data: FoodItem[] }>(
      `${this.endpoint}/category/${category}`
    );
    return response.data;
  }

  async getAllergensList(): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(
      '/api/v1/mess/allergens'
    );
    return response.data;
  }
}

export const foodItemService = new FoodItemService();
