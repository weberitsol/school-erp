import { apiClient } from '@/lib/api-client';

export interface Payslip {
  id: string;
  employeeId: string;
  employee?: { id: string; firstName: string; lastName: string };
  month: number;
  year: number;
  basicSalary: number;
  dearness?: number;
  houseRent?: number;
  conveyance?: number;
  medical?: number;
  otherAllowances?: number;
  grossSalary: number;
  pf?: number;
  esi?: number;
  professionalTax?: number;
  incomeTax?: number;
  otherDeductions?: number;
  totalDeductions: number;
  netSalary: number;
  workingDays?: number;
  daysPresent?: number;
  daysAbsent?: number;
  bonus?: number;
  deduction?: number;
  status: 'DRAFT' | 'FINALIZED' | 'PAID' | 'CANCELLED';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePayslipDto {
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  dearness?: number;
  houseRent?: number;
  conveyance?: number;
  medical?: number;
  otherAllowances?: number;
  pf?: number;
  esi?: number;
  professionalTax?: number;
  incomeTax?: number;
  otherDeductions?: number;
  workingDays?: number;
  daysPresent?: number;
  daysAbsent?: number;
  bonus?: number;
  deduction?: number;
}

class PayslipService {
  private endpoint = '/api/v1/hr/payslips';

  async getAll(filters?: {
    employeeId?: string;
    status?: string;
    month?: number;
    year?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: Payslip[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: Payslip[]; total: number; pagination: any }>(url);
    return {
      data: response.data,
      total: response.pagination?.total || 0,
    };
  }

  async getById(id: string): Promise<Payslip> {
    const response = await apiClient.get<{ data: Payslip }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: CreatePayslipDto): Promise<Payslip> {
    const response = await apiClient.post<{ data: Payslip }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreatePayslipDto>): Promise<Payslip> {
    const response = await apiClient.put<{ data: Payslip }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async generate(month: number, year: number, employeeIds?: string[]): Promise<Payslip[]> {
    const response = await apiClient.post<{ data: Payslip[] }>(`${this.endpoint}/generate`, {
      month,
      year,
      employeeIds,
    });
    return response.data;
  }

  async finalize(id: string): Promise<Payslip> {
    const response = await apiClient.post<{ data: Payslip }>(
      `${this.endpoint}/${id}/finalize`,
      {}
    );
    return response.data;
  }

  async markAsPaid(id: string, paidDate?: string): Promise<Payslip> {
    const response = await apiClient.post<{ data: Payslip }>(
      `${this.endpoint}/${id}/mark-paid`,
      { paidDate }
    );
    return response.data;
  }

  async getStats(month: number, year: number): Promise<any> {
    const params = `?month=${month}&year=${year}`;
    const response = await apiClient.get<{ data: any }>(`${this.endpoint}/stats${params}`);
    return response.data;
  }

  async cancel(id: string): Promise<Payslip> {
    const response = await apiClient.post<{ data: Payslip }>(
      `${this.endpoint}/${id}/cancel`,
      {}
    );
    return response.data;
  }
}

export const payslipService = new PayslipService();
