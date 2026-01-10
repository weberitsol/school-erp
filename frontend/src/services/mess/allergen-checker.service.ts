import { apiClient } from '@/lib/api-client';

/**
 * CRITICAL FRONTEND SERVICE
 * Client-side representation of allergen checking logic
 */

export interface AllergenCheckResult {
  safe: boolean;
  studentId: string;
  variantId: string;
  timestamp: string;
  conflictingAllergens?: Array<{
    allergenId: string;
    allergenName: string;
    severity: string;
    studentSeverity: string;
    ingredientFoodItems: string[];
  }>;
  requiresManagerOverride: boolean;
  blockReason?: string;
  notes?: string;
}

class AllergenCheckerService {
  private endpoint = '/api/v1/mess/allergies';

  /**
   * PRIMARY METHOD - Check if meal variant is safe for student
   * CRITICAL: Returns 403 if unsafe
   */
  async checkMealVariant(
    studentId: string,
    variantId: string
  ): Promise<AllergenCheckResult> {
    try {
      const response = await apiClient.post<{ data: AllergenCheckResult }>(
        `${this.endpoint}/check-meal`,
        { studentId, variantId }
      );
      return response.data;
    } catch (error: any) {
      // If 403, meal is unsafe
      if (error.response?.status === 403) {
        return {
          safe: false,
          studentId,
          variantId,
          timestamp: new Date().toISOString(),
          blockReason: error.response?.data?.error || 'Meal contains allergen',
          requiresManagerOverride: error.response?.data?.requiresOverride || false,
          conflictingAllergens: error.response?.data?.data?.conflictingAllergens,
        };
      }
      throw error;
    }
  }

  /**
   * Check multiple variants at once
   */
  async checkMultipleVariants(
    studentId: string,
    variantIds: string[]
  ): Promise<{ total: number; safe: number; unsafe: number; results: AllergenCheckResult[] }> {
    const response = await apiClient.post<{
      data: { total: number; safe: number; unsafe: number; results: AllergenCheckResult[] };
    }>(
      `${this.endpoint}/check-variants`,
      { studentId, variantIds }
    );
    return response.data;
  }

  /**
   * Get safe meal variants for student
   */
  async getSafeMealVariants(studentId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(
      `/api/v1/mess/students/${studentId}/safe-variants`
    );
    return response.data;
  }

  /**
   * Get check history for audit
   */
  async getCheckHistory(studentId?: string, limit: number = 50): Promise<any[]> {
    const params = new URLSearchParams();
    if (studentId) params.append('studentId', studentId);
    params.append('limit', limit.toString());

    const response = await apiClient.get<{ data: any[] }>(
      `${this.endpoint}/history?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Manager override for severe allergens
   * CRITICAL: Logged for accountability
   */
  async overrideCheck(
    studentId: string,
    variantId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      warning?: string;
    }>(
      `${this.endpoint}/override`,
      { studentId, variantId, reason }
    );

    return {
      success: response.success,
      message: response.message,
    };
  }
}

export const allergenCheckerService = new AllergenCheckerService();
