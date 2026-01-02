/**
 * GPS Tracking Service - Location tracking with background support
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { tripService } from './trip.service';
import { offlineQueueService } from './offline-queue.service';
import { LocationUpdate } from '../types/api.types';

const LOCATION_TASK_NAME = 'background-location-task';
const LOCATION_UPDATE_INTERVAL = 15000; // 15 seconds
const MIN_DISTANCE = 10; // meters

interface GPSState {
  isTracking: boolean;
  currentLocation: Location.LocationObject | null;
  isOnline: boolean;
  lastUpdateTime: number | null;
}

class GPSTrackingService {
  private state: GPSState = {
    isTracking: false,
    currentLocation: null,
    isOnline: false,
    lastUpdateTime: null,
  };

  private locationListener: Location.LocationSubscription | null = null;
  private updateIntervalId: NodeJS.Timeout | null = null;
  private onLocationUpdate: ((location: Location.LocationObject) => void) | null = null;
  private onStatusChange: ((isOnline: boolean) => void) | null = null;

  /**
   * Request location permissions (foreground + background)
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Request foreground permission
      const foregroundStatus = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus.status !== 'granted') {
        console.warn('Foreground location permission denied');
        return false;
      }

      // Request background permission
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        console.warn('Background location permission denied');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Check if location permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const foreground = await Location.getForegroundPermissionsAsync();
      return foreground.status === 'granted';
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Start GPS tracking (foreground)
   */
  async startTracking(
    onLocationUpdate?: (location: Location.LocationObject) => void,
    onStatusChange?: (isOnline: boolean) => void
  ): Promise<boolean> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          console.error('Location permissions not granted');
          this.state.isOnline = false;
          onStatusChange?.(false);
          return false;
        }
      }

      // Store callbacks
      this.onLocationUpdate = onLocationUpdate || null;
      this.onStatusChange = onStatusChange || null;

      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      this.state.currentLocation = location;
      this.state.isOnline = true;
      this.state.isTracking = true;
      onStatusChange?.(true);
      onLocationUpdate?.(location);

      // Start watching location
      this.locationListener = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: MIN_DISTANCE, // Only notify if moved 10m+
          timeInterval: LOCATION_UPDATE_INTERVAL,
        },
        (location) => {
          this.state.currentLocation = location;
          this.state.isOnline = true;
          this.state.lastUpdateTime = Date.now();
          onStatusChange?.(true);
          onLocationUpdate?.(location);
        }
      );

      // Start interval for regular updates
      this.startUpdateInterval();

      console.log('GPS tracking started');
      return true;
    } catch (error) {
      console.error('Error starting GPS tracking:', error);
      this.state.isOnline = false;
      onStatusChange?.(false);
      return false;
    }
  }

  /**
   * Stop GPS tracking
   */
  async stopTracking(): Promise<void> {
    try {
      // Stop location listener
      if (this.locationListener) {
        this.locationListener.remove();
        this.locationListener = null;
      }

      // Stop update interval
      if (this.updateIntervalId) {
        clearInterval(this.updateIntervalId);
        this.updateIntervalId = null;
      }

      // Unregister background task
      TaskManager.unregisterTaskAsync(LOCATION_TASK_NAME);

      this.state.isTracking = false;
      console.log('GPS tracking stopped');
    } catch (error) {
      console.error('Error stopping GPS tracking:', error);
    }
  }

  /**
   * Start interval for sending location updates to backend
   */
  private startUpdateInterval(): void {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }

    this.updateIntervalId = setInterval(async () => {
      if (this.state.currentLocation && this.state.isTracking) {
        await this.sendLocationToBackend(this.state.currentLocation);
      }
    }, LOCATION_UPDATE_INTERVAL);
  }

  /**
   * Send location update to backend (with offline queue support)
   */
  private async sendLocationToBackend(location: Location.LocationObject): Promise<void> {
    try {
      const update: LocationUpdate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        speed: location.coords.speed || 0,
        heading: location.coords.heading || 0,
        accuracy: location.coords.accuracy || 0,
      };

      // Send to backend via tripService
      await tripService.sendLocationUpdate(update);

      this.state.isOnline = true;
      this.onStatusChange?.(true);
      console.log('[GPS] Location sent to backend:', update);
    } catch (error: any) {
      console.error('[GPS] Error sending location to backend:', error);

      // Queue location update for later retry
      try {
        await offlineQueueService.enqueue({
          endpoint: '/transportation/location',
          method: 'POST',
          payload: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            speed: location.coords.speed || 0,
            heading: location.coords.heading || 0,
            accuracy: location.coords.accuracy || 0,
            timestamp: new Date().toISOString(),
          },
        });
        console.log('[GPS] Location queued for offline sync');
      } catch (queueError) {
        console.error('[GPS] Error queuing location:', queueError);
      }

      this.state.isOnline = false;
      this.onStatusChange?.(false);
    }
  }

  /**
   * Get current location
   */
  getCurrentLocation(): Location.LocationObject | null {
    return this.state.currentLocation;
  }

  /**
   * Get tracking status
   */
  isTracking(): boolean {
    return this.state.isTracking;
  }

  /**
   * Get online status
   */
  isOnline(): boolean {
    return this.state.isOnline;
  }

  /**
   * Get last update time
   */
  getLastUpdateTime(): number | null {
    return this.state.lastUpdateTime;
  }

  /**
   * Register background task for continuous location tracking
   */
  async registerBackgroundTask(): Promise<void> {
    try {
      // Define the background task
      TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
        if (error) {
          console.error('Background location task error:', error);
          return;
        }

        if (data) {
          const { locations } = data;
          const location = locations[locations.length - 1];

          if (location) {
            console.log('Background location received:', location);
            this.state.currentLocation = location;
            // Send to backend via background task
            await this.sendLocationToBackend(location);
          }
        }
      });

      // Start the background task
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        distanceInterval: MIN_DISTANCE,
        timeInterval: LOCATION_UPDATE_INTERVAL,
        mayShowUserSettingsDialog: true,
      });

      console.log('Background location task registered');
    } catch (error) {
      console.error('Error registering background task:', error);
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if driver is within geofence of a stop
   */
  isWithinGeofence(lat1: number, lon1: number, lat2: number, lon2: number, radiusMeters: number = 50): boolean {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= radiusMeters;
  }
}

export const gpsTrackingService = new GPSTrackingService();
