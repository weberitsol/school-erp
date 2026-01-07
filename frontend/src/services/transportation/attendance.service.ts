import { apiClient } from '@/lib/api-client';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  tripId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT';
  syncedAt?: string;
}

export interface AttendanceStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  weeklyPresenceRate: number;
  weeklyAbsenceRate: number;
}

export interface SyncStatus {
  id: string;
  tripId: string;
  date: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  recordsToSync: number;
  recordsSynced: number;
  failureReason?: string;
  syncedAt?: string;
}

class AttendanceService {
  private endpoint = '/api/v1/transportation';

  async syncTripAttendance(tripId: string): Promise<void> {
    await apiClient.post<{ success: boolean }>(`${this.endpoint}/trips/${tripId}/attendance/sync`, {});
  }

  async finalizeTripAttendance(tripId: string): Promise<void> {
    await apiClient.post<{ success: boolean }>(`${this.endpoint}/trips/${tripId}/attendance/finalize`, {});
  }

  async getStudentAttendance(studentId: string, date: string): Promise<AttendanceRecord[]> {
    const response = await apiClient.get<{ data: AttendanceRecord[] }>(
      `${this.endpoint}/students/${studentId}/attendance/${date}`
    );
    return response.data;
  }

  async getStudentAttendanceHistory(studentId: string): Promise<AttendanceRecord[]> {
    const response = await apiClient.get<{ data: AttendanceRecord[] }>(
      `${this.endpoint}/students/${studentId}/attendance-history`
    );
    return response.data;
  }

  async getClassAttendance(classId: string, date: string): Promise<AttendanceRecord[]> {
    const response = await apiClient.get<{ data: AttendanceRecord[] }>(
      `${this.endpoint}/classes/${classId}/attendance/${date}`
    );
    return response.data;
  }

  async notifyAbsence(studentId: string): Promise<void> {
    await apiClient.post<{ success: boolean }>(
      `${this.endpoint}/students/${studentId}/notify-absence`,
      {}
    );
  }

  async notifyClassAbsences(classId: string, date: string): Promise<void> {
    await apiClient.post<{ success: boolean }>(
      `${this.endpoint}/classes/${classId}/notify-absences/${date}`,
      {}
    );
  }

  async batchSync(tripIds: string[]): Promise<void> {
    await apiClient.post<{ success: boolean }>(`${this.endpoint}/attendance/batch-sync`, {
      tripIds,
    });
  }

  async getAttendanceStatsBySection(classId: string): Promise<any> {
    const response = await apiClient.get<{ data: any }>(
      `${this.endpoint}/attendance/stats-by-section?classId=${classId}`
    );
    return response.data;
  }

  async getAbsenceSummary(filters?: {
    startDate?: string;
    endDate?: string;
    classId?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.classId) params.append('classId', filters.classId);

    const queryString = params.toString();
    const url = queryString
      ? `${this.endpoint}/attendance/absence-summary?${queryString}`
      : `${this.endpoint}/attendance/absence-summary`;

    const response = await apiClient.get<{ data: any }>(url);
    return response.data;
  }
}

export const attendanceService = new AttendanceService();
