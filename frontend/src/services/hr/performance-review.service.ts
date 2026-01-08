import { apiClient } from '@/lib/api-client';

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employee?: { id: string; firstName: string; lastName: string };
  reviewCycleId: string;
  reviewPeriod?: string;
  year: number;
  technicalSkills: number;
  communication?: number;
  teamwork?: number;
  initiative?: number;
  reliability?: number;
  customerService?: number;
  overallRating?: number;
  reviewedById: string;
  reviewDate: string;
  promotionEligible: boolean;
  raisesPercentage?: number;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePerformanceReviewDto {
  employeeId: string;
  reviewCycleId: string;
  reviewPeriod?: string;
  year: number;
  technicalSkills: number;
  communication?: number;
  teamwork?: number;
  initiative?: number;
  reliability?: number;
  customerService?: number;
  reviewedById: string;
  reviewDate: string;
  promotionEligible?: boolean;
  raisesPercentage?: number;
  remarks?: string;
}

class PerformanceReviewService {
  private endpoint = '/api/v1/hr/performance-reviews';

  async getAll(filters?: {
    employeeId?: string;
    reviewCycleId?: string;
    year?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: PerformanceReview[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.reviewCycleId) params.append('reviewCycleId', filters.reviewCycleId);
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{
      data: PerformanceReview[];
      total: number;
      pagination: any;
    }>(url);
    return {
      data: response.data,
      total: response.pagination?.total || 0,
    };
  }

  async getById(id: string): Promise<PerformanceReview> {
    const response = await apiClient.get<{ data: PerformanceReview }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: CreatePerformanceReviewDto): Promise<PerformanceReview> {
    const response = await apiClient.post<{ data: PerformanceReview }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreatePerformanceReviewDto>): Promise<PerformanceReview> {
    const response = await apiClient.put<{ data: PerformanceReview }>(
      `${this.endpoint}/${id}`,
      data
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async getPromotionEligible(): Promise<PerformanceReview[]> {
    const response = await apiClient.get<{ data: PerformanceReview[] }>(
      `${this.endpoint}/eligible`
    );
    return response.data;
  }

  async getCycleStats(cycleId: string): Promise<any> {
    const response = await apiClient.get<{ data: any }>(
      `${this.endpoint}/cycle/${cycleId}/stats`
    );
    return response.data;
  }

  async getDepartmentStats(departmentId: string): Promise<any> {
    const response = await apiClient.get<{ data: any }>(
      `${this.endpoint}/department/${departmentId}/stats`
    );
    return response.data;
  }
}

export const performanceReviewService = new PerformanceReviewService();
