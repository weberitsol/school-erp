import { apiClient } from '@/lib/api-client';

export interface ExtraMealBooking {
  id: string;
  enrollmentId: string;
  bookingDate: string;
  mealDate: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  status: 'PENDING' | 'APPROVED' | 'SERVED' | 'CANCELLED';
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  enrollment?: {
    id: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      admissionNo: string;
    };
    plan: {
      id: string;
      name: string;
      mess: {
        id: string;
        name: string;
      };
    };
  };
}

export interface ExtraMealFilters {
  enrollmentId?: string;
  schoolId?: string;
  status?: string;
  skip?: number;
  take?: number;
}

export interface MonthlySummary {
  enrollmentId: string;
  month: number;
  year: number;
  totalQuantity: number;
  totalCost: number;
  bookings: ExtraMealBooking[];
}

class ExtraMealService {
  private apiBase = '/api/v1/mess/extra-meals';

  /**
   * Book extra meal(s)
   */
  async bookExtraMeal(
    enrollmentId: string,
    mealDate: Date,
    quantity: number,
    unitCost: number,
    schoolId: string
  ): Promise<ExtraMealBooking> {
    const response = await apiClient.post(this.apiBase, {
      enrollmentId,
      mealDate,
      quantity,
      unitCost,
      schoolId,
    });
    return response.data;
  }

  /**
   * Get extra meal bookings with filtering
   */
  async getExtraMeals(filters?: ExtraMealFilters): Promise<{
    data: ExtraMealBooking[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.enrollmentId) params.append('enrollmentId', filters.enrollmentId);
    if (filters?.schoolId) params.append('schoolId', filters.schoolId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.apiBase}?${queryString}` : this.apiBase;

    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Get single booking
   */
  async getExtraMealById(id: string): Promise<ExtraMealBooking> {
    const response = await apiClient.get(`${this.apiBase}/${id}`);
    return response.data;
  }

  /**
   * Update booking
   */
  async updateExtraMeal(
    id: string,
    data: {
      quantity?: number;
      unitCost?: number;
      status?: string;
    }
  ): Promise<ExtraMealBooking> {
    const response = await apiClient.put(`${this.apiBase}/${id}`, data);
    return response.data;
  }

  /**
   * Cancel booking
   */
  async cancelExtraMeal(id: string): Promise<ExtraMealBooking> {
    const response = await apiClient.delete(`${this.apiBase}/${id}`);
    return response.data;
  }

  /**
   * Get monthly cost summary
   */
  async getMonthlyExtraMealCost(
    enrollmentId: string,
    month: number,
    year: number
  ): Promise<MonthlySummary> {
    const response = await apiClient.get(
      `/api/v1/mess/enrollments/${enrollmentId}/extra-meals/cost?month=${month}&year=${year}`
    );
    return response.data;
  }

  /**
   * Approve booking
   */
  async approveExtraMeal(id: string): Promise<ExtraMealBooking> {
    const response = await apiClient.put(`${this.apiBase}/${id}/approve`);
    return response.data;
  }

  /**
   * Mark as served
   */
  async markAsServed(id: string): Promise<ExtraMealBooking> {
    const response = await apiClient.put(`${this.apiBase}/${id}/mark-served`);
    return response.data;
  }

  /**
   * Format amount as currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      SERVED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }
}

export const extraMealService = new ExtraMealService();
