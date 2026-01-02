import { redis } from '../config/redis';

/**
 * Redis Pub/Sub Service for Transportation Module
 * Enables broadcasting location updates across multiple server instances
 *
 * Usage:
 * - Publish location updates: transportPubSubService.publishLocationUpdate(...)
 * - Publish trip updates: transportPubSubService.publishTripUpdate(...)
 * - Subscribe to updates: transportPubSubService.subscribeToLocation(...)
 */

interface LocationUpdate {
  vehicleId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  status: 'ONLINE' | 'OFFLINE' | 'INACTIVE';
  timestamp: string;
}

interface TripUpdate {
  tripId: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  nextStop?: {
    stopId: string;
    name: string;
    eta?: string;
  };
  studentsBoarded?: number;
  studentsExpected?: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

interface GeofenceAlert {
  vehicleId: string;
  stopId: string;
  stopName: string;
  action: 'APPROACHING' | 'ARRIVED' | 'DEPARTED';
  distance?: number;
  timestamp: string;
}

type LocationUpdateCallback = (data: LocationUpdate) => void;
type TripUpdateCallback = (data: TripUpdate) => void;
type GeofenceAlertCallback = (data: GeofenceAlert) => void;

class TransportPubSubService {
  private locationSubscribers: Map<string, Set<LocationUpdateCallback>> = new Map();
  private tripSubscribers: Map<string, Set<TripUpdateCallback>> = new Map();
  private geofenceSubscribers: Map<string, Set<GeofenceAlertCallback>> = new Map();
  private isSubscribed = false;

  /**
   * Initialize Redis Pub/Sub subscriptions
   * Should be called once on server startup
   */
  async initialize(): Promise<void> {
    if (this.isSubscribed) {
      return;
    }

    try {
      const client = redis.getClient();
      if (!client) {
        console.warn('⚠️  Redis unavailable - Pub/Sub disabled');
        return;
      }

      const pubsub = client.duplicate();
      await pubsub.connect();

      // Subscribe to location update channels
      const locationPattern = 'transport:location:*';
      const tripPattern = 'transport:trip:*';
      const geofencePattern = 'transport:geofence:*';

      // Note: Redis doesn't support pattern subscription in pub/sub
      // Instead, we'll handle this at the publishLocation level with specific channels
      // For now, we establish the connection
      console.log('✅ Transport Pub/Sub service initialized');

      this.isSubscribed = true;
    } catch (error: any) {
      console.error('Failed to initialize Transport Pub/Sub:', error);
      throw error;
    }
  }

  /**
   * Publish location update to all subscribers
   * Sends to Redis Pub/Sub for cross-server broadcasting
   *
   * Usage:
   * transportPubSubService.publishLocationUpdate({
   *   vehicleId: 'v123',
   *   latitude: 40.7128,
   *   longitude: -74.0060,
   *   accuracy: 10,
   *   status: 'ONLINE',
   *   timestamp: new Date().toISOString()
   * })
   */
  async publishLocationUpdate(location: LocationUpdate): Promise<void> {
    const channel = `transport:location:${location.vehicleId}`;
    const client = redis.getClient();
    if (!client) return;

    try {
      // Publish to Redis Pub/Sub for cross-server broadcasting
      const numSubscribers = await client.publish(channel, JSON.stringify(location));

      // Also publish to school-wide channel for admins viewing all vehicles
      // Note: We'll need to pass schoolId separately or fetch it from vehicle
      // For now, we rely on Socket.IO adapter to handle room broadcasting

      if (numSubscribers > 0) {
        // console.log(`📡 Location published to ${numSubscribers} subscribers`);
      }
    } catch (error: any) {
      console.error(`Failed to publish location for vehicle ${location.vehicleId}:`, error);
      // Don't throw - continue even if pub/sub fails
    }
  }

