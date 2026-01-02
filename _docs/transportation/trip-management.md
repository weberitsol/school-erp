# Trip Management API Documentation

## Overview

The Trip Management system provides comprehensive lifecycle management for transportation trips. A trip represents a single vehicle's journey on a specific route on a particular date, carrying students from various pickup points to drop points.

**Key Features:**
- Complete trip lifecycle management (create, schedule, start, complete, cancel)
- Real-time trip status tracking
- Multi-filter trip querying with pagination
- Student tracking and attendance integration
- Trip statistics and analytics
- Automatic validation of dependencies (route, vehicle, driver)
- Finite State Machine (FSM) for status transitions

**Story:** 3.1 - Trip Scheduling & Management
**Status:** Complete
**Endpoints:** 11 REST API endpoints
**Authentication:** Required (JWT)
**Authorization:** Role-based (ADMIN, SUPER_ADMIN, TEACHER)

---

## Data Model

### Trip Entity

```typescript
interface Trip {
  id: string;                    // UUID
  routeId: string;               // FK to Route
  vehicleId: string;             // FK to Vehicle
  driverId: string;              // FK to Driver
  tripDate: Date;                // Date of trip (YYYY-MM-DD)
  status: TripStatus;            // SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED
  startTime: Date | null;        // When trip actually started
  endTime: Date | null;          // When trip actually ended
  schoolId: string;              // FK to School (for multi-tenancy)
  createdAt: Date;
  updatedAt: Date;
}

enum TripStatus {
  SCHEDULED    = "SCHEDULED",      // Created, not yet started
  IN_PROGRESS  = "IN_PROGRESS",    // Actively running
  COMPLETED    = "COMPLETED",      // Finished successfully
  CANCELLED    = "CANCELLED"       // Cancelled by admin
}

interface TripDetails extends Trip {
  route: {
    id: string;
    name: string;
    startTime: string;             // e.g., "07:30"
    endTime: string;               // e.g., "08:30"
  };
  vehicle: {
    id: string;
    registrationNumber: string;
    type: string;                  // BUS, VAN, AUTO, etc.
    capacity: number;
  };
  driver: {
    id: string;
    name: string;
    phone: string;
  };
  students: {
    total: number;                 // Total students assigned
    boarded: number;               // Students who boarded
    alighted: number;              // Students who alighted
    absent: number;                // Students who didn't board
  };
}
```

### Trip Statistics

```typescript
interface TripStatistics {
  summary: {
    totalTrips: number;
    scheduledTrips: number;
    inProgressTrips: number;
    completedTrips: number;
    cancelledTrips: number;
  };
  studentTracking: {
    totalStudentsServed: number;
    averageOccupancy: number;      // % (0-100)
    peakOccupancy: number;         // % (0-100)
  };
  dateRange: {
    startDate: string;             // ISO 8601
    endDate: string;               // ISO 8601
  };
}
```

---

## Trip Status FSM (Finite State Machine)

### Valid State Transitions

```
┌─────────────┐
│ SCHEDULED   │  (Initial state - trip created)
└──────┬──────┘
       │
       ↓
┌─────────────┐      ┌──────────────┐
│ IN_PROGRESS │ ───→ │  COMPLETED   │  (Terminal state - success)
└──────┬──────┘      └──────────────┘
       │
       └─────────────→ ┌──────────────┐
                       │  CANCELLED   │  (Terminal state - cancellation)
                       └──────────────┘
```

### Transition Rules

**SCHEDULED → IN_PROGRESS:**
- Requirements:
  - Trip status must be SCHEDULED
  - Vehicle must be ACTIVE
  - Driver must be ACTIVE
  - Triggered by driver or admin starting the trip
- Action: Sets `startTime` to current timestamp

**IN_PROGRESS → COMPLETED:**
- Requirements:
  - Trip status must be IN_PROGRESS
  - Can only be triggered by driver or admin
- Action: Sets `endTime` to current timestamp, marks trip complete

**Any State → CANCELLED:**
- Requirements:
  - Only SCHEDULED or IN_PROGRESS trips can be cancelled
  - Requires admin authorization
  - Optional: Provide cancellation reason
- Action: Sets status to CANCELLED, records reason if provided

**Invalid Transitions:** (Throw 400 Bad Request)
- IN_PROGRESS → SCHEDULED
- COMPLETED → any state
- CANCELLED → any state
- Attempt to transition without required conditions

