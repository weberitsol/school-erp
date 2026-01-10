import { apiClient } from '@/lib/api-client';

export interface MealFeedback {
  id: string;
  mealId: string;
  studentId: string;
  schoolId: string;
  rating: 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT';
  comments?: string;
  createdAt: string;
  updatedAt: string;
  meal?: any;
  student?: any;
  actions?: FeedbackAction[];
}

export interface FeedbackAction {
  id: string;
  feedbackId: string;
  schoolId: string;
  actionDescription: string;
  actionDate: string;
  completionDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  feedback?: MealFeedback;
}

export interface FeedbackFilters {
  mealId?: string;
  studentId?: string;
  rating?: string;
  skip?: number;
  take?: number;
}

export interface FeedbackStats {
  totalFeedbacks: number;
  excellentCount: number;
  goodCount: number;
  averageCount: number;
  poorCount: number;
  averageRating: number;
}

class FeedbackService {
  private apiBase = '/api/v1/mess';

  /**
   * Create meal feedback
   */
  async createFeedback(
    mealId: string,
    rating: 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT',
    comments?: string
  ): Promise<MealFeedback> {
    const response = await apiClient.post(`${this.apiBase}/feedback`, {
      mealId,
      rating,
      comments,
    });
    return response.data;
  }

  /**
   * Get feedback list
   */
  async getFeedback(filters?: FeedbackFilters): Promise<{
    data: MealFeedback[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.mealId) params.append('mealId', filters.mealId);
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.rating) params.append('rating', filters.rating);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.apiBase}/feedback?${queryString}` : `${this.apiBase}/feedback`;

    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Get feedback by ID
   */
  async getFeedbackById(id: string): Promise<MealFeedback> {
    const response = await apiClient.get(`${this.apiBase}/feedback/${id}`);
    return response.data;
  }

  /**
   * Update feedback
   */
  async updateFeedback(
    id: string,
    rating?: 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT',
    comments?: string
  ): Promise<MealFeedback> {
    const response = await apiClient.put(`${this.apiBase}/feedback/${id}`, {
      rating,
      comments,
    });
    return response.data;
  }

  /**
   * Delete feedback
   */
  async deleteFeedback(id: string): Promise<void> {
    await apiClient.delete(`${this.apiBase}/feedback/${id}`);
  }

  /**
   * Get school feedback stats
   */
  async getSchoolFeedbackStats(): Promise<FeedbackStats> {
    const response = await apiClient.get(`${this.apiBase}/feedback/stats/school`);
    return response.data;
  }

  /**
   * Get recent feedback
   */
  async getRecentFeedback(limit?: number): Promise<MealFeedback[]> {
    const url = limit
      ? `${this.apiBase}/feedback/stats/recent?limit=${limit}`
      : `${this.apiBase}/feedback/stats/recent`;
    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Get meal feedback stats
   */
  async getMealFeedbackStats(mealId: string): Promise<FeedbackStats> {
    const response = await apiClient.get(`${this.apiBase}/feedback/stats/meal/${mealId}`);
    return response.data;
  }

  /**
   * Get student feedback
   */
  async getStudentFeedback(): Promise<MealFeedback[]> {
    const response = await apiClient.get(`${this.apiBase}/feedback/student/my-feedback`);
    return response.data;
  }

  /**
   * Create feedback action
   */
  async createFeedbackAction(
    feedbackId: string,
    actionDescription: string,
    actionDate: Date
  ): Promise<FeedbackAction> {
    const response = await apiClient.post(`${this.apiBase}/feedback-actions`, {
      feedbackId,
      actionDescription,
      actionDate,
    });
    return response.data;
  }

  /**
   * Get feedback actions
   */
  async getFeedbackActions(filters?: any): Promise<{
    data: FeedbackAction[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.feedbackId) params.append('feedbackId', filters.feedbackId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const queryString = params.toString();
    const url = queryString
      ? `${this.apiBase}/feedback-actions?${queryString}`
      : `${this.apiBase}/feedback-actions`;

    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Update feedback action
   */
  async updateFeedbackAction(
    id: string,
    actionDescription?: string,
    actionDate?: Date,
    status?: string
  ): Promise<FeedbackAction> {
    const response = await apiClient.put(`${this.apiBase}/feedback-actions/${id}`, {
      actionDescription,
      actionDate,
      status,
    });
    return response.data;
  }

  /**
   * Complete feedback action
   */
  async completeFeedbackAction(id: string): Promise<FeedbackAction> {
    const response = await apiClient.put(
      `${this.apiBase}/feedback-actions/${id}/complete`
    );
    return response.data;
  }

  /**
   * Get open actions
   */
  async getOpenActions(): Promise<FeedbackAction[]> {
    const response = await apiClient.get(`${this.apiBase}/feedback-actions/open`);
    return response.data;
  }

  /**
   * Get action stats
   */
  async getActionStats(): Promise<any> {
    const response = await apiClient.get(`${this.apiBase}/feedback-actions/stats`);
    return response.data;
  }

  /**
   * Format rating as string
   */
  formatRating(rating: string): string {
    const ratings: Record<string, string> = {
      POOR: 'Poor',
      AVERAGE: 'Average',
      GOOD: 'Good',
      EXCELLENT: 'Excellent',
    };
    return ratings[rating] || rating;
  }

  /**
   * Get rating color
   */
  getRatingColor(rating: string): string {
    const colors: Record<string, string> = {
      POOR: 'bg-red-100 text-red-800',
      AVERAGE: 'bg-yellow-100 text-yellow-800',
      GOOD: 'bg-blue-100 text-blue-800',
      EXCELLENT: 'bg-green-100 text-green-800',
    };
    return colors[rating] || 'bg-gray-100 text-gray-800';
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

export const feedbackService = new FeedbackService();
