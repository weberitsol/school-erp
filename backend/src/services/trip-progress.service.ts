import { PrismaClient, Prisma } from '@prisma/client';
import { redis } from '../config/redis';

const prisma = new PrismaClient();

interface TripStop {
  stopId: string;
  stopName: string;
  sequence: number;
  latitude: number;
  longitude: number;
  plannedArrivalTime?: string;
  actualArrivalTime?: string;
  departureTime?: string;
  status: 'PENDING' | 'ARRIVED' | 'COMPLETED';
}

interface TripProgress {
  tripId: string;
  vehicleId: string;
  currentStopIndex: number; // 0-based index in stops array
  totalStops: number;
  completedStops: number;
  progressPercentage: number;
  stops: TripStop[];
  nextStop: {
    stopId: string;
    stopName: string;
    sequence: number;
    latitude: number;
    longitude: number;
    plannedArrivalTime?: string;
    estimatedTimeToArrival: number; // seconds
  } | null;
  currentLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  tripStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  studentsBoarded: number;
  studentsExpected: number;
}

/**
 * Service to track trip progress, calculate ETA, and monitor stop arrivals/departures
 */
class TripProgressService {
  private readonly CACHE_KEY_PREFIX = 'trip:progress:';
  private readonly STOP_ARRIVAL_THRESHOLD = 100; // meters

