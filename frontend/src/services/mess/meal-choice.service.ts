import { apiClient } from '@/lib/api-client';

export interface StudentMealChoice {
  id: string;
  attendanceId: string;
  variantId: string;
  studentId: string;
  chosenAt: string;
  updatedAt: string;
}

export interface CreateMealChoiceDto {
  attendanceId: string;
  variantId: string;
  studentId: string;
}

export interface AvailableVariants {
  safe: any[];
  warning: any[];
  blocked: any[];
}

class MealChoiceService {
  private endpoint = '/api/v1/mess/meal-choices';

  async getAll(filters?: {
    attendanceId?: string;
    studentId?: string;
    variantId?: string;
  }): Promise<{ data: StudentMealChoice[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.attendanceId) params.append('attendanceId', filters.attendanceId);
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.variantId) params.append('variantId', filters.variantId);

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: StudentMealChoice[]; total: number }>(url);
    return response;
  }

  async getById(id: string): Promise<StudentMealChoice> {
    const response = await apiClient.get<{ data: StudentMealChoice }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async getByStudent(studentId: string): Promise<StudentMealChoice[]> {
    const response = await apiClient.get<{ data: StudentMealChoice[] }>(
      `${this.endpoint}/by-student/${studentId}`
    );
    return response.data;
  }

  async create(data: CreateMealChoiceDto): Promise<StudentMealChoice> {
    try {
      const response = await apiClient.post<{ data: StudentMealChoice }>(this.endpoint, data);
      return response.data;
    } catch (error: any) {
      // Check if this is a critical allergen error
      if (error.response?.data?.critical === true) {
        const errorMsg = error.response?.data?.error || 'Allergen conflict detected';
        throw new Error(errorMsg);
      }
      throw error;
    }
  }

  async update(id: string, data: Partial<CreateMealChoiceDto>): Promise<StudentMealChoice> {
    try {
      const response = await apiClient.put<{ data: StudentMealChoice }>(
        `${this.endpoint}/${id}`,
        data
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.critical === true) {
        const errorMsg = error.response?.data?.error || 'Allergen conflict detected';
        throw new Error(errorMsg);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async getAvailableVariants(attendanceId: string): Promise<AvailableVariants> {
    const response = await apiClient.get<{ data: AvailableVariants }>(
      `${this.endpoint}/available/${attendanceId}`
    );
    return response.data;
  }

  async getMealChoiceStatistics(mealId: string): Promise<{
    totalChoices: number;
    variantBreakdown: Record<string, number>;
    studentsWithChoices: number;
  }> {
    const response = await apiClient.get<{ data: any }>(
      `${this.endpoint}/statistics/${mealId}`
    );
    return response.data;
  }
}

export const mealChoiceService = new MealChoiceService();
