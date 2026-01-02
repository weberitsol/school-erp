import { PrismaClient, Prisma } from '@prisma/client';
import { redis } from '../config/redis';

const prisma = new PrismaClient();

interface LocationData {
  vehicleId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  tripId?: string;
}

interface CurrentLocation {
  vehicleId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  status: 'ONLINE' | 'OFFLINE' | 'INACTIVE';
  timestamp: Date;
}

interface LocationHistory {
  id: string;
  vehicleId: string;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  accuracy: number;
  status: 'ONLINE' | 'OFFLINE' | 'INACTIVE';
  timestamp: Date;
  createdAt: Date;
}

class GPSTrackingService {
  private readonly CACHE_TTL = 60; // Redis cache TTL in seconds
  private readonly DB_SAVE_INTERVAL = 300000; // Save to DB every 5 minutes (300 seconds)
  private readonly CACHE_KEY_PREFIX = 'gps:location:';
  private readonly PUBSUB_CHANNEL_PREFIX = 'transport:location:';
  private saveIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Capture GPS location from driver app
   * Stores in Redis cache and publishes via Pub/Sub
   * Periodically saves to PostgreSQL for historical data
   */
  async captureLocation(data: LocationData): Promise<CurrentLocation> {
    // Validate GPS coordinates
    if (data.latitude < -90 || data.latitude > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }

    if (data.longitude < -180 || data.longitude > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }

    // Validate accuracy
    const accuracy = Math.max(1, Math.min(data.accuracy || 10, 1000)); // Clamp between 1-1000 meters

    const location: CurrentLocation = {
      vehicleId: data.vehicleId,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy,
      status: 'ONLINE',
      timestamp: new Date(),
    };

    // Store in Redis cache with TTL
    const cacheKey = `${this.CACHE_KEY_PREFIX}${data.vehicleId}`;
    const client = redis.getClient();
    if (client) {
      await client.setex(
        cacheKey,
        this.CACHE_TTL,
        JSON.stringify(location)
      );

      // Publish to Redis Pub/Sub for real-time broadcasting
      const pubsubChannel = `${this.PUBSUB_CHANNEL_PREFIX}${data.vehicleId}`;
      await client.publish(pubsubChannel, JSON.stringify(location));
    }

    // Set up periodic database save if not already scheduled
    this.setupPeriodicDBSave(data.vehicleId);

    return location;
  }

  /**
   * Get current location from Redis cache
   */
  async getCurrentLocation(vehicleId: string): Promise<CurrentLocation | null> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${vehicleId}`;
    const client = redis.getClient();
    if (!client) return null;

    const cached = await client.get(cacheKey);

    if (!cached) {
      return null;
    }

    try {
      return JSON.parse(cached);
    } catch (error) {
      console.error('Failed to parse cached location:', error);
      return null;
    }
  }

  /**
   * Get location history from database
   */
  async getLocationHistory(
    vehicleId: string,
    startTime?: Date,
    endTime?: Date,
    limit: number = 100
  ): Promise<LocationHistory[]> {
    const where: Prisma.GPSLocationWhereInput = {
      vehicleId,
      ...(startTime || endTime) && {
        timestamp: {
          ...(startTime && { gte: startTime }),
          ...(endTime && { lte: endTime }),
        },
      },
    };

    return prisma.gPSLocation.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get vehicle's last known location from database
   */
  async getLastLocationFromDB(vehicleId: string): Promise<LocationHistory | null> {
    return prisma.gPSLocation.findFirst({
      where: { vehicleId },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Set up periodic save to database
   * Saves location data every 5 minutes for sparse historical storage
   */
  private setupPeriodicDBSave(vehicleId: string): void {
    // If already scheduled, don't create another interval
    if (this.saveIntervals.has(vehicleId)) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const location = await this.getCurrentLocation(vehicleId);

        if (location) {
          // Save to database for historical record
          await prisma.gPSLocation.create({
            data: {
              vehicleId,
              latitude: new Prisma.Decimal(location.latitude),
              longitude: new Prisma.Decimal(location.longitude),
              accuracy: location.accuracy,
              status: location.status,
              timestamp: location.timestamp,
            },
          });
        } else {
          // Vehicle offline - clear the interval
          clearInterval(intervalId);
          this.saveIntervals.delete(vehicleId);
        }
      } catch (error) {
        console.error(`Failed to save location for vehicle ${vehicleId}:`, error);
      }
    }, this.DB_SAVE_INTERVAL);

    this.saveIntervals.set(vehicleId, intervalId);
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   * Returns distance in kilometers
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
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
  }

  /**
   * Check if vehicle is within geofence of a stop
   * Returns true if vehicle is within specified radius (default 100 meters)
   */
  isWithinGeofence(
    vehicleLat: number,
    vehicleLon: number,
    stopLat: number,
    stopLon: number,
    radiusMeters: number = 100
  ): boolean {
    const distance = this.calculateDistance(vehicleLat, vehicleLon, stopLat, stopLon);
    return distance * 1000 <= radiusMeters; // Convert to meters
  }

  /**
   * Get all active vehicles (with locations cached in Redis)
   */
  async getActiveVehicles(): Promise<CurrentLocation[]> {
    const pattern = `${this.CACHE_KEY_PREFIX}*`;
    const client = redis.getClient();
    if (!client) return [];

    const keys = await client.keys(pattern);

    const locations: CurrentLocation[] = [];

    for (const key of keys) {
      const cached = await client.get(key);
      if (cached) {
        try {
          locations.push(JSON.parse(cached));
        } catch (error) {
          console.error('Failed to parse cached location:', error);
        }
      }
    }

    return locations;
  }

  /**
   * Mark vehicle as offline
   */
  async markVehicleOffline(vehicleId: string): Promise<void> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${vehicleId}`;
    const location = await this.getCurrentLocation(vehicleId);

    if (location) {
      location.status = 'OFFLINE';
      const client = redis.getClient();
      if (client) {
        await client.setex(cacheKey, this.CACHE_TTL, JSON.stringify(location));

        // Publish offline status
        const pubsubChannel = `${this.PUBSUB_CHANNEL_PREFIX}${vehicleId}`;
        await client.publish(pubsubChannel, JSON.stringify(location));
      }
    }

    // Clear the periodic save interval
    const intervalId = this.saveIntervals.get(vehicleId);
    if (intervalId) {
      clearInterval(intervalId);
      this.saveIntervals.delete(vehicleId);
    }
  }

  /**
   * Clean up resources on shutdown
   */
  async cleanup(): Promise<void> {
    for (const [vehicleId, intervalId] of this.saveIntervals.entries()) {
      clearInterval(intervalId);
    }
    this.saveIntervals.clear();
    await prisma.$disconnect();
  }
}

export const gpsTrackingService = new GPSTrackingService();
