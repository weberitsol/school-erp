import { apiClient } from '@/lib/api-client';

export interface Meal {
  id: string;
  menuId: string;
  schoolId: string;
  name: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  serveTimeStart: string;
  serveTimeEnd: string;
  isServing: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMealDto {
  menuId: string;
  name: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  serveTimeStart: string;
  serveTimeEnd: string;
}

class MealService {
  private endpoint = '/api/v1/mess/meals';

  async getAll(filters?: {
    menuId?: string;
    mealType?: string;
    schoolId?: string;
    isServing?: boolean;
  }): Promise<{ data: Meal[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.menuId) params.append('menuId', filters.menuId);
    if (filters?.mealType) params.append('mealType', filters.mealType);
    if (filters?.schoolId) params.append('schoolId', filters.schoolId);
    if (filters?.isServing !== undefined) params.append('isServing', String(filters.isServing));

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: Meal[]; total: number }>(url);
    return response;
  }

  async getById(id: string): Promise<Meal> {
    const response = await apiClient.get<{ data: Meal }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async getByMenu(menuId: string): Promise<Meal[]> {
    const response = await apiClient.get<{ data: Meal[] }>(
      `${this.endpoint}/by-menu/${menuId}`
    );
    return response.data;
  }

  async getMealsByDateRange(
    messId: string,
    startDate: string,
    endDate: string,
    mealType?: string
  ): Promise<Meal[]> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    if (mealType) params.append('mealType', mealType);

    const response = await apiClient.get<{ data: Meal[] }>(
      `${this.endpoint}/date-range/${messId}?${params.toString()}`
    );
    return response.data;
  }

  async create(data: CreateMealDto): Promise<Meal> {
    const response = await apiClient.post<{ data: Meal }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateMealDto>): Promise<Meal> {
    const response = await apiClient.put<{ data: Meal }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async updateServingStatus(id: string, isServing: boolean): Promise<Meal> {
    const response = await apiClient.put<{ data: Meal }>(
      `${this.endpoint}/${id}/serving-status`,
      { isServing }
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async getStatistics(mealId: string): Promise<{
    totalAttendees: number;
    totalFeedbacks: number;
    avgRating: number;
    variants: number;
    servingStatus: boolean;
  }> {
    const response = await apiClient.get<{ data: any }>(`${this.endpoint}/${mealId}/statistics`);
    return response.data;
  }

  async getServingWindow(
    mealId: string
  ): Promise<{
    mealType: string;
    startTime: string;
    endTime: string;
    isCurrentlyServing: boolean;
  }> {
    const response = await apiClient.get<{ data: any }>(
      `${this.endpoint}/${mealId}/serving-window`
    );
    return response.data;
  }
}

export const mealService = new MealService();
