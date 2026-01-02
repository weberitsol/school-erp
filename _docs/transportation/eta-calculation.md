# ETA Calculation & Route Progress Tracking - Story 2.5

## Overview

Story 2.5 provides sophisticated ETA (Estimated Time of Arrival) calculations using multiple algorithmic methods, historical speed data, and real-time vehicle telemetry. This enables parents and administrators to see accurate arrival times for all remaining stops on a trip.

### Key Features

✅ **Multi-Method ETA Estimation** - Simple, historical, Kalman filter, weighted average
✅ **Speed History Tracking** - Records vehicle speeds for pattern analysis
✅ **Route Progress Breakdown** - ETA for each remaining stop
✅ **Confidence Scores** - Each ETA includes reliability metric (0-100%)
✅ **Speed Profiles** - Current, average, min, max speeds
✅ **Accuracy Metrics** - Compare predicted vs actual arrival times
✅ **Multi-segment Analysis** - Track progress through multiple stops

---

## ETA Calculation Methods

### 1. Simple ETA (Fallback)

**When Used:** Vehicle not moving, no speed data available

**Formula:**
```
ETA = distance_km / 40 km/h (default speed)
```

**Confidence:** 30-50% (low, used as fallback)

**Example:**
```
Distance to next stop: 5 km
ETA = 5 / 40 = 0.125 hours = 7.5 minutes
```

---

### 2. Historical ETA

**When Used:** Vehicle has recent speed history, stable roads

**Process:**
1. Query last 100 GPS locations
2. Calculate speed between consecutive readings
3. Filter outliers (< 0 km/h or > 150 km/h)
4. Calculate median speed (robust to outliers)
5. Calculate confidence based on speed variance

**Formula:**
```
median_speed = sorted_speeds[len(speeds)/2]
variance = Σ(speed - mean)² / n
std_dev = √variance
confidence = 1 - (std_dev / median_speed)

ETA = distance_km / median_speed * 3600 seconds
```

**Confidence:** 60-95% (medium-high, based on data consistency)

**Example:**
```
Last 10 speeds: [32, 35, 38, 40, 39, 37, 41, 36, 40, 38] km/h
Sorted: [32, 35, 36, 37, 38, 38, 39, 40, 40, 41]
Median: 38 km/h
Std Dev: 2.4 km/h
Confidence: 1 - (2.4/38) = 0.94 = 94%

Distance: 5 km
ETA = 5 / 38 * 3600 = 473 seconds ≈ 8 minutes
```

---

### 3. Kalman Filter ETA

**When Used:** Vehicle moving with measurable acceleration, real-time speed

**Concept:** Kalman filtering smooths estimates by accounting for:
- Current speed
- Recent acceleration/deceleration
- Physics of vehicle motion

**Process:**
1. Get last 10 speed readings
2. Calculate acceleration: `a = (v_latest - v_oldest) / time`
3. If accelerating: use kinematic equation `v² = u² + 2as`
4. Calculate time to reach distance with constant acceleration

**Formula (Accelerating):**
```
v² = u² + 2as
v² = current_speed² + 2 * acceleration * distance_km
final_speed = √(v²)
time_to_stop = (final_speed - current_speed) / acceleration
```

**Confidence:** 70-90% (when accelerating); 50% (when coasting)

**Example:**
```
Current speed: 30 km/h
Acceleration: 0.5 m/s² = 1.8 km/h²
Distance: 5 km

v² = 30² + 2 * 1.8 * 5
v² = 900 + 18 = 918
v = 30.3 km/h
time = (30.3 - 30) / 1.8 = 0.167 hours = 10 minutes
```

---

### 4. Weighted Average ETA

**When Used:** Combining all available methods for best estimate

**Process:**
1. Calculate all applicable estimates
2. Weight by confidence score
3. Average to get final estimate
4. Report confidence as average of component confidences

**Formula:**
```
weighted_eta = Σ(eta * confidence) / Σ(confidence)
final_confidence = Σ(confidence) / number_of_methods
```

