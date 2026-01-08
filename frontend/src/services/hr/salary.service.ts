import { apiClient } from '@/lib/api-client';

export interface Salary {
  id: string;
  employeeId: string;
  employee?: { id: string; firstName: string; lastName: string };
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
  month: number;
  year: number;
  status: string;
  effectiveFrom?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSalaryDto {
  employeeId: string;
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
  month: number;
  year: number;
  effectiveFrom?: string;
}

class SalaryService {
  private endpoint = '/api/v1/hr/salaries';

  async getAll(filters?: {
    employeeId?: string;
    status?: string;
    month?: number;
    year?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: Salary[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: Salary[]; total: number; pagination: any }>(url);
    return {
      data: response.data,
      total: response.pagination?.total || 0,
    };
  }

  async getById(id: string): Promise<Salary> {
    const response = await apiClient.get<{ data: Salary }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: CreateSalaryDto): Promise<Salary> {
    const response = await apiClient.post<{ data: Salary }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateSalaryDto>): Promise<Salary> {
    const response = await apiClient.put<{ data: Salary }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async getCurrentSalary(employeeId: string): Promise<Salary> {
    const response = await apiClient.get<{ data: Salary }>(
      `${this.endpoint}/employee/${employeeId}/current`
    );
    return response.data;
  }

  async getSalaryHistory(employeeId: string, limit?: number): Promise<Salary[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<{ data: Salary[] }>(
      `${this.endpoint}/employee/${employeeId}/history${params}`
    );
    return response.data;
  }

  async calculatePayroll(month: number, year: number): Promise<any> {
    const response = await apiClient.post<{ data: any }>(`${this.endpoint}/payroll/calculate`, {
      month,
      year,
    });
    return response.data;
  }

  async recalculate(id: string): Promise<Salary> {
    const response = await apiClient.post<{ data: Salary }>(
      `${this.endpoint}/${id}/recalculate`,
      {}
    );
    return response.data;
  }
}

export const salaryService = new SalaryService();
