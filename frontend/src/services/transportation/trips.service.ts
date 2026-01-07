import { apiClient } from '@/lib/api-client';

export interface Trip {
  id: string;
  tripDate: string;
  routeId: string;
  driverId: string;
  vehicleId: string;
  tripType: 'PICKUP' | 'DROPOFF' | 'ROUND_TRIP';
  studentsCount: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  eta?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // API response includes these nested objects
  route?: {
    id: string;
    name: string;
    startTime?: string;
    endTime?: string;
  };
  vehicle?: {
    id: string;
    registrationNumber: string;
    type: string;
    capacity: number;
  };
  driver?: {
    id: string;
    name?: string;
    phone?: string;
  };
  startTime?: string;
  endTime?: string;
  students?: {
    total: number;
    boarded: number;
    alighted: number;
    absent: number;
  };
}

export interface CreateTripDto {
  tripDate: string;
  routeId: string;
  driverId: string;
  vehicleId: string;
  tripType: 'PICKUP' | 'DROPOFF' | 'ROUND_TRIP';
  studentsCount: number;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export interface UpdateTripDto extends Partial<CreateTripDto> {
  id: string;
}

export interface TripStatistics {
  totalTrips: number;
  completedTrips: number;
  inProgressTrips: number;
  cancelledTrips: number;
  onTimeRate: number;
}

class TripsService {
  private endpoint = '/api/v1/transportation/trips';

  async getAll(filters?: {
    status?: string;
    routeId?: string;
    driverId?: string;
    skip?: number;
    take?: number;
  }): Promise<Trip[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.routeId) params.append('routeId', filters.routeId);
    if (filters?.driverId) params.append('driverId', filters.driverId);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: { trips: Trip[] } }>(url);
    // Handle pagination response format
    return response.data.trips || response.data as any;
  }

  async getById(id: string): Promise<Trip> {
    const response = await apiClient.get<{ data: Trip }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: CreateTripDto): Promise<Trip> {
    const response = await apiClient.post<{ data: Trip }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateTripDto>): Promise<Trip> {
    const response = await apiClient.put<{ data: Trip }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async startTrip(id: string): Promise<Trip> {
    const response = await apiClient.post<{ data: Trip }>(`${this.endpoint}/${id}/start`, {});
    return response.data;
  }

  async completeTrip(id: string): Promise<Trip> {
    const response = await apiClient.post<{ data: Trip }>(`${this.endpoint}/${id}/complete`, {});
    return response.data;
  }

  async cancelTrip(id: string): Promise<Trip> {
    const response = await apiClient.post<{ data: Trip }>(`${this.endpoint}/${id}/cancel`, {});
    return response.data;
  }

  async getTripsByDate(date: string): Promise<Trip[]> {
    const response = await apiClient.get<{ data: Trip[] }>(`${this.endpoint}/date/${date}`);
    return response.data;
  }

  async getActiveTrips(): Promise<Trip[]> {
    const response = await apiClient.get<{ data: Trip[] }>(`${this.endpoint}/active`);
    return response.data;
  }

  async getStudents(tripId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`${this.endpoint}/${tripId}/students`);
    return response.data;
  }

  async getEta(tripId: string): Promise<{
    estimatedArrival: string;
    remainingTime: number;
    remainingDistance: number;
  }> {
    const response = await apiClient.get<{ data: { estimatedArrival: string; remainingTime: number; remainingDistance: number } }>(`${this.endpoint}/${tripId}/eta`);
    return response.data;
  }

  async getStatistics(): Promise<TripStatistics> {
    const response = await apiClient.get<{ data: TripStatistics }>(`${this.endpoint}/statistics`);
    return response.data;
  }
}

export const tripsService = new TripsService();
