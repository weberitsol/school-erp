import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface LocationUpdate {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: string;
}

interface VehicleUpdate {
  vehicleId: string;
  status: string;
  location?: LocationUpdate;
}

export const useVehicleSocket = (accessToken: string | null, enabled: boolean = true) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [locationUpdates, setLocationUpdates] = useState<Map<string, LocationUpdate>>(new Map());
  const [vehicleUpdates, setVehicleUpdates] = useState<Map<string, VehicleUpdate>>(new Map());

  useEffect(() => {
    if (!enabled || !accessToken) return;

    // Initialize Socket.IO connection
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: {
        token: accessToken,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to server');
      setIsConnected(true);
      // Subscribe to all vehicle location updates
      socket.emit('subscribe', { channel: 'vehicle:locations' });
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error);
    });

    // Vehicle location updates
    socket.on('transport:location:update', (data: LocationUpdate) => {
      console.log('[Socket.IO] Location update:', data);
      setLocationUpdates((prev) => {
        const updated = new Map(prev);
        updated.set(data.vehicleId, data);
        return updated;
      });
    });

    // Vehicle status updates
    socket.on('transport:vehicle:update', (data: VehicleUpdate) => {
      console.log('[Socket.IO] Vehicle update:', data);
      setVehicleUpdates((prev) => {
        const updated = new Map(prev);
        updated.set(data.vehicleId, data);
        return updated;
      });
    });

    // Batch location updates
    socket.on('transport:locations:batch', (data: LocationUpdate[]) => {
      console.log('[Socket.IO] Batch location updates:', data.length);
      setLocationUpdates((prev) => {
        const updated = new Map(prev);
        data.forEach((update) => {
          updated.set(update.vehicleId, update);
        });
        return updated;
      });
    });

    return () => {
      if (socket.connected) {
        socket.emit('unsubscribe', { channel: 'vehicle:locations' });
        socket.disconnect();
      }
    };
  }, [accessToken, enabled]);

  // Utility to get latest location for a vehicle
  const getVehicleLocation = useCallback((vehicleId: string): LocationUpdate | undefined => {
    return locationUpdates.get(vehicleId);
  }, [locationUpdates]);

  // Utility to get vehicle status
  const getVehicleStatus = useCallback((vehicleId: string): VehicleUpdate | undefined => {
    return vehicleUpdates.get(vehicleId);
  }, [vehicleUpdates]);

  // Emit events to server
  const publishLocationUpdate = useCallback((location: LocationUpdate) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('publish', {
        channel: 'vehicle:locations',
        data: location,
      });
    }
  }, []);

  return {
    isConnected,
    socket: socketRef.current,
    locationUpdates,
    vehicleUpdates,
    getVehicleLocation,
    getVehicleStatus,
    publishLocationUpdate,
  };
};
