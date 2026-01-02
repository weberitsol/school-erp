import { Request, Response } from 'express';
import { gpsTrackingService } from '../services/gps-tracking.service';
import { tripProgressService } from '../services/trip-progress.service';
import { geofenceService } from '../services/geofence.service';
import { transportPubSubService } from '../services/transport-pubsub.service';
import { etaCalculationService } from '../services/eta-calculation.service';
import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

/**
 * Set Socket.IO instance for broadcasting
 * Called from app.ts after Socket.IO initialization
 */
export function setSocketIOInstance(socketIO: SocketIOServer) {
  io = socketIO;
}

const prisma = new PrismaClient();

export const gpsTrackingController = {
  /**
   * POST /transportation/location
   * Capture GPS location from driver app
   * Requires: vehicleId, latitude, longitude
   * Optional: accuracy, tripId
   */
  async captureLocation(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { vehicleId, latitude, longitude, accuracy, tripId } = req.body;

      // Validation
      if (!vehicleId || latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Vehicle ID, latitude, and longitude are required',
        });
      }

      // Verify vehicle exists and belongs to school
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, schoolId },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found or access denied',
        });
      }

      // If tripId provided, verify it exists
      if (tripId) {
        const trip = await prisma.trip.findFirst({
          where: { id: tripId, vehicleId, schoolId },
        });

        if (!trip) {
          return res.status(404).json({
            success: false,
            error: 'Trip not found or access denied',
          });
        }
      }

      const location = await gpsTrackingService.captureLocation({
        vehicleId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : undefined,
        tripId,
      });

      // ==================== BROADCASTING ====================
      // Broadcast location update via Socket.IO and Redis Pub/Sub
      try {
        // Broadcast via Socket.IO to subscribed clients
        if (io) {
          // Broadcast to vehicle-specific room
          io.of('/transport').to(`vehicle:${vehicleId}`).emit('location:update', {
            vehicleId,
            location,
            timestamp: new Date().toISOString(),
          });

          // Broadcast to school-wide room (for admins viewing all vehicles)
          io.of('/transport').to(`school:${schoolId}`).emit('location:update', {
            vehicleId,
            location,
            timestamp: new Date().toISOString(),
          });
        }

        // Publish to Redis Pub/Sub for multi-server scaling
        await transportPubSubService.publishLocationUpdate({
          vehicleId,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          accuracy: accuracy ? parseFloat(accuracy) : 10,
          status: 'ONLINE',
          timestamp: new Date().toISOString(),
        });

        // If trip is active, calculate progress and check geofence
        if (tripId) {
          // Calculate trip progress with ETA
          const tripProgress = await tripProgressService.calculateTripProgress(
            tripId,
            vehicleId,
            parseFloat(latitude),
            parseFloat(longitude)
          );

          if (tripProgress) {
            // Broadcast trip progress update
            if (io) {
              io.of('/transport').to(`trip:${tripId}`).emit('trip:update', {
                tripId,
                update: {
                  status: tripProgress.tripStatus,
                  currentStopIndex: tripProgress.currentStopIndex,
                  totalStops: tripProgress.totalStops,
                  completedStops: tripProgress.completedStops,
                  progressPercentage: tripProgress.progressPercentage,
                  nextStop: tripProgress.nextStop,
                  studentsBoarded: tripProgress.studentsBoarded,
                  studentsExpected: tripProgress.studentsExpected,
                  currentLocation: tripProgress.currentLocation,
                },
                timestamp: new Date().toISOString(),
              });
            }

            // Publish trip update to Redis Pub/Sub
            await transportPubSubService.publishTripUpdate({
              tripId,
              status: tripProgress.tripStatus as any,
              nextStop: tripProgress.nextStop
                ? {
                    stopId: tripProgress.nextStop.stopId,
                    name: tripProgress.nextStop.stopName,
                    eta: new Date(
                      Date.now() + tripProgress.nextStop.estimatedTimeToArrival * 1000
                    ).toISOString(),
                  }
                : undefined,
              studentsBoarded: tripProgress.studentsBoarded,
              studentsExpected: tripProgress.studentsExpected,
              currentLocation: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
              },
            });
          }

          // Check geofence proximity to stops
          const geofenceEvents = await geofenceService.checkStopProximity(
            tripId,
            vehicleId,
            parseFloat(latitude),
            parseFloat(longitude)
          );

          // Broadcast geofence events
          for (const event of geofenceEvents) {
            // Log the event
            console.log(
              `🎯 Geofence ${event.action}: ${event.stopName} (${event.distance}m away)`
            );

            // Broadcast via Socket.IO
            if (io) {
              io.of('/transport').to(`trip:${tripId}`).emit('geofence:alert', {
                vehicleId: event.vehicleId,
                tripId: event.tripId,
                stopId: event.stopId,
                stopName: event.stopName,
                action: event.action,
                distance: event.distance,
                timestamp: event.timestamp,
              });

              // Also broadcast to vehicle room
              io.of('/transport').to(`vehicle:${vehicleId}`).emit('geofence:alert', {
                vehicleId: event.vehicleId,
                tripId: event.tripId,
                stopId: event.stopId,
                stopName: event.stopName,
                action: event.action,
                distance: event.distance,
                timestamp: event.timestamp,
              });
            }

            // Publish to Redis Pub/Sub
            await transportPubSubService.publishGeofenceAlert({
              vehicleId: event.vehicleId,
              stopId: event.stopId,
              stopName: event.stopName,
              action: event.action as any,
              distance: event.distance,
              timestamp: event.timestamp,
            });

            // Handle automatic arrival/departure recording
            if (event.action === 'ARRIVED') {
              await geofenceService.recordArrival(tripId, event.stopId);
            } else if (event.action === 'DEPARTED') {
              await geofenceService.recordDeparture(tripId, event.stopId);
            }
          }
        }
      } catch (broadcastError) {
        console.error('Error broadcasting location update:', broadcastError);
        // Don't fail the response if broadcasting fails
      }
      // ==================== END BROADCASTING ====================

      // ==================== SPEED RECORDING FOR ETA HISTORY ====================
      // Record speed data for historical ETA calculations
      try {
        if (tripId) {
          // Calculate current speed from vehicle's recent locations
          const recentLocs = await prisma.gPSLocation.findMany({
            where: { vehicleId },
            orderBy: { timestamp: 'desc' },
            take: 2,
          });

          let currentSpeedKmh = 0;
          if (recentLocs.length === 2) {
            // Haversine distance calculation
            const lat1 = parseFloat(recentLocs[0].latitude.toString());
            const lon1 = parseFloat(recentLocs[0].longitude.toString());
            const lat2 = parseFloat(recentLocs[1].latitude.toString());
            const lon2 = parseFloat(recentLocs[1].longitude.toString());

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
            const distanceKm = R * c;

            const timeSeconds =
              (recentLocs[0].timestamp.getTime() - recentLocs[1].timestamp.getTime()) / 1000;
            if (timeSeconds > 0) {
              currentSpeedKmh = (distanceKm / (timeSeconds / 3600));
              // Sanity check
              if (currentSpeedKmh > 150) currentSpeedKmh = 0;
            }
          }

          // Record speed reading for ETA history
          await etaCalculationService.recordSpeedReading(
            vehicleId,
            tripId,
            currentSpeedKmh,
            accuracy ? parseFloat(accuracy) : 10
          );
        }
      } catch (speedError) {
        console.error('Error recording speed data:', speedError);
        // Don't fail if speed recording fails
      }
      // ==================== END SPEED RECORDING ====================

      res.status(201).json({
        success: true,
        data: location,
        message: 'Location captured and broadcasted successfully',
      });
    } catch (error: any) {
      console.error('Error capturing location:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to capture location',
      });
    }
  },

  /**
   * GET /transportation/vehicles/:id/location
   * Get current location of a vehicle from Redis cache
   */
  async getCurrentLocation(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id: vehicleId } = req.params;

      // Verify vehicle exists and belongs to school
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, schoolId },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found or access denied',
        });
      }

      const location = await gpsTrackingService.getCurrentLocation(vehicleId);

      if (!location) {
        return res.status(404).json({
          success: false,
          error: 'No current location data available',
        });
      }

      res.json({
        success: true,
        data: location,
      });
    } catch (error: any) {
      console.error('Error fetching current location:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch current location',
      });
    }
  },

  /**
   * GET /transportation/vehicles/:id/location-history
   * Get historical location data from database
   */
  async getLocationHistory(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id: vehicleId } = req.params;
      const { startTime, endTime, limit } = req.query;

      // Verify vehicle exists and belongs to school
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, schoolId },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found or access denied',
        });
      }

      const start = startTime ? new Date(startTime as string) : undefined;
      const end = endTime ? new Date(endTime as string) : undefined;
      const queryLimit = limit ? parseInt(limit as string) : 100;

      // Validate dates if provided
      if (start && isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid start time format',
        });
      }

      if (end && isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid end time format',
        });
      }

      if (queryLimit < 1 || queryLimit > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 1000',
        });
      }

      const history = await gpsTrackingService.getLocationHistory(
        vehicleId,
        start,
        end,
        queryLimit
      );

      res.json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (error: any) {
      console.error('Error fetching location history:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch location history',
      });
    }
  },

  /**
   * GET /transportation/vehicles/active
   * Get all vehicles with active locations
   */
  async getActiveVehicles(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const locations = await gpsTrackingService.getActiveVehicles();

      // Filter to only show vehicles from this school
      const schoolVehicles = await prisma.vehicle.findMany({
        where: { schoolId },
        select: { id: true },
      });

      const schoolVehicleIds = new Set(schoolVehicles.map((v) => v.id));
      const activeSchoolVehicles = locations.filter((loc) =>
        schoolVehicleIds.has(loc.vehicleId)
      );

      res.json({
        success: true,
        data: activeSchoolVehicles,
        count: activeSchoolVehicles.length,
      });
    } catch (error: any) {
      console.error('Error fetching active vehicles:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch active vehicles',
      });
    }
  },

  /**
   * POST /transportation/vehicles/:id/location/offline
   * Mark vehicle as offline
   */
  async markOffline(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id: vehicleId } = req.params;

      // Verify vehicle exists and belongs to school
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, schoolId },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found or access denied',
        });
      }

      await gpsTrackingService.markVehicleOffline(vehicleId);

      res.json({
        success: true,
        message: 'Vehicle marked as offline',
      });
    } catch (error: any) {
      console.error('Error marking vehicle offline:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to mark vehicle offline',
      });
    }
  },

  /**
   * GET /transportation/distance
   * Calculate distance between two GPS coordinates
   */
  async calculateDistance(req: Request, res: Response) {
    try {
      const { lat1, lon1, lat2, lon2 } = req.query;

      if (
        !lat1 ||
        !lon1 ||
        !lat2 ||
        !lon2 ||
        typeof lat1 !== 'string' ||
        typeof lon1 !== 'string' ||
        typeof lat2 !== 'string' ||
        typeof lon2 !== 'string'
      ) {
        return res.status(400).json({
          success: false,
          error: 'lat1, lon1, lat2, lon2 query parameters are required',
        });
      }

      const latitude1 = parseFloat(lat1);
      const longitude1 = parseFloat(lon1);
      const latitude2 = parseFloat(lat2);
      const longitude2 = parseFloat(lon2);

      if (isNaN(latitude1) || isNaN(longitude1) || isNaN(latitude2) || isNaN(longitude2)) {
        return res.status(400).json({
          success: false,
          error: 'All coordinates must be valid numbers',
        });
      }

      const distanceKm = gpsTrackingService.calculateDistance(
        latitude1,
        longitude1,
        latitude2,
        longitude2
      );

      res.json({
        success: true,
        data: {
          distanceKm: parseFloat(distanceKm.toFixed(2)),
          distanceMeters: Math.round(distanceKm * 1000),
          point1: { latitude: latitude1, longitude: longitude1 },
          point2: { latitude: latitude2, longitude: longitude2 },
        },
      });
    } catch (error: any) {
      console.error('Error calculating distance:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to calculate distance',
      });
    }
  },
};
