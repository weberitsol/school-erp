import { apiClient } from '@/lib/api-client';

export interface Menu {
  id: string;
  messId: string;
  date: string;
  dayOfWeek: string;
  season?: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuDto {
  messId: string;
  date: string;
  dayOfWeek: string;
  season?: string;
}

class MenuService {
  private endpoint = '/api/v1/mess/menus';

  async getAll(filters?: {
    messId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    schoolId?: string;
  }): Promise<{ data: Menu[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.messId) params.append('messId', filters.messId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.schoolId) params.append('schoolId', filters.schoolId);

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: Menu[]; total: number }>(url);
    return response;
  }

  async getById(id: string): Promise<Menu> {
    const response = await apiClient.get<{ data: Menu }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async getByDate(messId: string, date: string): Promise<Menu> {
    const response = await apiClient.get<{ data: Menu }>(
      `${this.endpoint}/by-date/${messId}/${date}`
    );
    return response.data;
  }

  async getByDateRange(messId: string, startDate: string, endDate: string): Promise<Menu[]> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    const response = await apiClient.get<{ data: Menu[] }>(
      `${this.endpoint}/range/${messId}?${params.toString()}`
    );
    return response.data;
  }

  async create(data: CreateMenuDto): Promise<Menu> {
    const response = await apiClient.post<{ data: Menu }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateMenuDto>): Promise<Menu> {
    const response = await apiClient.put<{ data: Menu }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async updateStatus(
    id: string,
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED',
    notes?: string
  ): Promise<Menu> {
    const response = await apiClient.put<{ data: Menu }>(
      `${this.endpoint}/${id}/status`,
      { status, notes }
    );
    return response.data;
  }

  async publish(id: string): Promise<Menu> {
    const response = await apiClient.post<{ data: Menu }>(
      `${this.endpoint}/${id}/publish`,
      {}
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async getStatistics(menuId: string): Promise<{
    totalMeals: number;
    mealsWithAttendance: number;
    avgFeedbackRating: number;
    mealTypes: string[];
    allergenWarnings: string[];
  }> {
    const response = await apiClient.get<{ data: any }>(
      `${this.endpoint}/${menuId}/statistics`
    );
    return response.data;
  }

  async cloneFromDate(messId: string, sourceDate: string, targetDate: string): Promise<Menu> {
    const response = await apiClient.post<{ data: Menu }>(`${this.endpoint}/clone-from-date`, {
      messId,
      sourceDate,
      targetDate,
    });
    return response.data;
  }
}

export const menuService = new MenuService();
