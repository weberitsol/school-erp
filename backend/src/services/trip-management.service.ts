import { PrismaClient, TripStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateTripInput {
  routeId: string;
  vehicleId: string;
  driverId: string;
  tripDate: Date;
  schoolId: string;
}

interface UpdateTripInput {
  routeId?: string;
  vehicleId?: string;
  driverId?: string;
  tripDate?: Date;
  status?: TripStatus;
  startTime?: Date;
  endTime?: Date;
}

interface TripFilters {
  schoolId: string;
  routeId?: string;
  vehicleId?: string;
  driverId?: string;
  status?: TripStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

interface TripDetails {
  id: string;
  route: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  };
  vehicle: {
    id: string;
    registrationNumber: string;
    type: string;
    capacity: number;
  };
  driver: {
    id: string;
    name: string;
    phone: string;
  };
  tripDate: Date;
  status: TripStatus;
  startTime: Date | null;
  endTime: Date | null;
  students: {
    total: number;
    boarded: number;
    alighted: number;
    absent: number;
  };
}

/**
 * Service for managing trips
 * Handles creation, scheduling, status updates, and queries
 */
class TripManagementService {
  /**
   * Create a new trip
   */
  async createTrip(input: CreateTripInput): Promise<TripDetails> {
    // Validate that all referenced entities exist
    const [route, vehicle, driver] = await Promise.all([
      prisma.route.findFirst({
        where: { id: input.routeId, schoolId: input.schoolId },
      }),
      prisma.vehicle.findFirst({
        where: { id: input.vehicleId, schoolId: input.schoolId },
      }),
      prisma.driver.findFirst({
        where: { id: input.driverId, schoolId: input.schoolId },
      }),
    ]);

    if (!route) {
      throw new Error('Route not found or access denied');
    }
    if (!vehicle) {
      throw new Error('Vehicle not found or access denied');
    }
    if (!driver) {
      throw new Error('Driver not found or access denied');
    }

    // Check if a trip already exists for this date/route/vehicle combination
    const existingTrip = await prisma.trip.findFirst({
      where: {
        routeId: input.routeId,
        vehicleId: input.vehicleId,
        tripDate: {
          equals: new Date(input.tripDate.toDateString()),
        },
      },
    });

    if (existingTrip) {
      throw new Error('Trip already exists for this date, route, and vehicle');
    }

    // Create the trip
    const trip = await prisma.trip.create({
      data: {
        routeId: input.routeId,
        vehicleId: input.vehicleId,
        driverId: input.driverId,
        tripDate: input.tripDate,
        schoolId: input.schoolId,
        status: 'SCHEDULED',
      },
      include: {
        route: true,
        vehicle: true,
        driver: true,
        studentRecords: true,
      },
    });

    return this.formatTripDetails(trip);
  }

  /**
   * Get trip details with student boarding information
   */
  async getTripDetails(tripId: string, schoolId: string): Promise<TripDetails | null> {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, schoolId },
      include: {
        route: true,
        vehicle: true,
        driver: true,
        studentRecords: true,
      },
    });

    if (!trip) {
      return null;
    }

    return this.formatTripDetails(trip);
  }

  /**
   * List trips with filters and pagination
   */
  async listTrips(filters: TripFilters): Promise<{
    trips: TripDetails[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { schoolId: filters.schoolId };

    if (filters.routeId) where.routeId = filters.routeId;
    if (filters.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters.driverId) where.driverId = filters.driverId;
    if (filters.status) where.status = filters.status;

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.tripDate = {};
      if (filters.startDate) {
        where.tripDate.gte = new Date(filters.startDate.toDateString());
      }
      if (filters.endDate) {
        // Include entire end date
        const endDate = new Date(filters.endDate);
        endDate.setDate(endDate.getDate() + 1);
        where.tripDate.lt = endDate;
      }
    }

    // Get total count
    const total = await prisma.trip.count({ where });

    // Get paginated trips
    const trips = await prisma.trip.findMany({
      where,
      include: {
        route: true,
        vehicle: true,
        driver: true,
        studentRecords: true,
      },
      orderBy: { tripDate: 'desc' },
      skip,
      take: limit,
    });

    const formattedTrips = trips.map((trip) => this.formatTripDetails(trip));

    return {
      trips: formattedTrips,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Update trip status and details
   */
  async updateTrip(tripId: string, schoolId: string, input: UpdateTripInput): Promise<TripDetails> {
    // Verify trip exists
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, schoolId },
    });

    if (!trip) {
      throw new Error('Trip not found or access denied');
    }

    // Validate new references if provided
    if (input.routeId && input.routeId !== trip.routeId) {
      const route = await prisma.route.findFirst({
        where: { id: input.routeId, schoolId },
      });
      if (!route) throw new Error('Route not found or access denied');
    }

    if (input.vehicleId && input.vehicleId !== trip.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: input.vehicleId, schoolId },
      });
      if (!vehicle) throw new Error('Vehicle not found or access denied');
    }

    if (input.driverId && input.driverId !== trip.driverId) {
      const driver = await prisma.driver.findFirst({
        where: { id: input.driverId, schoolId },
      });
      if (!driver) throw new Error('Driver not found or access denied');
    }

    // Validate status transitions
    if (input.status) {
      this.validateStatusTransition(trip.status, input.status);
    }

    // Update trip
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(input.routeId && { routeId: input.routeId }),
        ...(input.vehicleId && { vehicleId: input.vehicleId }),
        ...(input.driverId && { driverId: input.driverId }),
        ...(input.tripDate && { tripDate: input.tripDate }),
        ...(input.status && { status: input.status }),
        ...(input.startTime !== undefined && { startTime: input.startTime }),
        ...(input.endTime !== undefined && { endTime: input.endTime }),
      },
      include: {
        route: true,
        vehicle: true,
        driver: true,
        studentRecords: true,
      },
    });

    return this.formatTripDetails(updatedTrip);
  }

  /**
   * Start a trip (set status to IN_PROGRESS and record start time)
   */
  async startTrip(tripId: string, schoolId: string): Promise<TripDetails> {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, schoolId },
    });

    if (!trip) {
      throw new Error('Trip not found or access denied');
    }

    if (trip.status !== 'SCHEDULED') {
      throw new Error(`Cannot start trip in ${trip.status} status. Must be SCHEDULED.`);
    }

    // Verify vehicle and driver are available
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: trip.vehicleId },
    });

    if (!vehicle || vehicle.status !== 'ACTIVE') {
      throw new Error('Vehicle is not available for this trip');
    }

    const driver = await prisma.driver.findUnique({
      where: { id: trip.driverId },
    });

    if (!driver || driver.status !== 'ACTIVE') {
      throw new Error('Driver is not available for this trip');
    }

    // Update trip status
    return this.updateTrip(tripId, schoolId, {
      status: 'IN_PROGRESS',
      startTime: new Date(),
    });
  }

  /**
   * Complete a trip (set status to COMPLETED and record end time)
   */
  async completeTrip(tripId: string, schoolId: string): Promise<TripDetails> {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, schoolId },
    });

    if (!trip) {
      throw new Error('Trip not found or access denied');
    }

    if (trip.status !== 'IN_PROGRESS') {
      throw new Error(`Cannot complete trip in ${trip.status} status. Must be IN_PROGRESS.`);
    }

    // Update trip status
    return this.updateTrip(tripId, schoolId, {
      status: 'COMPLETED',
      endTime: new Date(),
    });
  }

  /**
   * Cancel a trip
   */
  async cancelTrip(tripId: string, schoolId: string, reason?: string): Promise<TripDetails> {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, schoolId },
    });

    if (!trip) {
      throw new Error('Trip not found or access denied');
    }

    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      throw new Error(`Cannot cancel trip in ${trip.status} status`);
    }

    // Update trip status
    return this.updateTrip(tripId, schoolId, {
      status: 'CANCELLED',
    });
  }

  /**
   * Get scheduled trips for a specific date
   */
  async getTripsForDate(
    schoolId: string,
    date: Date,
    filters?: { routeId?: string; vehicleId?: string; driverId?: string }
  ): Promise<TripDetails[]> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const where: any = {
      schoolId,
      tripDate: {
        gte: dayStart,
        lte: dayEnd,
      },
    };

    if (filters?.routeId) where.routeId = filters.routeId;
    if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters?.driverId) where.driverId = filters.driverId;

    const trips = await prisma.trip.findMany({
      where,
      include: {
        route: true,
        vehicle: true,
        driver: true,
        studentRecords: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return trips.map((trip) => this.formatTripDetails(trip));
  }

  /**
   * Get active trips (IN_PROGRESS)
   */
  async getActiveTrips(schoolId: string): Promise<TripDetails[]> {
    const trips = await prisma.trip.findMany({
      where: {
        schoolId,
        status: 'IN_PROGRESS',
      },
      include: {
        route: true,
        vehicle: true,
        driver: true,
        studentRecords: true,
      },
      orderBy: { startTime: 'desc' },
    });

    return trips.map((trip) => this.formatTripDetails(trip));
  }

  /**
   * Get trip statistics
   */
  async getTripStatistics(
    schoolId: string,
    filters?: { startDate?: Date; endDate?: Date }
  ): Promise<{
    totalTrips: number;
    scheduledTrips: number;
    inProgressTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    totalStudentsServed: number;
    averageOccupancy: number;
  }> {
    const where: any = { schoolId };

    if (filters?.startDate || filters?.endDate) {
      where.tripDate = {};
      if (filters.startDate) {
        where.tripDate.gte = new Date(filters.startDate.toDateString());
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setDate(endDate.getDate() + 1);
        where.tripDate.lt = endDate;
      }
    }

    // Get counts by status
    const [totalTrips, scheduled, inProgress, completed, cancelled] = await Promise.all([
      prisma.trip.count({ where }),
      prisma.trip.count({ where: { ...where, status: 'SCHEDULED' } }),
      prisma.trip.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.trip.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.trip.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);

    // Get student statistics
    const studentStats = await prisma.studentTripRecord.aggregate({
      where: {
        trip: where,
      },
      _count: {
        id: true,
      },
    });

    // Calculate average occupancy
    const trips = await prisma.trip.findMany({
      where,
      include: { vehicle: true },
    });

    let totalCapacity = 0;
    let totalBoarded = 0;

    for (const trip of trips) {
      totalCapacity += trip.vehicle.capacity;
      const boarded = await prisma.studentTripRecord.count({
        where: { tripId: trip.id, boarded: true },
      });
      totalBoarded += boarded;
    }

    const averageOccupancy =
      trips.length > 0
        ? Math.round((totalBoarded / (trips.length * (totalCapacity / trips.length))) * 100)
        : 0;

    return {
      totalTrips,
      scheduledTrips: scheduled,
      inProgressTrips: inProgress,
      completedTrips: completed,
      cancelledTrips: cancelled,
      totalStudentsServed: studentStats._count.id,
      averageOccupancy,
    };
  }

  /**
   * Get students for a trip
   */
  async getTripStudents(tripId: string): Promise<any[]> {
    const records = await prisma.studentTripRecord.findMany({
      where: { tripId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            phone: true,
          },
        },
        studentRoute: {
          select: {
            pickupStopId: true,
            dropStopId: true,
          },
        },
      },
      orderBy: { student: { firstName: 'asc' } },
    });

    return records.map((record) => ({
      id: record.id,
      studentId: record.student.id,
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      admissionNo: record.student.admissionNo,
      boarded: record.boarded,
      boardingTime: record.boardingTime,
      boardingPhoto: record.boardingPhoto,
      alighted: record.alighted,
      alightingTime: record.alightingTime,
      alightingPhoto: record.alightingPhoto,
      absent: record.absent,
      pickupStop: record.studentRoute.pickupStopId,
      dropStop: record.studentRoute.dropStopId,
    }));
  }

  /**
   * Validate status transitions
   */
  private validateStatusTransition(currentStatus: TripStatus, newStatus: TripStatus): void {
    const validTransitions: Record<TripStatus, TripStatus[]> = {
      SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [], // No transitions from completed
      CANCELLED: [], // No transitions from cancelled
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(
        `Cannot transition from ${currentStatus} to ${newStatus}. ` +
        `Valid transitions: ${validTransitions[currentStatus].join(', ')}`
      );
    }
  }

  /**
   * Format trip data for API response
   */
  private formatTripDetails(trip: any): TripDetails {
    const studentRecords = trip.studentRecords || [];
    const boarded = studentRecords.filter((r: any) => r.boarded).length;
    const alighted = studentRecords.filter((r: any) => r.alighted).length;
    const absent = studentRecords.filter((r: any) => r.absent).length;

    return {
      id: trip.id,
      route: {
        id: trip.route.id,
        name: trip.route.name,
        startTime: trip.route.startTime,
        endTime: trip.route.endTime,
      },
      vehicle: {
        id: trip.vehicle.id,
        registrationNumber: trip.vehicle.registrationNumber,
        type: trip.vehicle.type,
        capacity: trip.vehicle.capacity,
      },
      driver: {
        id: trip.driver.id,
        name: `Driver ${trip.driver.licenseNumber}`,
        phone: trip.driver.phone,
      },
      tripDate: trip.tripDate,
      status: trip.status,
      startTime: trip.startTime,
      endTime: trip.endTime,
      students: {
        total: studentRecords.length,
        boarded,
        alighted,
        absent,
      },
    };
  }
}

export const tripManagementService = new TripManagementService();
