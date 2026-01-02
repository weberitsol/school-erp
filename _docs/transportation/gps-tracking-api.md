# GPS Tracking API Documentation

## Overview

The GPS Tracking API provides real-time vehicle location tracking capabilities for the Transportation Module. It implements a three-tier storage strategy:

1. **Redis Cache (60s TTL)** - Fastest access for current locations
2. **Redis Pub/Sub** - Real-time broadcasting to WebSocket clients
3. **PostgreSQL (Sparse)** - Historical data storage (every 5 minutes)

## Rate Limiting

### Location Capture (POST /transportation/location)
- **Vehicle Level**: 10 updates per minute per vehicle
- **Driver Level**: 20 updates per minute per user account
- **Response Code**: 429 (Too Many Requests) when exceeded
- **Response Headers**:
  - `X-RateLimit-Limit-Vehicle`: Max vehicle updates
  - `X-RateLimit-Remaining-Vehicle`: Remaining updates for this vehicle
  - `X-RateLimit-Reset-Vehicle`: Reset timestamp (Unix seconds)
  - `X-RateLimit-Limit-Driver`: Max driver updates
  - `X-RateLimit-Remaining-Driver`: Remaining updates for this driver
  - `X-RateLimit-Reset-Driver`: Reset timestamp (Unix seconds)

### Active Vehicles Endpoint
- **Limit**: 30 requests per minute per user
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Location History Endpoint
- **Limit**: 60 requests per minute per user
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Authentication

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## Endpoints

### 1. Capture GPS Location

**POST** `/api/v1/transportation/location`

Capture GPS location from driver app. Location is stored in Redis cache with 60-second TTL and published to Pub/Sub for real-time broadcasting.

#### Request Body
```json
{
  "vehicleId": "uuid",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10,
  "tripId": "uuid (optional)"
}
```

#### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| vehicleId | string (UUID) | Yes | Vehicle identifier |
| latitude | number | Yes | GPS latitude (-90 to 90) |
| longitude | number | Yes | GPS longitude (-180 to 180) |
| accuracy | number | No | GPS accuracy in meters (1-1000, default 10) |
| tripId | string (UUID) | No | Associated trip ID for validation |

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "vehicleId": "uuid",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10,
    "status": "ONLINE",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "message": "Location captured successfully"
}
```

#### Error Responses

**400 Bad Request** - Missing or invalid parameters
```json
{
  "success": false,
  "error": "Vehicle ID, latitude, and longitude are required"
}
```

**404 Not Found** - Vehicle not found
```json
{
  "success": false,
  "error": "Vehicle not found or access denied"
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "success": false,
  "error": "Rate limit exceeded for this vehicle",
  "retryAfter": 45000,
  "resetAt": "2024-01-15T10:31:00Z"
}
```

#### Example cURL
```bash
curl -X POST http://localhost:5000/api/v1/transportation/location \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "vehicle-123",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10,
    "tripId": "trip-456"
  }'
```

---

### 2. Get Current Location

**GET** `/api/v1/transportation/vehicles/:id/location`

Retrieve the current location of a vehicle from Redis cache. Returns the most recent location captured within the last 60 seconds.

#### Parameters
| Field | Type | Location | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Path | Vehicle ID |

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "vehicleId": "vehicle-123",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10,
    "status": "ONLINE",
    "timestamp": "2024-01-15T10:30:45Z"
  }
}
```

#### Error Responses

**404 Not Found** - Vehicle not found or no location data
```json
{
  "success": false,
  "error": "Vehicle not found or access denied"
}
```

```json
{
  "success": false,
  "error": "No current location data available"
}
```

#### Example cURL
```bash
curl -X GET http://localhost:5000/api/v1/transportation/vehicles/vehicle-123/location \
  -H "Authorization: Bearer $TOKEN"
```

---

### 3. Get Location History

**GET** `/api/v1/transportation/vehicles/:id/location-history`

Retrieve historical GPS location data from the database. Locations are stored sparsely (every 5 minutes) for efficient storage.

