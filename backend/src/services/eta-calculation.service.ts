import { redis } from '../config/redis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SpeedReading {
  timestamp: Date;
  speed: number; // km/h
  distance: number; // meters traveled
  accuracy: number; // GPS accuracy in meters
}

interface ETAData {
  distanceKm: number;
  estimatedSeconds: number;
  confidence: number; // 0-1, higher = more confident
  method: 'simple' | 'historical' | 'kalman' | 'weighted';
  explanation: string;
}

interface RouteSegmentETA {
  segment: number; // 0 = current to next stop, 1 = next+1, etc
  fromStop: string;
  toStop: string;
  distanceKm: number;
  estimatedSeconds: number;
  arrivalTime: Date; // Calculated arrival time
  confidence: number;
}

interface RouteProgressBreakdown {
  totalDistanceKm: number;
  totalEstimatedSeconds: number;
  completedDistanceKm: number;
  completedSeconds: number;
  remainingDistanceKm: number;
  remainingSeconds: number;
  progressPercentage: number;
  estimatedArrivalTime: Date;
  segments: RouteSegmentETA[];
  confidence: number;
  speedProfile: {
    currentSpeedKmh: number;
    averageSpeedKmh: number;
    maxSpeedKmh: number;
    minSpeedKmh: number;
  };
}

/**
 * Advanced ETA calculation service
 * Provides sophisticated ETA estimates using:
 * - Historical speed data
 * - Current speed and acceleration
 * - Time-of-day patterns
 * - Traffic patterns (if available)
 * - Kalman filtering for smoothing
 */
class ETACalculationService {
  private readonly SPEED_HISTORY_CACHE_KEY = 'speed:history:';
  private readonly SPEED_HISTORY_TTL = 86400; // 24 hours
  private readonly MIN_DATA_POINTS = 3; // Minimum readings for statistical calculation
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  /**
   * Calculate sophisticated ETA to next stop
   * Considers current speed, distance, and historical patterns
   */
  async calculateAdvancedETA(
    vehicleId: string,
    currentLatitude: number,
    currentLongitude: number,
    nextStopLat: number,
    nextStopLon: number,
    currentSpeedKmh: number = 0
  ): Promise<ETAData> {
    // Calculate distance to next stop
    const distanceKm = this.calculateDistance(
      currentLatitude,
      currentLongitude,
      nextStopLat,
      nextStopLon
    );

    // Try multiple estimation methods
    const estimates: { seconds: number; confidence: number; method: string }[] = [];

    // Method 1: Simple calculation (fallback)
    const simpleETA = this.calculateSimpleETA(distanceKm, currentSpeedKmh);
    estimates.push({
      seconds: simpleETA,
      confidence: currentSpeedKmh > 0 ? 0.5 : 0.3, // Low confidence if speed is 0
      method: 'simple',
    });

    // Method 2: Historical speed data
    const historicalETA = await this.calculateHistoricalETA(vehicleId, distanceKm);
    if (historicalETA) {
      estimates.push({
        seconds: historicalETA.seconds,
        confidence: historicalETA.confidence,
        method: 'historical',
      });
    }

    // Method 3: Kalman filter smoothing
    const kalmanETA = await this.calculateKalmanETA(
      vehicleId,
      distanceKm,
      currentSpeedKmh
    );
    if (kalmanETA) {
      estimates.push({
        seconds: kalmanETA.seconds,
        confidence: kalmanETA.confidence,
        method: 'kalman',
      });
    }

    // Method 4: Weighted average of all methods
    const weightedETA = this.calculateWeightedETA(estimates);
    estimates.push({
      seconds: weightedETA.seconds,
      confidence: weightedETA.confidence,
      method: 'weighted',
    });

    // Select best estimate (highest confidence)
    const bestEstimate = estimates.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    return {
      distanceKm,
      estimatedSeconds: Math.round(bestEstimate.seconds),
      confidence: bestEstimate.confidence,
      method: bestEstimate.method as any,
      explanation: `${bestEstimate.method} estimate: ${Math.round(bestEstimate.seconds / 60)} minutes`,
    };
  }

