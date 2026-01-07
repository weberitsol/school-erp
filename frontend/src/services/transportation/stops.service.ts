import { apiClient } from '@/lib/api-client';

export interface Stop {
  id: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  stopType: 'PICKUP' | 'DROPOFF' | 'BOTH';
  geofenceRadius: number;
  expectedArrivalTime?: string;
  assignedRoutes?: string[];
  sequence: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStopDto {
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  stopType: 'PICKUP' | 'DROPOFF' | 'BOTH';
  geofenceRadius: number;
  expectedArrivalTime?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateStopDto extends Partial<CreateStopDto> {
  id: string;
}

class StopsService {
  private endpoint = '/api/v1/transportation/stops';

  async getAll(filters?: {
    status?: string;
    routeId?: string;
    skip?: number;
    take?: number;
  }): Promise<Stop[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.routeId) params.append('routeId', filters.routeId);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: Stop[] }>(url);
    return response.data;
  }

  async getById(id: string): Promise<Stop> {
    const response = await apiClient.get<{ data: Stop }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: CreateStopDto): Promise<Stop> {
    const response = await apiClient.post<{ data: Stop }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateStopDto>): Promise<Stop> {
    const response = await apiClient.put<{ data: Stop }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async getAssignedStudents(stopId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`${this.endpoint}/${stopId}/students`);
    return response.data;
  }
}

export const stopsService = new StopsService();
