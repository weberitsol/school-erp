import { redis } from '../config/redis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface GeofenceEvent {
  vehicleId: string;
  tripId: string;
  stopId: string;
  stopName: string;
  action: 'APPROACHING' | 'ARRIVED' | 'DEPARTED';
  distance: number; // meters
  latitude: number;
  longitude: number;
  timestamp: string;
}

/**
 * Detects when vehicles enter/exit geofences around bus stops
 * Handles proximity-based alerts and automatic arrival/departure recording
 */
class GeofenceService {
  private readonly APPROACHING_THRESHOLD = 500; // meters - when to start showing "bus arriving"
  private readonly ARRIVAL_THRESHOLD = 100; // meters - when to consider "arrived"
  private readonly DEPARTURE_THRESHOLD = 150; // meters - when to consider "departed" after arrival
  private readonly CACHE_KEY_PREFIX = 'geofence:vehicle:';

  /**
   * Check if vehicle is within geofence of any stops on its trip route
   */
  async checkStopProximity(
    tripId: string,
    vehicleId: string,
    latitude: number,
    longitude: number
  ): Promise<GeofenceEvent[]> {
    const events: GeofenceEvent[] = [];

    try {
      // Get trip with route stops
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, vehicleId },
        include: {
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

      if (!trip?.route?.stops) {
        return events;
      }

      // Check proximity to each stop
      for (const routeStop of trip.route.stops) {
        const stop = routeStop.stop;
        const stopLat = parseFloat(stop.latitude.toString());
        const stopLon = parseFloat(stop.longitude.toString());

        const distance = this.calculateDistance(latitude, longitude, stopLat, stopLon);

        // Get previous state from cache
        const prevState = await this.getStopState(vehicleId, stop.id);

        // Determine current state
        let currentState = 'OUTSIDE';
        if (distance <= this.ARRIVAL_THRESHOLD) {
          currentState = 'ARRIVED';
        } else if (distance <= this.APPROACHING_THRESHOLD) {
          currentState = 'APPROACHING';
        }

        // Generate events based on state transitions
        if (currentState !== prevState) {
          if (currentState === 'APPROACHING' && prevState === 'OUTSIDE') {
            events.push({
              vehicleId,
              tripId,
              stopId: stop.id,
              stopName: stop.name,
              action: 'APPROACHING',
              distance: Math.round(distance),
              latitude,
              longitude,
              timestamp: new Date().toISOString(),
            });
          } else if (currentState === 'ARRIVED' && prevState !== 'ARRIVED') {
            events.push({
              vehicleId,
              tripId,
              stopId: stop.id,
              stopName: stop.name,
              action: 'ARRIVED',
              distance: Math.round(distance),
              latitude,
              longitude,
              timestamp: new Date().toISOString(),
            });
          } else if (currentState === 'OUTSIDE' && prevState === 'ARRIVED') {
            events.push({
              vehicleId,
              tripId,
              stopId: stop.id,
              stopName: stop.name,
              action: 'DEPARTED',
              distance: Math.round(distance),
              latitude,
              longitude,
              timestamp: new Date().toISOString(),
            });
          }
        }

        // Cache current state
        await this.setStopState(vehicleId, stop.id, currentState);
      }

      return events;
    } catch (error) {
      console.error('Geofence proximity check failed:', error);
      return events;
    }
  }

  /**
   * Record vehicle arrival at stop (triggered by ARRIVED geofence event)
   */
  async recordArrival(tripId: string, stopId: string): Promise<boolean> {
    try {
      const timestamp = new Date();

      // Update all student records for this trip - mark as boarded
      await prisma.studentTripRecord.updateMany({
        where: { tripId },
        data: { boarded: true, boardingTime: timestamp },
      });

      // Log to database for history
      await prisma.gPSLocation.create({
        data: {
          vehicleId: '', // Will be populated from context
          latitude: 0,
          longitude: 0,
          accuracy: 0,
          status: 'ONLINE',
          timestamp,
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to record arrival:', error);
      return false;
    }
  }

  /**
   * Record vehicle departure from stop (triggered by DEPARTED geofence event)
   */
  async recordDeparture(tripId: string, stopId: string): Promise<boolean> {
    try {
      const timestamp = new Date();

      // Update trip departure time
      await prisma.trip.update({
        where: { id: tripId },
        data: { status: 'IN_PROGRESS' },
      });

      // Mark stop as completed in any outstanding records - mark as alighted
      const records = await prisma.studentTripRecord.updateMany({
        where: {
          tripId,
          alighted: false,
        },
        data: { alighted: true, alightingTime: timestamp },
      });

      return records.count > 0;
    } catch (error) {
      console.error('Failed to record departure:', error);
      return false;
    }
  }

  /**
   * Clear all geofence states for a vehicle (used when trip ends)
   */
  async clearVehicleGeofences(vehicleId: string): Promise<void> {
    try {
      const client = redis.getClient();
      if (!client) return;

      const pattern = `${this.CACHE_KEY_PREFIX}${vehicleId}:*`;
      const keys = await client.keys(pattern);

      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      console.error('Failed to clear vehicle geofences:', error);
    }
  }

  /**
   * Get all active geofence events for a vehicle
   */
  async getActiveGeofences(vehicleId: string): Promise<Map<string, string>> {
    try {
      const client = redis.getClient();
      if (!client) return new Map();

      const pattern = `${this.CACHE_KEY_PREFIX}${vehicleId}:*`;
      const keys = await client.keys(pattern);
      const states = new Map<string, string>();

      for (const key of keys) {
        const stopId = key.replace(`${this.CACHE_KEY_PREFIX}${vehicleId}:`, '');
        const state = await client.get(key);
        if (state) {
          states.set(stopId, state);
        }
      }

      return states;
    } catch (error) {
      console.error('Failed to get active geofences:', error);
      return new Map();
    }
  }

  /**
   * Get cached stop state for a vehicle
   */
  private async getStopState(vehicleId: string, stopId: string): Promise<string> {
    try {
      const client = redis.getClient();
      if (!client) return 'OUTSIDE';

      const cacheKey = `${this.CACHE_KEY_PREFIX}${vehicleId}:${stopId}`;
      const state = await client.get(cacheKey);
      return state || 'OUTSIDE';
    } catch (error) {
      console.error('Failed to get stop state:', error);
      return 'OUTSIDE';
    }
  }

  /**
   * Cache stop state for a vehicle
   */
  private async setStopState(vehicleId: string, stopId: string, state: string): Promise<void> {
    try {
      const client = redis.getClient();
      if (!client) return;

      const cacheKey = `${this.CACHE_KEY_PREFIX}${vehicleId}:${stopId}`;
      // TTL of 24 hours - clears when trip ends
      await client.setex(cacheKey, 86400, state);
    } catch (error) {
      console.error('Failed to set stop state:', error);
    }
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
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
    return R * c * 1000; // Return in meters
  }

  /**
   * Get geofence configuration (thresholds)
   */
  getGeofenceConfig() {
    return {
      approachingThreshold: this.APPROACHING_THRESHOLD,
      arrivalThreshold: this.ARRIVAL_THRESHOLD,
      departureThreshold: this.DEPARTURE_THRESHOLD,
    };
  }
}

export const geofenceService = new GeofenceService();