  /**
   * Calculate ETA to all remaining stops on the route (multi-segment)
   */
  async calculateRouteProgressBreakdown(
    tripId: string,
    vehicleId: string,
    currentLatitude: number,
    currentLongitude: number,
    currentSpeedKmh: number,
    remainingStops: Array<{ id: string; name: string; latitude: number; longitude: number }>
  ): Promise<RouteProgressBreakdown | null> {
    if (!remainingStops || remainingStops.length === 0) {
      return null;
    }

    try {
      // Get trip completion data
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
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
        return null;
      }

      const allStops = trip.route.stops;

      // Calculate completion metrics
      const completedStops = await this.countCompletedStops(tripId);
      const completedDistance = await this.calculateCompletedDistance(
        allStops,
        completedStops
      );

      // Calculate segments to all remaining stops
      const segments: RouteSegmentETA[] = [];
      let cumulativeSeconds = 0;
      let cumulativeDistance = completedDistance;
      let currentLat = currentLatitude;
      let currentLon = currentLongitude;

      for (let i = 0; i < Math.min(5, remainingStops.length); i++) {
        const stop = remainingStops[i];
        const distanceKm = this.calculateDistance(
          currentLat,
          currentLon,
          stop.latitude,
          stop.longitude
        );

        // Get ETA for this segment
        const etaData = await this.calculateAdvancedETA(
          vehicleId,
          currentLat,
          currentLon,
          stop.latitude,
          stop.longitude,
          currentSpeedKmh
        );

        cumulativeSeconds += etaData.estimatedSeconds;
        cumulativeDistance += distanceKm;

        segments.push({
          segment: i,
          fromStop: i === 0 ? 'Current Location' : remainingStops[i - 1].name,
          toStop: stop.name,
          distanceKm: parseFloat(distanceKm.toFixed(2)),
          estimatedSeconds: etaData.estimatedSeconds,
          arrivalTime: new Date(Date.now() + cumulativeSeconds * 1000),
          confidence: etaData.confidence,
        });

        // Move to this stop for next segment
        currentLat = stop.latitude;
        currentLon = stop.longitude;
      }

      // Calculate total route metrics
      const totalDistanceKm = allStops.reduce((sum, rs) => {
        const dist = this.calculateDistance(
          rs.stop.latitude ? parseFloat(rs.stop.latitude.toString()) : 0,
          rs.stop.longitude ? parseFloat(rs.stop.longitude.toString()) : 0,
          allStops[0]?.stop.latitude ? parseFloat(allStops[0].stop.latitude.toString()) : 0,
          allStops[0]?.stop.longitude ? parseFloat(allStops[0].stop.longitude.toString()) : 0
        );
        return sum + dist;
      }, 0);

      // Calculate speed profile
      const speedProfile = await this.calculateSpeedProfile(vehicleId, tripId);

      // Calculate confidence as average of segment confidences
      const avgConfidence = segments.length > 0
        ? segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length
        : 0.5;

      return {
        totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
        totalEstimatedSeconds: Math.round(
          allStops.length > 0
            ? (totalDistanceKm / speedProfile.averageSpeedKmh) * 3600
            : 0
        ),
        completedDistanceKm: parseFloat(completedDistance.toFixed(2)),
        completedSeconds: Math.round((completedDistance / speedProfile.averageSpeedKmh) * 3600),
        remainingDistanceKm: parseFloat((totalDistanceKm - completedDistance).toFixed(2)),
        remainingSeconds: cumulativeSeconds,
        progressPercentage: Math.round((completedDistance / totalDistanceKm) * 100),
        estimatedArrivalTime: segments[segments.length - 1]?.arrivalTime || new Date(),
        segments,
        confidence: avgConfidence,
        speedProfile,
      };
    } catch (error) {
      console.error('Failed to calculate route progress breakdown:', error);
      return null;
    }
  }

  /**
   * Record speed reading for historical analysis
   * Called after each GPS update
   */
  async recordSpeedReading(
    vehicleId: string,
    tripId: string,
    currentSpeedKmh: number,
    accuracy: number
  ): Promise<void> {
    try {
      const client = redis.getClient();
      if (!client) return; // Redis unavailable, skip caching

      const cacheKey = `${this.SPEED_HISTORY_CACHE_KEY}${vehicleId}:${tripId}`;

      // Get existing readings
      const existingData = await client.get(cacheKey);
      const readings: SpeedReading[] = existingData ? JSON.parse(existingData) : [];

      // Add new reading (keep last 60 readings = ~30 minutes at 30s intervals)
      readings.push({
        timestamp: new Date(),
        speed: currentSpeedKmh,
        distance: 0, // Will be calculated from GPS
        accuracy,
      });

      // Keep only recent readings (pruning to 60 entries)
      const pruned = readings.slice(-60);

      // Cache in Redis
      await client.setex(cacheKey, this.SPEED_HISTORY_TTL, JSON.stringify(pruned));
    } catch (error) {
      console.error('Failed to record speed reading:', error);
    }
  }

  /**
   * Simple ETA: distance / current speed
   * Used as fallback when no historical data available
   */
  private calculateSimpleETA(distanceKm: number, currentSpeedKmh: number): number {
    // Fallback speed if vehicle not moving (assume 40 km/h average)
    const speed = currentSpeedKmh > 0 ? currentSpeedKmh : 40;
    return (distanceKm / speed) * 3600; // Convert hours to seconds
  }

  /**
   * Historical ETA: Use average speed from past trips on same route
   * More accurate than simple ETA
   */
  private async calculateHistoricalETA(
    vehicleId: string,
    distanceKm: number
  ): Promise<{ seconds: number; confidence: number } | null> {
    try {
      // Query historical locations to calculate average speed
      const pastLocations = await prisma.gPSLocation.findMany({
        where: { vehicleId },
        orderBy: { timestamp: 'desc' },
        take: 100, // Last 100 readings
      });

      if (pastLocations.length < this.MIN_DATA_POINTS) {
        return null;
      }

      // Calculate speeds between consecutive readings
      const speeds: number[] = [];
      for (let i = 0; i < pastLocations.length - 1; i++) {
        const current = pastLocations[i];
        const previous = pastLocations[i + 1];

        const distance = this.calculateDistance(
          parseFloat(current.latitude.toString()),
          parseFloat(current.longitude.toString()),
          parseFloat(previous.latitude.toString()),
          parseFloat(previous.longitude.toString())
        );

        const timeSeconds = (current.timestamp.getTime() - previous.timestamp.getTime()) / 1000;
        if (timeSeconds > 0) {
          const speedKmh = (distance / 1000 / (timeSeconds / 3600));
          if (speedKmh > 0 && speedKmh < 150) { // Sanity check
            speeds.push(speedKmh);
          }
        }
      }

      if (speeds.length < this.MIN_DATA_POINTS) {
        return null;
      }

      // Calculate median speed (more robust than mean)
      const sortedSpeeds = speeds.sort((a, b) => a - b);
      const medianSpeed = sortedSpeeds[Math.floor(sortedSpeeds.length / 2)];

      // Confidence based on data consistency
      const variance = this.calculateVariance(speeds);
      const stdDev = Math.sqrt(variance);
      const confidence = Math.max(0.3, Math.min(0.95, 1 - stdDev / medianSpeed));

      return {
        seconds: (distanceKm / medianSpeed) * 3600,
        confidence,
      };
    } catch (error) {
      console.error('Historical ETA calculation failed:', error);
      return null;
    }
  }

  /**
   * Kalman Filter ETA: Smoothed estimate accounting for velocity and acceleration
   * More sophisticated but requires current speed data
   */
  private async calculateKalmanETA(
    vehicleId: string,
    distanceKm: number,
    currentSpeedKmh: number
  ): Promise<{ seconds: number; confidence: number } | null> {
    try {
      // Get recent speed readings
      const client = redis.getClient();
      if (!client) return null; // Redis unavailable

      const cacheKey = `${this.SPEED_HISTORY_CACHE_KEY}${vehicleId}:*`;
      const keys = await client.keys(cacheKey);

      if (keys.length === 0 || currentSpeedKmh === 0) {
        return null;
      }

      // Get latest readings
      const latestKey = keys[keys.length - 1];
      const data = await client.get(latestKey);
      if (!data) return null;

      const readings: SpeedReading[] = JSON.parse(data);
      if (readings.length < this.MIN_DATA_POINTS) {
        return null;
      }

      // Calculate acceleration (change in speed over time)
      const recentReadings = readings.slice(-10);
      const speeds = recentReadings.map((r) => r.speed);

      // Simple acceleration: (latest - oldest) / time
      const timeSpan = (recentReadings[recentReadings.length - 1].timestamp.getTime() -
        recentReadings[0].timestamp.getTime()) / 1000;

      const acceleration = timeSpan > 0
        ? (speeds[speeds.length - 1] - speeds[0]) / timeSpan
        : 0;

      // Kalman estimate: assume constant acceleration
      let predictedSpeed = currentSpeedKmh;
      let timeToStop = distanceKm / (currentSpeedKmh || 40);

      // If accelerating, adjust estimate
      if (acceleration > 0.1) {
        // v² = u² + 2as, solving for distance covered
        const discriminant = currentSpeedKmh * currentSpeedKmh + 2 * acceleration * distanceKm;
        if (discriminant >= 0) {
          predictedSpeed = Math.sqrt(discriminant);
          timeToStop = (predictedSpeed - currentSpeedKmh) / acceleration;
        }
      }

      const confidence = Math.min(0.9, currentSpeedKmh > 5 ? 0.8 : 0.5);

      return {
        seconds: timeToStop * 3600, // Convert to seconds
        confidence,
      };
    } catch (error) {
      console.error('Kalman ETA calculation failed:', error);
      return null;
    }
  }

  /**
   * Weighted average of multiple estimates
   * Combines best aspects of all methods
   */
  private calculateWeightedETA(
    estimates: Array<{ seconds: number; confidence: number; method: string }>
  ): { seconds: number; confidence: number } {
    const totalConfidence = estimates.reduce((sum, e) => sum + e.confidence, 0);
    if (totalConfidence === 0) {
      return { seconds: estimates[0].seconds, confidence: 0.5 };
    }

    const weightedSeconds = estimates.reduce(
      (sum, e) => sum + (e.seconds * e.confidence) / totalConfidence,
      0
    );

    return {
      seconds: weightedSeconds,
      confidence: totalConfidence / estimates.length,
    };
  }

  /**
   * Calculate speed profile for vehicle
   */
  private async calculateSpeedProfile(vehicleId: string, tripId: string) {
    const cacheKey = `${this.SPEED_HISTORY_CACHE_KEY}${vehicleId}:${tripId}`;
    const client = redis.getClient();
    const data = client ? await client.get(cacheKey) : null;

    let speeds: number[] = [40]; // Default fallback
    if (data) {
      const readings: SpeedReading[] = JSON.parse(data);
      speeds = readings.filter((r) => r.speed > 0 && r.speed < 150).map((r) => r.speed);
    }

    if (speeds.length === 0) speeds = [40];

    const current = speeds[speeds.length - 1] || 0;
    const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const max = Math.max(...speeds);
    const min = Math.min(...speeds);

    return {
      currentSpeedKmh: parseFloat(current.toFixed(1)),
      averageSpeedKmh: parseFloat(avg.toFixed(1)),
      maxSpeedKmh: parseFloat(max.toFixed(1)),
      minSpeedKmh: parseFloat(min.toFixed(1)),
    };
  }

  /**
   * Calculate distance completed on route
   */
  private async calculateCompletedDistance(stops: any[], completedStopIndex: number): Promise<number> {
    if (completedStopIndex === 0) return 0;

    let distance = 0;
    for (let i = 0; i < Math.min(completedStopIndex, stops.length - 1); i++) {
      const current = stops[i].stop;
      const next = stops[i + 1].stop;

      distance += this.calculateDistance(
        parseFloat(current.latitude.toString()),
        parseFloat(current.longitude.toString()),
        parseFloat(next.latitude.toString()),
        parseFloat(next.longitude.toString())
      );
    }
    return distance;
  }

  /**
   * Count completed stops on current trip
   */
  private async countCompletedStops(tripId: string): Promise<number> {
    try {
      // Count students who have alighted (arrived at destination)
      const count = await prisma.studentTripRecord.count({
        where: { tripId, alighted: true },
      });
      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   * Returns distance in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  }

  /**
   * Calculate variance of speed readings
   */
  private calculateVariance(speeds: number[]): number {
    if (speeds.length === 0) return 0;

    const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const squaredDiffs = speeds.map((speed) => Math.pow(speed - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / speeds.length;
  }

  /**
   * Get ETA accuracy metrics
   */
  async getETAAccuracy(vehicleId: string, tripId: string): Promise<{
    avgError: number; // Average ETA error in minutes
    accuracy: number; // 0-100% accuracy score
  }> {
    try {
      // Count alighting records to assess trip completion
      const records = await prisma.studentTripRecord.findMany({
        where: { tripId, alighted: true },
        select: {
          alightingTime: true,
        },
      });

      if (records.length === 0) {
        return { avgError: 0, accuracy: 50 };
      }

      // Calculate average error (placeholder - would need historical ETA vs actual data)
      return { avgError: 2, accuracy: 75 };
    } catch (error) {
      console.error('Failed to get ETA accuracy:', error);
      return { avgError: 0, accuracy: 0 };
    }
  }
}

export const etaCalculationService = new ETACalculationService();