#### Query Parameters
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| startTime | ISO8601 | Optional | Start of time range |
| endTime | ISO8601 | Optional | End of time range |
| limit | integer | 100 | Max records (1-1000) |

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "gps-entry-1",
      "vehicleId": "vehicle-123",
      "latitude": "40.7128",
      "longitude": "-74.0060",
      "accuracy": 10,
      "status": "ONLINE",
      "timestamp": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "gps-entry-2",
      "vehicleId": "vehicle-123",
      "latitude": "40.7130",
      "longitude": "-74.0058",
      "accuracy": 12,
      "status": "ONLINE",
      "timestamp": "2024-01-15T10:25:00Z",
      "createdAt": "2024-01-15T10:25:00Z"
    }
  ],
  "count": 2
}
```

#### Error Responses

**400 Bad Request** - Invalid parameters
```json
{
  "success": false,
  "error": "Invalid start time format"
}
```

```json
{
  "success": false,
  "error": "Limit must be between 1 and 1000"
}
```

**404 Not Found** - Vehicle not found
```json
{
  "success": false,
  "error": "Vehicle not found or access denied"
}
```

#### Example cURL
```bash
curl -X GET "http://localhost:5000/api/v1/transportation/vehicles/vehicle-123/location-history?startTime=2024-01-15T08:00:00Z&endTime=2024-01-15T12:00:00Z&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. Get Active Vehicles

**GET** `/api/v1/transportation/vehicles/active`

Retrieve all vehicles in the school with active location data (cached in Redis). Useful for displaying live vehicle positions on a map.

#### Query Parameters
None

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "vehicleId": "vehicle-123",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy": 10,
      "status": "ONLINE",
      "timestamp": "2024-01-15T10:30:45Z"
    },
    {
      "vehicleId": "vehicle-456",
      "latitude": 40.7150,
      "longitude": -74.0045,
      "accuracy": 8,
      "status": "ONLINE",
      "timestamp": "2024-01-15T10:30:50Z"
    }
  ],
  "count": 2
}
```

#### Example cURL
```bash
curl -X GET http://localhost:5000/api/v1/transportation/vehicles/active \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5. Mark Vehicle Offline

**POST** `/api/v1/transportation/vehicles/:id/location/offline`

Mark a vehicle as offline. Clears periodic database save operations and updates status to OFFLINE.

#### Parameters
| Field | Type | Location | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Path | Vehicle ID |

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Vehicle marked as offline"
}
```

#### Error Responses

**404 Not Found** - Vehicle not found
```json
{
  "success": false,
  "error": "Vehicle not found or access denied"
}
```

#### Example cURL
```bash
curl -X POST http://localhost:5000/api/v1/transportation/vehicles/vehicle-123/location/offline \
  -H "Authorization: Bearer $TOKEN"
```

---

### 6. Calculate Distance

**GET** `/api/v1/transportation/distance`

Calculate the distance between two GPS coordinates using the Haversine formula.

#### Query Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| lat1 | number | Yes | First point latitude |
| lon1 | number | Yes | First point longitude |
| lat2 | number | Yes | Second point latitude |
| lon2 | number | Yes | Second point longitude |

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "distanceKm": 1.23,
    "distanceMeters": 1234,
    "point1": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "point2": {
      "latitude": 40.7150,
      "longitude": -74.0045
    }
  }
}
```

#### Error Responses

**400 Bad Request** - Missing or invalid parameters
```json
{
  "success": false,
  "error": "lat1, lon1, lat2, lon2 query parameters are required"
}
```

```json
{
  "success": false,
  "error": "All coordinates must be valid numbers"
}
```

