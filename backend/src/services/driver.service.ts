import { PrismaClient, Driver, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface DriverFilters {
  schoolId: string;
  branchId?: string;
  status?: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'RESIGNED';
  search?: string;
  isActive?: boolean;
}

interface CreateDriverData {
  userId: string;
  licenseNumber: string;
  licenseExpiry: string;
  phone: string;
  schoolId: string;
  branchId?: string;
}

interface UpdateDriverData {
  licenseNumber?: string;
  licenseExpiry?: string;
  phone?: string;
  status?: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'RESIGNED';
  isActive?: boolean;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class DriverService {
  async createDriver(data: CreateDriverData): Promise<Driver> {
    // Check if license number is unique
    const existing = await prisma.driver.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });

    if (existing) {
      throw new Error('Driver with this license number already exists');
    }

    // Check if user already has a driver profile
    const userDriver = await prisma.driver.findUnique({
      where: { userId: data.userId },
    });

    if (userDriver) {
      throw new Error('User already has a driver profile');
    }

    // Verify that the user exists and belongs to the school
    const user = await prisma.user.findFirst({
      where: { id: data.userId, schoolId: data.schoolId },
    });

    if (!user) {
      throw new Error('User not found or access denied');
    }

    return prisma.driver.create({
      data: {
        userId: data.userId,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry),
        phone: data.phone,
        schoolId: data.schoolId,
        branchId: data.branchId,
      },
      include: { user: true },
    });
  }

  async getDrivers(
    filters: DriverFilters,
    pagination?: PaginationParams
  ): Promise<{ data: Driver[]; total: number }> {
    const where: Prisma.DriverWhereInput = {
      schoolId: filters.schoolId,
      ...(filters.branchId && { branchId: filters.branchId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
        OR: [
          { licenseNumber: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
          { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const skip = pagination ? (pagination.page || 0) * (pagination.limit || 10) : undefined;
    const take = pagination?.limit || 10;

    const [data, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        include: { user: true },
        skip,
        take,
        orderBy: { user: { email: 'asc' } },
      }),
      prisma.driver.count({ where }),
    ]);

    return { data, total };
  }

  async getDriverById(id: string, schoolId: string): Promise<Driver | null> {
    return prisma.driver.findFirst({
      where: { id, schoolId },
      include: {
        user: true,
        vehicleAssignments: {
          include: { vehicle: true },
          where: { unassignedDate: null },
        },
        routeAssignments: {
          include: { route: true },
          where: { effectiveTo: null },
        },
        trips: true,
      },
    });
  }

  async updateDriver(
    id: string,
    schoolId: string,
    data: UpdateDriverData
  ): Promise<Driver> {
    // Check ownership
    const driver = await prisma.driver.findFirst({
      where: { id, schoolId },
    });

    if (!driver) {
      throw new Error('Driver not found or access denied');
    }

    // Check if updating license number to one that exists
    if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
      const existing = await prisma.driver.findUnique({
        where: { licenseNumber: data.licenseNumber },
      });

      if (existing) {
        throw new Error('Driver with this license number already exists');
      }
    }

    return prisma.driver.update({
      where: { id },
      data: {
        ...(data.licenseNumber && { licenseNumber: data.licenseNumber }),
        ...(data.licenseExpiry && { licenseExpiry: new Date(data.licenseExpiry) }),
        ...(data.phone && { phone: data.phone }),
        ...(data.status && { status: data.status }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { user: true },
    });
  }

  async deleteDriver(id: string, schoolId: string): Promise<Driver> {
    // Soft delete by marking as RESIGNED
    const driver = await prisma.driver.findFirst({
      where: { id, schoolId },
    });

    if (!driver) {
      throw new Error('Driver not found or access denied');
    }

    return prisma.driver.update({
      where: { id },
      data: { status: 'RESIGNED', isActive: false },
    });
  }

  async checkLicenseExpiry(schoolId: string): Promise<Driver[]> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return prisma.driver.findMany({
      where: {
        schoolId,
        licenseExpiry: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
      include: { user: true },
    });
  }

  async assignDriverToRoute(
    driverId: string,
    routeId: string,
    schoolId: string
  ): Promise<any> {
    // Verify driver and route exist and belong to the school
    const [driver, route] = await Promise.all([
      prisma.driver.findFirst({ where: { id: driverId, schoolId } }),
      prisma.route.findFirst({ where: { id: routeId, schoolId } }),
    ]);

    if (!driver || !route) {
      throw new Error('Driver or route not found or access denied');
    }

    // Check if assignment already exists
    const existing = await prisma.routeDriver.findFirst({
      where: {
        routeId,
        driverId,
        effectiveTo: null,
      },
    });

    if (existing) {
      throw new Error('Driver is already assigned to this route');
    }

    return prisma.routeDriver.create({
      data: {
        routeId,
        driverId,
      },
      include: { route: true, driver: true },
    });
  }

  async unassignDriverFromRoute(
    driverId: string,
    routeId: string,
    schoolId: string
  ): Promise<any> {
    const driver = await prisma.driver.findFirst({
      where: { id: driverId, schoolId },
    });

    if (!driver) {
      throw new Error('Driver not found or access denied');
    }

    const assignment = await prisma.routeDriver.findFirst({
      where: {
        routeId,
        driverId,
        effectiveTo: null,
      },
    });

    if (!assignment) {
      throw new Error('No active assignment found');
    }

    return prisma.routeDriver.update({
      where: { id: assignment.id },
      data: { effectiveTo: new Date() },
    });
  }

  async getDriverRoutes(driverId: string, schoolId: string): Promise<any[]> {
    const driver = await prisma.driver.findFirst({
      where: { id: driverId, schoolId },
    });

    if (!driver) {
      throw new Error('Driver not found or access denied');
    }

    return prisma.routeDriver.findMany({
      where: { driverId, effectiveTo: null },
      include: { route: true },
    });
  }

  async getDriverTrips(
    driverId: string,
    schoolId: string,
    pagination?: PaginationParams
  ): Promise<{ data: any[]; total: number }> {
    const driver = await prisma.driver.findFirst({
      where: { id: driverId, schoolId },
    });

    if (!driver) {
      throw new Error('Driver not found or access denied');
    }

    const skip = pagination ? (pagination.page || 0) * (pagination.limit || 10) : undefined;
    const take = pagination?.limit || 10;

    const [data, total] = await Promise.all([
      prisma.trip.findMany({
        where: { driverId },
        include: { route: true, vehicle: true },
        skip,
        take,
        orderBy: { tripDate: 'desc' },
      }),
      prisma.trip.count({ where: { driverId } }),
    ]);

    return { data, total };
  }
}

export const driverService = new DriverService();
