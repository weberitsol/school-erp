import { apiClient } from '@/lib/api-client';
import { FeePayment, PaymentReport } from '@/lib/api';

interface PaymentFilters {
  studentId?: string;
  classId?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface PaymentResponse {
  data: FeePayment[];
  total: number;
}

class PaymentsService {
  private endpoint = '/api/v1/fees';

  /**
   * Get all payments with optional filters
   */
  async getAll(filters?: PaymentFilters): Promise<PaymentResponse> {
    const params = new URLSearchParams();

    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.limit !== undefined) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}/payments?${queryString}` : `${this.endpoint}/payments`;

    const response = await apiClient.get<{ success: boolean; data: FeePayment[]; total: number }>(url);
    return { data: response.data, total: response.total };
  }

  /**
   * Record a new payment
   */
  async recordPayment(data: Partial<FeePayment>): Promise<FeePayment> {
    const response = await apiClient.post<{ success: boolean; data: FeePayment }>(`${this.endpoint}/payments`, data);
    return response.data;
  }

  /**
   * Get pending dues with optional filters
   */
  async getPendingDues(filters?: {
    studentId?: string;
    classId?: string;
  }): Promise<FeePayment[]> {
    const params = new URLSearchParams();

    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.classId) params.append('classId', filters.classId);

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}/dues?${queryString}` : `${this.endpoint}/dues`;

    const response = await apiClient.get<{ success: boolean; data: FeePayment[] }>(url);
    return response.data;
  }

  /**
   * Get payment report for a date range
   */
  async getReport(dateFrom: string, dateTo: string): Promise<PaymentReport> {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}/report?${queryString}` : `${this.endpoint}/report`;

    const response = await apiClient.get<{ success: boolean; data: PaymentReport }>(url);
    return response.data;
  }

  /**
   * Download receipt PDF for a payment
   */
  async downloadReceiptPDF(paymentId: string): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${this.endpoint}/payments/${paymentId}/receipt`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download receipt');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${paymentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private getAuthToken(): string | null {
    try {
      const stored = localStorage.getItem('school-erp-auth');
      if (stored) {
        const authData = JSON.parse(stored);
        return authData.state?.accessToken || authData.accessToken || null;
      }
    } catch (e) {
      console.error('Failed to parse auth from localStorage:', e);
    }
    return null;
  }
}

export const paymentsService = new PaymentsService();