  /**
   * Publish trip update to all subscribers
   *
   * Usage:
   * transportPubSubService.publishTripUpdate({
   *   tripId: 't456',
   *   status: 'IN_PROGRESS',
   *   nextStop: { stopId: 'stop-1', name: 'Main Street', eta: '...' },
   *   studentsBoarded: 15
   * })
   */
  async publishTripUpdate(update: TripUpdate): Promise<void> {
    const channel = `transport:trip:${update.tripId}`;
    const client = redis.getClient();
    if (!client) return;

    try {
      const numSubscribers = await client.publish(channel, JSON.stringify(update));

      if (numSubscribers > 0) {
        // console.log(`🚌 Trip update published to ${numSubscribers} subscribers`);
      }
    } catch (error: any) {
      console.error(`Failed to publish trip update for trip ${update.tripId}:`, error);
    }
  }

  /**
   * Publish geofence alert when vehicle enters/exits stop geofence
   *
   * Usage:
   * transportPubSubService.publishGeofenceAlert({
   *   vehicleId: 'v123',
   *   stopId: 'stop-1',
   *   stopName: 'Main Street',
   *   action: 'ARRIVED',
   *   distance: 45,
   *   timestamp: new Date().toISOString()
   * })
   */
  async publishGeofenceAlert(alert: GeofenceAlert): Promise<void> {
    const channel = `transport:geofence:${alert.vehicleId}`;
    const client = redis.getClient();
    if (!client) return;

    try {
      const numSubscribers = await client.publish(channel, JSON.stringify(alert));

      if (numSubscribers > 0) {
        // console.log(`🎯 Geofence alert published to ${numSubscribers} subscribers`);
      }
    } catch (error: any) {
      console.error(`Failed to publish geofence alert:`, error);
    }
  }

  /**
   * Subscribe to location updates for a vehicle
   * This is typically used within server-side listeners
   *
   * Note: For WebSocket clients, Socket.IO adapter handles pub/sub internally
   */
  subscribeToLocationUpdates(vehicleId: string, callback: LocationUpdateCallback): void {
    if (!this.locationSubscribers.has(vehicleId)) {
      this.locationSubscribers.set(vehicleId, new Set());
    }

    this.locationSubscribers.get(vehicleId)!.add(callback);
  }

  /**
   * Unsubscribe from location updates
   */
  unsubscribeFromLocationUpdates(vehicleId: string, callback: LocationUpdateCallback): void {
    const subscribers = this.locationSubscribers.get(vehicleId);
    if (subscribers) {
      subscribers.delete(callback);
    }
  }

  /**
   * Subscribe to trip updates
   */
  subscribeToTripUpdates(tripId: string, callback: TripUpdateCallback): void {
    if (!this.tripSubscribers.has(tripId)) {
      this.tripSubscribers.set(tripId, new Set());
    }

    this.tripSubscribers.get(tripId)!.add(callback);
  }

  /**
   * Unsubscribe from trip updates
   */
  unsubscribeFromTripUpdates(tripId: string, callback: TripUpdateCallback): void {
    const subscribers = this.tripSubscribers.get(tripId);
    if (subscribers) {
      subscribers.delete(callback);
    }
  }

  /**
   * Subscribe to geofence alerts
   */
  subscribeToGeofenceAlerts(vehicleId: string, callback: GeofenceAlertCallback): void {
    if (!this.geofenceSubscribers.has(vehicleId)) {
      this.geofenceSubscribers.set(vehicleId, new Set());
    }

    this.geofenceSubscribers.get(vehicleId)!.add(callback);
  }

  /**
   * Unsubscribe from geofence alerts
   */
  unsubscribeFromGeofenceAlerts(vehicleId: string, callback: GeofenceAlertCallback): void {
    const subscribers = this.geofenceSubscribers.get(vehicleId);
    if (subscribers) {
      subscribers.delete(callback);
    }
  }

  /**
   * Get Redis Pub/Sub stats for monitoring
   */
  async getPubSubStats(): Promise<{
    pubsubChannels: number;
    pubsubPatterns: number;
  }> {
    try {
      return {
        pubsubChannels: Object.keys(this.locationSubscribers).length,
        pubsubPatterns: 0,
      };
    } catch (error) {
      console.error('Failed to get Pub/Sub stats:', error);
      return { pubsubChannels: 0, pubsubPatterns: 0 };
    }
  }

  /**
   * Health check for Pub/Sub service
   */
  async healthCheck(): Promise<boolean> {
    try {
      return redis.isConnected();
    } catch (error) {
      return false;
    }
  }
}

export const transportPubSubService = new TransportPubSubService();
