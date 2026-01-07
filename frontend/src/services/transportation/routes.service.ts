import { apiClient } from '@/lib/api-client';

export interface BoardingPoint {
  id: string;
  name: string;
  sequence: number;
  latitude?: number;
  longitude?: number;
  arrivalTime: string;
}

export interface Route {
  id: string;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: 'ACTIVE' | 'INACTIVE';
  schoolId: string;
  branchId?: string | null;
  isActive: boolean;
  stops?: BoardingPoint[];
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields for backward compatibility
  startPoint?: string;
  endPoint?: string;
  distance?: number;
  departureTime?: string;
  arrivalTime?: string;
  operatingDays?: string[];
  boardingPoints?: BoardingPoint[];
}

export interface CreateRouteDto {
  name: string;
  startPoint: string;
  endPoint: string;
  distance: number;
  departureTime: string;
  arrivalTime: string;
  operatingDays: string[];
  boardingPoints: Omit<BoardingPoint, 'id'>[];
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateRouteDto extends Partial<CreateRouteDto> {
  id: string;
}

class RoutesService {
  private endpoint = '/api/v1/transportation/routes';

  async getAll(filters?: {
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<Route[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: Route[] }>(url);
    return response.data;
  }

  async getById(id: string): Promise<Route> {
    const response = await apiClient.get<{ data: Route }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: CreateRouteDto): Promise<Route> {
    const response = await apiClient.post<{ data: Route }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateRouteDto>): Promise<Route> {
    const response = await apiClient.put<{ data: Route }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async getStops(routeId: string): Promise<BoardingPoint[]> {
    const response = await apiClient.get<{ data: BoardingPoint[] }>(`${this.endpoint}/${routeId}/stops`);
    return response.data;
  }

  async addStop(routeId: string, stop: Omit<BoardingPoint, 'id'>): Promise<BoardingPoint> {
    const response = await apiClient.post<{ data: BoardingPoint }>(`${this.endpoint}/${routeId}/stops`, stop);
    return response.data;
  }

  async removeStop(routeId: string, stopId: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${routeId}/stops/${stopId}`);
  }

  async updateStopSequence(
    routeId: string,
    updates: Array<{ stopId: string; sequence: number }>
  ): Promise<void> {
    await apiClient.put<{ success: boolean }>(`${this.endpoint}/${routeId}/stops/sequence`, { updates });
  }
}

export const routesService = new RoutesService();
