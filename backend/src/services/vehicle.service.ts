import { PrismaClient, Vehicle, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface VehicleFilters {
  schoolId: string;
  branchId?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'RETIRED';
  type?: 'BUS' | 'VAN' | 'CAR' | 'AUTO' | 'TEMPO';
  search?: string;
  isActive?: boolean;
}

interface CreateVehicleData {
  registrationNumber: string;
  type: 'BUS' | 'VAN' | 'CAR' | 'AUTO' | 'TEMPO';
  capacity: number;
  gpsDeviceId?: string;
  schoolId: string;
  branchId?: string;
  purchaseDate?: string;
}

interface UpdateVehicleData {
  registrationNumber?: string;
  type?: 'BUS' | 'VAN' | 'CAR' | 'AUTO' | 'TEMPO';
  capacity?: number;
  gpsDeviceId?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'RETIRED';
  purchaseDate?: string;
  isActive?: boolean;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class VehicleService {
  async createVehicle(data: CreateVehicleData): Promise<Vehicle> {
    // Check if registration number is unique
    const existing = await prisma.vehicle.findUnique({
      where: { registrationNumber: data.registrationNumber },
    });

    if (existing) {
      throw new Error('Vehicle with this registration number already exists');
    }

    return prisma.vehicle.create({
      data: {
        registrationNumber: data.registrationNumber,
        type: data.type,
        capacity: data.capacity,
        gpsDeviceId: data.gpsDeviceId,
        schoolId: data.schoolId,
        branchId: data.branchId,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      },
    });
  }

  async getVehicles(
    filters: VehicleFilters,
    pagination?: PaginationParams
  ): Promise<{ data: Vehicle[]; total: number }> {
    const where: Prisma.VehicleWhereInput = {
      schoolId: filters.schoolId,
      ...(filters.branchId && { branchId: filters.branchId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
        OR: [
          { registrationNumber: { contains: filters.search, mode: 'insensitive' } },
          { gpsDeviceId: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = pagination ? (pagination.page || 0) * (pagination.limit || 10) : undefined;
    const take = pagination?.limit || 10;

    const [data, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take,
        orderBy: { registrationNumber: 'asc' },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return { data, total };
  }

  async getVehicleById(id: string, schoolId: string): Promise<Vehicle | null> {
    return prisma.vehicle.findFirst({
      where: { id, schoolId },
      include: {
        routeVehicles: {
          include: { route: true },
        },
        vehicleDrivers: {
          include: { driver: true },
        },
        trips: true,
        maintenanceLogs: true,
      },
    });
  }

  async updateVehicle(
    id: string,
    schoolId: string,
    data: UpdateVehicleData
  ): Promise<Vehicle> {
    // Check ownership
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, schoolId },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found or access denied');
    }

    // Check if updating registration number to one that exists
    if (data.registrationNumber && data.registrationNumber !== vehicle.registrationNumber) {
      const existing = await prisma.vehicle.findUnique({
        where: { registrationNumber: data.registrationNumber },
      });

      if (existing) {
        throw new Error('Vehicle with this registration number already exists');
      }
    }

    return prisma.vehicle.update({
      where: { id },
      data: {
        ...(data.registrationNumber && { registrationNumber: data.registrationNumber }),
        ...(data.type && { type: data.type }),
        ...(data.capacity && { capacity: data.capacity }),
        ...(data.gpsDeviceId !== undefined && { gpsDeviceId: data.gpsDeviceId }),
        ...(data.status && { status: data.status }),
        ...(data.purchaseDate && { purchaseDate: new Date(data.purchaseDate) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteVehicle(id: string, schoolId: string): Promise<Vehicle> {
    // Soft delete by marking as RETIRED
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, schoolId },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found or access denied');
    }

    return prisma.vehicle.update({
      where: { id },
      data: { status: 'RETIRED', isActive: false },
    });
  }

  async getVehicleMaintenanceHistory(
    vehicleId: string,
    schoolId: string,
    pagination?: PaginationParams
  ): Promise<{ data: any[]; total: number }> {
    // Verify vehicle ownership
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, schoolId },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found or access denied');
    }

    const skip = pagination ? (pagination.page || 0) * (pagination.limit || 10) : undefined;
    const take = pagination?.limit || 10;

    const [data, total] = await Promise.all([
      prisma.vehicleMaintenanceLog.findMany({
        where: { vehicleId },
        include: { recordedBy: true },
        skip,
        take,
        orderBy: { date: 'desc' },
      }),
      prisma.vehicleMaintenanceLog.count({ where: { vehicleId } }),
    ]);

    return { data, total };
  }

  async assignDriverToVehicle(
    vehicleId: string,
    driverId: string,
    schoolId: string
  ): Promise<any> {
    // Verify both vehicle and driver exist and belong to the school
    const [vehicle, driver] = await Promise.all([
      prisma.vehicle.findFirst({ where: { id: vehicleId, schoolId } }),
      prisma.driver.findFirst({ where: { id: driverId, schoolId } }),
    ]);

    if (!vehicle || !driver) {
      throw new Error('Vehicle or driver not found or access denied');
    }

    // Check if assignment already exists
    const existing = await prisma.vehicleDriver.findFirst({
      where: {
        vehicleId,
        driverId,
        unassignedDate: null,
      },
    });

    if (existing) {
      throw new Error('Driver is already assigned to this vehicle');
    }

    return prisma.vehicleDriver.create({
      data: {
        vehicleId,
        driverId,
      },
      include: { vehicle: true, driver: true },
    });
  }

  async unassignDriverFromVehicle(
    vehicleId: string,
    driverId: string,
    schoolId: string
  ): Promise<any> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, schoolId },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found or access denied');
    }

    const assignment = await prisma.vehicleDriver.findFirst({
      where: {
        vehicleId,
        driverId,
        unassignedDate: null,
      },
    });

    if (!assignment) {
      throw new Error('No active assignment found');
    }

    return prisma.vehicleDriver.update({
      where: { id: assignment.id },
      data: { unassignedDate: new Date() },
    });
  }

  async getVehicleDrivers(vehicleId: string, schoolId: string): Promise<any[]> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, schoolId },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found or access denied');
    }

    return prisma.vehicleDriver.findMany({
      where: { vehicleId },
      include: { driver: true },
      orderBy: { assignedDate: 'desc' },
    });
  }
}

export const vehicleService = new VehicleService();
