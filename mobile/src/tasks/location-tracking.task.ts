/**
 * Background Location Tracking Task - Runs in background to track location
 */

import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineQueueService } from '../services/offline-queue.service';

const LOCATION_TASK_NAME = 'background-location-tracking';

export const LocationTrackingTask = {
  /**
   * Register background location task
   */
  register: async () => {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);

      if (isRegistered) {
        console.log('[LocationTask] Task already registered');
        return true;
      }

      // Define the task
      TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
        try {
          if (error) {
            console.error('[LocationTask] Error in background task:', error);
            return;
          }

          const tripId = await AsyncStorage.getItem('current_trip_id');

          if (!tripId) {
            console.log('[LocationTask] No active trip, skipping');
            return;
          }

          if (!data || !data.locations || data.locations.length === 0) {
            console.log('[LocationTask] No location data available');
            return;
          }

          // Get the last location
          const location = data.locations[data.locations.length - 1];

          console.log(`[LocationTask] Got location: ${location.latitude}, ${location.longitude}`);

          // Queue the location update
          await offlineQueueService.enqueue({
            endpoint: '/transportation/location',
            method: 'POST',
            payload: {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              altitude: location.altitude,
              bearing: location.heading,
              speed: location.speed,
              timestamp: new Date(location.timestamp).toISOString(),
            },
          });

          console.log('[LocationTask] Location queued for upload');
        } catch (error) {
          console.error('[LocationTask] Error processing location:', error);
        }
      });

      console.log('[LocationTask] Task registered successfully');
      return true;
    } catch (error) {
      console.error('[LocationTask] Error registering task:', error);
      return false;
    }
  },

  /**
   * Start background location tracking
   */
  start: async () => {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);

      if (!isRegistered) {
        console.log('[LocationTask] Task not registered, registering...');
        await LocationTrackingTask.register();
      }

      // Start the task with 15-second interval
      await TaskManager.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: 'BestForNavigation',
        distanceInterval: 5, // meters
        timeInterval: 15000, // 15 seconds
        deferredUpdatesInterval: 30000, // 30 seconds
        foregroundService: {
          notificationTitle: 'Location Tracking',
          notificationBody: 'Recording your location for trip tracking',
          notificationColor: '#3B82F6',
        },
      });

      console.log('[LocationTask] Background location tracking started');
      return true;
    } catch (error) {
      console.error('[LocationTask] Error starting background tracking:', error);
      return false;
    }
  },

  /**
   * Stop background location tracking
   */
  stop: async () => {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);

      if (isRegistered) {
        await TaskManager.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('[LocationTask] Background location tracking stopped');
      }

      return true;
    } catch (error) {
      console.error('[LocationTask] Error stopping background tracking:', error);
      return false;
    }
  },

  /**
   * Check if background tracking is running
   */
  isRunning: async () => {
    try {
      return await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    } catch (error) {
      console.error('[LocationTask] Error checking task status:', error);
      return false;
    }
  },

  /**
   * Set active trip ID for background tracking
   */
  setActiveTripId: async (tripId: string | null) => {
    try {
      if (tripId) {
        await AsyncStorage.setItem('current_trip_id', tripId);
        console.log(`[LocationTask] Set active trip ID: ${tripId}`);
      } else {
        await AsyncStorage.removeItem('current_trip_id');
        console.log('[LocationTask] Cleared active trip ID');
      }
      return true;
    } catch (error) {
      console.error('[LocationTask] Error setting active trip ID:', error);
      return false;
    }
  },

  /**
   * Get active trip ID
   */
  getActiveTripId: async () => {
    try {
      return await AsyncStorage.getItem('current_trip_id');
    } catch (error) {
      console.error('[LocationTask] Error getting active trip ID:', error);
      return null;
    }
  },
};
