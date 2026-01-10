import { apiClient } from '@/lib/api-client';

export interface StudentAllergy {
  id: string;
  studentId: string;
  allergenId: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLAXIS';
  doctorName?: string;
  doctorContactNumber?: string;
  verificationDocumentUrl?: string;
  verificationDate?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateStudentAllergyDto {
  studentId: string;
  allergenId: string;
  severity?: string;
  doctorName?: string;
  doctorContactNumber?: string;
  verificationDocumentUrl?: string;
  verificationDate?: string;
}

class StudentAllergyService {
  private endpoint = '/api/v1/mess/allergies';

  async getAll(filters?: {
    studentId?: string;
    allergenId?: string;
    isVerified?: boolean;
  }): Promise<{ data: StudentAllergy[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.allergenId) params.append('allergenId', filters.allergenId);
    if (filters?.isVerified !== undefined) params.append('isVerified', filters.isVerified.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: StudentAllergy[]; total: number }>(url);
    return response;
  }

  async getById(id: string): Promise<StudentAllergy> {
    const response = await apiClient.get<{ data: StudentAllergy }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async getByStudent(studentId: string): Promise<StudentAllergy[]> {
    const response = await apiClient.get<{ data: StudentAllergy[] }>(
      `/api/v1/mess/enrollments/${studentId}/allergies`
    );
    return response.data;
  }

  async getCriticalAllergies(studentId: string): Promise<StudentAllergy[]> {
    const response = await apiClient.get<{ data: StudentAllergy[] }>(
      `/api/v1/mess/students/${studentId}/critical-allergies`
    );
    return response.data;
  }

  async create(data: CreateStudentAllergyDto): Promise<StudentAllergy> {
    const response = await apiClient.post<{ data: StudentAllergy }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateStudentAllergyDto>): Promise<StudentAllergy> {
    const response = await apiClient.put<{ data: StudentAllergy }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async verify(id: string): Promise<StudentAllergy> {
    const response = await apiClient.post<{ data: StudentAllergy }>(
      `${this.endpoint}/${id}/verify`,
      {}
    );
    return response.data;
  }

  async reject(id: string): Promise<StudentAllergy> {
    const response = await apiClient.post<{ data: StudentAllergy }>(
      `${this.endpoint}/${id}/reject`,
      {}
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }
}

export const studentAllergyService = new StudentAllergyService();