---

## API Endpoints

### 1. Create Trip

**Endpoint:** `POST /api/v1/transportation/trips`

**Authorization:** ADMIN, SUPER_ADMIN

**Request:**
```json
{
  "routeId": "route-123",
  "vehicleId": "vehicle-456",
  "driverId": "driver-789",
  "tripDate": "2025-01-15"
}
```

**Validation:**
- `routeId`: Required, must exist and belong to school
- `vehicleId`: Required, must exist and belong to school
- `driverId`: Required, must exist and belong to school
- `tripDate`: Required, valid ISO 8601 date
- Duplicate check: No existing SCHEDULED/IN_PROGRESS trip for same route+vehicle+date

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": "trip-001",
    "routeId": "route-123",
    "vehicleId": "vehicle-456",
    "driverId": "driver-789",
    "tripDate": "2025-01-15T00:00:00.000Z",
    "status": "SCHEDULED",
    "startTime": null,
    "endTime": null,
    "schoolId": "school-uuid",
    "createdAt": "2025-01-14T10:30:00.000Z",
    "updatedAt": "2025-01-14T10:30:00.000Z"
  },
  "message": "Trip created successfully"
}
```

**Error Cases:**
- 400: Missing required fields
- 400: Invalid date format
- 404: Route/vehicle/driver not found
- 400: Duplicate trip exists for same route+vehicle+date
- 401: Unauthorized (not ADMIN/SUPER_ADMIN)

---

### 2. Get Trip Details

**Endpoint:** `GET /api/v1/transportation/trips/:id`

**Authorization:** Any authenticated user (filtered by schoolId)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "trip-001",
    "routeId": "route-123",
    "vehicleId": "vehicle-456",
    "driverId": "driver-789",
    "tripDate": "2025-01-15T00:00:00.000Z",
    "status": "IN_PROGRESS",
    "startTime": "2025-01-15T07:30:00.000Z",
    "endTime": null,
    "schoolId": "school-uuid",
    "route": {
      "id": "route-123",
      "name": "Route A - North Zone",
      "startTime": "07:30",
      "endTime": "08:30"
    },
    "vehicle": {
      "id": "vehicle-456",
      "registrationNumber": "KA01AB1234",
      "type": "BUS",
      "capacity": 50
    },
    "driver": {
      "id": "driver-789",
      "name": "Rajesh Kumar",
      "phone": "+91-9876543210"
    },
    "students": {
      "total": 45,
      "boarded": 42,
      "alighted": 0,
      "absent": 3
    },
    "createdAt": "2025-01-14T10:30:00.000Z",
    "updatedAt": "2025-01-15T07:35:00.000Z"
  }
}
```

**Error Cases:**
- 404: Trip not found or access denied
- 401: Unauthorized

---

### 3. List Trips (with Filters & Pagination)

**Endpoint:** `GET /api/v1/transportation/trips`

**Authorization:** Any authenticated user

