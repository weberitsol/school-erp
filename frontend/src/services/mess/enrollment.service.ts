import axios from 'axios';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mess`;

export interface MessEnrollmentInput {
  studentId: string;
  messId: string;
  planId: string;
  startDate: Date;
  endDate?: Date;
  dietaryPreferences?: string[];
}

export interface MessEnrollment {
  id: string;
  studentId: string;
  messId: string;
  planId: string;
  enrollmentDate: Date;
  startDate: Date;
  endDate?: Date;
  dietaryPreferences: string[];
  status: string;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
  student: any;
  mess: any;
  plan: any;
}

class EnrollmentService {
  async create(data: MessEnrollmentInput): Promise<MessEnrollment> {
    const response = await axios.post(`${API_BASE}/enrollments`, {
      ...data,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate?.toISOString(),
    });
    return response.data.data;
  }

  async getAll(filters?: {
    studentId?: string;
    messId?: string;
    status?: string;
  }): Promise<{ data: MessEnrollment[]; total: number }> {
    const response = await axios.get(`${API_BASE}/enrollments`, { params: filters });
    return response.data;
  }

  async getById(id: string): Promise<MessEnrollment> {
    const response = await axios.get(`${API_BASE}/enrollments/${id}`);
    return response.data.data;
  }

  async getStudentEnrollments(studentId: string): Promise<MessEnrollment[]> {
    const response = await axios.get(`${API_BASE}/students/${studentId}/enrollments`);
    return response.data.data;
  }

  async update(
    id: string,
    data: Partial<MessEnrollmentInput>
  ): Promise<MessEnrollment> {
    const response = await axios.put(`${API_BASE}/enrollments/${id}`, {
      ...data,
      startDate: data.startDate?.toISOString(),
      endDate: data.endDate?.toISOString(),
    });
    return response.data.data;
  }

  async endEnrollment(id: string): Promise<MessEnrollment> {
    const response = await axios.post(`${API_BASE}/enrollments/${id}/end`);
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/enrollments/${id}`);
  }

  async getMessStatistics(messId: string): Promise<any> {
    const response = await axios.get(`${API_BASE}/messes/${messId}/enrollment-stats`);
    return response.data.data;
  }
}

export const enrollmentService = new EnrollmentService();
