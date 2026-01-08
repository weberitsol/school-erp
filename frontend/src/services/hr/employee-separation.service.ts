import { apiClient } from '@/lib/api-client';

export interface EmployeeSeparation {
  id: string;
  employeeId: string;
  employee?: { id: string; firstName: string; lastName: string };
  separationDate: string;
  separationType: 'RESIGNATION' | 'RETIREMENT' | 'TERMINATION' | 'REDUNDANCY' | 'DEATH' | 'OTHER';
  reason?: string;
  reasonDescription?: string;
  noticeDate?: string;
  noticePeriod?: number;
  effectiveDate: string;
  settlementStatus: 'PENDING' | 'INITIATED' | 'PARTIAL' | 'COMPLETE';
  basicSalaryDue?: number;
  allowancesDue?: number;
  earnedLeavePayout?: number;
  gratuity?: number;
  bonusAdjustment?: number;
  loanRecovery?: number;
  otherAdjustments?: number;
  finalSettlementAmount?: number;
  certDocumentUrl?: string;
  certIssuanceDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSeparationDto {
  employeeId: string;
  separationDate: string;
  separationType: string;
  reason?: string;
  reasonDescription?: string;
  noticeDate?: string;
  noticePeriod?: number;
  effectiveDate: string;
}

interface SettlementCalculationDto {
  basicSalaryDue?: number;
  allowancesDue?: number;
  earnedLeavePayout?: number;
  gratuity?: number;
  bonusAdjustment?: number;
  loanRecovery?: number;
  otherAdjustments?: number;
}

class EmployeeSeparationService {
  private endpoint = '/api/v1/hr/separations';

  async getAll(filters?: {
    employeeId?: string;
    separationType?: string;
    settlementStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: EmployeeSeparation[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.separationType) params.append('separationType', filters.separationType);
    if (filters?.settlementStatus) params.append('settlementStatus', filters.settlementStatus);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{
      data: EmployeeSeparation[];
      total: number;
      pagination: any;
    }>(url);
    return {
      data: response.data,
      total: response.pagination?.total || 0,
    };
  }

  async getById(id: string): Promise<EmployeeSeparation> {
    const response = await apiClient.get<{ data: EmployeeSeparation }>(
      `${this.endpoint}/${id}`
    );
    return response.data;
  }

  async create(data: CreateSeparationDto): Promise<EmployeeSeparation> {
    const response = await apiClient.post<{ data: EmployeeSeparation }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateSeparationDto>): Promise<EmployeeSeparation> {
    const response = await apiClient.put<{ data: EmployeeSeparation }>(
      `${this.endpoint}/${id}`,
      data
    );
    return response.data;
  }

  async calculateSettlement(
    id: string,
    calculation: SettlementCalculationDto
  ): Promise<EmployeeSeparation> {
    const response = await apiClient.post<{ data: EmployeeSeparation }>(
      `${this.endpoint}/${id}/calculate-settlement`,
      calculation
    );
    return response.data;
  }

  async approveFinalSettlement(
    id: string,
    approvedById: string
  ): Promise<EmployeeSeparation> {
    const response = await apiClient.post<{ data: EmployeeSeparation }>(
      `${this.endpoint}/${id}/approve-settlement`,
      { approvedById }
    );
    return response.data;
  }

  async generateExperienceCertificate(
    id: string,
    documentUrl: string
  ): Promise<EmployeeSeparation> {
    const response = await apiClient.post<{ data: EmployeeSeparation }>(
      `${this.endpoint}/${id}/generate-certificate`,
      { documentUrl }
    );
    return response.data;
  }

  async getByEmployee(employeeId: string): Promise<EmployeeSeparation[]> {
    const response = await apiClient.get<{ data: EmployeeSeparation[] }>(
      `${this.endpoint}/employee/${employeeId}`
    );
    return response.data;
  }

  async getPending(): Promise<EmployeeSeparation[]> {
    const response = await apiClient.get<{ data: EmployeeSeparation[] }>(
      `${this.endpoint}/pending`
    );
    return response.data;
  }

  async getByType(type: string): Promise<EmployeeSeparation[]> {
    const response = await apiClient.get<{ data: EmployeeSeparation[] }>(
      `${this.endpoint}/type/${type}`
    );
    return response.data;
  }

  async getByDateRange(startDate: string, endDate: string): Promise<EmployeeSeparation[]> {
    const response = await apiClient.post<{ data: EmployeeSeparation[] }>(
      `${this.endpoint}/date-range`,
      { startDate, endDate }
    );
    return response.data;
  }

  async getStats(): Promise<any> {
    const response = await apiClient.get<{ data: any }>(`${this.endpoint}/stats`);
    return response.data;
  }

  async getAvgSettlementAmount(): Promise<number> {
    const response = await apiClient.get<{ data: { averageSettlementAmount: number } }>(
      `${this.endpoint}/stats/average-settlement`
    );
    return response.data.averageSettlementAmount;
  }
}

export const employeeSeparationService = new EmployeeSeparationService();
