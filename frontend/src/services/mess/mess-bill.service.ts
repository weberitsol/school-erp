import { apiClient } from '@/lib/api-client';

export interface MessBill {
  id: string;
  enrollmentId: string;
  schoolId: string;
  billingMonth: number;
  billingYear: number;
  baseMealPlanCost: number;
  additionalCharges: number;
  discount: number;
  totalAmount: number;
  paidAmount?: number;
  paidDate?: string;
  invoiceId?: string;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  enrollment: {
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
      monthlyPrice: number;
      mess: {
        id: string;
        name: string;
      };
    };
  };
}

export interface BillFilters {
  enrollmentId?: string;
  messId?: string;
  schoolId?: string;
  status?: string;
  month?: number;
  year?: number;
  skip?: number;
  take?: number;
}

export interface BillStats {
  totalBills: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  byStatus: Record<string, { count: number; amount: number }>;
}

class MessBillService {
  private apiBase = '/api/v1/mess/bills';

  /**
   * Generate bill for single enrollment
   */
  async generateBill(enrollmentId: string, month: number, year: number): Promise<MessBill> {
    const response = await apiClient.post(`${this.apiBase}/generate`, {
      enrollmentId,
      month,
      year,
    });
    return response.data;
  }

  /**
   * Generate bills for all enrollments in a mess
   */
  async generateBulkBills(
    messId: string,
    month: number,
    year: number
  ): Promise<{
    successful: number;
    failed: number;
    successfulBills: MessBill[];
    errors: any[];
  }> {
    const response = await apiClient.post(`${this.apiBase}/bulk-generate`, {
      messId,
      month,
      year,
    });
    return response.data;
  }

  /**
   * Get bills with filtering and pagination
   */
  async getBills(filters?: BillFilters): Promise<{ data: MessBill[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.enrollmentId) params.append('enrollmentId', filters.enrollmentId);
    if (filters?.messId) params.append('messId', filters.messId);
    if (filters?.schoolId) params.append('schoolId', filters.schoolId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.apiBase}?${queryString}` : this.apiBase;

    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Get single bill
   */
  async getBillById(id: string): Promise<MessBill> {
    const response = await apiClient.get(`${this.apiBase}/${id}`);
    return response.data;
  }

  /**
   * Update bill status
   */
  async updateBillStatus(id: string, status: string): Promise<MessBill> {
    const response = await apiClient.put(`${this.apiBase}/${id}/status`, { status });
    return response.data;
  }

  /**
   * Record payment
   */
  async recordPayment(
    id: string,
    amount: number,
    paymentMethod: string,
    transactionId?: string,
    notes?: string
  ): Promise<MessBill> {
    const response = await apiClient.post(`${this.apiBase}/${id}/payment`, {
      amount,
      paymentMethod,
      transactionId,
      notes,
    });
    return response.data;
  }

  /**
   * Get bill statistics
   */
  async getBillStats(schoolId: string): Promise<BillStats> {
    const response = await apiClient.get(`${this.apiBase}/stats?schoolId=${schoolId}`);
    return response.data;
  }

  /**
   * Get overdue bills
   */
  async getOverdueBills(schoolId: string): Promise<MessBill[]> {
    const response = await apiClient.get(
      `${this.apiBase}/overdue?schoolId=${schoolId}`
    );
    return response.data;
  }

  /**
   * Sync bill to Finance module
   */
  async syncToFinance(id: string): Promise<{ billId: string; invoiceId: string }> {
    const response = await apiClient.post(`${this.apiBase}/${id}/sync-finance`);
    return response.data;
  }

  /**
   * Cancel bill
   */
  async cancelBill(id: string): Promise<MessBill> {
    const response = await apiClient.put(`${this.apiBase}/${id}/cancel`);
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
      PAID: 'bg-green-100 text-green-800',
      PARTIAL: 'bg-blue-100 text-blue-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get month name
   */
  getMonthName(month: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return monthNames[month - 1] || 'Unknown';
  }
}

export const messBillService = new MessBillService();
