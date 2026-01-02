import { PrismaClient, Route, Stop, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteFilters {
  schoolId: string;
  branchId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  search?: string;
  isActive?: boolean;
}

interface CreateRouteData {
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  schoolId: string;
  branchId?: string;
}

interface UpdateRouteData {
  name?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isActive?: boolean;
}

interface StopFilters {
  schoolId: string;
  branchId?: string;
  stopType?: 'PICKUP' | 'DROP' | 'BOTH';
  search?: string;
  isActive?: boolean;
}

interface CreateStopData {
  name: string;
  latitude: number;
  longitude: number;
  stopType: 'PICKUP' | 'DROP' | 'BOTH';
  address?: string;
  schoolId: string;
  branchId?: string;
}

interface UpdateStopData {
  name?: string;
  latitude?: number;
  longitude?: number;
  stopType?: 'PICKUP' | 'DROP' | 'BOTH';
  address?: string;
  isActive?: boolean;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class RouteService {
  // ==================== ROUTE OPERATIONS ====================

  async createRoute(data: CreateRouteData): Promise<Route> {
    return prisma.route.create({
      data: {
        name: data.name,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        schoolId: data.schoolId,
        branchId: data.branchId,
      },
    });
  }

  async getRoutes(
    filters: RouteFilters,
    pagination?: PaginationParams
  ): Promise<{ data: Route[]; total: number }> {
    const where: Prisma.RouteWhereInput = {
      schoolId: filters.schoolId,
      ...(filters.branchId && { branchId: filters.branchId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = pagination ? (pagination.page || 0) * (pagination.limit || 10) : undefined;
    const take = pagination?.limit || 10;

    const [data, total] = await Promise.all([
      prisma.route.findMany({
        where,
        include: { stops: { include: { stop: true } } },
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      prisma.route.count({ where }),
    ]);

    return { data, total };
  }

  async getRouteById(id: string, schoolId: string): Promise<Route | null> {
    return prisma.route.findFirst({
      where: { id, schoolId },
      include: {
        stops: {
          include: { stop: true },
          orderBy: { sequence: 'asc' },
        },
        vehicleAssignments: {
          include: { vehicle: true },
          where: { effectiveTo: null },
        },
        driverAssignments: {
          include: { driver: true },
          where: { effectiveTo: null },
        },
        studentAssignments: true,
        trips: true,
      },
    });
  }

  async updateRoute(id: string, schoolId: string, data: UpdateRouteData): Promise<Route> {
    const route = await prisma.route.findFirst({
      where: { id, schoolId },
    });

    if (!route) {
      throw new Error('Route not found or access denied');
    }

    return prisma.route.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.status && { status: data.status }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteRoute(id: string, schoolId: string): Promise<Route> {
    const route = await prisma.route.findFirst({
      where: { id, schoolId },
    });

    if (!route) {
      throw new Error('Route not found or access denied');
    }

    return prisma.route.update({
      where: { id },
      data: { status: 'INACTIVE', isActive: false },
    });
  }

  async addStopToRoute(
    routeId: string,
    stopId: string,
    sequence: number,
    waitTimeMinutes: number = 5,
    schoolId?: string
  ): Promise<any> {
    if (schoolId) {
      const route = await prisma.route.findFirst({
        where: { id: routeId, schoolId },
      });

      if (!route) {
        throw new Error('Route not found or access denied');
      }
    }

    // Check if stop already exists in route
    const existing = await prisma.routeStop.findFirst({
      where: { routeId, stopId },
    });

    if (existing) {
      throw new Error('Stop is already added to this route');
    }

    // Check if sequence is already taken
    const sequenceExists = await prisma.routeStop.findFirst({
      where: { routeId, sequence },
    });

    if (sequenceExists) {
      throw new Error('Sequence number is already taken for this route');
    }

    return prisma.routeStop.create({
      data: {
        routeId,
        stopId,
        sequence,
        waitTimeMinutes,
      },
      include: { route: true, stop: true },
    });
  }

  async removeStopFromRoute(routeId: string, stopId: string, schoolId?: string): Promise<any> {
    if (schoolId) {
      const route = await prisma.route.findFirst({
        where: { id: routeId, schoolId },
      });

      if (!route) {
        throw new Error('Route not found or access denied');
      }
    }

    const routeStop = await prisma.routeStop.findFirst({
      where: { routeId, stopId },
    });

    if (!routeStop) {
      throw new Error('Stop not found in this route');
    }

    return prisma.routeStop.delete({
      where: { id: routeStop.id },
    });
  }

  async updateRouteStopSequence(
    routeId: string,
    stopId: string,
    newSequence: number,
    schoolId?: string
  ): Promise<any> {
    if (schoolId) {
      const route = await prisma.route.findFirst({
        where: { id: routeId, schoolId },
      });

      if (!route) {
        throw new Error('Route not found or access denied');
      }
    }

    const routeStop = await prisma.routeStop.findFirst({
      where: { routeId, stopId },
    });

    if (!routeStop) {
      throw new Error('Stop not found in this route');
    }

    // Check if new sequence is already taken
    const sequenceExists = await prisma.routeStop.findFirst({
      where: { routeId, sequence: newSequence, NOT: { id: routeStop.id } },
    });

    if (sequenceExists) {
      throw new Error('Sequence number is already taken for this route');
    }

    return prisma.routeStop.update({
      where: { id: routeStop.id },
      data: { sequence: newSequence },
    });
  }

  async getRouteStops(routeId: string, schoolId?: string): Promise<any[]> {
    if (schoolId) {
      const route = await prisma.route.findFirst({
        where: { id: routeId, schoolId },
      });

      if (!route) {
        throw new Error('Route not found or access denied');
      }
    }

    return prisma.routeStop.findMany({
      where: { routeId },
      include: { stop: true },
      orderBy: { sequence: 'asc' },
    });
  }

  // ==================== STOP OPERATIONS ====================

  async createStop(data: CreateStopData): Promise<Stop> {
    return prisma.stop.create({
      data: {
        name: data.name,
        latitude: new Prisma.Decimal(data.latitude),
        longitude: new Prisma.Decimal(data.longitude),
        stopType: data.stopType,
        address: data.address,
        schoolId: data.schoolId,
        branchId: data.branchId,
      },
    });
  }

  async getStops(
    filters: StopFilters,
    pagination?: PaginationParams
  ): Promise<{ data: Stop[]; total: number }> {
    const where: Prisma.StopWhereInput = {
      schoolId: filters.schoolId,
      ...(filters.branchId && { branchId: filters.branchId }),
      ...(filters.stopType && { stopType: filters.stopType }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { address: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = pagination ? (pagination.page || 0) * (pagination.limit || 10) : undefined;
    const take = pagination?.limit || 10;

    const [data, total] = await Promise.all([
      prisma.stop.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      prisma.stop.count({ where }),
    ]);

    return { data, total };
  }

  async getStopById(id: string, schoolId: string): Promise<Stop | null> {
    return prisma.stop.findFirst({
      where: { id, schoolId },
      include: {
        routes: {
          include: { route: true },
        },
        pickupStudents: true,
        dropStudents: true,
      },
    });
  }

  async updateStop(id: string, schoolId: string, data: UpdateStopData): Promise<Stop> {
    const stop = await prisma.stop.findFirst({
      where: { id, schoolId },
    });

    if (!stop) {
      throw new Error('Stop not found or access denied');
    }

    return prisma.stop.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.latitude !== undefined && { latitude: new Prisma.Decimal(data.latitude) }),
        ...(data.longitude !== undefined && { longitude: new Prisma.Decimal(data.longitude) }),
        ...(data.stopType && { stopType: data.stopType }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteStop(id: string, schoolId: string): Promise<Stop> {
    const stop = await prisma.stop.findFirst({
      where: { id, schoolId },
    });

    if (!stop) {
      throw new Error('Stop not found or access denied');
    }

    // Check if stop is used in any routes
    const routeStops = await prisma.routeStop.findMany({
      where: { stopId: id },
    });

    if (routeStops.length > 0) {
      throw new Error('Cannot delete stop that is assigned to routes. Remove from routes first.');
    }

    return prisma.stop.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export const routeService = new RouteService();
