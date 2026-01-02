/**
 * GPS Tracking Types
 */

export interface LocationData {
  vehicleId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  tripId?: string;
}

export interface CurrentLocation {
  vehicleId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  status: 'ONLINE' | 'OFFLINE' | 'INACTIVE';
  timestamp: Date;
}

export interface LocationHistory {
  id: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  status: 'ONLINE' | 'OFFLINE' | 'INACTIVE';
  timestamp: Date;
  createdAt: Date;
}

export interface DistanceCalculationResult {
  distanceKm: number;
  distanceMeters: number;
  point1: {
    latitude: number;
    longitude: number;
  };
  point2: {
    latitude: number;
    longitude: number;
  };
}

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

export interface GeofenceCheckResult {
  isWithinGeofence: boolean;
  distanceMeters: number;
  stopName: string;
  radiusMeters: number;
}
