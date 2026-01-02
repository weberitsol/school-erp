import { Request, Response } from 'express';
import { etaCalculationService } from '../services/eta-calculation.service';
import { tripProgressService } from '../services/trip-progress.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const etaController = {
  /**
   * GET /api/v1/transportation/trips/:tripId/eta
   * Get comprehensive ETA breakdown for entire trip (all remaining stops)
   */
  async getRouteETABreakdown(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { tripId } = req.params;

      // Verify trip exists and belongs to school
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, schoolId },
        include: {
          vehicle: true,
          route: {
            include: {
              stops: {
                include: { stop: true },
                orderBy: { sequence: 'asc' },
              },
            },
          },
        },
      });

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found or access denied',
        });
      }

      // Get current vehicle location
      const currentLoc = await prisma.gPSLocation.findFirst({
        where: { vehicleId: trip.vehicleId },
        orderBy: { timestamp: 'desc' },
      });

      if (!currentLoc) {
        return res.status(400).json({
          success: false,
          error: 'No current location data available for vehicle',
        });
      }

      // Build remaining stops list
      const remainingStops = trip.route.stops.map((rs) => ({
        id: rs.stop.id,
        name: rs.stop.name,
        latitude: parseFloat(rs.stop.latitude.toString()),
        longitude: parseFloat(rs.stop.longitude.toString()),
      }));

      // Calculate ETA breakdown
      const breakdown = await etaCalculationService.calculateRouteProgressBreakdown(
        tripId,
        trip.vehicleId,
        parseFloat(currentLoc.latitude.toString()),
        parseFloat(currentLoc.longitude.toString()),
        0, // Current speed - would be calculated from GPS
        remainingStops
      );

      if (!breakdown) {
        return res.status(400).json({
          success: false,
          error: 'Could not calculate route ETA',
        });
      }

      res.json({
        success: true,
        data: {
          tripId,
          vehicleId: trip.vehicleId,
          routeName: trip.route.name,
          breakdown,
          lastUpdate: currentLoc.timestamp,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error getting route ETA breakdown:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to calculate route ETA',
      });
    }
  },

  /**
   * GET /api/v1/transportation/trips/:tripId/stops/:stopId/eta
   * Get detailed ETA for a specific stop
   */
  async getStopETA(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { tripId, stopId } = req.params;

      // Verify trip and stop exist
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, schoolId },
        include: {
          vehicle: true,
          route: {
            include: {
              stops: {
                include: { stop: true },
                orderBy: { sequence: 'asc' },
              },
            },
          },
        },
      });

      if (!trip) {
        return res.status(404).json({ success: false, error: 'Trip not found' });
      }

      const routeStop = trip.route.stops.find((rs) => rs.stop.id === stopId);
      if (!routeStop) {
        return res.status(404).json({ success: false, error: 'Stop not found on this route' });
      }

      // Get current location
      const currentLoc = await prisma.gPSLocation.findFirst({
        where: { vehicleId: trip.vehicleId },
        orderBy: { timestamp: 'desc' },
      });

      if (!currentLoc) {
        return res.status(400).json({
          success: false,
          error: 'No current location available',
        });
      }

      // Calculate ETA using multiple methods
      const eta = await etaCalculationService.calculateAdvancedETA(
        trip.vehicleId,
        parseFloat(currentLoc.latitude.toString()),
        parseFloat(currentLoc.longitude.toString()),
        parseFloat(routeStop.stop.latitude.toString()),
        parseFloat(routeStop.stop.longitude.toString()),
        0 // Current speed
      );

      // Get stop details
      const stop = routeStop.stop;

      res.json({
        success: true,
        data: {
          tripId,
          vehicleId: trip.vehicleId,
          stop: {
            id: stop.id,
            name: stop.name,
            latitude: parseFloat(stop.latitude.toString()),
            longitude: parseFloat(stop.longitude.toString()),
            sequence: routeStop.sequence,
          },
          eta: {
            estimatedSeconds: eta.estimatedSeconds,
            estimatedMinutes: Math.round(eta.estimatedSeconds / 60),
            estimatedArrivalTime: new Date(Date.now() + eta.estimatedSeconds * 1000),
            distanceKm: parseFloat(eta.distanceKm.toFixed(2)),
            confidence: parseFloat((eta.confidence * 100).toFixed(1)),
            method: eta.method,
            explanation: eta.explanation,
          },
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error getting stop ETA:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to calculate ETA',
      });
    }
  },

  /**
   * GET /api/v1/transportation/trips/:tripId/progress
   * Get detailed trip progress with multi-segment ETA
   */
  async getTripProgressWithETA(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { tripId } = req.params;

      // Verify trip exists
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, schoolId },
        include: {
          vehicle: true,
          route: {
            include: {
              stops: {
                include: { stop: true },
                orderBy: { sequence: 'asc' },
              },
            },
          },
        },
      });

      if (!trip) {
        return res.status(404).json({ success: false, error: 'Trip not found' });
      }

      // Get current location
      const currentLoc = await prisma.gPSLocation.findFirst({
        where: { vehicleId: trip.vehicleId },
        orderBy: { timestamp: 'desc' },
      });

      if (!currentLoc) {
        return res.status(400).json({
          success: false,
          error: 'No current location available',
        });
      }

      // Get trip progress
      const progress = await tripProgressService.calculateTripProgress(
        tripId,
        trip.vehicleId,
        parseFloat(currentLoc.latitude.toString()),
        parseFloat(currentLoc.longitude.toString())
      );

      if (!progress) {
        return res.status(400).json({
          success: false,
          error: 'Could not calculate trip progress',
        });
      }

      // Get detailed ETA breakdown
      const remainingStops = progress.stops.slice(progress.currentStopIndex);
      const stopsForEta = remainingStops.map((stop) => ({
        id: stop.stopId,
        name: stop.stopName,
        latitude: stop.latitude,
        longitude: stop.longitude,
      }));
      const breakdown = await etaCalculationService.calculateRouteProgressBreakdown(
        tripId,
        trip.vehicleId,
        parseFloat(currentLoc.latitude.toString()),
        parseFloat(currentLoc.longitude.toString()),
        0,
        stopsForEta
      );

      res.json({
        success: true,
        data: {
          tripId,
          vehicleId: trip.vehicleId,
          routeName: trip.route.name,
          progress: {
            status: progress.tripStatus,
            currentStopIndex: progress.currentStopIndex,
            totalStops: progress.totalStops,
            completedStops: progress.completedStops,
            progressPercentage: progress.progressPercentage,
            nextStop: progress.nextStop,
            studentsBoarded: progress.studentsBoarded,
            studentsExpected: progress.studentsExpected,
          },
          eta: breakdown ? {
            totalDistanceKm: breakdown.totalDistanceKm,
            completedDistanceKm: breakdown.completedDistanceKm,
            remainingDistanceKm: breakdown.remainingDistanceKm,
            totalEstimatedSeconds: breakdown.totalEstimatedSeconds,
            completedSeconds: breakdown.completedSeconds,
            remainingSeconds: breakdown.remainingSeconds,
            estimatedArrivalTime: breakdown.estimatedArrivalTime,
            confidence: parseFloat((breakdown.confidence * 100).toFixed(1)),
            segments: breakdown.segments.map((seg) => ({
              segment: seg.segment,
              fromStop: seg.fromStop,
              toStop: seg.toStop,
              distanceKm: seg.distanceKm,
              estimatedMinutes: Math.round(seg.estimatedSeconds / 60),
              arrivalTime: seg.arrivalTime,
              confidence: parseFloat((seg.confidence * 100).toFixed(1)),
            })),
            speedProfile: breakdown.speedProfile,
          } : null,
          currentLocation: progress.currentLocation,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error getting trip progress with ETA:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get trip progress',
      });
    }
  },

  /**
   * POST /api/v1/transportation/speed-record
   * Record speed reading for historical analysis (called after GPS update)
   */
  async recordSpeedReading(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { vehicleId, tripId, currentSpeedKmh, accuracy } = req.body;

      // Validation
      if (!vehicleId || tripId === undefined || currentSpeedKmh === undefined) {
        return res.status(400).json({
          success: false,
          error: 'vehicleId, tripId, currentSpeedKmh are required',
        });
      }

      // Verify vehicle belongs to school
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, schoolId },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found or access denied',
        });
      }

      // Record the speed reading
      await etaCalculationService.recordSpeedReading(
        vehicleId,
        tripId,
        parseFloat(currentSpeedKmh),
        accuracy ? parseFloat(accuracy) : 10
      );

      res.json({
        success: true,
        message: 'Speed reading recorded successfully',
      });
    } catch (error: any) {
      console.error('Error recording speed reading:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to record speed reading',
      });
    }
  },

  /**
   * GET /api/v1/transportation/trips/:tripId/eta-accuracy
   * Get ETA accuracy metrics and historical error rates
   */
  async getETAAccuracy(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { tripId } = req.params;

      // Verify trip exists
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, schoolId },
      });

      if (!trip) {
        return res.status(404).json({ success: false, error: 'Trip not found' });
      }

      // Get accuracy metrics
      const accuracy = await etaCalculationService.getETAAccuracy(trip.vehicleId, tripId);

      res.json({
        success: true,
        data: {
          tripId,
          vehicleId: trip.vehicleId,
          accuracy: {
            avgErrorMinutes: parseFloat(accuracy.avgError.toFixed(2)),
            accuracyPercentage: parseFloat(accuracy.accuracy.toFixed(1)),
            description:
              accuracy.accuracy > 80
                ? 'Highly accurate'
                : accuracy.accuracy > 60
                ? 'Moderately accurate'
                : 'Low accuracy - collect more data',
          },
          recommendation:
            accuracy.accuracy < 60 ? 'Continue recording to improve accuracy' : 'ETA is reliable',
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error getting ETA accuracy:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get ETA accuracy',
      });
    }
  },

  /**
   * GET /api/v1/transportation/vehicles/:vehicleId/speed-profile
   * Get current speed profile for a vehicle (current, average, min, max speeds)
   */
  async getVehicleSpeedProfile(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { vehicleId } = req.params;

      // Verify vehicle exists and belongs to school
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, schoolId },
      });

      if (!vehicle) {
        return res.status(404).json({ success: false, error: 'Vehicle not found' });
      }

      // Get recent locations to calculate speed
      const locations = await prisma.gPSLocation.findMany({
        where: { vehicleId },
        orderBy: { timestamp: 'desc' },
        take: 20, // Last 20 readings
      });

      if (locations.length < 2) {
        return res.json({
          success: true,
          data: {
            vehicleId,
            speedProfile: {
              currentSpeedKmh: 0,
              averageSpeedKmh: 0,
              maxSpeedKmh: 0,
              minSpeedKmh: 0,
            },
            readingCount: locations.length,
            message: 'Insufficient data for speed calculation',
          },
        });
      }

      // Calculate speeds between consecutive readings
      const speeds: number[] = [];
      for (let i = 0; i < locations.length - 1; i++) {
        const current = locations[i];
        const previous = locations[i + 1];

        const distance = this.calculateDistance(
          parseFloat(current.latitude.toString()),
          parseFloat(current.longitude.toString()),
          parseFloat(previous.latitude.toString()),
          parseFloat(previous.longitude.toString())
        );

        const timeSeconds = (current.timestamp.getTime() - previous.timestamp.getTime()) / 1000;
        if (timeSeconds > 0) {
          const speedKmh = (distance / 1000 / (timeSeconds / 3600));
          if (speedKmh >= 0 && speedKmh < 150) {
            speeds.push(speedKmh);
          }
        }
      }

      const currentSpeed = speeds[0] || 0;
      const avgSpeed = speeds.reduce((a, b) => a + b, 0) / (speeds.length || 1);
      const maxSpeed = Math.max(...speeds, 0);
      const minSpeed = Math.min(...speeds, 0);

      res.json({
        success: true,
        data: {
          vehicleId,
          speedProfile: {
            currentSpeedKmh: parseFloat(currentSpeed.toFixed(1)),
            averageSpeedKmh: parseFloat(avgSpeed.toFixed(1)),
            maxSpeedKmh: parseFloat(maxSpeed.toFixed(1)),
            minSpeedKmh: parseFloat(minSpeed.toFixed(1)),
          },
          readingCount: speeds.length,
          lastUpdate: locations[0].timestamp,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error getting vehicle speed profile:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get speed profile',
      });
    }
  },

  /**
   * Helper: Calculate distance using Haversine formula
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
};
