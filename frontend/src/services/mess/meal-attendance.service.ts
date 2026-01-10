import axios from 'axios';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mess`;

export interface MealAttendanceInput {
  studentId: string;
  enrollmentId: string;
  mealId: string;
  variantId?: string;
  status: 'PRESENT' | 'ABSENT' | 'HOLIDAY';
  attendanceDate: Date;
}

export interface MealAttendance {
  id: string;
  enrollmentId: string;
  mealId: string;
  variantId?: string;
  status: string;
  attendanceDate: Date;
  allergyVerified: boolean;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
  meal: any;
  variant: any;
  enrollment: any;
}

export interface SafeVariant {
  id: string;
  variantType: string;
  variantCost: number;
  description?: string;
  isSafe: boolean;
  requiresOverride: boolean;
  conflictingAllergens: Array<{
    allergenName: string;
    severity: string;
  }>;
}

export interface AttendanceSummary {
  enrollmentId: string;
  month: number;
  year: number;
  totalDays: number;
  presentCount: number;
  absentCount: number;
  holidayCount: number;
  allergyVerifiedCount: number;
  totalCost: number;
  attendances: MealAttendance[];
}

class MealAttendanceService {
  async markAttendance(data: MealAttendanceInput): Promise<MealAttendance> {
    const response = await axios.post(`${API_BASE}/attendance/mark`, {
      ...data,
      attendanceDate: data.attendanceDate.toISOString(),
    });
    return response.data.data;
  }

  async getAll(filters?: {
    enrollmentId?: string;
    mealId?: string;
    status?: string;
  }): Promise<{ data: MealAttendance[]; total: number }> {
    const response = await axios.get(`${API_BASE}/attendance`, { params: filters });
    return response.data;
  }

  async getById(id: string): Promise<MealAttendance> {
    const response = await axios.get(`${API_BASE}/attendance/${id}`);
    return response.data.data;
  }

  async getSafeVariants(
    studentId: string,
    mealId: string
  ): Promise<{
    safeVariants: SafeVariant[];
    unsafeVariants: SafeVariant[];
    totalVariants: number;
    safeCount: number;
    unsafeCount: number;
  }> {
    const response = await axios.get(
      `${API_BASE}/meals/${mealId}/safe-variants/${studentId}`
    );
    return response.data.data;
  }

  async getMonthlyAttendance(
    enrollmentId: string,
    year: number,
    month: number
  ): Promise<AttendanceSummary> {
    const response = await axios.get(
      `${API_BASE}/attendance/enrollment/${enrollmentId}/monthly`,
      {
        params: { year, month },
      }
    );
    return response.data.data;
  }

  async getAttendanceStats(
    enrollmentId: string
  ): Promise<{
    enrollmentId: string;
    totalMeals: number;
    presentCount: number;
    absentCount: number;
    holidayCount: number;
    attendancePercentage: number;
    allergyVerificationRate: number;
  }> {
    const response = await axios.get(
      `${API_BASE}/attendance/enrollment/${enrollmentId}/stats`
    );
    return response.data.data;
  }

  async update(
    id: string,
    data: Partial<MealAttendanceInput>
  ): Promise<MealAttendance> {
    const response = await axios.put(`${API_BASE}/attendance/${id}`, {
      ...data,
      attendanceDate: data.attendanceDate?.toISOString(),
    });
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/attendance/${id}`);
  }
}

export const mealAttendanceService = new MealAttendanceService();
