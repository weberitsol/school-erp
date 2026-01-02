# WebSocket API Documentation - Real-time Vehicle Tracking

## Overview

The Transportation Module provides real-time vehicle location updates via Socket.IO WebSocket connections. The WebSocket server operates on the `/transport` namespace with JWT-based authentication.

### Connection Details
- **Base URL**: `ws://localhost:5000` (or your server URL)
- **Namespace**: `/transport`
- **Path**: `/socket.io`
- **Protocol**: Socket.IO with WebSocket transport fallback to polling

### Features
- ✅ JWT token-based authentication
- ✅ Room-based subscriptions (vehicles, trips, school-wide)
- ✅ Multi-server scaling via Redis Pub/Sub
- ✅ Automatic reconnection with exponential backoff
- ✅ Role-based access control
- ✅ Connection state management

---

## Authentication

### Connecting with JWT Token

All WebSocket connections require a valid JWT token obtained from the `/api/v1/auth/login` endpoint.

#### JavaScript/Node.js Example
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000/transport', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('✅ Connected to transport namespace');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

#### React Native Example (Expo)
```javascript
import io from 'socket.io-client';

const SOCKET_URL = 'http://YOUR_API_SERVER:5000';

const socket = io(SOCKET_URL + '/transport', {
  auth: {
    token: authToken,
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on('connect', () => {
  console.log('WebSocket connected');
});
```

### Token Refresh

If your JWT token expires:

```javascript
// Get new token from login endpoint
const response = await fetch('http://localhost:5000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: user.email, password: password })
});

const { token } = await response.json();

// Reconnect with new token
socket.auth = { token };
socket.disconnect().connect();
```

---

## Events

### Client → Server Events (Emits)

#### 1. Subscribe to Vehicle Location Updates

Subscribe to real-time location updates for a specific vehicle.

**Event Name**: `subscribe:vehicle`

**Payload**:
```javascript
{
  vehicleId: "uuid"
}
```

**Example**:
```javascript
socket.emit('subscribe:vehicle',
  { vehicleId: 'vehicle-123' },
  (response) => {
    if (response.success) {
      console.log(response.message); // "Subscribed to vehicle vehicle-123"
    } else {
      console.error(response.error);
    }
  }
);
```

**Authorization**: Any authenticated user from the same school

**Use Cases**:
- Parent tracking their child's bus
- Driver monitoring their assigned vehicle
- Admin viewing live vehicle map

---

#### 2. Unsubscribe from Vehicle

Stop receiving location updates for a vehicle.

**Event Name**: `unsubscribe:vehicle`

**Payload**:
```javascript
{
  vehicleId: "uuid"
}
```

**Example**:
```javascript
socket.emit('unsubscribe:vehicle',
  { vehicleId: 'vehicle-123' },
  (response) => {
    console.log(response.message);
  }
);
```

---

#### 3. Subscribe to Trip Updates

Subscribe to real-time updates for a specific trip (boarding, alighting, completion).

**Event Name**: `subscribe:trip`

**Payload**:
```javascript
{
  tripId: "uuid"
}
```

**Example**:
```javascript
socket.emit('subscribe:trip',
  { tripId: 'trip-456' },
  (response) => {
    if (response.success) {
      console.log('Subscribed to trip updates');
    }
  }
);
```

**Authorization**: Any authenticated user from the same school

**Use Cases**:
- Student/Parent tracking trip status
- Admin monitoring trip progress
- Driver confirming student boarding/alighting

---

#### 4. Unsubscribe from Trip

Stop receiving trip updates.

**Event Name**: `unsubscribe:trip`

**Payload**:
```javascript
{
  tripId: "uuid"
}
```

---

#### 5. Subscribe to School Vehicle Locations

Subscribe to location updates for ALL vehicles in the school. **Admin only**.

**Event Name**: `subscribe:school`

**Payload**:
```javascript
{}
```

**Example**:
```javascript
socket.emit('subscribe:school', {}, (response) => {
  if (response.success) {
    console.log('Subscribed to all school vehicle locations');
  } else {
    console.error('Unauthorized: Admin access required');
  }
});
```

**Authorization**: ADMIN, SUPER_ADMIN only

**Use Cases**:
- Admin dashboard showing all vehicles
- Operations center monitoring fleet
- Analytics and reporting

---

#### 6. Unsubscribe from School Locations

Stop receiving all school vehicle updates.

**Event Name**: `unsubscribe:school`

**Payload**:
```javascript
{}
```

---

#### 7. Ping (Keep-alive)

Send a ping to keep the connection alive and check server responsiveness.

**Event Name**: `ping`

**Payload**:
```javascript
{}
```

