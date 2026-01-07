import { apiClient } from '@/lib/api-client';

export interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseClass: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  assignedVehicles?: string[];
  assignedRoutes?: string[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDriverDto {
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseClass: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateDriverDto extends Partial<CreateDriverDto> {
  id: string;
}

export interface LicenseExpiryCheck {
  driverId: string;
  fullName: string;
  licenseNumber: string;
  licenseExpiry: string;
  daysUntilExpiry: number;
  status: 'EXPIRED' | 'EXPIRING_SOON' | 'VALID';
}

class DriversService {
  private endpoint = '/api/v1/transportation/drivers';

  async getAll(filters?: {
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<Driver[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

    const response = await apiClient.get<{ data: Driver[] }>(url);
    return response.data;
  }

  async getById(id: string): Promise<Driver> {
    const response = await apiClient.get<{ data: Driver }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: CreateDriverDto): Promise<Driver> {
    const response = await apiClient.post<{ data: Driver }>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateDriverDto>): Promise<Driver> {
    const response = await apiClient.put<{ data: Driver }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
  }

  async checkLicenseExpiry(): Promise<LicenseExpiryCheck[]> {
    const response = await apiClient.get<{ data: LicenseExpiryCheck[] }>(`${this.endpoint}/check-expiry`);
    return response.data;
  }

  async getAssignedRoutes(driverId: string): Promise<string[]> {
    const response = await apiClient.get<{ data: string[] }>(`${this.endpoint}/${driverId}/routes`);
    return response.data;
  }

  async assignRoute(driverId: string, routeId: string): Promise<void> {
    await apiClient.post<{ success: boolean }>(`${this.endpoint}/${driverId}/routes`, { routeId });
  }

  async unassignRoute(driverId: string, routeId: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${driverId}/routes/${routeId}`);
  }

  async getTrips(driverId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`${this.endpoint}/${driverId}/trips`);
    return response.data;
  }
}

export const driversService = new DriversService();
