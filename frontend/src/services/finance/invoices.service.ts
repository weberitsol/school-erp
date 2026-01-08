import { apiClient } from '@/lib/api-client';
import { FeeInvoice, InvoiceStats } from '@/lib/api';

interface InvoiceFilters {
  studentId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface InvoiceResponse {
  data: FeeInvoice[];
  total: number;
}

interface GenerateInvoiceData {
  studentId: string;
  feeStructureIds: string[];
  discount?: number;
  tax?: number;
  dueDate: string;
}

interface BulkGenerateInvoiceData {
  classId?: string;
  sectionId?: string;
  feeStructureIds: string[];
  discount?: number;
  tax?: number;
  dueDate: string;
}

class InvoicesService {
  private endpoint = '/api/v1/invoices';

  /**
   * Get all invoices with optional filters
   */
  async getAll(filters?: InvoiceFilters): Promise<InvoiceResponse> {
    const params = new URLSearchParams();

    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.limit !== undefined) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ success: boolean; data: FeeInvoice[]; total: number }>(url);
    return { data: response.data, total: response.total };
  }

  /**
   * Get a specific invoice by ID
   */
  async getById(id: string): Promise<FeeInvoice> {
    const response = await apiClient.get<{ success: boolean; data: FeeInvoice }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  /**
   * Generate a single invoice for a student
   */
  async generate(data: GenerateInvoiceData): Promise<FeeInvoice> {
    const response = await apiClient.post<{ success: boolean; data: FeeInvoice }>(`${this.endpoint}/generate`, data);
    return response.data;
  }

  /**
   * Bulk generate invoices for a class/section
   */
  async bulkGenerate(data: BulkGenerateInvoiceData): Promise<FeeInvoice[]> {
    const response = await apiClient.post<{ success: boolean; data: FeeInvoice[] }>(`${this.endpoint}/bulk-generate`, data);
    return response.data;
  }

  /**
   * Update invoice status
   */
  async updateStatus(id: string, status: string): Promise<FeeInvoice> {
    const response = await apiClient.put<{ success: boolean; data: FeeInvoice }>(`${this.endpoint}/${id}/status`, { status });
    return response.data;
  }

  /**
   * Cancel an invoice
   */
  async cancel(id: string): Promise<FeeInvoice> {
    const response = await apiClient.put<{ success: boolean; data: FeeInvoice }>(`${this.endpoint}/${id}/cancel`, {});
    return response.data;
  }

  /**
   * Get invoice statistics
   */
  async getStats(): Promise<InvoiceStats> {
    const response = await apiClient.get<{ success: boolean; data: InvoiceStats }>(`${this.endpoint}/stats`);
    return response.data;
  }

  /**
   * Get overdue invoices
   */
  async getOverdue(): Promise<FeeInvoice[]> {
    const response = await apiClient.get<{ success: boolean; data: FeeInvoice[] }>(`${this.endpoint}/overdue`);
    return response.data;
  }

  /**
   * Download invoice PDF
   */
  async downloadPDF(invoiceId: string): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${this.endpoint}/${invoiceId}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoiceId}.pdf`;
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

export const invoicesService = new InvoicesService();