**Example**:
```javascript
socket.emit('ping', {}, (response) => {
  console.log('Server timestamp:', response.timestamp);
  console.log('Latency:', Date.now() - new Date(response.timestamp).getTime());
});
```

---

### Server → Client Events (Listeners)

#### 1. Location Update

Receive real-time location updates for subscribed vehicles.

**Event Name**: `location:update`

**Payload**:
```javascript
{
  vehicleId: "uuid",
  location: {
    vehicleId: "uuid",
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 10,
    status: "ONLINE", // "ONLINE", "OFFLINE", "INACTIVE"
    timestamp: "2024-01-15T10:30:45Z"
  },
  timestamp: "2024-01-15T10:30:45Z"
}
```

**Example**:
```javascript
socket.on('location:update', (data) => {
  console.log(`🚐 Vehicle ${data.vehicleId} location:`);
  console.log(`   Lat: ${data.location.latitude}, Lon: ${data.location.longitude}`);
  console.log(`   Accuracy: ${data.location.accuracy}m`);
  console.log(`   Status: ${data.location.status}`);

  // Update map marker
  updateVehicleMarker(data.vehicleId, data.location);
});
```

**Frequency**: Real-time as location updates are captured (up to 10/min per vehicle)

---

#### 2. Trip Update

Receive real-time updates for subscribed trips.

**Event Name**: `trip:update`

**Payload**:
```javascript
{
  tripId: "uuid",
  update: {
    // See Story 2.4 for detailed trip update structure
    status: "IN_PROGRESS",
    nextStop: { stopId: "stop-1", name: "Main Street", eta: "2024-01-15T10:35:00Z" },
    studentsBoarded: 15,
    studentsExpected: 20,
    currentLocation: { latitude: 40.7128, longitude: -74.0060 }
  },
  timestamp: "2024-01-15T10:30:45Z"
}
```

**Example**:
```javascript
socket.on('trip:update', (data) => {
  console.log(`🚌 Trip ${data.tripId} update:`, data.update);
  updateTripUI(data.tripId, data.update);
});
```

---

#### 3. Connection Events (Built-in)

**Events**:
- `connect` - Successfully connected
- `disconnect` - Disconnected (reason provided)
- `error` - Connection error occurred
- `reconnect_attempt` - Attempting to reconnect
- `reconnect` - Reconnected after disconnect

**Example**:
```javascript
socket.on('connect', () => console.log('✅ Connected'));
socket.on('disconnect', (reason) => console.log('❌ Disconnected:', reason));
socket.on('error', (error) => console.error('Error:', error));
socket.on('reconnect_attempt', () => console.log('🔄 Reconnecting...'));
socket.on('reconnect', () => console.log('✅ Reconnected'));
```

---

## Access Control

### Role-based Subscriptions

| Action | ADMIN | SUPER_ADMIN | TEACHER | PARENT | STUDENT |
|--------|-------|-------------|---------|--------|---------|
| Subscribe vehicle | ✅ Own | ✅ All | ✅ Assigned | ✅ Child's | ✅ Own |
| Subscribe trip | ✅ All | ✅ All | ✅ Assigned | ✅ Child's | ✅ Own |
| Subscribe school | ✅ | ✅ | ❌ | ❌ | ❌ |

### Validation Rules

1. **Vehicle Subscription**
   - User must be in same school as vehicle
   - Admins can view any vehicle in their school
   - Non-admins can only view vehicles they have access to

2. **Trip Subscription**
   - User must be in same school as trip
   - Admins can view any trip in their school
   - Non-admins can only view trips they're involved in

3. **School Subscription**
   - Admin/Super_admin role required
   - School verified via JWT token

---

## Error Handling

### Authentication Errors

**Error**: Authentication token required
```javascript
socket.on('connect_error', (error) => {
  if (error.message === 'Authentication token required') {
    // Redirect to login
    window.location.href = '/login';
  }
});
```

**Solution**: Provide valid JWT token in auth object

### Authorization Errors

**Error**: Admin access required
```javascript
socket.emit('subscribe:school', {}, (response) => {
  if (!response.success && response.error === 'Admin access required') {
    console.error('You do not have permission to view all vehicles');
  }
});
```

**Solution**: Only admins can call certain operations

### Connection Errors

**Common Reasons for Disconnection**:
- `transport error` - Transport layer error
- `server namespace disconnect` - Server forced disconnect
- `client namespace disconnect` - Client requested disconnect
- `ping timeout` - No response to ping (network issue)

**Auto-reconnection**: Socket.IO automatically attempts to reconnect with exponential backoff

---

## Best Practices

### 1. Token Management