#### Example cURL
```bash
curl -X GET "http://localhost:5000/api/v1/transportation/distance?lat1=40.7128&lon1=-74.0060&lat2=40.7150&lon2=-74.0045" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Data Storage Strategy

### Redis Cache
- **Key Pattern**: `gps:location:{vehicleId}`
- **TTL**: 60 seconds
- **Data**: Current location object
- **Usage**: Fast access for current positions, WebSocket broadcasts

### Redis Pub/Sub
- **Channel Pattern**: `transport:location:{vehicleId}`
- **Message Format**: JSON location object
- **Usage**: Real-time distribution to WebSocket subscribers

### PostgreSQL
- **Table**: `GPSLocation`
- **Storage Frequency**: Every 5 minutes (sparse)
- **Data**: Historical GPS traces for replay, analytics, debugging
- **Retention**: Configurable (recommend 30 days for storage efficiency)

---

## GPS Status Values

| Status | Description |
|--------|-------------|
| ONLINE | Vehicle actively sending location updates |
| OFFLINE | Vehicle stopped sending updates |
| INACTIVE | Vehicle not in operation |

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid parameters or validation failed |
| 401 | Unauthorized - Missing or invalid JWT token |
| 404 | Not Found - Vehicle not found in database |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |

---

## Example Workflow

### 1. Driver Starts Trip
```bash
# Capture initial location
curl -X POST http://localhost:5000/api/v1/transportation/location \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "v123",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10,
    "tripId": "t456"
  }'
```

### 2. Admin Views Live Map
```bash
# Get all active vehicles
curl -X GET http://localhost:5000/api/v1/transportation/vehicles/active \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get specific vehicle location
curl -X GET http://localhost:5000/api/v1/transportation/vehicles/v123/location \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 3. Parent Tracks Their Child's Bus
- Connects to WebSocket: `ws://localhost:5000/socket.io` with room subscription `vehicle:v123`
- Receives real-time location updates via Pub/Sub
- Periodically polls location endpoint for redundancy

### 4. Trip Ends - Mark Offline
```bash
# Mark vehicle as offline
curl -X POST http://localhost:5000/api/v1/transportation/vehicles/v123/location/offline \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 5. Analytics - View Route Taken
```bash
# Get full trip history
curl -X GET "http://localhost:5000/api/v1/transportation/vehicles/v123/location-history?startTime=2024-01-15T08:00:00Z&endTime=2024-01-15T09:00:00Z&limit=1000" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Performance Considerations

### Optimization Tips

1. **Location Capture Frequency**
   - Mobile app should send GPS every 15-30 seconds
   - Rate limiting prevents spam: 10/min = 1 every 6 seconds minimum

2. **WebSocket vs Polling**
   - Use WebSocket for real-time tracking (parents, live map)
   - Use HTTP polling for periodic updates (less resource intensive)
   - Cache updates last 60 seconds in Redis

3. **Historical Data Queries**
   - Filter by time range to reduce query load
   - Use `limit` parameter to control result size
   - Data stored sparsely (every 5 min) - not suitable for sub-minute analysis

4. **Database Indexing**
   - `GPSLocation.vehicleId` - indexed for vehicle queries
   - `GPSLocation.timestamp` - indexed for time range queries
   - Composite index on `(vehicleId, timestamp)` for efficient retrieval

### Monitoring

Track these metrics:
- Location capture rate (should be ~10/min per vehicle)
- Redis cache hit rate (should be >95%)
- Pub/Sub message throughput
- Database write volume (sparse, expected ~12/hour per vehicle)

---

## Troubleshooting

### No Location Data Available
1. Check vehicle exists: `GET /api/v1/transportation/vehicles/{id}`
2. Check rate limit hasn't been exceeded
3. Verify driver is sending updates (check driver app logs)
4. Location cache expires after 60 seconds of inactivity

### Rate Limit Exceeded
- Wait for the time indicated in `resetAt` field
- Reduce update frequency in driver app
- Check if multiple processes are sending updates for same vehicle

### WebSocket Not Receiving Updates
- Verify WebSocket connection established
- Check Redis Pub/Sub is configured correctly
- Verify room subscription format: `vehicle:{vehicleId}`
- Check network connectivity between client and server

---

## Related Documentation

- [WebSocket Real-time Tracking](./websocket-tracking.md) - Story 2.2
- [Redis Pub/Sub Integration](./redis-pubsub.md) - Story 2.3
- [ETA Calculation](./eta-calculation.md) - Story 2.5
- [Transportation API Overview](./transportation-api-overview.md)