**Query Parameters:**
- `routeId` (optional): Filter by route
- `vehicleId` (optional): Filter by vehicle
- `driverId` (optional): Filter by driver
- `status` (optional): Filter by status (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
- `startDate` (optional): Filter trips from date (ISO 8601)
- `endDate` (optional): Filter trips until date (ISO 8601)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Example Request:**
```
GET /api/v1/transportation/trips?status=IN_PROGRESS&page=1&limit=10
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "id": "trip-001",
        "routeId": "route-123",
        "vehicleId": "vehicle-456",
        "driverId": "driver-789",
        "tripDate": "2025-01-15T00:00:00.000Z",
        "status": "IN_PROGRESS",
        "startTime": "2025-01-15T07:30:00.000Z",
        "endTime": null,
        "schoolId": "school-uuid"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

**Error Cases:**
- 400: Invalid filter values or pagination parameters
- 401: Unauthorized

---

### 4. Update Trip

**Endpoint:** `PUT /api/v1/transportation/trips/:id`

**Authorization:** ADMIN, SUPER_ADMIN

**Request:** (All fields optional)
```json
{
  "routeId": "route-124",
  "vehicleId": "vehicle-457",
  "driverId": "driver-790",
  "tripDate": "2025-01-16",
  "status": "SCHEDULED",
  "startTime": "2025-01-16T07:30:00Z",
  "endTime": "2025-01-16T08:30:00Z"
}
```

**Validation:**
- Trip must exist and belong to school
- All provided fields must be valid
- Status transitions must follow FSM rules
- If status is updated, start/endTime may be set automatically

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "trip-001",
    "routeId": "route-124",
    "vehicleId": "vehicle-457",
    "driverId": "driver-790",
    "tripDate": "2025-01-16T00:00:00.000Z",
    "status": "SCHEDULED",
    "startTime": null,
    "endTime": null,
    "schoolId": "school-uuid",
    "updatedAt": "2025-01-14T11:00:00.000Z"
  },
  "message": "Trip updated successfully"
}
```

**Error Cases:**
- 404: Trip not found
- 400: Invalid status transition
- 401: Unauthorized (not ADMIN/SUPER_ADMIN)

---

### 5. Start Trip

**Endpoint:** `POST /api/v1/transportation/trips/:id/start`

**Authorization:** ADMIN, TEACHER (driver)

**Request:** (Empty body)
```json
{}
```

**Action:**
- Validates trip status is SCHEDULED
- Checks vehicle and driver are ACTIVE
- Sets `startTime` to current timestamp
- Transitions status to IN_PROGRESS
- Emits `trip:started` event (for Socket.IO listeners)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "trip-001",
    "status": "IN_PROGRESS",
    "startTime": "2025-01-15T07:30:45.000Z",
    "endTime": null,
    "updatedAt": "2025-01-15T07:30:45.000Z"
  },
  "message": "Trip started successfully"
}
```

**Error Cases:**
- 404: Trip not found
- 400: Trip is not in SCHEDULED status
- 400: Vehicle is not ACTIVE
- 400: Driver is not ACTIVE
- 401: Unauthorized

---

### 6. Complete Trip

**Endpoint:** `POST /api/v1/transportation/trips/:id/complete`

**Authorization:** ADMIN, TEACHER (driver)

**Request:** (Empty body)
```json
{}
```

**Action:**
- Validates trip status is IN_PROGRESS
- Sets `endTime` to current timestamp
- Transitions status to COMPLETED
- Finalizes student attendance records
- Emits `trip:completed` event

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "trip-001",
    "status": "COMPLETED",
    "startTime": "2025-01-15T07:30:00.000Z",
    "endTime": "2025-01-15T08:35:30.000Z",
    "updatedAt": "2025-01-15T08:35:30.000Z"
  },
  "message": "Trip completed successfully"
}
```

**Error Cases:**
- 404: Trip not found
- 400: Trip is not in IN_PROGRESS status
- 401: Unauthorized

---

### 7. Cancel Trip

**Endpoint:** `POST /api/v1/transportation/trips/:id/cancel`

**Authorization:** ADMIN, SUPER_ADMIN

**Request:**
```json
{
  "reason": "Vehicle breakdown"  // Optional
}
```

**Validation:**
- Trip must be in SCHEDULED or IN_PROGRESS status
- Only ADMIN/SUPER_ADMIN can cancel
- Reason is optional (stored for audit trail)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "trip-001",
    "status": "CANCELLED",
    "reason": "Vehicle breakdown",
    "updatedAt": "2025-01-15T09:00:00.000Z"
  },
  "message": "Trip cancelled successfully"
}
```

**Error Cases:**
- 404: Trip not found
- 400: Trip is already COMPLETED or CANCELLED
- 401: Unauthorized

---

### 8. Get Trips for Specific Date

**Endpoint:** `GET /api/v1/transportation/trips/date/:date`

**Authorization:** Any authenticated user

**Path Parameters:**
- `date`: Date in YYYY-MM-DD format

**Query Parameters (Optional):**
- `routeId`: Filter by route
- `vehicleId`: Filter by vehicle
- `driverId`: Filter by driver

**Example Request:**
```
GET /api/v1/transportation/trips/date/2025-01-15?routeId=route-123
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "trips": [
      {
        "id": "trip-001",
        "routeId": "route-123",
        "vehicleId": "vehicle-456",
        "driverId": "driver-789",
        "tripDate": "2025-01-15T00:00:00.000Z",
        "status": "IN_PROGRESS",
        "startTime": "2025-01-15T07:30:00.000Z",
        "endTime": null
      },
      {
        "id": "trip-002",
        "routeId": "route-124",
        "vehicleId": "vehicle-457",
        "driverId": "driver-790",
        "tripDate": "2025-01-15T00:00:00.000Z",
        "status": "COMPLETED",
        "startTime": "2025-01-15T14:00:00.000Z",
        "endTime": "2025-01-15T15:30:00.000Z"
      }
    ],
    "count": 2
  }
}
```

**Error Cases:**
- 400: Invalid date format (use YYYY-MM-DD)
- 401: Unauthorized

---

### 9. Get Active Trips

**Endpoint:** `GET /api/v1/transportation/trips/active`

**Authorization:** Any authenticated user

**Description:** Returns all IN_PROGRESS trips for the school.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "id": "trip-001",
        "routeId": "route-123",
        "vehicleId": "vehicle-456",
        "driverId": "driver-789",
        "tripDate": "2025-01-15T00:00:00.000Z",
        "status": "IN_PROGRESS",
        "startTime": "2025-01-15T07:30:00.000Z",
        "endTime": null
      },
      {
        "id": "trip-003",
        "routeId": "route-125",
        "vehicleId": "vehicle-458",
        "driverId": "driver-791",
        "tripDate": "2025-01-15T00:00:00.000Z",
        "status": "IN_PROGRESS",
        "startTime": "2025-01-15T14:00:00.000Z",
        "endTime": null
      }
    ],
    "count": 2
  }
}
```

