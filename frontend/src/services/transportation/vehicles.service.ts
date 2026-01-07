import { apiClient } from '@/lib/api-client';

export interface Vehicle {
  id: string;
  registrationNo: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  type: 'BUS' | 'MINIBUS' | 'VAN';
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  assignedDriver?: string;
  assignedRoutes?: string[];
  boardingPoints?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVehicleDto {
  registrationNo: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  type: 'BUS' | 'MINIBUS' | 'VAN';
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface UpdateVehicleDto extends Partial<CreateVehicleDto> {
  id: string;
}

class VehiclesService {
  private endpoint = '/api/v1/transportation/vehicles';

  async getAll(filters?: {
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<Vehicle[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: Vehicle[] }>(url);
    return response.data;
  }

  async getById(id: string): Promise<Vehicle> {
    const response = await apiClient.get<{ data: Vehicle }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: CreateVehicleDto): Promise<Vehicle> {
    const response = await apiClient.post<{ data: Vehicle }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateVehicleDto>): Promise<Vehicle> {
    const response = await apiClient.put<{ data: Vehicle }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async getAssignedDrivers(vehicleId: string): Promise<string[]> {
    const response = await apiClient.get<{ data: string[] }>(`${this.endpoint}/${vehicleId}/drivers`);
    return response.data;
  }

  async assignDriver(vehicleId: string, driverId: string): Promise<void> {
    await apiClient.post<{ success: boolean }>(`${this.endpoint}/${vehicleId}/drivers`, { driverId });
  }

  async unassignDriver(vehicleId: string, driverId: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${vehicleId}/drivers/${driverId}`);
  }

  async getMaintenanceHistory(vehicleId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`${this.endpoint}/${vehicleId}/maintenance`);
    return response.data;
  }
}

export const vehiclesService = new VehiclesService();
