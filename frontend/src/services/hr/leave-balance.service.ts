import { apiClient } from '@/lib/api-client';

export interface LeaveBalance {
  id: string;
  employeeId: string;
  employee?: { id: string; firstName: string; lastName: string };
  academicYear: string;
  casualLeave: number;
  casualLeaveUsed: number;
  earnedLeave: number;
  earnedLeaveUsed: number;
  medicalLeave: number;
  medicalLeaveUsed: number;
  unpaidLeave?: number;
  studyLeave?: number;
  maternityLeave?: number;
  paternityLeave?: number;
  bereavementLeave?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLeaveBalanceDto {
  employeeId: string;
  academicYear: string;
  casualLeave: number;
  earnedLeave: number;
  medicalLeave: number;
  unpaidLeave?: number;
  studyLeave?: number;
  maternityLeave?: number;
  paternityLeave?: number;
  bereavementLeave?: number;
}

class LeaveBalanceService {
  private endpoint = '/api/v1/hr/leave-balances';

  async getAll(filters?: {
    employeeId?: string;
    academicYear?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: LeaveBalance[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.academicYear) params.append('academicYear', filters.academicYear);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{
      data: LeaveBalance[];
      total: number;
      pagination: any;
    }>(url);
    return {
      data: response.data,
      total: response.pagination?.total || 0,
    };
  }

  async getById(id: string): Promise<LeaveBalance> {
    const response = await apiClient.get<{ data: LeaveBalance }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: CreateLeaveBalanceDto): Promise<LeaveBalance> {
    const response = await apiClient.post<{ data: LeaveBalance }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateLeaveBalanceDto>): Promise<LeaveBalance> {
    const response = await apiClient.put<{ data: LeaveBalance }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async deductLeave(
    id: string,
    leaveType: string,
    days: number
  ): Promise<LeaveBalance> {
    const response = await apiClient.post<{ data: LeaveBalance }>(
      `${this.endpoint}/${id}/deduct`,
      { leaveType, days }
    );
    return response.data;
  }

  async restoreLeave(
    id: string,
    leaveType: string,
    days: number
  ): Promise<LeaveBalance> {
    const response = await apiClient.post<{ data: LeaveBalance }>(
      `${this.endpoint}/${id}/restore`,
      { leaveType, days }
    );
    return response.data;
  }

  async getAvailableLeave(id: string, leaveType: string): Promise<number> {
    const response = await apiClient.get<{ data: { availableDays: number } }>(
      `${this.endpoint}/${id}/available/${leaveType}`
    );
    return response.data.availableDays;
  }

  async getCurrentBalance(employeeId: string): Promise<LeaveBalance> {
    const response = await apiClient.get<{ data: LeaveBalance }>(
      `${this.endpoint}/employee/${employeeId}/current`
    );
    return response.data;
  }

  async processCarryOver(id: string): Promise<LeaveBalance> {
    const response = await apiClient.post<{ data: LeaveBalance }>(
      `${this.endpoint}/${id}/carry-over`,
      {}
    );
    return response.data;
  }
}

export const leaveBalanceService = new LeaveBalanceService();
