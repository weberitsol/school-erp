/**
 * Parent Socket Service - Real-time bus tracking via WebSocket
 */

import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationUpdate {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: string;
}

export interface VehicleStatus {
  vehicleId: string;
  latitude: number;
  longitude: number;
  lastUpdated: string;
  isLive: boolean;
}

type LocationCallback = (location: LocationUpdate) => void;
type StatusCallback = (status: VehicleStatus) => void;
type StudentBoardedCallback = (data: any) => void;
type StudentAlightedCallback = (data: any) => void;
type TripStatusCallback = (data: any) => void;

class ParentSocketService {
  private socket: Socket | null = null;
  private apiUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.0.106:5000/transport';
  private vehicleId: string | null = null;
  private locationCallbacks: LocationCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private boardedCallbacks: StudentBoardedCallback[] = [];
  private alightedCallbacks: StudentAlightedCallback[] = [];
  private tripStatusCallbacks: TripStatusCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Initialize Socket.IO connection
   */
  async connect(vehicleId: string): Promise<void> {
    if (this.socket?.connected && this.vehicleId === vehicleId) {
      console.log('[ParentSocket] Already connected to vehicle:', vehicleId);
      return;
    }

    this.vehicleId = vehicleId;
    this.reconnectAttempts = 0;

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token available');
      }

      this.socket = io(this.apiUrl, {
        auth: {
          token,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      // Connection events
      this.socket.on('connect', () => {
        console.log('[ParentSocket] Connected to Socket.IO server');
        this.reconnectAttempts = 0;
        this.subscribe(vehicleId);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[ParentSocket] Disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('[ParentSocket] Connection error:', error);
      });

      // Location update events
      this.socket.on('location-update', (data: LocationUpdate) => {
        console.log('[ParentSocket] ✓ Location update received');
        this.vehicleLocationUpdated(data);
      });

      // Trip events
      this.socket.on('student-boarded', (data: any) => {
        console.log('[ParentSocket] ✓ Student boarded:', data);
        this.notifyStudentBoarded(data);
      });

      this.socket.on('student-alighted', (data: any) => {
        console.log('[ParentSocket] ✓ Student alighted:', data);
        this.notifyStudentAlighted(data);
      });

      this.socket.on('trip-status-changed', (data: any) => {
        console.log('[ParentSocket] ✓ Trip status changed:', data);
        this.notifyTripStatusChanged(data);
      });

      console.log('[ParentSocket] ✓ Socket.IO initialized');
    } catch (error) {
      console.error('[ParentSocket] Failed to initialize Socket.IO:', error);
      throw error;
    }
  }

  /**
   * Subscribe to vehicle location updates
   */
  private subscribe(vehicleId: string): void {
    if (!this.socket?.connected) {
      console.warn('[ParentSocket] Cannot subscribe - not connected');
      return;
    }

    const room = `vehicle:${vehicleId}`;
    this.socket.emit('subscribe', room);
    console.log('[ParentSocket] Subscribed to room:', room);
  }

  /**
   * Unsubscribe from vehicle updates
   */
  private unsubscribe(): void {
    if (!this.socket || !this.vehicleId) return;

    const room = `vehicle:${this.vehicleId}`;
    this.socket.emit('unsubscribe', room);
    console.log('[ParentSocket] Unsubscribed from room:', room);
  }

  /**
   * Disconnect from Socket.IO
   */
  disconnect(): void {
    if (!this.socket) return;

    this.unsubscribe();
    this.socket.disconnect();
    this.socket = null;
    this.vehicleId = null;
    this.locationCallbacks = [];
    this.statusCallbacks = [];
    this.boardedCallbacks = [];
    this.alightedCallbacks = [];
    this.tripStatusCallbacks = [];

    console.log('[ParentSocket] Disconnected');
  }

  /**
   * Register callback for location updates
   */
  onLocationUpdate(callback: LocationCallback): void {
    this.locationCallbacks.push(callback);
  }

  /**
   * Register callback for vehicle status
   */
  onStatusUpdate(callback: StatusCallback): void {
    this.statusCallbacks.push(callback);
  }

  /**
   * Register callback for student boarded event
   */
  onStudentBoarded(callback: StudentBoardedCallback): void {
    this.boardedCallbacks.push(callback);
  }

  /**
   * Register callback for student alighted event
   */
  onStudentAlighted(callback: StudentAlightedCallback): void {
    this.alightedCallbacks.push(callback);
  }

  /**
   * Register callback for trip status changes
   */
  onTripStatusChanged(callback: TripStatusCallback): void {
    this.tripStatusCallbacks.push(callback);
  }

  /**
   * Notify location update callbacks
   */
  private vehicleLocationUpdated(location: LocationUpdate): void {
    const status: VehicleStatus = {
      vehicleId: location.vehicleId,
      latitude: location.latitude,
      longitude: location.longitude,
      lastUpdated: location.timestamp,
      isLive: true,
    };

    this.locationCallbacks.forEach((callback) => {
      try {
        callback(location);
      } catch (error) {
        console.error('[ParentSocket] Error in location callback:', error);
      }
    });

    this.statusCallbacks.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        console.error('[ParentSocket] Error in status callback:', error);
      }
    });
  }

  /**
   * Notify student boarded callbacks
   */
  private notifyStudentBoarded(data: any): void {
    this.boardedCallbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('[ParentSocket] Error in boarded callback:', error);
      }
    });
  }

  /**
   * Notify student alighted callbacks
   */
  private notifyStudentAlighted(data: any): void {
    this.alightedCallbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('[ParentSocket] Error in alighted callback:', error);
      }
    });
  }

  /**
   * Notify trip status changed callbacks
   */
  private notifyTripStatusChanged(data: any): void {
    this.tripStatusCallbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('[ParentSocket] Error in trip status callback:', error);
      }
    });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get current vehicle ID
   */
  getCurrentVehicleId(): string | null {
    return this.vehicleId;
  }
}

export const parentSocketService = new ParentSocketService();