  /**
   * Calculate trip progress with next stop ETA
   * Integrates current GPS location with trip route
   */
  async calculateTripProgress(
    tripId: string,
    vehicleId: string,
    currentLatitude: number,
    currentLongitude: number
  ): Promise<TripProgress | null> {
    try {
      // Fetch trip with route stops and current location
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, vehicleId },
        include: {
          route: {
            include: {
              stops: {
                include: {
                  stop: true,
                },
                orderBy: { sequence: 'asc' },
              },
            },
          },
          vehicle: true,
          _count: {
            select: { studentRecords: true },
          },
        },
      });

      if (!trip || !trip.route) {
        return null;
      }

      const routeStops = trip.route.stops;
      if (!routeStops || routeStops.length === 0) {
        return null;
      }

      // Build TripStop array
      const stops: TripStop[] = routeStops.map((rs) => ({
        stopId: rs.stop.id,
        stopName: rs.stop.name,
        sequence: rs.sequence,
        latitude: parseFloat(rs.stop.latitude.toString()),
        longitude: parseFloat(rs.stop.longitude.toString()),
        status: 'PENDING',
      }));

      // Determine current stop index based on trip history
      const completedStops = await this.countCompletedStops(tripId);
      const currentStopIndex = Math.min(completedStops, stops.length - 1);

      // Calculate ETA to next stop
      let nextStop: TripProgress['nextStop'] = null;
      if (currentStopIndex < stops.length - 1) {
        const upcomingStop = stops[currentStopIndex];
        const distanceToNext = this.calculateDistance(
          currentLatitude,
          currentLongitude,
          upcomingStop.latitude,
          upcomingStop.longitude
        );

        // Estimate speed (average 30 km/h in city, 50 km/h on highway)
        const averageSpeed = 40; // km/h
        const etaSeconds = Math.round((distanceToNext / averageSpeed) * 3600);

        nextStop = {
          stopId: upcomingStop.stopId,
          stopName: upcomingStop.stopName,
          sequence: upcomingStop.sequence,
          latitude: upcomingStop.latitude,
          longitude: upcomingStop.longitude,
          estimatedTimeToArrival: etaSeconds,
        };
      }

      // Calculate progress
      const progressPercentage = Math.round((completedStops / stops.length) * 100);

      const tripProgress: TripProgress = {
        tripId,
        vehicleId,
        currentStopIndex,
        totalStops: stops.length,
        completedStops,
        progressPercentage,
        stops,
        nextStop,
        currentLocation: {
          latitude: currentLatitude,
          longitude: currentLongitude,
          timestamp: new Date().toISOString(),
        },
        tripStatus: trip.status as any,
        studentsBoarded: await this.countBoardedStudents(tripId),
        studentsExpected: trip._count.studentRecords || 0,
      };

      // Cache progress for quick access
      await this.cacheTripProgress(tripId, tripProgress);

      return tripProgress;
    } catch (error) {
      console.error(`Failed to calculate trip progress for ${tripId}:`, error);
      return null;
    }
  }

  /**
   * Detect if vehicle has arrived at a stop (within threshold distance)
   */
  async detectStopArrival(
    tripId: string,
    vehicleId: string,
    currentLatitude: number,
    currentLongitude: number,
    stopIndex: number
  ): Promise<{ arrived: boolean; stopId: string; distance: number } | null> {
    try {
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

      if (!trip?.route?.stops || stopIndex >= trip.route.stops.length) {
        return null;
      }

      const stop = trip.route.stops[stopIndex].stop;
      const stopLat = parseFloat(stop.latitude.toString());
      const stopLon = parseFloat(stop.longitude.toString());

      const distance = this.calculateDistance(
        currentLatitude,
        currentLongitude,
        stopLat,
        stopLon
      );

      return {
        arrived: distance <= this.STOP_ARRIVAL_THRESHOLD,
        stopId: stop.id,
        distance: Math.round(distance), // in meters
      };
    } catch (error) {
      console.error('Stop arrival detection failed:', error);
      return null;
    }
  }

  /**
   * Mark a stop as completed in the trip
   */
  async markStopAsCompleted(tripId: string, stopId: string): Promise<boolean> {
    try {
      // Record the arrival in StudentTripRecord
      await prisma.studentTripRecord.updateMany({
        where: {
          tripId,
          studentRoute: {
            route: {
              trips: { some: { id: tripId } },
            },
          },
        },
        data: {
          alightingTime: new Date(),
        },
      });

      // Clear cached progress to force recalculation
      const client = redis.getClient();
      if (client) {
        await client.del(`${this.CACHE_KEY_PREFIX}${tripId}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to mark stop as completed:', error);
      return false;
    }
  }

  /**
   * Get cached trip progress
   */
  async getCachedProgress(tripId: string): Promise<TripProgress | null> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${tripId}`;
      const client = redis.getClient();
      if (!client) return null;

      const cached = await client.get(cacheKey);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error('Failed to get cached trip progress:', error);
      return null;
    }
  }

  /**
   * Cache trip progress in Redis for quick access
   */
  private async cacheTripProgress(tripId: string, progress: TripProgress): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${tripId}`;
      const client = redis.getClient();
      if (!client) return;

      await client.setex(cacheKey, 60, JSON.stringify(progress)); // 60s TTL
    } catch (error) {
      console.error('Failed to cache trip progress:', error);
    }
  }

  /**
   * Count how many stops have been completed in this trip
   */
  private async countCompletedStops(tripId: string): Promise<number> {
    try {
      const completedRecords = await prisma.studentTripRecord.count({
        where: {
          tripId,
          alightingTime: { not: null },
        },
      });

      // Return unique stop count (each student marks arrival at same stop)
      const records = await prisma.studentTripRecord.findMany({
        where: { tripId, alightingTime: { not: null } },
        select: { studentRoute: { select: { dropStopId: true } } },
      });

      const uniqueStops = new Set(records.map((r) => r.studentRoute?.dropStopId));
      return uniqueStops.size;
    } catch (error) {
      console.error('Failed to count completed stops:', error);
      return 0;
    }
  }

  /**
   * Count students boarded so far in this trip
   */
  private async countBoardedStudents(tripId: string): Promise<number> {
    try {
      return await prisma.studentTripRecord.count({
        where: {
          tripId,
          boarded: true,
        },
      });
    } catch (error) {
      console.error('Failed to count boarded students:', error);
      return 0;
    }
  }

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   * Returns distance in kilometers
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
    const distance = R * c;

    return distance * 1000; // Convert to meters
  }

  /**
   * Get trip statistics for monitoring
   */
  async getTripStats(tripId: string): Promise<{
    progress: number;
    boarded: number;
    expected: number;
    lastUpdate: string;
  } | null> {
    try {
      const progress = await this.getCachedProgress(tripId);
      if (!progress) {
        return null;
      }

      return {
        progress: progress.progressPercentage,
        boarded: progress.studentsBoarded,
        expected: progress.studentsExpected,
        lastUpdate: progress.currentLocation.timestamp,
      };
    } catch (error) {
      console.error('Failed to get trip stats:', error);
      return null;
    }
  }
}

export const tripProgressService = new TripProgressService();
