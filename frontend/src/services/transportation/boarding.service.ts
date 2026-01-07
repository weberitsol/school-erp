import { apiClient } from '@/lib/api-client';

export interface BoardingRecord {
  id: string;
  tripId: string;
  studentId: string;
  stopId: string;
  status: 'PENDING' | 'BOARDED' | 'ABSENT';
  boardingTime?: string;
  photo?: string;
}

export interface BoardingSummary {
  tripId: string;
  totalStudents: number;
  boarded: number;
  absent: number;
  pending: number;
  successRate: number;
}

class BoardingService {
  private endpoint = '/api/v1/transportation/trips';

  async recordPickup(
    tripId: string,
    studentId: string,
    stopId: string,
    photo?: string
  ): Promise<BoardingRecord> {
    const response = await apiClient.post<{ data: BoardingRecord }>(`${this.endpoint}/${tripId}/boarding/pickup`, {
      studentId,
      stopId,
      photo,
    });
    return response.data;
  }

  async recordDropoff(tripId: string, studentId: string, stopId: string): Promise<BoardingRecord> {
    const response = await apiClient.post<{ data: BoardingRecord }>(`${this.endpoint}/${tripId}/alighting/dropoff`, {
      studentId,
      stopId,
    });
    return response.data;
  }

  async markAbsent(tripId: string, studentId: string): Promise<BoardingRecord> {
    const response = await apiClient.post<{ data: BoardingRecord }>(`${this.endpoint}/${tripId}/attendance/absent`, {
      studentId,
    });
    return response.data;
  }

  async getBoardingSummary(tripId: string): Promise<BoardingSummary> {
    const response = await apiClient.get<{ data: BoardingSummary }>(`${this.endpoint}/${tripId}/boarding/summary`);
    return response.data;
  }

  async getPendingStudents(tripId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`${this.endpoint}/${tripId}/boarding/pending`);
    return response.data;
  }

  async getPendingAlighting(tripId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`${this.endpoint}/${tripId}/alighting/pending`);
    return response.data;
  }

  async autoBoardStudents(tripId: string): Promise<void> {
    await apiClient.post<{ success: boolean }>(`${this.endpoint}/${tripId}/boarding/auto`, {});
  }

  async uploadBoardingPhoto(
    tripId: string,
    studentId: string,
    photo: string
  ): Promise<void> {
    await apiClient.put<{ success: boolean }>(
      `${this.endpoint}/${tripId}/students/${studentId}/boarding/photo`,
      { photo }
    );
  }

  async getStudentBoardingHistory(
    tripId: string,
    studentId: string
  ): Promise<BoardingRecord[]> {
    const response = await apiClient.get<{ data: BoardingRecord[] }>(
      `${this.endpoint}/${tripId}/students/${studentId}/boarding`
    );
    return response.data;
  }

  async finalizeBoardingAttendance(tripId: string): Promise<void> {
    await apiClient.post<{ success: boolean }>(`${this.endpoint}/${tripId}/attendance/finalize`, {});
  }
}

export const boardingService = new BoardingService();
