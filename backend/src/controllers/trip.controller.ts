import { Request, Response } from 'express';
import { tripManagementService } from '../services/trip-management.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const tripController = {
  /**
   * POST /api/v1/transportation/trips
   * Create a new trip
   */
  async createTrip(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { routeId, vehicleId, driverId, tripDate } = req.body;

      // Validation
      if (!routeId || !vehicleId || !driverId || !tripDate) {
        return res.status(400).json({
          success: false,
          error: 'routeId, vehicleId, driverId, and tripDate are required',
        });
      }

      // Parse and validate tripDate
      const date = new Date(tripDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid tripDate format. Use ISO 8601 format.',
        });
      }

      // Create trip
      const trip = await tripManagementService.createTrip({
        routeId,
        vehicleId,
        driverId,
        tripDate: date,
        schoolId,
      });

      res.status(201).json({
        success: true,
        data: trip,
        message: 'Trip created successfully',
      });
    } catch (error: any) {
      console.error('Error creating trip:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to create trip',
      });
    }
  },

  /**
   * GET /api/v1/transportation/trips/:id
   * Get trip details
   */
  async getTripDetails(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      const trip = await tripManagementService.getTripDetails(id, schoolId);

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found or access denied',
        });
      }

      res.json({
        success: true,
        data: trip,
      });
    } catch (error: any) {
      console.error('Error getting trip details:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get trip details',
      });
    }
  },

  /**
   * GET /api/v1/transportation/trips
   * List trips with filters and pagination
   */
  async listTrips(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { routeId, vehicleId, driverId, status, startDate, endDate, page, limit } =
        req.query;

      const filters: any = { schoolId };

      if (routeId) filters.routeId = routeId as string;
      if (vehicleId) filters.vehicleId = vehicleId as string;
      if (driverId) filters.driverId = driverId as string;
      if (status) filters.status = status as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);

      const result = await tripManagementService.listTrips(filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error listing trips:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list trips',
      });
    }
  },

  /**
   * PUT /api/v1/transportation/trips/:id
   * Update trip
   */
  async updateTrip(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const { routeId, vehicleId, driverId, tripDate, status, startTime, endTime } = req.body;

      const updateInput: any = {};
      if (routeId) updateInput.routeId = routeId;
      if (vehicleId) updateInput.vehicleId = vehicleId;
      if (driverId) updateInput.driverId = driverId;
      if (tripDate) updateInput.tripDate = new Date(tripDate);
      if (status) updateInput.status = status;
      if (startTime) updateInput.startTime = new Date(startTime);
      if (endTime) updateInput.endTime = new Date(endTime);

      const trip = await tripManagementService.updateTrip(id, schoolId, updateInput);

      res.json({
        success: true,
        data: trip,
        message: 'Trip updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating trip:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update trip',
      });
    }
  },

  /**
   * POST /api/v1/transportation/trips/:id/start
   * Start a trip (transition from SCHEDULED to IN_PROGRESS)
   */
  async startTrip(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      const trip = await tripManagementService.startTrip(id, schoolId);

      res.json({
        success: true,
        data: trip,
        message: 'Trip started successfully',
      });
    } catch (error: any) {
      console.error('Error starting trip:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to start trip',
      });
    }
  },

  /**
   * POST /api/v1/transportation/trips/:id/complete
   * Complete a trip (transition from IN_PROGRESS to COMPLETED)
   */
  async completeTrip(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      const trip = await tripManagementService.completeTrip(id, schoolId);

      res.json({
        success: true,
        data: trip,
        message: 'Trip completed successfully',
      });
    } catch (error: any) {
      console.error('Error completing trip:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to complete trip',
      });
    }
  },

  /**
   * POST /api/v1/transportation/trips/:id/cancel
   * Cancel a trip
   */
  async cancelTrip(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const { reason } = req.body;

      const trip = await tripManagementService.cancelTrip(id, schoolId, reason);

      res.json({
        success: true,
        data: trip,
        message: 'Trip cancelled successfully',
      });
    } catch (error: any) {
      console.error('Error cancelling trip:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to cancel trip',
      });
    }
  },

  /**
   * GET /api/v1/transportation/trips/date/:date
   * Get trips for a specific date
   */
  async getTripsForDate(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { date } = req.params;
      const { routeId, vehicleId, driverId } = req.query;

      // Parse date
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD.',
        });
      }

      const filters: any = {};
      if (routeId) filters.routeId = routeId;
      if (vehicleId) filters.vehicleId = vehicleId;
      if (driverId) filters.driverId = driverId;

      const trips = await tripManagementService.getTripsForDate(schoolId, parsedDate, filters);

      res.json({
        success: true,
        data: {
          date,
          trips,
          count: trips.length,
        },
      });
    } catch (error: any) {
      console.error('Error getting trips for date:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get trips for date',
      });
    }
  },

  /**
   * GET /api/v1/transportation/trips/active
   * Get all active trips (IN_PROGRESS)
   */
  async getActiveTrips(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const trips = await tripManagementService.getActiveTrips(schoolId);

      res.json({
        success: true,
        data: {
          trips,
          count: trips.length,
        },
      });
    } catch (error: any) {
      console.error('Error getting active trips:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get active trips',
      });
    }
  },

  /**
   * GET /api/v1/transportation/trips/:id/students
   * Get students for a trip
   */
  async getTripStudents(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      // Verify trip exists and belongs to school
      const trip = await prisma.trip.findFirst({
        where: { id, schoolId },
      });

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found or access denied',
        });
      }

      const students = await tripManagementService.getTripStudents(id);

      res.json({
        success: true,
        data: {
          tripId: id,
          students,
          count: students.length,
          boarded: students.filter((s: any) => s.boarded).length,
          alighted: students.filter((s: any) => s.alighted).length,
          absent: students.filter((s: any) => s.absent).length,
        },
      });
    } catch (error: any) {
      console.error('Error getting trip students:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get trip students',
      });
    }
  },

  /**
   * GET /api/v1/transportation/statistics
   * Get trip statistics
   */
  async getTripStatistics(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { startDate, endDate } = req.query;

      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const stats = await tripManagementService.getTripStatistics(schoolId, filters);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error getting trip statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get trip statistics',
      });
    }
  },
};
