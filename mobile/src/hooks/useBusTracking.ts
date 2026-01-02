/**
 * useBusTracking Hook - Manage real-time bus tracking state
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { parentSocketService, LocationUpdate, VehicleStatus } from '../services/parent-socket.service';
import { calculateETA, ETAResult } from '../utils/eta.util';

export interface BusLocation {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: Date;
}

export interface BusTrackingState {
  currentLocation: BusLocation | null;
  status: VehicleStatus | null;
  isLive: boolean;
  isConnected: boolean;
  error: string | null;
  pickupETA: ETAResult | null;
  dropETA: ETAResult | null;
}

export interface UseBusTrackingOptions {
  vehicleId: string;
  parentLat?: number;
  parentLon?: number;
  pickupLat?: number;
  pickupLon?: number;
  dropLat?: number;
  dropLon?: number;
  averageSpeed?: number;
  updateInterval?: number; // milliseconds
}

export function useBusTracking(options: UseBusTrackingOptions) {
  const [tracking, setTracking] = useState<BusTrackingState>({
    currentLocation: null,
    status: null,
    isLive: false,
    isConnected: false,
    error: null,
    pickupETA: null,
    dropETA: null,
  });

  const [tripEvents, setTripEvents] = useState<any[]>([]);
  const etaUpdateIntervalRef = useRef<NodeJS.Timeout>();

  // Initialize Socket.IO connection
  useEffect(() => {
    const initializeTracking = async () => {
      try {
        await parentSocketService.connect(options.vehicleId);
        setTracking((prev) => ({ ...prev, isConnected: true, error: null }));

        // Register callbacks
        parentSocketService.onLocationUpdate(handleLocationUpdate);
        parentSocketService.onStatusUpdate(handleStatusUpdate);
        parentSocketService.onStudentBoarded((data) => {
          setTripEvents((prev) => [
            ...prev,
            { type: 'BOARDED', data, timestamp: new Date() },
          ]);
        });
        parentSocketService.onStudentAlighted((data) => {
          setTripEvents((prev) => [
            ...prev,
            { type: 'ALIGHTED', data, timestamp: new Date() },
          ]);
        });
        parentSocketService.onTripStatusChanged((data) => {
          setTripEvents((prev) => [
            ...prev,
            { type: 'STATUS_CHANGED', data, timestamp: new Date() },
          ]);
        });
      } catch (error) {
        console.error('Error initializing bus tracking:', error);
        setTracking((prev) => ({
          ...prev,
          isConnected: false,
          error: 'Failed to connect to tracking service',
        }));
      }
    };

    initializeTracking();

    return () => {
      parentSocketService.disconnect();
      if (etaUpdateIntervalRef.current) {
        clearInterval(etaUpdateIntervalRef.current);
      }
    };
  }, [options.vehicleId]);

  // Handle location updates
  const handleLocationUpdate = useCallback(
    (location: LocationUpdate) => {
      const busLocation: BusLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed,
        heading: location.heading,
        accuracy: location.accuracy,
        timestamp: new Date(location.timestamp),
      };

      setTracking((prev) => ({
        ...prev,
        currentLocation: busLocation,
        isLive: true,
      }));

      // Calculate ETAs
      if (busLocation.latitude && busLocation.longitude) {
        let pickupETA = null;
        let dropETA = null;

        if (options.pickupLat && options.pickupLon) {
          pickupETA = calculateETA(
            busLocation.latitude,
            busLocation.longitude,
            options.pickupLat,
            options.pickupLon,
            options.averageSpeed || 40
          );
        }

        if (options.dropLat && options.dropLon) {
          dropETA = calculateETA(
            busLocation.latitude,
            busLocation.longitude,
            options.dropLat,
            options.dropLon,
            options.averageSpeed || 40
          );
        }

        setTracking((prev) => ({
          ...prev,
          pickupETA,
          dropETA,
        }));
      }
    },
    [options.pickupLat, options.pickupLon, options.dropLat, options.dropLon, options.averageSpeed]
  );

  // Handle status updates
  const handleStatusUpdate = useCallback((status: VehicleStatus) => {
    setTracking((prev) => ({
      ...prev,
      status,
      isLive: status.isLive,
    }));
  }, []);

  // Refresh ETAs periodically to show countdown
  useEffect(() => {
    etaUpdateIntervalRef.current = setInterval(() => {
      setTracking((prev) => {
        if (!prev.currentLocation) return prev;

        let pickupETA = null;
        let dropETA = null;

        if (options.pickupLat && options.pickupLon) {
          pickupETA = calculateETA(
            prev.currentLocation.latitude,
            prev.currentLocation.longitude,
            options.pickupLat,
            options.pickupLon,
            options.averageSpeed || 40
          );
        }

        if (options.dropLat && options.dropLon) {
          dropETA = calculateETA(
            prev.currentLocation.latitude,
            prev.currentLocation.longitude,
            options.dropLat,
            options.dropLon,
            options.averageSpeed || 40
          );
        }

        return { ...prev, pickupETA, dropETA };
      });
    }, options.updateInterval || 10000); // Update every 10 seconds by default

    return () => {
      if (etaUpdateIntervalRef.current) {
        clearInterval(etaUpdateIntervalRef.current);
      }
    };
  }, [options.pickupLat, options.pickupLon, options.dropLat, options.dropLon, options.averageSpeed, options.updateInterval]);

  // Get current connection status
  const isConnected = parentSocketService.isConnected();

  return {
    ...tracking,
    isConnected,
    tripEvents,
    clearTripEvents: () => setTripEvents([]),
  };
}
