import { apiClient } from '@/lib/api-client';

export interface MessComplaint {
  id: string;
  studentId: string;
  schoolId: string;
  title: string;
  description: string;
  category?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolutionNotes?: string;
  resolutionDate?: string;
  createdAt: string;
  updatedAt: string;
  student?: any;
}

export interface ComplaintFilters {
  status?: string;
  category?: string;
  studentId?: string;
  skip?: number;
  take?: number;
}

export interface ComplaintStats {
  totalComplaints: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  averageResolutionTime: number;
}

class ComplaintService {
  private apiBase = '/api/v1/mess';

  /**
   * Create complaint
   */
  async createComplaint(
    title: string,
    description: string,
    category?: string
  ): Promise<MessComplaint> {
    const response = await apiClient.post(`${this.apiBase}/complaints`, {
      title,
      description,
      category,
    });
    return response.data;
  }

  /**
   * Get complaints list
   */
  async getComplaints(filters?: ComplaintFilters): Promise<{
    data: MessComplaint[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const queryString = params.toString();
    const url = queryString
      ? `${this.apiBase}/complaints?${queryString}`
      : `${this.apiBase}/complaints`;

    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Get complaint by ID
   */
  async getComplaintById(id: string): Promise<MessComplaint> {
    const response = await apiClient.get(`${this.apiBase}/complaints/${id}`);
    return response.data;
  }

  /**
   * Update complaint
   */
  async updateComplaint(
    id: string,
    title?: string,
    description?: string,
    category?: string
  ): Promise<MessComplaint> {
    const response = await apiClient.put(`${this.apiBase}/complaints/${id}`, {
      title,
      description,
      category,
    });
    return response.data;
  }

  /**
   * Update complaint status
   */
  async updateComplaintStatus(
    id: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
    resolutionNotes?: string
  ): Promise<MessComplaint> {
    const response = await apiClient.put(`${this.apiBase}/complaints/${id}/status`, {
      status,
      resolutionNotes,
    });
    return response.data;
  }

  /**
   * Delete complaint
   */
  async deleteComplaint(id: string): Promise<void> {
    await apiClient.delete(`${this.apiBase}/complaints/${id}`);
  }

  /**
   * Get open complaints
   */
  async getOpenComplaints(filters?: ComplaintFilters): Promise<{
    data: MessComplaint[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const queryString = params.toString();
    const url = queryString
      ? `${this.apiBase}/complaints/open/list?${queryString}`
      : `${this.apiBase}/complaints/open/list`;

    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Get complaints by category
   */
  async getComplaintsByCategory(category: string): Promise<MessComplaint[]> {
    const response = await apiClient.get(
      `${this.apiBase}/complaints/category/${category}`
    );
    return response.data;
  }

  /**
   * Get student complaints
   */
  async getStudentComplaints(): Promise<MessComplaint[]> {
    const response = await apiClient.get(`${this.apiBase}/complaints/student/my-complaints`);
    return response.data;
  }

  /**
   * Get complaint categories
   */
  async getCategories(): Promise<string[]> {
    const response = await apiClient.get(`${this.apiBase}/complaints/categories/list`);
    return response.data;
  }

  /**
   * Get complaint stats
   */
  async getComplaintStats(): Promise<ComplaintStats> {
    const response = await apiClient.get(`${this.apiBase}/complaints/stats/summary`);
    return response.data;
  }

  /**
   * Get complaint summary
   */
  async getComplaintSummary(): Promise<any> {
    const response = await apiClient.get(`${this.apiBase}/complaints/stats/breakdown`);
    return response.data;
  }

  /**
   * Format status
   */
  formatStatus(status: string): string {
    const statuses: Record<string, string> = {
      OPEN: 'Open',
      IN_PROGRESS: 'In Progress',
      RESOLVED: 'Resolved',
      CLOSED: 'Closed',
    };
    return statuses[status] || status;
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      OPEN: 'bg-red-100 text-red-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-blue-100 text-blue-800',
      CLOSED: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }
}

export const complaintService = new ComplaintService();
