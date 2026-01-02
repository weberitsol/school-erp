import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis } from './redis';

const prisma = new PrismaClient();

interface SocketUser {
  id: string;
  email: string;
  role: string;
  schoolId: string;
}

interface SocketData extends Socket {
  user?: SocketUser;
  authenticated?: boolean;
}

/**
 * Initialize Socket.IO server with JWT authentication and room management
 * Namespace: /transport
 */
export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        process.env.WEB_ADMIN_URL || 'http://localhost:3000',
        process.env.MOBILE_APP_URL || 'exp://localhost:19000',
        'http://localhost:3001',
        'http://localhost:3002',
      ],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
  });

  // Create transport namespace
  const transportNamespace = io.of('/transport');

  // Set up Redis Pub/Sub adapter for multi-server scaling
  // This allows Socket.IO to broadcast across multiple server instances
  try {
    const pubClient = redis.getClient();

    if (pubClient && redis.isConnected()) {
      const subClient = pubClient.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Socket.IO Redis Pub/Sub adapter configured');
    } else {
      console.warn('⚠️ Redis not connected - Socket.IO Pub/Sub adapter will be skipped');
    }
  } catch (error: any) {
    console.warn('⚠️ Failed to setup Redis adapter for Socket.IO:', error.message);
    console.log('📌 Socket.IO will work in single-server mode');
  }

  // JWT Authentication Middleware
  transportNamespace.use(async (socket: SocketData, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Extract token from Bearer format if present
      const extractedToken = token.startsWith('Bearer ') ? token.slice(7) : token;

      // Verify JWT
      const decoded = jwt.verify(extractedToken, process.env.JWT_SECRET || 'your-secret-key') as any;

      // Validate user exists in database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, schoolId: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user data to socket
      socket.user = user;
      socket.authenticated = true;

      return next();
    } catch (error: any) {
      console.error('Socket authentication error:', error.message);
      return next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  transportNamespace.on('connection', (socket: SocketData) => {
    if (!socket.user) {
      socket.disconnect();
      return;
    }

    console.log(
      `🔗 User ${socket.user.email} connected to transport namespace [${socket.id}]`
    );

    // ==================== EVENT HANDLERS ====================

    /**
     * Subscribe to vehicle location updates
     * Room format: vehicle:{vehicleId}
     *
     * Example:
     * socket.emit('subscribe:vehicle', { vehicleId: 'v123' })
     */
    socket.on('subscribe:vehicle', async (data: { vehicleId: string }, callback) => {
      try {
        if (!data.vehicleId) {
          return callback({ success: false, error: 'Vehicle ID is required' });
        }

        // Validate user has access to this vehicle (same school)
        const vehicle = await prisma.vehicle.findFirst({
          where: { id: data.vehicleId, schoolId: socket.user!.schoolId },
        });

        if (!vehicle) {
          return callback({
            success: false,
            error: 'Vehicle not found or access denied',
          });
        }

        const room = `vehicle:${data.vehicleId}`;
        socket.join(room);

        console.log(`📍 ${socket.user!.email} subscribed to ${room}`);

        callback({
          success: true,
          message: `Subscribed to vehicle ${data.vehicleId}`,
        });
      } catch (error: any) {
        console.error('Subscribe vehicle error:', error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Unsubscribe from vehicle location updates
     *
     * Example:
     * socket.emit('unsubscribe:vehicle', { vehicleId: 'v123' })
     */
    socket.on('unsubscribe:vehicle', (data: { vehicleId: string }, callback) => {
      try {
        if (!data.vehicleId) {
          return callback({ success: false, error: 'Vehicle ID is required' });
        }

        const room = `vehicle:${data.vehicleId}`;
        socket.leave(room);

        console.log(`📍 ${socket.user!.email} unsubscribed from ${room}`);

        callback({
          success: true,
          message: `Unsubscribed from vehicle ${data.vehicleId}`,
        });
      } catch (error: any) {
        console.error('Unsubscribe vehicle error:', error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Subscribe to trip updates
     * Room format: trip:{tripId}
     *
     * Example:
     * socket.emit('subscribe:trip', { tripId: 't456' })
     */
    socket.on('subscribe:trip', async (data: { tripId: string }, callback) => {
      try {
        if (!data.tripId) {
          return callback({ success: false, error: 'Trip ID is required' });
        }

        // Validate user has access to this trip (same school)
        const trip = await prisma.trip.findFirst({
          where: { id: data.tripId, schoolId: socket.user!.schoolId },
        });

        if (!trip) {
          return callback({
            success: false,
            error: 'Trip not found or access denied',
          });
        }

        const room = `trip:${data.tripId}`;
        socket.join(room);

        console.log(`🚌 ${socket.user!.email} subscribed to ${room}`);

        callback({
          success: true,
          message: `Subscribed to trip ${data.tripId}`,
        });
      } catch (error: any) {
        console.error('Subscribe trip error:', error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Unsubscribe from trip updates
     *
     * Example:
     * socket.emit('unsubscribe:trip', { tripId: 't456' })
     */
    socket.on('unsubscribe:trip', (data: { tripId: string }, callback) => {
      try {
        if (!data.tripId) {
          return callback({ success: false, error: 'Trip ID is required' });
        }

        const room = `trip:${data.tripId}`;
        socket.leave(room);

        console.log(`🚌 ${socket.user!.email} unsubscribed from ${room}`);

        callback({
          success: true,
          message: `Unsubscribed from trip ${data.tripId}`,
        });
      } catch (error: any) {
        console.error('Unsubscribe trip error:', error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Subscribe to all vehicles in school
     * Room format: school:{schoolId}
     * Only ADMIN/SUPER_ADMIN can subscribe
     *
     * Example:
     * socket.emit('subscribe:school', {})
     */
    socket.on('subscribe:school', (data: any, callback) => {
      try {
        // Only admins can view all school vehicles
        if (!['ADMIN', 'SUPER_ADMIN'].includes(socket.user!.role)) {
          return callback({
            success: false,
            error: 'Admin access required',
          });
        }

        const room = `school:${socket.user!.schoolId}`;
        socket.join(room);

        console.log(`🏫 ${socket.user!.email} subscribed to school locations`);

        callback({
          success: true,
          message: 'Subscribed to school vehicle locations',
        });
      } catch (error: any) {
        console.error('Subscribe school error:', error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Unsubscribe from school vehicles
     *
     * Example:
     * socket.emit('unsubscribe:school', {})
     */
    socket.on('unsubscribe:school', (data: any, callback) => {
      try {
        const room = `school:${socket.user!.schoolId}`;
        socket.leave(room);

        console.log(`🏫 ${socket.user!.email} unsubscribed from school locations`);

        callback({
          success: true,
          message: 'Unsubscribed from school vehicle locations',
        });
      } catch (error: any) {
        console.error('Unsubscribe school error:', error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Ping to keep connection alive
     *
     * Example:
     * socket.emit('ping', {}, (response) => console.log(response))
     */
    socket.on('ping', (data: any, callback) => {
      if (typeof callback === 'function') {
        callback({
          success: true,
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', (reason) => {
      console.log(
        `❌ User ${socket.user?.email} disconnected [${socket.id}] - Reason: ${reason}`
      );
    });

    /**
     * Error handler
     */
    socket.on('error', (error) => {
      console.error(`⚠️ Socket error for ${socket.user?.email}:`, error);
    });
  });

  return io;
}

/**
 * Helper function to broadcast location update to vehicle subscribers
 *
 * Usage:
 * broadcastVehicleLocation(io, vehicleId, schoolId, locationData)
 */
export function broadcastVehicleLocation(
  io: SocketIOServer,
  vehicleId: string,
  schoolId: string,
  location: any
) {
  // Broadcast to vehicle-specific room
  io.of('/transport').to(`vehicle:${vehicleId}`).emit('location:update', {
    vehicleId,
    location,
    timestamp: new Date().toISOString(),
  });

  // Broadcast to school-wide room (for admins viewing all vehicles)
  io.of('/transport').to(`school:${schoolId}`).emit('location:update', {
    vehicleId,
    location,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper function to broadcast trip update
 *
 * Usage:
 * broadcastTripUpdate(io, tripId, schoolId, updateData)
 */
export function broadcastTripUpdate(
  io: SocketIOServer,
  tripId: string,
  schoolId: string,
  update: any
) {
  io.of('/transport').to(`trip:${tripId}`).emit('trip:update', {
    tripId,
    update,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper function to get active connections count
 */
export function getActiveConnections(io: SocketIOServer): number {
  return io.of('/transport').sockets.size;
}

/**
 * Helper function to get room subscribers count
 */
export function getRoomSubscribersCount(io: SocketIOServer, room: string): number {
  const namespace = io.of('/transport');
  return namespace.sockets.size;
}

export default initializeSocketIO;