**Example:**
```
Methods:
- Simple: 450s @ 0.5 confidence
- Historical: 480s @ 0.9 confidence
- Kalman: 470s @ 0.7 confidence

Weighted ETA = (450*0.5 + 480*0.9 + 470*0.7) / (0.5+0.9+0.7)
            = (225 + 432 + 329) / 2.1
            = 986 / 2.1
            = 469 seconds ≈ 8 minutes

Final confidence = (0.5 + 0.9 + 0.7) / 3 = 0.70 = 70%
```

---

## Speed History & Tracking

### Speed Recording

Automatically triggered on each GPS location capture:

```typescript
// Recorded with each GPS update
{
  vehicleId: "v123",
  tripId: "trip-456",
  timestamp: "2024-01-15T10:30:45Z",
  speed: 38.5,      // km/h
  accuracy: 8,      // GPS accuracy in meters
}
```

**Storage:**
- **Redis Cache:** Last 60 readings per vehicle-trip (≈30 minutes at 30s intervals)
- **Retention:** 24 hours TTL per trip
- **Database:** Sparse storage (every 5 min) via GPSLocation table

### Speed Profile Endpoint

Provides summary statistics:

```json
{
  "currentSpeedKmh": 42.3,
  "averageSpeedKmh": 38.5,
  "maxSpeedKmh": 52.1,
  "minSpeedKmh": 15.0
}
```

---

## Route Progress Breakdown

### Multi-Segment ETA

Calculates ETA to each remaining stop:

```typescript
{
  segment: 0,                    // Current to next stop
  fromStop: "Current Location",
  toStop: "Main Street",
  distanceKm: 2.5,
  estimatedSeconds: 300,         // 5 minutes
  arrivalTime: "2024-01-15T10:35:45Z",
  confidence: 92.5               // 0-100%
}
```

### Route Progress Breakdown Response

**GET `/api/v1/transportation/trips/{tripId}/eta`**

```json
{
  "success": true,
  "data": {
    "tripId": "trip-456",
    "vehicleId": "v123",
    "routeName": "Route A - Main Loop",
    "breakdown": {
      "totalDistanceKm": 15.3,
      "totalEstimatedSeconds": 1650,
      "completedDistanceKm": 3.2,
      "completedSeconds": 350,
      "remainingDistanceKm": 12.1,
      "remainingSeconds": 1300,
      "progressPercentage": 21,
      "estimatedArrivalTime": "2024-01-15T10:52:30Z",
      "confidence": 87.5,
      "segments": [
        {
          "segment": 0,
          "fromStop": "Current Location",
          "toStop": "Main Street",
          "distanceKm": 2.5,
          "estimatedMinutes": 5,
          "arrivalTime": "2024-01-15T10:35:45Z",
          "confidence": 92
        },
        {
          "segment": 1,
          "fromStop": "Main Street",
          "toStop": "Oak Avenue",
          "distanceKm": 3.1,
          "estimatedMinutes": 6,
          "arrivalTime": "2024-01-15T10:42:00Z",
          "confidence": 88
        },
        {
          "segment": 2,
          "fromStop": "Oak Avenue",
          "toStop": "Central Park",
          "distanceKm": 2.8,
          "estimatedMinutes": 5,
          "arrivalTime": "2024-01-15T10:47:30Z",
          "confidence": 85
        }
      ],
      "speedProfile": {
        "currentSpeedKmh": 42.3,
        "averageSpeedKmh": 38.5,
        "maxSpeedKmh": 52.1,
        "minSpeedKmh": 15.0
      }
    },
    "lastUpdate": "2024-01-15T10:30:45Z",
    "generatedAt": "2024-01-15T10:30:47Z"
  }
}
```

---

## API Endpoints

### 1. Route ETA Breakdown

**GET `/api/v1/transportation/trips/:tripId/eta`**

Get comprehensive ETA breakdown for entire trip (all remaining stops).

**Parameters:**
- `tripId` (path) - Trip ID

**Response:** See multi-segment ETA response above

**Example:**
```bash
curl http://localhost:5000/api/v1/transportation/trips/trip-456/eta \
  -H "Authorization: Bearer <token>"
```

---

### 2. Trip Progress with ETA

**GET `/api/v1/transportation/trips/:tripId/progress`**

Get detailed trip progress with integrated ETA calculations.

**Parameters:**
- `tripId` (path) - Trip ID

