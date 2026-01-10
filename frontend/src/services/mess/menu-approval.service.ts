import { apiClient } from '@/lib/api-client';

export interface MenuApproval {
  id: string;
  menuId: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedBy?: string;
  submittedDate?: string;
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
  allergenWarnings: string[];
  notes?: string;
  createdAt: string;
}

class MenuApprovalService {
  private endpoint = '/api/v1/mess/menu-approvals';

  async getAll(filters?: {
    status?: string;
    menuId?: string;
  }): Promise<{ data: MenuApproval[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.menuId) params.append('menuId', filters.menuId);

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: MenuApproval[]; total: number }>(url);
    return response;
  }

  async getById(id: string): Promise<MenuApproval> {
    const response = await apiClient.get<{ data: MenuApproval }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async getByMenu(menuId: string): Promise<MenuApproval> {
    const response = await apiClient.get<{ data: MenuApproval }>(
      `/api/v1/mess/menus/${menuId}/approval`
    );
    return response.data;
  }

  async getPending(): Promise<MenuApproval[]> {
    const response = await apiClient.get<{ data: MenuApproval[] }>(
      `${this.endpoint}/pending/list`
    );
    return response.data;
  }

  async submit(menuId: string): Promise<MenuApproval> {
    const response = await apiClient.post<{ data: MenuApproval }>(
      `/api/v1/mess/menus/submit`,
      { menuId }
    );
    return response.data;
  }

  async approve(id: string, notes?: string): Promise<MenuApproval> {
    const response = await apiClient.post<{ data: MenuApproval }>(
      `${this.endpoint}/${id}/approve`,
      { notes }
    );
    return response.data;
  }

  async reject(id: string, rejectionReason: string): Promise<MenuApproval> {
    const response = await apiClient.post<{ data: MenuApproval }>(
      `${this.endpoint}/${id}/reject`,
      { rejectionReason }
    );
    return response.data;
  }

  async calculateNutrition(menuId: string): Promise<{
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    perServingCalories: number;
  }> {
    const response = await apiClient.get<{
      data: {
        totalCalories: number;
        totalProtein: number;
        totalCarbs: number;
        totalFat: number;
        perServingCalories: number;
      };
    }>(`/api/v1/mess/menus/${menuId}/nutrition-summary`);
    return response.data;
  }

  async identifyAllergenWarnings(menuId: string): Promise<string[]> {
    const response = await apiClient.get<{ data: string[] }>(
      `/api/v1/mess/menus/${menuId}/allergen-warnings`
    );
    return response.data;
  }

  /**
   * CRITICAL: Check if menu can be served
   * Returns { allowed: false } if cannot be served
   */
  async canServe(menuId: string): Promise<{ allowed: boolean; message: string }> {
    try {
      const response = await apiClient.get<{ allowed: boolean; message: string }>(
        `/api/v1/mess/menus/${menuId}/can-serve`
      );
      return { allowed: true, message: response.message || 'Menu approved for serving' };
    } catch (error: any) {
      if (error.response?.status === 403) {
        return {
          allowed: false,
          message: error.response?.data?.error || 'Menu cannot be served - check approval and hygiene',
        };
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }
}

export const menuApprovalService = new MenuApprovalService();
