import { apiClient } from '@/lib/api-client';

export interface Employee {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  employeeNo: string;
  employmentType: string;
  designationId: string;
  designation?: { id: string; name: string };
  departmentId: string;
  department?: { id: string; name: string };
  reportingToId?: string;
  reportingTo?: Employee;
  joiningDate: string;
  basicSalary?: number;
  salaryGrade?: string;
  panNumber?: string;
  aadharNumber?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'SEPARATED';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeDto {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  employeeNo: string;
  employmentType: string;
  designationId: string;
  departmentId: string;
  reportingToId?: string;
  joiningDate: string;
  basicSalary?: number;
  salaryGrade?: string;
  panNumber?: string;
  aadharNumber?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {
  id: string;
}

class EmployeeService {
  private endpoint = '/api/v1/hr/employees';

  async getAll(filters?: {
    departmentId?: string;
    designationId?: string;
    status?: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: Employee[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.designationId) params.append('designationId', filters.designationId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: Employee[]; total: number; pagination: any }>(url);
    return {
      data: response.data,
      total: response.pagination?.total || 0,
    };
  }

  async getById(id: string): Promise<Employee> {
    const response = await apiClient.get<{ data: Employee }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: CreateEmployeeDto): Promise<Employee> {
    const response = await apiClient.post<{ data: Employee }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateEmployeeDto>): Promise<Employee> {
    const response = await apiClient.put<{ data: Employee }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async getByEmployeeNo(employeeNo: string): Promise<Employee> {
    const response = await apiClient.get<{ data: Employee }>(
      `${this.endpoint}/number/${employeeNo}`
    );
    return response.data;
  }

  async getByDepartment(departmentId: string): Promise<Employee[]> {
    const response = await apiClient.get<{ data: Employee[] }>(
      `${this.endpoint}/department/${departmentId}`
    );
    return response.data;
  }

  async getSubordinates(managerId: string): Promise<Employee[]> {
    const response = await apiClient.get<{ data: Employee[] }>(
      `${this.endpoint}/${managerId}/subordinates`
    );
    return response.data;
  }

  async updateStatus(id: string, status: string): Promise<Employee> {
    const response = await apiClient.put<{ data: Employee }>(
      `${this.endpoint}/${id}/status`,
      { status }
    );
    return response.data;
  }

  async getActiveCount(departmentId?: string): Promise<number> {
    const params = departmentId ? `?departmentId=${departmentId}` : '';
    const response = await apiClient.get<{ data: { activeEmployeeCount: number } }>(
      `${this.endpoint}/count/active${params}`
    );
    return response.data.activeEmployeeCount;
  }
}

export const employeeService = new EmployeeService();