**Response:**
```json
{
  "success": true,
  "data": {
    "tripId": "trip-456",
    "vehicleId": "v123",
    "routeName": "Route A",
    "progress": {
      "status": "IN_PROGRESS",
      "currentStopIndex": 2,
      "totalStops": 8,
      "completedStops": 2,
      "progressPercentage": 25,
      "nextStop": {
        "stopId": "stop-3",
        "stopName": "Main Street",
        "latitude": 40.7180,
        "longitude": -74.0100,
        "sequence": 3,
        "estimatedTimeToArrival": 420
      },
      "studentsBoarded": 15,
      "studentsExpected": 20
    },
    "eta": {
      "totalDistanceKm": 15.3,
      "completedDistanceKm": 3.2,
      "remainingDistanceKm": 12.1,
      "totalEstimatedSeconds": 1650,
      "completedSeconds": 350,
      "remainingSeconds": 1300,
      "estimatedArrivalTime": "2024-01-15T10:52:30Z",
      "confidence": 87.5,
      "segments": [...]
    }
  }
}
```

---

### 3. Stop-Specific ETA

**GET `/api/v1/transportation/trips/:tripId/stops/:stopId/eta`**

Get detailed ETA for a specific stop.

**Parameters:**
- `tripId` (path) - Trip ID
- `stopId` (path) - Stop ID

**Response:**
```json
{
  "success": true,
  "data": {
    "tripId": "trip-456",
    "vehicleId": "v123",
    "stop": {
      "id": "stop-3",
      "name": "Main Street",
      "latitude": 40.7180,
      "longitude": -74.0100,
      "sequence": 3,
      "plannedArrivalTime": "2024-01-15T10:35:00Z"
    },
    "eta": {
      "estimatedSeconds": 480,
      "estimatedMinutes": 8,
      "estimatedArrivalTime": "2024-01-15T10:38:45Z",
      "distanceKm": 2.5,
      "confidence": 91.5,
      "method": "weighted",
      "explanation": "weighted estimate: 8 minutes"
    },
    "generatedAt": "2024-01-15T10:30:47Z"
  }
}
```

---

### 4. Record Speed Data

**POST `/api/v1/transportation/speed-record`**

Manually record speed reading (usually automatic from GPS updates).

**Request Body:**
```json
{
  "vehicleId": "v123",
  "tripId": "trip-456",
  "currentSpeedKmh": 42.5,
  "accuracy": 8
}
```

**Response:**
```json
{
  "success": true,
  "message": "Speed reading recorded successfully"
}
```

---

### 5. ETA Accuracy Metrics

**GET `/api/v1/transportation/trips/:tripId/eta-accuracy`**

Get accuracy metrics and historical error rates for this trip.

**Response:**
```json
{
  "success": true,
  "data": {
    "tripId": "trip-456",
    "vehicleId": "v123",
    "accuracy": {
      "avgErrorMinutes": 2.3,
      "accuracyPercentage": 82.5,
      "description": "Highly accurate"
    },
    "recommendation": "ETA is reliable"
  }
}
```

---

### 6. Vehicle Speed Profile

**GET `/api/v1/transportation/vehicles/:vehicleId/speed-profile`**

Get current speed profile for a vehicle.

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicleId": "v123",
    "speedProfile": {
      "currentSpeedKmh": 42.3,
      "averageSpeedKmh": 38.5,
      "maxSpeedKmh": 52.1,
      "minSpeedKmh": 15.0
    },
    "readingCount": 18,
    "lastUpdate": "2024-01-15T10:30:45Z"
  }
}
```

---

## Confidence Scoring

Each ETA includes a confidence score (0-100%):

| Confidence | Interpretation | Recommendation |
|------------|-----------------|-----------------|
| 80-100% | Highly accurate | Trust the ETA |
| 60-80% | Moderately accurate | Generally reliable |
| 40-60% | Low accuracy | Use with caution |
| 0-40% | Very unreliable | Treat as estimate only |

### Confidence Factors

**Increases confidence:**
- More speed history (more data points)
- Consistent speeds (low variance)
- Recent data (fresh readings)
- Multiple estimation methods agree

**Decreases confidence:**
- Few speed readings
- Highly variable speeds
- Stopped vehicle (speed = 0)
- Extreme acceleration/deceleration

---

## Client Implementation Examples

### React Parent App

```typescript
import { useEffect, useState } from 'react';

