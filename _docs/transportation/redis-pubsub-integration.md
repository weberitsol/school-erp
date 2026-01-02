# Redis Pub/Sub Integration - Multi-Server Scaling

## Overview

The Transportation Module uses Redis Pub/Sub to enable real-time location broadcasting across multiple server instances. This allows the system to scale horizontally while maintaining real-time synchronization between servers.

### Architecture

```
Driver App 1 ─→ Server 1 ─────┐
                              ├─→ Redis Pub/Sub ─→ Server 2 ─→ Parent App
Driver App 2 ─→ Server 2 ─────┤                 └─→ Server 3 ─→ Admin Dashboard
                              ├─→ Redis Cache (GPS locations)
Driver App 3 ─→ Server 3 ─────┘                 └─→ PostgreSQL (History)
```

## Key Features

✅ **Cross-Server Broadcasting** - Location updates from any server reach all clients
✅ **Redis Adapter** - Socket.IO Adapter for Redis ensures broadcasts cross server boundaries
✅ **Fault Tolerance** - Server failures don't affect other instances
✅ **Load Balancing** - Distribute connections across multiple servers
✅ **Zero-Downtime Scaling** - Add/remove servers without disrupting clients
✅ **Multi-Tenancy** - Schools remain isolated even with shared servers

## Redis Pub/Sub Channels

### Location Update Channels

**Channel Pattern**: `transport:location:{vehicleId}`

**Message Format**:
```json
{
  "vehicleId": "vehicle-123",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10,
  "status": "ONLINE",
  "timestamp": "2024-01-15T10:30:45Z"
}
```

**Subscribers**: All servers with clients interested in this vehicle

**Examples**:
- `transport:location:vehicle-123` - Updates for vehicle 123
- `transport:location:vehicle-456` - Updates for vehicle 456

---

### Trip Update Channels

**Channel Pattern**: `transport:trip:{tripId}`

**Message Format**:
```json
{
  "tripId": "trip-456",
  "status": "IN_PROGRESS",
  "nextStop": {
    "stopId": "stop-1",
    "name": "Main Street",
    "eta": "2024-01-15T10:35:00Z"
  },
  "studentsBoarded": 15,
  "studentsExpected": 20,
  "currentLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

**Examples**:
- `transport:trip:trip-456` - Updates for trip 456
- `transport:trip:trip-789` - Updates for trip 789

---

### Geofence Alert Channels

**Channel Pattern**: `transport:geofence:{vehicleId}`

**Message Format**:
```json
{
  "vehicleId": "vehicle-123",
  "stopId": "stop-1",
  "stopName": "Main Street",
  "action": "ARRIVED",
  "distance": 45,
  "timestamp": "2024-01-15T10:30:45Z"
}
```

**Actions**: `APPROACHING`, `ARRIVED`, `DEPARTED`

---

## How It Works

### Single Server Flow
```
Driver sends GPS
    ↓
Server 1 receives request
    ↓
Redis Cache updated
    ↓
Redis Pub/Sub publishes (transport:location:vehicle-123)
    ↓
Socket.IO broadcasts to subscribers in Server 1
    ↓
Clients connected to Server 1 receive update
```

### Multi-Server Flow
```
Driver sends GPS to Server 1
    ↓
Server 1 receives & caches in Redis
    ↓
Redis Pub/Sub publishes (transport:location:vehicle-123)
    ↓
Server 1 broadcasts to local subscribers
    ↓
Redis Adapter forwards to Server 2 & Server 3
    ↓
Server 2 broadcasts to its clients
Server 3 broadcasts to its clients
    ↓
All clients worldwide receive update in real-time
```

## Configuration

### Environment Variables

```bash
# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Socket.IO configuration
SOCKET_IO_PATH=/socket.io
SOCKET_IO_CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# GPS tracking settings
GPS_UPDATE_INTERVAL=15000          # GPS update frequency (ms)
GPS_DB_SAVE_INTERVAL=300000        # Save to DB every 5 minutes
GPS_CACHE_TTL=60                   # Redis cache TTL (seconds)
GPS_RATE_LIMIT_MAX=10              # Max updates per minute
```

### Redis Server Setup

#### Development (Single Instance)
```bash
# Start Redis server
redis-server

# Monitor Pub/Sub traffic
redis-cli
> MONITOR
```

#### Production (Replica Set)
```bash
# Main Redis server
redis-server --port 6379

# Replica server
redis-server --port 6380 --replicaof localhost 6379

# Sentinel for failover
redis-sentinel sentinel.conf
```

#### Docker Deployment
```dockerfile
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}

  redis-replica:
    image: redis:7-alpine
    ports:
      - "6380:6380"
    command: redis-server --port 6380 --replicaof redis 6379 --requirepass ${REDIS_PASSWORD}
    depends_on:
      - redis

volumes:
  redis_data:
```

## Socket.IO Redis Adapter

### How It Works

The `@socket.io/redis-adapter` package enables Socket.IO to:
1. Store room memberships in Redis
2. Route messages through Redis to other servers
3. Maintain session state across servers

### Configuration

```typescript
// backend/src/config/socket.config.ts
import { createAdapter } from '@socket.io/redis-adapter';
import { redis } from './redis';

const pubClient = redis.getClient();
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### Room Broadcasting

When a server broadcasts to a room:
1. Local subscribers receive immediately
2. Message is published to Redis Pub/Sub
3. Other servers receive via adapter
4. Other servers broadcast to their local subscribers

```typescript
// Broadcasting to vehicle room from Server 1
io.of('/transport').to(`vehicle:v123`).emit('location:update', data);

// Reaches clients connected to:
// - Server 1 (direct emit)
// - Server 2 (via Redis adapter)
// - Server 3 (via Redis adapter)
```

## Performance Characteristics