---

### 10. Get Trip Students

**Endpoint:** `GET /api/v1/transportation/trips/:id/students`

**Authorization:** Any authenticated user

**Description:** Returns all students assigned to the trip with their boarding/alighting status.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "tripId": "trip-001",
    "students": [
      {
        "studentId": "student-001",
        "name": "Aarav Sharma",
        "rollNumber": "12A01",
        "pickupStopId": "stop-001",
        "pickupStopName": "Main Gate",
        "dropStopId": "stop-005",
        "dropStopName": "Home Complex",
        "boarded": true,
        "boardedAt": "2025-01-15T07:35:00.000Z",
        "alighted": false,
        "alightedAt": null,
        "absent": false,
        "photo": "https://..."
      },
      {
        "studentId": "student-002",
        "name": "Bhavna Gupta",
        "rollNumber": "12A02",
        "pickupStopId": "stop-001",
        "pickupStopName": "Main Gate",
        "dropStopId": "stop-006",
        "dropStopName": "Park Avenue",
        "boarded": false,
        "boardedAt": null,
        "alighted": false,
        "alightedAt": null,
        "absent": true,
        "photo": null
      }
    ],
    "count": 2,
    "boarded": 1,
    "alighted": 0,
    "absent": 1
  }
}
```

**Error Cases:**
- 404: Trip not found
- 401: Unauthorized

---

### 11. Get Trip Statistics

**Endpoint:** `GET /api/v1/transportation/statistics`

**Authorization:** ADMIN, SUPER_ADMIN

**Query Parameters (Optional):**
- `startDate`: Filter from date (ISO 8601)
- `endDate`: Filter until date (ISO 8601)

**Example Request:**
```
GET /api/v1/transportation/statistics?startDate=2025-01-01&endDate=2025-01-31
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTrips": 150,
      "scheduledTrips": 20,
      "inProgressTrips": 5,
      "completedTrips": 120,
      "cancelledTrips": 5
    },
    "studentTracking": {
      "totalStudentsServed": 4500,
      "averageOccupancy": 78.5,
      "peakOccupancy": 95.2
    },
    "dateRange": {
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-01-31T23:59:59.999Z"
    }
  }
}
```

**Error Cases:**
- 400: Invalid date format
- 401: Unauthorized (requires ADMIN/SUPER_ADMIN)

---

## Business Logic & Validation

### Duplicate Trip Prevention

When creating a trip, the system checks for existing SCHEDULED or IN_PROGRESS trips with the same:
- `routeId`
- `vehicleId`
- Trip date (same calendar day)

If found, trip creation is rejected with error: "A trip already exists for this route and vehicle on this date."

### Vehicle/Driver Active Status

Starting a trip requires:
- Vehicle status: ACTIVE (not MAINTENANCE, OUT_OF_SERVICE, or RETIRED)
- Driver status: ACTIVE (not ON_LEAVE, SUSPENDED, or RESIGNED)

### Multi-tenancy Isolation

All queries automatically filter by `req.user.schoolId`:
- Users can only see trips for their school
- Cross-school trip access is prevented
- School context is required for all endpoints

### Attendance Integration

When a trip is marked COMPLETED:
- All students on that trip get their attendance automatically recorded
- Students marked "boarded" and "alighted" are marked PRESENT
- Students marked "absent" are marked ABSENT
- Records are linked to the school's attendance system

---

## Error Handling

### Common Error Responses

**400 Bad Request - Missing Fields:**
```json
{
  "success": false,
  "error": "routeId, vehicleId, driverId, and tripDate are required"
}
```

**400 Bad Request - Invalid State Transition:**
```json
{
  "success": false,
  "error": "Cannot start a trip that is not in SCHEDULED status"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Trip not found or access denied"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "School context required"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, POST state transitions |
| 201 | Created | Trip successfully created |
| 400 | Bad Request | Validation failure, invalid state transition |
| 401 | Unauthorized | Missing JWT, school context required |
| 403 | Forbidden | Insufficient role authorization |
| 404 | Not Found | Trip/route/vehicle/driver doesn't exist |
| 500 | Server Error | Unexpected error, check server logs |

---

## Usage Examples

### Example 1: Create and Start a Morning Trip

```bash
# 1. Create trip
curl -X POST http://localhost:5000/api/v1/transportation/trips \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": "route-north-01",
    "vehicleId": "vehicle-ka01ab1234",
    "driverId": "driver-rajesh-123",
    "tripDate": "2025-01-15"
  }'

# Response: 201 Created with trip object

# 2. Get trip details
curl -X GET http://localhost:5000/api/v1/transportation/trips/trip-001 \
  -H "Authorization: Bearer TOKEN"

# 3. At 7:30 AM, driver starts the trip
curl -X POST http://localhost:5000/api/v1/transportation/trips/trip-001/start \
  -H "Authorization: Bearer TOKEN"

# Response: Trip status changes to IN_PROGRESS

# 4. Check active trips in real-time
curl -X GET http://localhost:5000/api/v1/transportation/trips/active \
  -H "Authorization: Bearer TOKEN"

# 5. At 8:35 AM, complete the trip
curl -X POST http://localhost:5000/api/v1/transportation/trips/trip-001/complete \
  -H "Authorization: Bearer TOKEN"

# Response: Trip status changes to COMPLETED, attendance recorded
```

### Example 2: List Today's Trips with Filters

```bash
# Get all IN_PROGRESS trips for today
curl -X GET "http://localhost:5000/api/v1/transportation/trips/date/2025-01-15" \
  -H "Authorization: Bearer TOKEN"

# Get specific route's trips
curl -X GET "http://localhost:5000/api/v1/transportation/trips/date/2025-01-15?routeId=route-north-01" \
  -H "Authorization: Bearer TOKEN"

# Paginated trip list with filters
curl -X GET "http://localhost:5000/api/v1/transportation/trips?status=COMPLETED&startDate=2025-01-01&endDate=2025-01-31&page=1&limit=20" \
  -H "Authorization: Bearer TOKEN"
```

### Example 3: Cancel a Trip

```bash
# Cancel trip due to vehicle maintenance
curl -X POST http://localhost:5000/api/v1/transportation/trips/trip-001/cancel \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Vehicle emergency maintenance required"
  }'

# Response: Trip status changes to CANCELLED
```

### Example 4: Get Trip Statistics for Month

```bash
# Get monthly statistics
curl -X GET "http://localhost:5000/api/v1/transportation/statistics?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer TOKEN"

# Response:
# {
#   "summary": {
#     "totalTrips": 150,
#     "completedTrips": 145,
#     "cancelledTrips": 5
#   },
#   "studentTracking": {
#     "totalStudentsServed": 4500,
#     "averageOccupancy": 78.5
#   }
# }
```

---

## Troubleshooting

### Problem: Cannot Start Trip - Vehicle Not Active

**Symptom:**
```json
{
  "success": false,
  "error": "Vehicle is not ACTIVE"
}
```

**Solution:**
- Check vehicle status in `/vehicles/:id` endpoint
- If vehicle is in MAINTENANCE, complete maintenance first
- Update vehicle status to ACTIVE in admin interface

---

### Problem: Duplicate Trip Error on Creation

**Symptom:**
```json
{
  "success": false,
  "error": "A trip already exists for this route and vehicle on this date"
}
```

**Solution:**
- Check if trip was already created for this route+vehicle+date
- Use `/trips/date/:date?routeId=...&vehicleId=...` to view existing trips
- Either cancel the existing trip or create a different trip

---

### Problem: Cannot Complete Trip - Wrong Status

**Symptom:**
```json
{
  "success": false,
  "error": "Cannot complete a trip that is not in IN_PROGRESS status"
}
```

**Solution:**
- Ensure trip is in IN_PROGRESS status
- Call `/trips/:id` to check current status
- Start trip first with `/trips/:id/start` if still SCHEDULED

---

### Problem: Attendance Not Recorded

**Symptom:** After completing trip, attendance not showing in attendance module

**Causes & Solutions:**
1. **Students not assigned to trip:**
   - Verify students are in StudentRoute table with this trip's routeId
   - Use `/trips/:id/students` to view assigned students

2. **Boarding data incomplete:**
   - Ensure driver marked students as boarded/absent
   - Check StudentTripRecord table for boarding data
   - Incomplete records won't sync to attendance

3. **Integration disabled:**
   - Check if attendance integration is enabled in school settings
   - Verify StudentTripRecord has attendance sync flag

---

## Integration with Other Stories

### Previous Stories (Dependencies)
- **Story 1.1-1.4 (Sprint 1):** Vehicle, Driver, Route, Stop CRUD - Trip depends on these
- **Story 2.1-2.5 (Sprint 2):** GPS tracking & ETA - Trip data feeds ETA calculations

### Next Stories (Dependent)
- **Story 3.2:** Student Boarding/Alighting Tracking - Uses trip data
- **Story 3.3:** Attendance Integration - Finalizes attendance from completed trips
- **Sprint 4-6:** Mobile & Dashboard apps - Display trip information

---

## Performance Considerations

### Indexing Strategy

Database should have indexes on:
- `Trip(schoolId, tripDate)` - Daily trip queries
- `Trip(vehicleId, tripDate)` - Vehicle trips
- `Trip(driverId, status)` - Driver active trips
- `Trip(status)` - Active trip filtering

### Caching Strategy

Redis caching recommended for:
- Active trips (IN_PROGRESS): 30s TTL
- Trip details with student counts: 60s TTL
- Daily trip statistics: 5m TTL

### Query Optimization

- Pagination required: Default limit 20, max 100
- Always include schoolId filter (multi-tenancy)
- Use date range filters for historical queries
- Avoid full table scans

---

## Security Considerations

### Authorization Matrix

| Endpoint | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| Create Trip | - | ADMIN/SUPER_ADMIN | - | - |
| Get Details | Any | - | - | - |
| List Trips | Any | - | - | - |
| Update Trip | - | - | ADMIN/SUPER_ADMIN | - |
| Start Trip | - | ADMIN/TEACHER | - | - |
| Complete Trip | - | ADMIN/TEACHER | - | - |
| Cancel Trip | - | ADMIN/SUPER_ADMIN | - | - |
| Get by Date | Any | - | - | - |
| Get Active | Any | - | - | - |
| Get Students | Any | - | - | - |
| Statistics | ADMIN/SUPER_ADMIN | - | - | - |

### Data Isolation

- All queries filtered by `req.user.schoolId`
- Cross-school trip access impossible
- Driver can only access their own trips (checked at application level)
- Parent can only access child's trips (checked at application level)

### Input Validation

- Date format: ISO 8601 (YYYY-MM-DD)
- IDs: UUID format validation
- Status: Enum validation
- Numeric fields: Type and range validation

---

## Related Documentation

- **Vehicle Management:** `_docs/transportation/vehicle-management.md`
- **Driver Management:** `_docs/transportation/driver-management.md`
- **Route Management:** `_docs/transportation/route-management.md`
- **GPS Tracking:** `_docs/transportation/gps-tracking.md`
- **ETA Calculation:** `_docs/transportation/eta-calculation.md`
- **Real-time Broadcasting:** `_docs/transportation/location-broadcasting.md`

---

## Changelog

### Version 1.0 (Story 3.1 - Complete)
- Initial release: 11 endpoints for trip lifecycle management
- Trip status FSM with validation
- Multi-filter querying and pagination
- Student tracking integration
- Trip statistics and analytics
- Full authorization and multi-tenancy

---

**Last Updated:** January 2025
**Maintained By:** Development Team
**API Version:** v1