function ETADisplay({ tripId, token }) {
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchETA = async () => {
      const res = await fetch(
        `http://localhost:5000/api/v1/transportation/trips/${tripId}/eta`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setEta(data.data.breakdown);
      setLoading(false);
    };

    // Fetch initially
    fetchETA();

    // Refresh every 30 seconds
    const interval = setInterval(fetchETA, 30000);
    return () => clearInterval(interval);
  }, [tripId, token]);

  if (loading) return <div>Loading ETA...</div>;

  const next = eta.segments[0];
  const confidence = Math.round(eta.confidence * 100);

  return (
    <div className="eta-container">
      <h2>Bus ETA</h2>
      <div className="eta-card">
        <h3>{next.toStop}</h3>
        <p className="time">
          {next.estimatedMinutes} minutes
        </p>
        <p className="arrival">
          Arrives at {new Date(next.arrivalTime).toLocaleTimeString()}
        </p>
        <div className="confidence">
          <span>Accuracy: {confidence}%</span>
          <ConfidenceBar value={confidence} />
        </div>
      </div>

      <div className="route-breakdown">
        <h4>Full Route</h4>
        {eta.segments.map((seg, i) => (
          <div key={i} className="segment">
            <span>{seg.toStop}</span>
            <span>{seg.estimatedMinutes}m</span>
            <span>{Math.round(seg.confidence * 100)}%</span>
          </div>
        ))}
      </div>

      <div className="speed-profile">
        <h4>Vehicle Speed</h4>
        <p>Current: {eta.speedProfile.currentSpeedKmh} km/h</p>
        <p>Average: {eta.speedProfile.averageSpeedKmh} km/h</p>
      </div>
    </div>
  );
}

function ConfidenceBar({ value }) {
  const color = value > 80 ? 'green' : value > 60 ? 'yellow' : 'red';
  return (
    <div className="bar" style={{ width: `${value}%`, backgroundColor: color }} />
  );
}
```

### React Native Driver App

```typescript
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

