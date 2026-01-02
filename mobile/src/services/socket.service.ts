/**
 * Socket.IO Service - Real-time communication
 */

import io, { Socket } from 'socket.io-client';
import { authService } from './auth.service';

interface SocketState {
  isConnected: boolean;
  socket: Socket | null;
  currentTripId: string | null;
}

type TripUpdateCallback = (data: any) => void;
type ConnectionChangeCallback = (isConnected: boolean) => void;

class SocketService {
  private state: SocketState = {
    isConnected: false,
    socket: null,
    currentTripId: null,
  };

  private tripUpdateCallbacks: TripUpdateCallback[] = [];
  private connectionChangeCallbacks: ConnectionChangeCallback[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  /**
   * Initialize Socket.IO connection
   */
  async connect(tripId: string): Promise<boolean> {
    try {
      // Get access token
      const token = await authService.getAccessToken();
      if (!token) {
        console.error('No access token available for Socket.IO connection');
        return false;
      }

      const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.0.106:5000/transport';

      // Create socket connection
      const socket = io(socketUrl, {
        auth: {
          token,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        autoConnect: true,
      });

      // Setup event listeners
      socket.on('connect', () => {
        console.log('Socket.IO connected');
        this.state.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionChange(true);

        // Subscribe to trip room
        this.subscribeTripRoom(tripId);
      });

      socket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
        this.state.isConnected = false;
        this.notifyConnectionChange(false);
      });

      socket.on('connect_error', (error: any) => {
        console.error('Socket.IO connection error:', error);
        this.state.isConnected = false;
        this.notifyConnectionChange(false);
      });

      socket.on('trip-update', (data: any) => {
        console.log('Trip update received:', data);
        this.notifyTripUpdate(data);
      });

      socket.on('student-boarded', (data: any) => {
        console.log('Student boarded event:', data);
        this.notifyTripUpdate({ type: 'student-boarded', data });
      });

      socket.on('student-alighted', (data: any) => {
        console.log('Student alighted event:', data);
        this.notifyTripUpdate({ type: 'student-alighted', data });
      });

      socket.on('error', (error: any) => {
        console.error('Socket.IO error:', error);
      });

      this.state.socket = socket;
      this.state.currentTripId = tripId;

      console.log('Socket.IO initialized for trip:', tripId);
      return true;
    } catch (error) {
      console.error('Error initializing Socket.IO:', error);
      this.state.isConnected = false;
      this.notifyConnectionChange(false);
      return false;
    }
  }

  /**
   * Subscribe to trip room for real-time updates
   */
  private subscribeTripRoom(tripId: string): void {
    if (!this.state.socket) {
      console.error('Socket not connected');
      return;
    }

    try {
      // Emit subscription request
      this.state.socket.emit('subscribe', `trip:${tripId}`);
      console.log('Subscribed to trip room:', tripId);
    } catch (error) {
      console.error('Error subscribing to trip room:', error);
    }
  }

  /**
   * Disconnect Socket.IO
   */
  disconnect(): void {
    try {
      if (this.state.socket) {
        this.state.socket.disconnect();
        this.state.socket = null;
      }

      this.state.isConnected = false;
      this.state.currentTripId = null;
      this.tripUpdateCallbacks = [];
      this.connectionChangeCallbacks = [];

      console.log('Socket.IO disconnected');
    } catch (error) {
      console.error('Error disconnecting Socket.IO:', error);
    }
  }

  /**
   * Register callback for trip updates
   */
  onTripUpdate(callback: TripUpdateCallback): () => void {
    this.tripUpdateCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.tripUpdateCallbacks = this.tripUpdateCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Register callback for connection status changes
   */
  onConnectionChange(callback: ConnectionChangeCallback): () => void {
    this.connectionChangeCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.connectionChangeCallbacks = this.connectionChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify all trip update subscribers
   */
  private notifyTripUpdate(data: any): void {
    this.tripUpdateCallbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in trip update callback:', error);
      }
    });
  }

  /**
   * Notify all connection change subscribers
   */
  private notifyConnectionChange(isConnected: boolean): void {
    this.connectionChangeCallbacks.forEach((callback) => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('Error in connection change callback:', error);
      }
    });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.isConnected && this.state.socket?.connected === true;
  }

  /**
   * Get current trip ID
   */
  getCurrentTripId(): string | null {
    return this.state.currentTripId;
  }

  /**
   * Emit custom event (for future use)
   */
  emit(event: string, data: any): void {
    if (this.state.socket && this.state.isConnected) {
      this.state.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  /**
   * Get raw socket instance
   */
  getSocket(): Socket | null {
    return this.state.socket;
  }
}

export const socketService = new SocketService();
