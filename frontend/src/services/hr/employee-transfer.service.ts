import { apiClient } from '@/lib/api-client';

export interface EmployeeTransfer {
  id: string;
  employeeId: string;
  employee?: { id: string; firstName: string; lastName: string };
  fromDepartmentId: string;
  fromDepartment?: string;
  fromLocation?: string;
  toDepartmentId: string;
  toDepartment?: string;
  toLocation?: string;
  transferDate: string;
  transferReason?: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  initiatedBy?: string;
  transferOrder?: string;
  approvedById?: string;
  approvalDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransferDto {
  employeeId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  fromLocation?: string;
  toLocation?: string;
  transferDate: string;
  transferReason?: string;
  initiatedBy?: string;
  transferOrder?: string;
}

class EmployeeTransferService {
  private endpoint = '/api/v1/hr/transfers';

  async getAll(filters?: {
    employeeId?: string;
    status?: string;
    fromDepartmentId?: string;
    toDepartmentId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: EmployeeTransfer[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.fromDepartmentId) params.append('fromDepartmentId', filters.fromDepartmentId);
    if (filters?.toDepartmentId) params.append('toDepartmentId', filters.toDepartmentId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{
      data: EmployeeTransfer[];
      total: number;
      pagination: any;
    }>(url);
    return {
      data: response.data,
      total: response.pagination?.total || 0,
    };
  }

  async getById(id: string): Promise<EmployeeTransfer> {
    const response = await apiClient.get<{ data: EmployeeTransfer }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: CreateTransferDto): Promise<EmployeeTransfer> {
    const response = await apiClient.post<{ data: EmployeeTransfer }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateTransferDto>): Promise<EmployeeTransfer> {
    const response = await apiClient.put<{ data: EmployeeTransfer }>(
      `${this.endpoint}/${id}`,
      data
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async getPending(): Promise<EmployeeTransfer[]> {
    const response = await apiClient.get<{ data: EmployeeTransfer[] }>(
      `${this.endpoint}/pending`
    );
    return response.data;
  }

  async approve(id: string, approvedById: string): Promise<EmployeeTransfer> {
    const response = await apiClient.post<{ data: EmployeeTransfer }>(
      `${this.endpoint}/${id}/approve`,
      { approvedById }
    );
    return response.data;
  }

  async reject(id: string): Promise<EmployeeTransfer> {
    const response = await apiClient.post<{ data: EmployeeTransfer }>(
      `${this.endpoint}/${id}/reject`,
      {}
    );
    return response.data;
  }

  async getByEmployee(employeeId: string): Promise<EmployeeTransfer[]> {
    const response = await apiClient.get<{ data: EmployeeTransfer[] }>(
      `${this.endpoint}/employee/${employeeId}`
    );
    return response.data;
  }

  async getLatestByEmployee(employeeId: string): Promise<EmployeeTransfer> {
    const response = await apiClient.get<{ data: EmployeeTransfer }>(
      `${this.endpoint}/employee/${employeeId}/latest`
    );
    return response.data;
  }

  async getByDateRange(startDate: string, endDate: string): Promise<EmployeeTransfer[]> {
    const response = await apiClient.post<{ data: EmployeeTransfer[] }>(
      `${this.endpoint}/date-range`,
      { startDate, endDate }
    );
    return response.data;
  }

  async getDepartmentTransfers(departmentId: string): Promise<{
    incoming: EmployeeTransfer[];
    outgoing: EmployeeTransfer[];
  }> {
    const response = await apiClient.get<{
      data: { incoming: EmployeeTransfer[]; outgoing: EmployeeTransfer[] };
    }>(`${this.endpoint}/department/${departmentId}`);
    return response.data;
  }

  async getStats(): Promise<any> {
    const response = await apiClient.get<{ data: any }>(
      `${this.endpoint}/stats/by-department`
    );
    return response.data;
  }
}

export const employeeTransferService = new EmployeeTransferService();