export function DriverETAScreen({ tripId, token }) {
  const [progress, setProgress] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProgress = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(
        `http://api.school.com/api/v1/transportation/trips/${tripId}/progress`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setProgress(data.data);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProgress();
    const interval = setInterval(fetchProgress, 30000);
    return () => clearInterval(interval);
  }, [tripId, token]);

  if (!progress) return <Text>Loading...</Text>;

  const next = progress.eta?.segments[0];
  const confidence = Math.round(progress.eta?.confidence || 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Next Stop: {next?.toStop}</Text>
      <Text style={styles.eta}>{next?.estimatedMinutes} minutes away</Text>
      <Text style={styles.confidence}>
        Confidence: {confidence}%
      </Text>

      <View style={styles.stats}>
        <Text>Progress: {progress.progress.progressPercentage}%</Text>
        <Text>Students Boarded: {progress.progress.studentsBoarded}/
          {progress.progress.studentsExpected}</Text>
        <Text>Speed: {progress.eta?.speedProfile.currentSpeedKmh} km/h</Text>
      </View>

      <View style={styles.segments}>
        {progress.eta?.segments.map((seg, i) => (
          <View key={i} style={styles.segment}>
            <Text>{seg.toStop}</Text>
            <Text>{seg.estimatedMinutes}m (±{100-Math.round(seg.confidence*100)}%)</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
```

---

## Performance Characteristics

### Calculation Speed

| Method | Time | Data Required |
|--------|------|----------------|
| Simple ETA | <1ms | Current location |
| Historical ETA | 10-50ms | 100 recent locations |
| Kalman Filter | 5-20ms | 10 recent readings |
| Weighted Average | 20-100ms | All methods |

**Total for all methods:** <150ms typically

### Storage Requirements

**Per Vehicle-Trip:**
- Speed readings: 60 entries × 100 bytes = 6KB (Redis)
- ETA calculations: Cached for 60s
- Database: Only sparse locations (every 5 min)

**Scaling:**
- 100 vehicles: <1MB Redis cache
- 1000 vehicles: <10MB Redis cache

---

## Troubleshooting

### ETA Not Calculated

**Symptoms:** 404 response or null ETA

**Causes:**
1. No current location for vehicle
2. Trip has no route assigned
3. Route has no stops

**Solution:**
```bash
# Check if vehicle has location
curl http://localhost:5000/api/v1/transportation/vehicles/v123/location

# Check if trip has route
curl http://localhost:5000/api/v1/transportation/trips/trip-456 | jq '.route'

# Check if route has stops
curl http://localhost:5000/api/v1/transportation/routes/route-789/stops
```

---

### Low Confidence Score (< 60%)

**Symptoms:** ETA frequently changes, confidence shown as low

**Causes:**
1. Inconsistent speeds (traffic variation)
2. Few speed readings (early in trip)
3. Vehicle not moving (speed = 0)

**Solutions:**
- Wait for more speed data (collect 10+ readings)
- Check traffic conditions
- Verify GPS accuracy (should be < 20 meters)

```bash
# Check speed profile
curl http://localhost:5000/api/v1/transportation/vehicles/v123/speed-profile

# Check GPS accuracy
curl http://localhost:5000/api/v1/transportation/vehicles/v123/location \
  | jq '.data.accuracy'
```

---

### ETA Consistently Wrong (High Error)

**Symptoms:** Actual arrival is much later/earlier than predicted

**Causes:**
1. **Late:** Traffic patterns not reflected in speed history
2. **Early:** Overshooting speed estimates
3. **Variable:** Multiple conflicting routes with different speeds

**Solutions:**

**1. Adjust average speed:**
```typescript
// In eta-calculation.service.ts
const averageSpeed = 45; // Increase if consistently late, decrease if early
```

**2. Increase historical data window:**
```typescript
// Query more readings for better average
const pastLocations = await prisma.gPSLocation.findMany({
  where: { vehicleId },
  take: 200 // Increased from 100
});
```

**3. Filter by time of day:**
```typescript
// Use morning rush hour speeds for morning trips, etc
const hourOfDay = new Date().getHours();
const speedFactor = hourOfDay < 9 ? 0.8 : 1.0; // 20% slower during rush
```

---

### Speed Data Not Recording

**Symptoms:** Speed profile shows "insufficient data"

**Causes:**
1. Trip doesn't have `tripId` in GPS update
2. GPS updates not being sent frequently enough
3. Speed recording failing silently

**Solution:**
```bash
# Verify GPS update includes tripId
curl -X POST http://localhost:5000/api/v1/transportation/location \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "v123",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "tripId": "trip-456"  # MUST include tripId!
  }'

# Check Redis speed history cache
redis-cli
> KEYS "speed:history:*"
> GET speed:history:v123:trip-456  # Should have array of readings
```

---

## Monitoring

### Key Metrics

```bash
# Average ETA accuracy per vehicle
SELECT vehicleId, AVG(ABS(actual_arrival - predicted_arrival))
FROM trip_arrivals
GROUP BY vehicleId;

# ETA recalculation frequency
KEYS "trip:progress:*" | wc -l  # Number of cached ETAs

# Speed data collection rate
redis-cli KEYS "speed:history:*:*" | wc -l  # Number of speed histories
```

---

## Production Deployment

### Checklist

- [ ] Speed history cache configured (24h TTL in Redis)
- [ ] ETA calculations tested with real route data
- [ ] Confidence scores validated against actual arrival times
- [ ] Performance tested at 1000+ concurrent vehicles
- [ ] Client apps updated to fetch ETA every 30 seconds
- [ ] Accuracy metrics logged for continuous improvement
- [ ] Staff trained on interpreting confidence scores
- [ ] Parent communication plan for ETA accuracy

---

## Summary

Story 2.5 provides sophisticated ETA calculations enabling:

✅ **Multi-method estimation** - Simple, historical, Kalman filter, weighted
✅ **Speed history** - Automatic tracking for better accuracy over time
✅ **Route breakdown** - ETA for each remaining stop
✅ **Confidence scoring** - Know how reliable each ETA is
✅ **Performance optimization** - <150ms for all calculations
✅ **Client flexibility** - React, React Native examples included

**Result:** Parents see accurate, confidence-scored ETAs for buses; admins monitor fleet progress with detailed segment breakdowns.