### Latency

| Component | Latency |
|-----------|---------|
| Driver → Server 1 | Network latency |
| Server 1 → Redis | < 1ms (same network) |
| Redis Pub/Sub | < 1ms |
| Server 2 → Client | Network latency |
| **Total End-to-End** | ~50-200ms (depending on network) |

### Throughput

- **Single Server**: 1000+ location updates/second
- **3 Servers with Redis**: 3000+ location updates/second (scales linearly)
- **Redis Pub/Sub**: Millions of messages/second

### Scalability

```
Without Redis Adapter (single server):
- Max connections: ~4,000 per server (typical limits)
- Total system capacity: 4,000 concurrent users

With Redis Adapter (3 servers):
- Max connections: ~4,000 × 3 = 12,000 concurrent users
- Adds minimal latency (Redis < 1ms)
```

## Deployment Strategies

### Load Balanced Setup

```
           ┌─────────────────┐
           │   Load Balancer │
           │   (nginx/HAProxy) │
           └────────┬────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
    ┌────────┐  ┌────────┐  ┌────────┐
    │Server 1│  │Server 2│  │Server 3│
    └────────┘  └────────┘  └────────┘
        │           │           │
        └───────────┼───────────┘
                    │
              ┌─────────────┐
              │ Redis Cluster│
              └─────────────┘
```

**Configuration**:
1. Load balancer distributes connections to multiple servers
2. All servers connect to same Redis instance/cluster
3. Socket.IO adapter synchronizes across servers
4. No sticky sessions needed (Redis maintains state)

### High Availability Setup

```
┌────────────────────────────────────┐
│         DNS Round Robin             │
└────────────────────────────────────┘
         │         │         │
    ┌────────┐ ┌────────┐ ┌────────┐
    │Server 1│ │Server 2│ │Server 3│
    └────────┘ └────────┘ └────────┘
         │         │         │
    ┌────────────────────────────────┐
    │   Redis Sentinel (HA)          │
    │   Master ───→ Replica ─→ Replica│
    └────────────────────────────────┘
```

**Features**:
- DNS load balancing (no SPOF)
- Redis Sentinel for automatic failover
- Each server independent
- Shared Redis state

## Monitoring & Debugging

### Redis CLI Commands

```bash
# Monitor Pub/Sub channels
redis-cli
> MONITOR

# List all channels
> PUBSUB CHANNELS

# Count subscribers for a channel
> PUBSUB NUMSUB transport:location:*

# Check memory usage
> INFO memory

# View key distribution
> INFO keyspace

# Check persistence
> INFO persistence
```

### Socket.IO Metrics

```javascript
// Check adapter stats
io.of('/transport').adapter.sockets(sockets => {
  console.log('Connected sockets:', sockets);
});

// Monitor rooms
io.of('/transport').adapter.rooms((rooms) => {
  console.log('Active rooms:', rooms);
});

// Check server instances
io.engine.clientsCount // Number of clients on this server
```

### Prometheus Metrics

```typescript
// Export Pub/Sub metrics
app.get('/metrics', async (req, res) => {
  const stats = await transportPubSubService.getPubSubStats();
  const socketStats = {
    activeConnections: io.of('/transport').sockets.size,
    activeRooms: io.of('/transport').sockets.size,
  };

  res.json({
    redis_pubsub: stats,
    websocket: socketStats,
  });
});
```

## Troubleshooting

### Issue: Updates not reaching other servers

**Symptoms**: Location updates visible on Server 1 but not Server 2

**Causes**:
- Redis not configured
- Redis adapter not initialized
- Network issues between servers and Redis

**Solution**:
```bash
# Check Redis connection
redis-cli ping
# Should return: PONG

# Check adapter status
console.log(io.of('/transport').adapter);
# Should show: RedisAdapter or similar

# Test pub/sub
redis-cli
> SUBSCRIBE transport:location:*
# Should receive messages when GPS updates occur
```

### Issue: High latency in location updates

**Symptoms**: Updates taking 5+ seconds to reach clients

**Causes**:
- Redis running on slow network
- Pub/Sub subscriber lag
- High message throughput overwhelming server

**Solution**:
```bash
# Check Redis latency
redis-cli --latency

# Monitor active channels
PUBSUB CHANNELS
PUBSUB NUMSUB transport:location:*

# Check server memory
INFO memory
# Look for mem_fragmentation_ratio
```

### Issue: Memory usage increasing continuously

**Symptoms**: Redis memory keeps growing

**Causes**:
- Cache expiration not configured
- Old GPS location data accumulating
- Pub/Sub channels not cleaning up

**Solution**:
```bash
# Set automatic key expiration
EXPIRE <key> <seconds>

# Clean old GPS locations
ZREMRANGEBYSCORE gps:location:* 0 <timestamp>

# Monitor expiration
CONFIG GET appendonly
CONFIG GET save
```

## Production Checklist

- [ ] Redis replication configured
- [ ] Redis persistence enabled (RDB or AOF)
- [ ] Redis Sentinel for failover
- [ ] Multiple application servers behind load balancer
- [ ] Socket.IO adapter configured on all servers
- [ ] Monitoring/alerting for Redis health
- [ ] Backup strategy for Redis data
- [ ] Network between app servers and Redis optimized
- [ ] Rate limiting configured (10 GPS/min per vehicle)
- [ ] Database saves enabled (sparse, every 5 minutes)

## Related Documentation

- [GPS Tracking API](./gps-tracking-api.md) - Story 2.1
- [WebSocket API](./websocket-api.md) - Story 2.2
- [Real-time Location Broadcasting](./location-broadcasting.md) - Story 2.4
- [ETA Calculation](./eta-calculation.md) - Story 2.5
- [Deployment Guide](./deployment.md) - Infrastructure setup