```javascript
// Don't embed token in client-side code
❌ const socket = io(url, { auth: { token: 'hardcoded-token' } });

// Fetch token securely
✅ const token = await getAuthToken();
   const socket = io(url, { auth: { token } });

// Handle token expiry
✅ socket.on('connect_error', (error) => {
     if (error.message.includes('token')) {
       refreshToken().then(token => {
         socket.auth.token = token;
         socket.connect();
       });
     }
   });
```

### 2. Room Management

```javascript
// Subscribe to rooms on connect
socket.on('connect', () => {
  socket.emit('subscribe:vehicle', { vehicleId: activeVehicleId });
  socket.emit('subscribe:trip', { tripId: activeTripId });
});

// Clean up on unmount
socket.on('disconnect', () => {
  socket.emit('unsubscribe:vehicle', { vehicleId: activeVehicleId });
  socket.emit('unsubscribe:trip', { tripId: activeTripId });
});
```

### 3. Error Handling

```javascript
socket.on('location:update', (data) => {
  try {
    updateMapMarker(data.location);
  } catch (error) {
    console.error('Failed to update marker:', error);
    // Don't disconnect - just log error
  }
});
```

### 4. Memory Management

```javascript
// Unsubscribe from unused rooms
function switchToVehicle(newVehicleId, oldVehicleId) {
  socket.emit('unsubscribe:vehicle', { vehicleId: oldVehicleId });
  socket.emit('subscribe:vehicle', { vehicleId: newVehicleId });
}

// Cleanup on app unmount
useEffect(() => {
  return () => {
    socket.disconnect();
  };
}, []);
```

### 5. Handle Reconnection

```javascript
let reconnectCount = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

socket.on('reconnect_attempt', () => {
  reconnectCount++;
  if (reconnectCount > MAX_RECONNECT_ATTEMPTS) {
    // After max attempts, show error and redirect to login
    showError('Connection lost. Please refresh the page.');
  }
});

socket.on('reconnect', () => {
  reconnectCount = 0;
  console.log('✅ Connection restored');
  // Re-subscribe to rooms
});
```

---

## Performance Considerations

### Location Update Frequency

- **Driver App**: Send GPS every 15-30 seconds (controlled by rate limiting at 10/min max)
- **Server Broadcast**: Real-time via Pub/Sub
- **Client Updates**: Receive and process location updates in real-time

### Optimization Tips

1. **Debounce Updates on Client**
   ```javascript
   let lastUpdateTime = 0;
   const DEBOUNCE_MS = 100;

   socket.on('location:update', (data) => {
     if (Date.now() - lastUpdateTime > DEBOUNCE_MS) {
       updateMapMarker(data.location);
       lastUpdateTime = Date.now();
     }
   });
   ```

2. **Lazy Load Location History**
   ```javascript
   // Use HTTP endpoint for historical data, not WebSocket
   const history = await fetch('/api/v1/transportation/vehicles/{id}/location-history')
     .then(r => r.json());
   ```

3. **Limit Active Subscriptions**
   ```javascript
   // Max 5 vehicle subscriptions per user to prevent memory issues
   const activeSubscriptions = new Set();

   function subscribeToVehicle(vehicleId) {
     if (activeSubscriptions.size >= 5) {
       const oldVehicle = activeSubscriptions.values().next().value;
       unsubscribeFromVehicle(oldVehicle);
     }
     activeSubscriptions.add(vehicleId);
     socket.emit('subscribe:vehicle', { vehicleId });
   }
   ```

---

## Testing WebSocket Connection

### Using Socket.IO Test Client

```bash
# Install npm package
npm install -g socketio-client-tool

# Connect
socketio-client-tool -u http://localhost:5000/transport?auth=<token>
```

### Using JavaScript Console

```javascript
const socket = io('http://localhost:5000/transport', {
  auth: { token: 'your-jwt-token' }
});

// Subscribe to a vehicle
socket.emit('subscribe:vehicle', { vehicleId: 'v123' }, (res) => console.log(res));

// Listen for updates
socket.on('location:update', (data) => console.log(data));

// Test ping
socket.emit('ping', {}, (res) => console.log(res));
```

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Connection refused | Server not running | Start backend server |
| Auth error | Invalid token | Get fresh token from login endpoint |
| Room not subscribed | Authorization denied | Check user role and school |
| No location updates | No active subscriptions | Subscribe to vehicle/trip first |
| Frequent disconnects | Network issues | Check Internet connection, firewall |
| High latency | Redis Pub/Sub delay | Check Redis server health |

---

## Related Documentation

- [GPS Tracking API](./gps-tracking-api.md) - Story 2.1
- [Redis Pub/Sub Integration](./redis-pubsub.md) - Story 2.3
- [Real-time Location Broadcasting](./location-broadcasting.md) - Story 2.4
- [ETA Calculation](./eta-calculation.md) - Story 2.5
