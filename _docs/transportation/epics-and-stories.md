# Transportation Module - Epics & User Stories

**Version:** 1.0
**Date:** 2025-12-31
**Author:** John (Product Manager)
**Status:** Epic & Story Planning Complete

---

## Table of Contents

1. [Epic 1: Core Transportation Data Models](#epic-1-core-transportation-data-models)
2. [Epic 2: Real-Time Vehicle Tracking](#epic-2-real-time-vehicle-tracking)
3. [Epic 3: Trip Management & Student Tracking](#epic-3-trip-management--student-tracking)
4. [Epic 4: Route Optimization & Planning](#epic-4-route-optimization--planning)
5. [Epic 5: Mobile App - Driver Interface](#epic-5-mobile-app---driver-interface)
6. [Epic 6: Mobile App - Parent Interface](#epic-6-mobile-app---parent-interface)
7. [Epic 7: Admin Dashboard - Web](#epic-7-admin-dashboard---web)
8. [Epic 8: Safety & Compliance](#epic-8-safety--compliance)
9. [Epic 9: Notifications & Alerts](#epic-9-notifications--alerts)
10. [Epic 10: Testing & Deployment](#epic-10-testing--deployment)

---

## EPIC 1: Core Transportation Data Models

**Epic ID:** T-EPIC-001
**Priority:** CRITICAL (Blocker for all other epics)
**Duration:** 1 week
**Story Points:** 34
**Status:** Ready for Sprint 1

### Epic Description
Establish the complete database schema and foundational CRUD APIs for all transportation entities. This epic creates the data layer upon which all other features depend.

### Acceptance Criteria
- ✅ All 13 Prisma models implemented in schema.prisma
- ✅ All 8 enums defined with proper values
- ✅ Schema migration created and tested
- ✅ All relationships properly configured (1:1, 1:M, M:M)
- ✅ Basic CRUD APIs for Vehicle, Driver, Route, Stop operational
- ✅ Multi-tenancy (schoolId) enforced on all queries
- ✅ Authentication & authorization middleware applied
- ✅ Database seeding script with sample data

---

### Story 1.1: Prisma Schema Implementation
**Story ID:** T-1-1
**Points:** 13
**Assignee:** Amelia (Developer)
**Dependencies:** None

**Description**
Create all 13 transportation models and 8 enums in Prisma schema following existing patterns.

**User Story**
As a backend developer, I need the complete database schema defined so that I can build APIs on top of structured data.

**Acceptance Criteria**
- ✅ Vehicle model created with fields: id, registrationNumber, type, capacity, gpsDeviceId, status, purchaseDate, schoolId, branchId
- ✅ Driver model created with fields: id, userId, licenseNumber, licenseExpiry, phone, status, schoolId, branchId
- ✅ Route model created with fields: id, name, description, status, startTime, endTime, schoolId, branchId
- ✅ Stop model created with fields: id, name, latitude, longitude, stopType, address, schoolId, branchId
- ✅ RouteStop junction model with: id, routeId, stopId, sequence, waitTimeMinutes
- ✅ RouteVehicle model with: id, routeId, vehicleId, effectiveFrom, effectiveTo
- ✅ RouteDriver model with: id, routeId, driverId, effectiveFrom, effectiveTo
- ✅ VehicleDriver model with: id, vehicleId, driverId, assignedDate, unassignedDate
- ✅ StudentRoute model with: id, studentId, routeId, pickupStopId, dropStopId, boardingTime, alightingTime
- ✅ Trip model with: id, routeId, vehicleId, driverId, tripDate, startTime, endTime, status
- ✅ StudentTripRecord model with: id, tripId, studentId, boardingTime, alightingTime, boarded, alighted
- ✅ VehicleMaintenanceLog model with: id, vehicleId, maintenanceType, status, date, notes, cost
- ✅ GPSLocation model with: id, vehicleId, latitude, longitude, accuracy, timestamp, status
- ✅ 8 enums created: VehicleType, VehicleStatus, DriverStatus, RouteStatus, StopType, MaintenanceType, MaintenanceStatus, GPSStatus
- ✅ All relationships configured with proper cascading (onDelete: CASCADE/SET_NULL)
- ✅ Indexes created on: vehicleId, driverId, routeId, studentId, schoolId, timestamp
- ✅ Timestamps (@createdAt, @updatedAt) added to all models
- ✅ Multi-tenancy constraint enforced via schoolId field
- ✅ Prisma generate completes without errors

**Definition of Done**
- Schema compiles in Prisma
- All relationships validate correctly
- Migration files generated
- Sample data script created for testing

---

### Story 1.2: Vehicle Management CRUD API
**Story ID:** T-1-2
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** Story 1.1

**Description**
Build REST API endpoints for vehicle management (Create, Read, Update, Delete) with authentication and authorization.

**User Story**
As an admin, I need to manage school vehicles (add, view, update, delete) so I can maintain the fleet inventory.

**Acceptance Criteria**
- ✅ POST /api/v1/transportation/vehicles - Create vehicle with validation
  - Required fields: registrationNumber, type, capacity, gpsDeviceId
  - Validation: type enum, capacity > 0, unique registrationNumber per school
  - Returns: Created vehicle object with id
  - Status: 201 Created
- ✅ GET /api/v1/transportation/vehicles - List all vehicles with pagination, filters
  - Query params: page, limit, status, type, search (registrationNumber)
  - Returns: { data: [], total, page, pages }
  - Multi-tenancy: Filter by req.user.schoolId
  - Status: 200 OK
- ✅ GET /api/v1/transportation/vehicles/:id - Get single vehicle by ID
  - Returns: Vehicle object with related Driver, Route assignments
  - Includes: Current maintenance status, GPS location, trip count
  - Status: 200 OK or 404 Not Found
- ✅ PUT /api/v1/transportation/vehicles/:id - Update vehicle
  - Updatable fields: registrationNumber, type, capacity, gpsDeviceId, status
  - Validation: No duplicate registrationNumber, type enum, capacity > 0
  - Returns: Updated vehicle object
  - Status: 200 OK
- ✅ DELETE /api/v1/transportation/vehicles/:id - Soft delete (mark RETIRED)
  - Cannot delete if active routes assigned
  - Status: 200 OK or 409 Conflict
- ✅ GET /api/v1/transportation/vehicles/:id/maintenance-history - Get maintenance logs
  - Returns: Paginated MaintenanceLog records sorted by date DESC
  - Status: 200 OK
- ✅ Authentication: All endpoints require JWT token
- ✅ Authorization: Only ADMIN, SUPER_ADMIN can POST/PUT/DELETE
- ✅ Rate limiting: Standard (100 req/min per IP)
- ✅ Error handling: Proper HTTP status codes and error messages
- ✅ Swagger/OpenAPI annotations added for each endpoint

**Definition of Done**
- All CRUD operations tested manually
- Postman collection created
- Response format matches fee API pattern
- Error cases handled (404, 409, 422)

---

### Story 1.3: Driver Management CRUD API
**Story ID:** T-1-3
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** Story 1.1

**Description**
Build REST API endpoints for driver management with license validation and vehicle assignment.

**User Story**
As an admin, I need to manage school drivers (add, view, update, assign to vehicles) so I can maintain driver records and assignments.

**Acceptance Criteria**
- ✅ POST /api/v1/transportation/drivers - Create driver
  - Required fields: userId, licenseNumber, licenseExpiry, phone
  - Validation: licenseNumber unique per school, licenseExpiry > today, phone format
  - Links to existing User model (userId validation)
  - Returns: Created driver object with id
  - Status: 201 Created
- ✅ GET /api/v1/transportation/drivers - List drivers with pagination
  - Query params: page, limit, status, search (name, licenseNumber)
  - Returns: { data: [], total, page, pages }
  - Includes: Current vehicle assignment, active trip count
  - Multi-tenancy: Filter by schoolId
  - Status: 200 OK
- ✅ GET /api/v1/transportation/drivers/:id - Get single driver
  - Returns: Driver object with User details, vehicle assignment, routes
  - Status: 200 OK or 404
- ✅ PUT /api/v1/transportation/drivers/:id - Update driver
  - Updatable fields: licenseNumber, licenseExpiry, phone, status
  - Validation: licenseExpiry > today
  - Returns: Updated driver object
  - Status: 200 OK
- ✅ DELETE /api/v1/transportation/drivers/:id - Mark driver as RESIGNED
  - Cannot delete if trip in progress
  - Status: 200 OK or 409 Conflict
- ✅ POST /api/v1/transportation/drivers/:id/assign-vehicle - Assign vehicle to driver
  - Body: { vehicleId, effectiveFrom, effectiveTo }
  - Validation: Vehicle exists, Driver exists, no conflicting assignments
  - Creates VehicleDriver record
  - Returns: Assignment details with id
  - Status: 201 Created
- ✅ GET /api/v1/transportation/drivers/:id/assignment-history - Get past assignments
  - Returns: Paginated VehicleDriver records
  - Status: 200 OK
- ✅ Authentication: All endpoints require JWT
- ✅ Authorization: ADMIN/SUPER_ADMIN for POST/PUT/DELETE
- ✅ Error handling: Proper status codes for validation errors

**Definition of Done**
- Create driver → Assign to vehicle workflow tested
- License expiry validation working
- Error cases handled (duplicate license, missing user)

---

### Story 1.4: Route & Stop Configuration API
**Story ID:** T-1-4
**Points:** 13
**Assignee:** Amelia (Developer)
**Dependencies:** Story 1.1

**Description**
Build APIs for creating and managing routes with stops, including sequence management and vehicle/driver assignments.

**User Story**
As an admin, I need to create transport routes with multiple stops and assign vehicles/drivers so students can board and alight at designated locations.

**Acceptance Criteria**
- ✅ POST /api/v1/transportation/routes - Create route
  - Required fields: name, startTime, endTime
  - Optional fields: description
  - Validation: startTime < endTime, name unique per school
  - Returns: Created route object
  - Status: 201 Created
- ✅ GET /api/v1/transportation/routes - List routes with filters
  - Query params: page, limit, status, search (name)
  - Returns: { data: [], total, page, pages }
  - Includes: Stop count, vehicle/driver assignments, student count
  - Status: 200 OK
- ✅ GET /api/v1/transportation/routes/:id - Get route with stops
  - Returns: Route object with nested RouteStop array (sorted by sequence)
  - Includes: Assigned vehicles, assigned drivers, enrolled students
  - Status: 200 OK or 404
- ✅ PUT /api/v1/transportation/routes/:id - Update route
  - Updatable fields: name, startTime, endTime, description, status
  - Validation: startTime < endTime
  - Returns: Updated route object
  - Status: 200 OK
- ✅ DELETE /api/v1/transportation/routes/:id - Mark route as INACTIVE
  - Cannot delete if students enrolled
  - Status: 200 OK or 409 Conflict
- ✅ POST /api/v1/transportation/routes/:id/stops - Add stop to route
  - Required fields: stopId, sequence, waitTimeMinutes
  - Validation: Stop exists, sequence is integer, no duplicate sequence
  - Creates RouteStop record
  - Returns: RouteStop object with stop details
  - Status: 201 Created
- ✅ PUT /api/v1/transportation/routes/:id/stops/:stopId - Update stop sequence
  - Body: { sequence, waitTimeMinutes }
  - Reorders all stops to maintain sequence integrity
  - Returns: Updated RouteStop object
  - Status: 200 OK
- ✅ DELETE /api/v1/transportation/routes/:id/stops/:stopId - Remove stop from route
  - Resequences remaining stops
  - Returns: 204 No Content
  - Status: 204
- ✅ POST /api/v1/transportation/routes/:id/assign-vehicle - Assign vehicle to route
  - Body: { vehicleId, effectiveFrom, effectiveTo }
  - Creates RouteVehicle record
  - Returns: Assignment with id
  - Status: 201 Created
- ✅ POST /api/v1/transportation/routes/:id/assign-driver - Assign driver to route
  - Body: { driverId, effectiveFrom, effectiveTo }
  - Creates RouteDriver record
  - Returns: Assignment with id
  - Status: 201 Created
- ✅ GET /api/v1/transportation/routes/:id/students - Get enrolled students
  - Returns: Paginated list of StudentRoute assignments
  - Includes: Pickup/drop stop details
  - Status: 200 OK
- ✅ All endpoints require authentication
- ✅ Authorization: ADMIN/SUPER_ADMIN for write operations
- ✅ Multi-tenancy: Filter by schoolId

**Definition of Done**
- Full route creation workflow: Create route → Add stops → Assign vehicle → Assign driver
- Stop sequencing working correctly (tested with reorder)
- Error handling for invalid sequences, missing stops
- Database constraints preventing duplicate assignments

---

## EPIC 2: Real-Time Vehicle Tracking

**Epic ID:** T-EPIC-002
**Priority:** CRITICAL (Core feature)
**Duration:** 1 week
**Story Points:** 31
**Status:** Ready for Sprint 2

### Epic Description
Implement real-time GPS tracking infrastructure using Socket.IO WebSocket server and Redis Pub/Sub for multi-server broadcasting. Enable live vehicle location updates with <5 second end-to-end latency.

### Acceptance Criteria
- ✅ Socket.IO server running on /transport namespace
- ✅ GPS location capture endpoint operational with rate limiting
- ✅ Redis Pub/Sub channels broadcasting to all server instances
- ✅ <5 second end-to-end latency from GPS capture to client display
- ✅ 500+ concurrent WebSocket connections supported
- ✅ Historical location queries working
- ✅ Geofencing & route adherence monitoring implemented

---

### Story 2.1: GPS Location Capture & Validation
**Story ID:** T-2-1
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Epic 1

**Description**
Build GPS location ingestion endpoint with validation, rate limiting, and error handling.

**User Story**
As a driver, I need to submit GPS coordinates from my device so that parents and admins can see my vehicle's real-time location.

**Acceptance Criteria**
- ✅ POST /api/v1/transportation/location endpoint created
  - Request body: { vehicleId, latitude, longitude, accuracy, timestamp }
  - Validation:
    - Vehicle exists and is ACTIVE
    - Latitude range: -90 to 90
    - Longitude range: -180 to 180
    - Accuracy > 0 (meters)
    - Timestamp is valid and recent (not > 5 min old)
  - Returns: { success: true, data: { id, vehicleId, latitude, longitude } }
  - Status: 200 OK
- ✅ Rate limiting: 10 updates per minute per driver
  - Uses Redis-based rate limiter
  - Exceeding limit returns 429 Too Many Requests
  - Error message: "GPS updates rate limited. Try again in X seconds."
- ✅ Authentication: JWT token required
  - Extract driverId from req.user
  - Validate driver is assigned to vehicle
- ✅ Three-tier storage flow:
  1. Update Redis cache: `transport:location:{vehicleId}` (TTL: 60s)
  2. Publish to Redis Pub/Sub: `transport:location:{vehicleId}`
  3. Queue for PostgreSQL sparse storage (every 5 min)
- ✅ Error handling:
  - 400 Bad Request: Invalid lat/long
  - 404 Not Found: Vehicle not found
  - 401 Unauthorized: Driver not assigned to vehicle
  - 429 Too Many Requests: Rate limit exceeded
  - 500 Internal Server Error: Database error
- ✅ Logging: All GPS updates logged (can be disabled in production for performance)
- ✅ Performance: <100ms response time (99th percentile)

**Definition of Done**
- Rate limiter tested (check 11th request gets blocked)
- Validation catches invalid coordinates
- Redis cache updating and TTL working
- Pub/Sub message publishing verified
- Load tested with 100 concurrent drivers

---

### Story 2.2: WebSocket Server for Real-Time Tracking
**Story ID:** T-2-2
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** Story 2.1

**Description**
Implement Socket.IO WebSocket server for real-time location streaming to admin dashboard and parent apps.

**User Story**
As an admin/parent, I need real-time location updates so I can track vehicle movements on a map.

**Acceptance Criteria**
- ✅ Socket.IO server initialized on /transport namespace
  - Runs on same HTTP server as Express
  - CORS configured for frontend origins
  - Reconnection timeout: 30 seconds
  - Heartbeat interval: 25 seconds
- ✅ WebSocket authentication on handshake:
  - Client sends JWT token in connection query or header
  - Server validates token, extracts userId, userRole, schoolId
  - Unauthorized connections rejected
  - Proper error messages sent to client
- ✅ Room-based subscriptions:
  - Room naming: `vehicle:{vehicleId}` for vehicle tracking
  - Room naming: `school:{schoolId}` for emergency broadcasts
  - Room naming: `trip:{tripId}` for trip status updates
  - Clients can join/leave rooms dynamically
- ✅ Client events:
  - `subscribe-vehicle` - Join vehicle tracking room
    - Payload: { vehicleId }
    - Validation: User authorized for this vehicle
    - Response: { subscribed: true, vehicleId, lastLocation }
  - `unsubscribe-vehicle` - Leave room
    - Payload: { vehicleId }
    - Response: { unsubscribed: true }
  - `subscribe-school` - Join school-wide emergency room
    - Validation: User belongs to school
    - Response: { subscribed: true }
- ✅ Server-to-client events:
  - `location-update` - New GPS location
    - Payload: { vehicleId, latitude, longitude, accuracy, timestamp }
    - Sent to `vehicle:{vehicleId}` room
    - Latency: < 1 second from Redis Pub/Sub trigger
  - `trip-status-update` - Trip status change (started, completed)
    - Payload: { tripId, status, timestamp }
    - Sent to `trip:{tripId}` room
  - `eta-update` - ETA recalculation
    - Payload: { vehicleId, eta, distanceRemaining }
    - Sent to `vehicle:{vehicleId}` room
  - `emergency-alert` - Emergency broadcast
    - Payload: { alertId, vehicleId, type, message, timestamp }
    - Sent to `school:{schoolId}` room
  - `driver-status-change` - Driver availability
    - Payload: { driverId, status, timestamp }
    - Sent to `school:{schoolId}` room
- ✅ Connection management:
  - Track connected clients per room
  - Graceful disconnection handling
  - Cleanup disconnected sockets
  - Log connections/disconnections
- ✅ Performance targets:
  - Support 500+ concurrent connections
  - Message delivery latency < 1 second (p95)
  - CPU usage < 30% during normal operation
- ✅ Graceful degradation:
  - If Redis Pub/Sub unavailable, direct emit (single server)
  - Client auto-reconnects if connection dropped
  - Missed updates buffered when reconnecting

**Definition of Done**
- Manual testing: Connect with JWT token
- Room subscription: Verify client only receives updates for subscribed vehicles
- Load test: 500 concurrent connections stable
- Latency test: Message delivery < 1 second
- Disconnection: Verify cleanup and reconnection

---

### Story 2.3: Redis Pub/Sub for Multi-Server Broadcasting
**Story ID:** T-2-3
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Story 2.1, 2.2

**Description**
Implement Redis Pub/Sub service to broadcast location updates across multiple backend server instances.

**User Story**
As a system architect, I need location updates to broadcast across all servers so the system can scale horizontally without sticky sessions.

**Acceptance Criteria**
- ✅ Redis Pub/Sub service created: `backend/src/services/transport-pubsub.service.ts`
- ✅ Channel patterns:
  - `transport:location:{vehicleId}` - GPS location updates
  - `transport:emergency:{vehicleId}` - Emergency alerts
  - `transport:trip:{tripId}` - Trip status updates
- ✅ Publishing:
  - GPS location service publishes to `transport:location:{vehicleId}` after Redis cache update
  - Payload: { vehicleId, latitude, longitude, accuracy, timestamp, status }
- ✅ Subscribing:
  - Socket.IO server subscribes to relevant channels on startup
  - Receives published messages from any server instance
  - Routes messages to connected clients in appropriate room
- ✅ Channel management:
  - Dynamic subscription based on connected rooms
  - Cleanup subscriptions when no clients in room
- ✅ Error handling:
  - Redis connection failure: Log error, continue with single-server fallback
  - Message publish failure: Retry with exponential backoff (3 attempts)
  - Memory management: Remove subscriptions after 5 min inactivity
- ✅ Performance:
  - Publish latency < 50ms
  - Subscribe/unsubscribe < 100ms
- ✅ Testing:
  - Test with 3+ server instances
  - Verify message received by all servers
  - Verify room-based filtering works

**Definition of Done**
- Multi-server test: Start 2 backend instances, verify location update received by client on both
- Performance: Publish latency measured < 50ms
- Error scenario: Kill Redis, verify graceful degradation to single-server mode

---

### Story 2.4: Historical Location Data & Playback
**Story ID:** T-2-4
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Epic 1, 2.1

**Description**
Build APIs to query historical location data and support trip playback feature.

**User Story**
As an admin, I need to view historical location data and replay a vehicle's journey so I can audit trips and investigate incidents.

**Acceptance Criteria**
- ✅ GET /api/v1/transportation/vehicles/:id/location - Get current location
  - Returns: { vehicleId, latitude, longitude, accuracy, timestamp, status }
  - Data from Redis cache (instant)
  - Status: 200 OK or 404
- ✅ GET /api/v1/transportation/vehicles/:id/location-history - Get location history
  - Query params: startDate, endDate, limit (default 100, max 1000)
  - Date format: ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  - Returns: { data: [...], total, startDate, endDate }
  - Data from PostgreSQL (sparse storage every 5 min)
  - Sorted by timestamp DESC
  - Status: 200 OK
- ✅ GET /api/v1/transportation/trips/:tripId/route-playback - Get trip waypoints
  - Returns: { tripId, vehicleId, startTime, endTime, waypoints: [...] }
  - Waypoints include: timestamp, latitude, longitude, accuracy, speed
  - Used for trip replay animation on map
  - Status: 200 OK or 404
- ✅ Pagination for large date ranges:
  - Default: 100 records per page
  - Max: 1000 records per page (prevent DoS)
  - Include cursor-based pagination for real-time queries
- ✅ Authorization:
  - ADMIN/SUPER_ADMIN: Access any vehicle's history
  - PARENT: Access only assigned child's vehicle history
  - TEACHER: Access only assigned vehicle's history
- ✅ Performance:
  - Date range query (7 days): < 500ms
  - Indexed on: vehicleId, timestamp
- ✅ Error handling:
  - 400 Bad Request: Invalid date format
  - 404 Not Found: Vehicle or trip not found
  - 422 Unprocessable Entity: Date range too large

**Definition of Done**
- Queried locations for vehicle over 7-day range
- Verified sparse storage (5 min intervals)
- Tested trip playback data (100+ waypoints)
- Authorization tested (parent cannot see other child's vehicle)

---

### Story 2.5: Geofencing & Route Adherence Monitoring
**Story ID:** T-2-5
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** Epic 1, 2.1

**Description**
Implement geofencing around stops and route adherence monitoring to detect deviations and generate alerts.

**User Story**
As an admin, I need to detect when a vehicle deviates from its assigned route so I can alert drivers and investigate incidents.

**Acceptance Criteria**
- ✅ Geofence definition per stop:
  - Radius: 100-500 meters (configurable per stop)
  - Center: Stop GPS coordinates
  - Create `StopGeofence` model in Prisma (or extend Stop)
- ✅ On GPS update, check geofence crossing:
  - When vehicle enters geofence: Trigger `stop-entry` event
  - When vehicle exits geofence: Trigger `stop-exit` event
  - Payload: { tripId, stopId, timestamp, latitude, longitude }
  - Publish to Redis: `transport:geofence:{tripId}`
  - Broadcast via WebSocket: `trip:{tripId}` room
- ✅ Route adherence algorithm:
  - Create `RouteAdherence` service with methods:
    - `calculateDeviation(lat1, lon1, lat2, lon2, routeWaypoints)` → distance in meters
    - `checkAdherence(location, route, maxDeviationMeters)` → boolean
  - Max deviation threshold: 500 meters (configurable)
  - Deviation check on every GPS update (or every 5 updates for performance)
- ✅ Route deviation detection:
  - If vehicle deviates > 500m from route: Store deviation record
  - Payload: { tripId, vehicleId, timestamp, deviationMeters, latitude, longitude }
  - POST `/api/v1/transportation/routes/:id/adherence-report` to store
  - Publish to Redis: `transport:deviation:{tripId}`
  - Do NOT auto-alert yet (Story 9 handles alerting)
- ✅ Historical adherence queries:
  - GET /api/v1/transportation/trips/:tripId/deviations - Get all deviations for trip
    - Returns: Paginated list of deviation records
    - Sorted by timestamp DESC
  - GET /api/v1/transportation/drivers/:driverId/adherence-report - Get adherence score
    - Date range: Last 30 days
    - Returns: { adherencePercentage, deviationCount, totalTrips }
- ✅ Performance:
  - Geofence check: < 10ms per update
  - Deviation calculation: < 20ms per update
- ✅ Error handling:
  - Missing route geometry: Skip adherence check (log warning)
  - Invalid coordinates: Reject GPS update (400 error)

**Definition of Done**
- Geofence test: Vehicle enters stop radius, `stop-entry` event triggered
- Deviation test: Vehicle 600m off route, deviation recorded
- Adherence report: Query driver's adherence score
- Performance: 1000 GPS updates processed with geofence/deviation check < 15s total

---

## EPIC 3: Trip Management & Student Tracking

**Epic ID:** T-EPIC-003
**Priority:** HIGH
**Duration:** 1 week
**Story Points:** 28
**Status:** Ready for Sprint 3

### Epic Description
Implement trip execution workflows, student boarding/alighting tracking, and integration with the attendance module.

### Acceptance Criteria
- ✅ Trip creation and execution APIs operational
- ✅ Student boarding/alighting confirmation working
- ✅ Automatic attendance marking on boarding/alighting
- ✅ Real-time student status updates
- ✅ Trip completion and reports
- ✅ Integration with attendance module verified

---

### Story 3.1: Trip Creation & Execution API
**Story ID:** T-3-1
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** Epic 1

**Description**
Build APIs for creating daily trips and managing trip execution lifecycle.

**User Story**
As a driver, I need to start and complete daily trips so that the system can track student boarding and attendance.

**Acceptance Criteria**
- ✅ POST /api/v1/transportation/trips - Create trip
  - Required fields: routeId, vehicleId, driverId, tripDate
  - Validation:
    - Route, Vehicle, Driver exist and belong to same school
    - Driver assigned to vehicle
    - Vehicle assigned to route
    - Trip doesn't already exist for same route+date
  - Auto-set: startTime (current time), status = SCHEDULED
  - Returns: Created trip object with id
  - Status: 201 Created
- ✅ GET /api/v1/transportation/trips - List trips with filters
  - Query params: page, limit, date, routeId, driverId, status
  - Multi-tenancy: Filter by schoolId
  - Includes: Stop count, enrolled students, on-board count
  - Status: 200 OK
- ✅ GET /api/v1/transportation/trips/:id - Get trip details
  - Returns: Trip object with route details, enrolled students
  - Includes: StudentTripRecord for each student (boarding/alighting status)
  - Status: 200 OK or 404
- ✅ PUT /api/v1/transportation/trips/:id/status - Update trip status
  - Allowed statuses: SCHEDULED → IN_PROGRESS → COMPLETED
  - Also support: CANCELLED (if no students boarded)
  - Body: { status }
  - Validation: No backward transitions, no status changes after COMPLETED
  - Returns: Updated trip object with new status
  - Status: 200 OK or 409 Conflict
  - Trigger `trip-status-update` WebSocket event
- ✅ GET /api/v1/transportation/trips/:id/students - Get enrolled students
  - Returns: Paginated list of StudentRoute assignments for this trip's route
  - Includes: Expected boarding/alighting times, current status
  - Sorted by pickup sequence
  - Status: 200 OK
- ✅ Authentication: All endpoints require JWT
- ✅ Authorization:
  - Driver can only see/create their own trips
  - Admin can see all trips
- ✅ Scheduling:
  - Trips created 1 day before (admin can pre-create routes for week)
  - Auto-create trips from route schedule (future feature, Story X-Y)

**Definition of Done**
- Full trip workflow: Create → Start → Complete
- Status transitions validated (no backward transitions)
- Student list includes expected times
- WebSocket event broadcasts on status change

---

### Story 3.2: Student Boarding & Alighting Confirmation
**Story ID:** T-3-2
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** Story 3.1

**Description**
Build API and UI for drivers to confirm student boarding and alighting with optional photo verification.

**User Story**
As a driver, I need to confirm when each student boards and alights the bus so the system can track attendance accurately.

**Acceptance Criteria**
- ✅ POST /api/v1/transportation/trips/:tripId/student-boarding - Record boarding
  - Required fields: studentId
  - Optional fields: photo (base64 encoded)
  - Validation:
    - Student enrolled in trip's route
    - Student not already marked boarded
    - Boarding at correct stop (validate geofence if available)
  - Auto-set: boardingTime = current time
  - Creates/updates StudentTripRecord with: boarded = true, boardingTime, photo
  - Returns: { studentId, status: "boarded", boardingTime }
  - Status: 200 OK or 400 Bad Request
- ✅ POST /api/v1/transportation/trips/:tripId/student-alighting - Record alighting
  - Required fields: studentId
  - Optional fields: photo (base64 encoded)
  - Validation:
    - Student enrolled in trip's route
    - Student already marked boarded
    - Student not already marked alighted
    - Alighting at correct stop
  - Auto-set: alightingTime = current time
  - Updates StudentTripRecord with: alighted = true, alightingTime, photo
  - Returns: { studentId, status: "alighted", alightingTime }
  - Status: 200 OK or 400 Bad Request
- ✅ GET /api/v1/transportation/trips/:tripId/student-status - Get all students' status
  - Returns: List of { studentId, studentName, expectedBoarding, expectedAlighting, actualBoarding, actualAlighting, status }
  - Status values: PENDING, BOARDED, ALIGHTED, ABSENT
  - Sorted by expected boarding time
  - Status: 200 OK
- ✅ POST /api/v1/transportation/trips/:tripId/mark-absent - Mark student absent
  - Required fields: studentId
  - Validation: Student enrolled in trip's route
  - Updates StudentTripRecord with: boarded = false, absent = true, timestamp
  - Returns: { studentId, status: "absent" }
  - Status: 200 OK
- ✅ Photo storage:
  - Photos stored as base64 in StudentTripRecord.photo field (initially)
  - Size limit: 1MB per photo
  - Validation: Valid base64 format
- ✅ Real-time updates:
  - On boarding/alighting: Publish WebSocket event `student-status-update` to `trip:{tripId}`
  - Payload: { studentId, status, timestamp }
  - Parents receive real-time notification of boarding
- ✅ Authentication: Only driver can submit boarding/alighting
- ✅ Error handling:
  - 400: Student not enrolled, already boarded, invalid stop
  - 404: Trip or student not found

**Definition of Done**
- Driver app UI tested: Click student to mark boarded
- Photo capture and upload working
- Student status shown in real-time on parent app
- Absent marking working

---

### Story 3.3: Automatic Attendance Integration
**Story ID:** T-3-3
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Story 3.2

**Description**
Integrate with existing attendance module to automatically mark student attendance based on boarding/alighting.

**User Story**
As an admin, I need student attendance automatically marked from transportation boarding data so manual attendance entry is not needed.

**Acceptance Criteria**
- ✅ When student marked BOARDED on trip:
  - Check if student has class scheduled at trip end time
  - If yes: Call `attendanceModule.markPresent(studentId, classId, source: 'TRANSPORTATION')`
  - If no: Store boarding record, wait for manual confirmation or next day processing
  - Log integration event for audit trail
- ✅ When student marked ALIGHTED on trip:
  - Check if student has class scheduled at trip end time
  - If yes and boarded: Confirm attendance from boarding
  - If no: Mark as pickup completed (home drop-off)
- ✅ When student marked ABSENT on trip:
  - Call `attendanceModule.markAbsent(studentId, allClassesForDay, source: 'TRANSPORTATION')`
  - If transportation is primary attendance method, this counts
- ✅ Error handling:
  - If attendanceModule API fails: Log error, retry with exponential backoff
  - Timeout: 5 seconds (don't block boarding UI)
  - Graceful failure: Continue trip without attendance marking
- ✅ Attendance fields added:
  - StudentAttendance model: Add transportationStatus field (BOARDED, ALIGHTED, ABSENT, PENDING)
  - StudentAttendance model: Add transportationTripId reference
- ✅ Reporting:
  - Attendance report includes transportation data
  - Can filter by: Marked via Transportation, Manual Entry, Other
- ✅ Testing:
  - Mock attendance API calls
  - Test with different class schedules
  - Test retry logic on timeout

**Definition of Done**
- Student boarded, attendance marked in StudentAttendance
- Attendance report shows transportation source
- Failed API call triggers retry
- Timeout (5s) doesn't block boarding UI

---

### Story 3.4: Student Real-Time Status Updates
**Story ID:** T-3-4
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Story 3.2, 2.2

**Description**
Broadcast student boarding/alighting status updates to parents and admins in real-time.

**User Story**
As a parent, I need real-time notifications when my child boards and alights the bus so I know their transportation status.

**Acceptance Criteria**
- ✅ On student boarding confirmation:
  - Publish WebSocket event: `student-status-update`
  - Room: `trip:{tripId}` (for admin/driver)
  - Room: `student:{studentId}` (for parents of student, need to validate parent relationship)
  - Payload: { studentId, studentName, status: 'BOARDED', boardingTime, boardingStopName }
- ✅ On student alighting confirmation:
  - Same event structure with status: 'ALIGHTED', alightingTime, alightingStopName
- ✅ On student marked absent:
  - Same event structure with status: 'ABSENT', timestamp
- ✅ WebSocket room authorization for parent access:
  - Parent can subscribe to `student:{studentId}` room only if they are parent of student
  - Validate parent-student relationship before allowing subscription
  - Return error if not authorized
- ✅ Payload format:
  ```json
  {
    "studentId": "uuid",
    "studentName": "John Doe",
    "status": "BOARDED",
    "timestamp": "2025-01-15T08:30:00Z",
    "boardingTime": "2025-01-15T08:30:00Z",
    "boardingStopName": "School Gate",
    "latitude": 40.7128,
    "longitude": -74.0060
  }
  ```
- ✅ Broadcast on all rooms:
  - Admin sees all students across all trips
  - Driver sees students on their trip
  - Parent sees only their child
- ✅ Integration with notification module:
  - Also send push notification to parent: "John has boarded the bus"
  - SMS optional (configurable per parent)

**Definition of Done**
- Parent connected to WebSocket, receives boarding update in real-time
- Multiple parents see same update (no duplication)
- Authorization enforced (parent cannot see other child's updates)

---

### Story 3.5: Trip Completion & Report Generation
**Story ID:** T-3-5
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Story 3.1

**Description**
Generate trip reports with attendance summary and operational metrics.

**User Story**
As an admin, I need a trip summary report to review attendance, on-time performance, and route efficiency.

**Acceptance Criteria**
- ✅ GET /api/v1/transportation/trips/:id/report - Get trip completion report
  - Returns:
    ```json
    {
      "tripId": "uuid",
      "routeName": "Route 1",
      "date": "2025-01-15",
      "driverName": "John Smith",
      "vehicleRegNumber": "AB-1234",
      "startTime": "08:00:00",
      "completionTime": "08:45:00",
      "totalStudents": 25,
      "studentsBoarded": 24,
      "studentsAlighted": 24,
      "studentsAbsent": 1,
      "deviations": 0,
      "emergenciesTriggered": 0,
      "distanceCovered": "12.5 km",
      "averageSpeed": "25 km/h",
      "onTimePercentage": 96
    }
    ```
  - Status: 200 OK or 404
- ✅ Calculation logic:
  - totalStudents: Count of StudentRoute for this trip's route
  - studentsBoarded: Count of StudentTripRecord with boarded = true
  - studentsAlighted: Count of StudentTripRecord with alighted = true
  - studentsAbsent: Count of StudentTripRecord with absent = true
  - deviations: Count of RouteAdherence.deviationMeters > threshold
  - emergenciesTriggered: Count of emergency alerts for this trip
  - distanceCovered: Sum of distances between consecutive GPS points
  - averageSpeed: distanceCovered / (completionTime - startTime)
  - onTimePercentage: (Stops reached on time / Total stops) * 100
- ✅ POST /api/v1/transportation/trips/:id/mark-completed - Mark trip as COMPLETED
  - Auto-generate report
  - Auto-mark all non-boarded students as ABSENT
  - Update StudentAttendance for all students
  - Returns: Trip object with report
  - Status: 200 OK or 409 Conflict
- ✅ Report storage:
  - Store TripReport in database for historical queries
  - Create `TripReport` model: tripId, report JSON, createdAt
- ✅ GET /api/v1/transportation/routes/:routeId/daily-summary - Get summary for route
  - Date range filter
  - Returns: List of trip reports with on-time %, attendance %

**Definition of Done**
- Trip completion generates report with all fields
- Report stored in database
- Historical queries retrieve stored reports
- On-time percentage calculated correctly

---

## EPIC 4: Route Optimization & Planning

**Epic ID:** T-EPIC-004
**Priority:** MEDIUM
**Duration:** 1 week
**Story Points:** 20
**Status:** Ready for Sprint 4

### Epic Description
Implement route optimization algorithms and planning tools to help admins create efficient routes with minimal deviations.

---

### Story 4.1: Route Optimization Algorithm
**Story ID:** T-4-1
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** Epic 1

**Description**
Implement TSP (Traveling Salesman Problem) solver for route optimization.

**User Story**
As an admin, I need to optimize routes to minimize travel time and distance so we can improve fuel efficiency and on-time performance.

**Acceptance Criteria**
- ✅ POST /api/v1/transportation/routes/:id/optimize - Optimize route stop sequence
  - Query params: algorithm (nearest-neighbor|genetic|ant-colony)
  - Validation: Route exists, has at least 3 stops
  - Algorithm: Nearest Neighbor (default, fast)
    - Start at first stop (school)
    - For each remaining stop, visit nearest unvisited stop
    - Return to first stop
    - O(n²) complexity, fast for <50 stops
  - Returns:
    ```json
    {
      "originalDistance": 15.5,
      "optimizedDistance": 12.3,
      "improvement": 20.6,
      "newSequence": [
        { "stopId": "uuid1", "sequence": 0, "name": "School" },
        { "stopId": "uuid2", "sequence": 1, "name": "Park A" },
        ...
      ]
    }
    ```
  - Status: 200 OK
- ✅ Constraints:
  - Cannot change first/last stop (school)
  - Minimum stops per route: 3
  - Maximum stops per route: 50
- ✅ Implementation:
  - Create `RouteOptimization` service with methods:
    - `calculateDistance(lat1, lon1, lat2, lon2)` → meters (Haversine)
    - `generateAllPermutations(stops)` → array of sequences
    - `calculateTotalDistance(sequence)` → meters
    - `optimizeNearestNeighbor(stops)` → optimized sequence
- ✅ Performance:
  - 20 stops: < 100ms
  - 50 stops: < 500ms
  - Larger: Return error "Too many stops for optimization"
- ✅ Does NOT automatically apply:
  - User must review and confirm before RouteStop sequence updates
  - Implement dry-run test in Story 4.2

**Definition of Done**
- 10-stop route optimized, distance reduction shown
- Performance tested (20 and 50 stops)
- Haversine distance calculation verified

---

### Story 4.2: Route Optimization UI & Approval
**Story ID:** T-4-2
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Story 4.1

**Description**
Build UI for route optimization with map preview and approval workflow.

**User Story**
As an admin, I need to see the optimized route on a map and approve the changes before applying them.

**Acceptance Criteria**
- ✅ Route editor page enhancement:
  - Add "Optimize Route" button
  - On click: Show loading spinner, call optimization API
  - Display results:
    - Original total distance
    - Optimized total distance
    - Percentage improvement
  - Show two maps side-by-side:
    - Left: Original route with current sequence
    - Right: Optimized route with new sequence
  - Highlight stops with numbers showing new sequence
- ✅ Approval workflow:
  - Admin reviews maps
  - Can click "Apply Optimization" button
  - Confirmation dialog: "Are you sure? This will change the stop sequence for all future trips."
  - On confirm: Update RouteStop sequence in database
  - Success message: "Route optimized successfully"
- ✅ Alternative workflows:
  - Manual drag-drop reordering still available (Story 1.4)
  - Can edit individual stop sequence without optimization
  - Optimization is optional, not mandatory
- ✅ Undo capability:
  - Store previous sequence in RouteChangeHistory table
  - Add "Undo Last Change" button (works for 1 hour)
  - Returns sequence to previous version

**Definition of Done**
- UI component created and styled with Tailwind
- Maps load without errors
- Optimization apply workflow tested end-to-end
- Undo tested (can revert changes)

---

### Story 4.3: ETA Calculation & Display
**Story ID:** T-4-3
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Epic 2, 3.1

**Description**
Calculate and display ETAs for stops and final destination.

**User Story**
As a parent, I need to see when the bus will arrive at my child's stop so I can plan when to go outside.

**Acceptance Criteria**
- ✅ ETA calculation service:
  - Create `ETA` service with method: `calculateETA(tripId) → { stopId, eta, distanceRemaining, timeRemaining }`
  - Input: Current vehicle location, route stops, current speed
  - Algorithm:
    - Current speed: Calculate from last 5 GPS points (km/h)
    - Distance to next stop: Haversine distance
    - ETA = now + (distance / currentSpeed)
    - Account for wait time at stops (from RouteStop.waitTimeMinutes)
  - Return array of { stopId, stopName, eta, distanceRemaining }
  - Sorted by sequence
- ✅ Real-time ETA updates:
  - Recalculate ETA on every GPS update (Story 2.1)
  - Publish `eta-update` WebSocket event to `vehicle:{vehicleId}` room
  - Payload: { vehicleId, etas: [...] }
  - Throttle: Maximum 1 update per 10 seconds (reduce WebSocket load)
- ✅ Persistence:
  - Store calculated ETA in Redis: `transport:eta:{vehicleId}` (TTL 60s)
  - GET /api/v1/transportation/vehicles/:id/eta - Get current ETAs
    - Returns: { vehicleId, currentLocation, etas: [{stopId, stopName, eta, distanceRemaining}] }
    - Status: 200 OK
- ✅ Accuracy targets:
  - <5 km distances: ±2 minutes accuracy
  - 5-20 km: ±5 minutes accuracy
  - >20 km: ±10 minutes accuracy
- ✅ Display in parent app:
  - Show ETA for next stop in bold
  - Show distance remaining
  - Countdown timer (updates every 10 seconds)
  - Example: "Arriving in 12 minutes • 4.5 km away"

**Definition of Done**
- ETA calculated for test trip
- Accuracy tested against actual arrival times
- Real-time updates received on client
- Displayed correctly in parent app UI

---

### Story 4.4: Route Conflict Detection & Resolution
**Story ID:** T-4-4
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Epic 1

**Description**
Detect overlapping routes and vehicle conflicts to prevent scheduling issues.

**User Story**
As an admin, I need to detect if two routes are scheduled at the same time using the same vehicle so I can fix scheduling conflicts.

**Acceptance Criteria**
- ✅ Conflict detection API:
  - POST /api/v1/transportation/routes/:id/validate - Check route for conflicts
  - Returns: { conflicts: [], warnings: [] }
  - Conflict: Same vehicle assigned to two routes at overlapping times
    - Message: "Vehicle AB-1234 is assigned to Route A (8:00-8:45) and Route B (8:30-9:00)"
    - Severity: ERROR (prevents trip creation)
  - Conflict: Same driver assigned to overlapping routes
    - Severity: ERROR
  - Warning: Driver without vehicle assignment
    - Severity: WARNING (allows trip but alerts admin)
  - Warning: Route missing stops
    - Severity: WARNING
- ✅ Auto-detection on route creation:
  - After Story 1.4 (route created), automatically run validation
  - If conflicts found: Return 400 Bad Request with conflict details
  - User must resolve before route is created
- ✅ Conflict resolution UI:
  - Show list of conflicts
  - Suggest alternatives:
    - Use different vehicle
    - Use different driver
    - Reschedule route
    - Add another vehicle
  - Admin selects resolution and retries route creation
- ✅ Multi-route planning:
  - GET /api/v1/transportation/routes/check-bulk-schedule - Check multiple routes at once
  - Body: { routeIds: [...] }
  - Returns: All conflicts across routes, suggestions

**Definition of Done**
- Create conflicting routes, validation catches error
- Error message clear and actionable
- Suggestions help admin resolve quickly

---

## EPIC 5: Mobile App - Driver Interface

**Epic ID:** T-EPIC-005
**Priority:** HIGH
**Duration:** 1 week
**Story Points:** 28
**Status:** Ready for Sprint 5

### Epic Description
Build React Native mobile app for drivers with background GPS tracking, trip management, student checklist, and offline support.

---

### Story 5.1: Driver App Setup & Navigation
**Story ID:** T-5-1
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** None (Mobile foundation)

**Description**
Create mobile app project structure with navigation, authentication, and core screens.

**User Story**
As a driver, I need a mobile app to manage my trips and track GPS so I can efficiently execute transport routes.

**Acceptance Criteria**
- ✅ Project setup:
  - Create React Native project with Expo
  - Directory: `mobile/driver-app/`
  - Install dependencies: react-native, expo, expo-location, @react-navigation/native, socket.io-client
- ✅ Navigation structure:
  - Bottom tab navigator: Home, Active Trip, Trip History, Profile
  - Stack navigator within each tab
  - Proper back button handling
- ✅ Screens created (empty placeholders):
  - LoginScreen - Form with email/password
  - HomeScreen - Dashboard showing today's routes
  - ActiveTripScreen - Current trip details (Story 5.2)
  - TripHistoryScreen - Past trips list
  - ProfileScreen - Driver info, settings
- ✅ Authentication:
  - Login: POST /api/v1/auth/login with driver credentials
  - Token storage: Encrypted AsyncStorage
  - Token refresh: Automatic on app launch
  - Logout: Clear token and navigate to login
  - Deep link: Auto-navigate to trip if app opened while on trip
- ✅ Styling:
  - Use React Native Paper for UI components
  - Color scheme: Consistent with school branding
  - Dark mode support
- ✅ Error handling:
  - Network errors: Retry logic with exponential backoff
  - Session timeout: Auto-logout, redirect to login
  - API errors: Display user-friendly error messages

**Definition of Done**
- App builds and runs on iOS and Android simulator
- Navigation works (tabs switch, stacks push/pop)
- Login/logout flow works
- API calls use stored token

---

### Story 5.2: Active Trip Management UI
**Story ID:** T-5-2
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** Story 5.1, Epic 3.1

**Description**
Build UI for drivers to view and manage their active trip.

**User Story**
As a driver, I need to see my route, student list, and manage boarding/alighting so I can efficiently execute the trip.

**Acceptance Criteria**
- ✅ ActiveTripScreen layout:
  - Header: Route name, start/end time, vehicle info
  - Map view (40% height): Shows current location, route, next stops
  - Student list (60% height): Scrollable list of students
  - Action buttons at bottom: Mark Boarded, Mark Alighted, Emergency Alert
- ✅ Map features:
  - Center on current vehicle location
  - Show route as polyline
  - Show upcoming stops as markers
  - Show current stop as highlighted marker
  - Auto-center on vehicle as it moves
  - Can tap marker to zoom in
- ✅ Student list items show:
  - Student name with profile photo
  - Expected boarding/alighting stop and time
  - Current status: PENDING, BOARDED, ALIGHTED, ABSENT
  - Color coding: Green (boarded), Red (absent), Gray (pending), Blue (alighted)
  - Swipe actions: Mark Boarded (if pending), Mark Alighted (if boarded), Mark Absent
- ✅ Mark Boarded flow:
  - Tap student or swipe right
  - Show camera permission request (first time)
  - Capture photo (optional)
  - Submit boarding: POST /api/v1/transportation/trips/:tripId/student-boarding
  - Show success toast: "John marked boarded"
  - Update UI: Student moves to boarded section, changes color to green
- ✅ Mark Alighted flow:
  - Similar to boarding
  - Only available if already boarded
  - Submit: POST /api/v1/transportation/trips/:tripId/student-alighting
- ✅ Mark Absent flow:
  - Swipe left or tap menu
  - Show confirmation: "Mark John as absent?"
  - Submit: POST /api/v1/transportation/trips/:tripId/mark-absent
  - Update UI: Student color changes to red
- ✅ Trip controls:
  - Start Trip button (SCHEDULED → IN_PROGRESS): PUT /api/v1/transportation/trips/:id/status
  - Complete Trip button (IN_PROGRESS → COMPLETED): Same endpoint, auto-marks remaining students as absent
  - Pause/Resume for breaks
- ✅ Real-time updates:
  - If admin modifies student list in web app, driver app updates (WebSocket listener)
  - If new student added to route, appears in list

**Definition of Done**
- Trip screen loads and shows student list
- Boarding photo capture works
- Student status updates in real-time
- Start/Complete Trip buttons work

---

### Story 5.3: Background GPS Tracking
**Story ID:** T-5-3
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** Story 5.1, Epic 2.1

**Description**
Implement background GPS tracking that continues even when app is closed.

**User Story**
As a system, I need continuous GPS tracking throughout the trip so parents always see accurate vehicle location even if the driver app is backgrounded.

**Acceptance Criteria**
- ✅ GPS service setup:
  - Use expo-location for foreground GPS
  - Use TaskManager for background GPS (Android)
  - iOS: Use background app refresh capability
- ✅ Permission requests:
  - Location: "Always" permission (required for background tracking)
  - Show explanation: "We need your location to track the vehicle in real-time"
  - Request on first app launch
  - If denied: Show warning, ask to enable in settings
- ✅ GPS collection:
  - Accuracy: Best (HIGHEST_ACCURACY)
  - Distance filter: 50 meters (update if moved 50m)
  - Time interval: 15 seconds minimum
  - Battery efficiency: Stop background tracking if vehicle parked > 1 hour
- ✅ Data submission:
  - On each GPS update: POST /api/v1/transportation/location
  - Payload: { vehicleId, latitude, longitude, accuracy, timestamp }
  - Use token from AsyncStorage
  - Implement queue for offline (see Story 5.4)
- ✅ Battery optimization:
  - Show battery usage estimate in app settings
  - Option to reduce update frequency (30s, 60s)
  - Stop tracking during driver break (add pause button)
- ✅ Status indicator:
  - Header shows "GPS: ON" (green) or "GPS: OFF" (red)
  - Shows number of GPS points sent today
  - Shows last GPS update timestamp
- ✅ Error handling:
  - GPS permission denied: Show banner, don't crash
  - Location unavailable (indoors): Show warning, continue with last known location
  - Network error: Queue for offline sync

**Definition of Done**
- App running in background, GPS location submitted every 15 seconds
- Location visible on admin dashboard
- Battery impact acceptable (<5% per hour)
- Permission requests working on iOS and Android

---

### Story 5.4: Offline Support & Sync Queue
**Story ID:** T-5-4
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** Story 5.2, 5.3

**Description**
Implement offline queue for GPS updates and API calls with conflict-free sync on reconnect.

**User Story**
As a driver, I need the app to work without network so I can continue tracking and recording student boarding even in dead zones.

**Acceptance Criteria**
- ✅ Offline data storage:
  - Use SQLite (expo-sqlite) for local database
  - Create tables: gps_queue, boarding_queue, settings
- ✅ GPS queue (offline):
  - When online: POST GPS directly to API
  - When offline: Store in SQLite: { vehicleId, latitude, longitude, accuracy, timestamp, synced=false }
  - Resume sending on reconnect
  - Keep queue for 24 hours (prevent stale data)
- ✅ Boarding/Alighting queue:
  - When online: POST student-boarding directly
  - When offline: Store in SQLite: { tripId, studentId, action (boarding|alighting|absent), timestamp, synced=false }
  - Resume on reconnect
- ✅ Sync on reconnect:
  - Detect network change (NetInfo library)
  - On reconnect: Start sync process
  - Batch: Send up to 100 GPS points in single request (POST /batch)
  - For boarding: Send individually (order matters)
  - Mark as synced=true after successful response
  - Retry failed requests (exponential backoff)
- ✅ Conflict resolution:
  - GPS points: No conflicts (idempotent, timestamped)
  - Boarding: If student already marked boarded online, skip duplicate
    - Check timestamp: Use whichever is earlier as actual boarding time
  - Display: Show sync status in UI
    - "Syncing X items..." while sync in progress
    - "All synced" when complete
    - Error banner if sync fails
- ✅ Data consistency:
  - If offline for > 8 hours, show warning: "You're offline. Some changes may not sync."
  - When online again: Force full state sync from server
  - Validate trip still in progress (admin might have ended it)

**Definition of Done**
- GPS updates queued when offline
- Student boarding logged locally, syncs when online
- No duplicate entries after sync
- UI shows sync status accurately

---

### Story 5.5: Emergency Alert Button
**Story ID:** T-5-5
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Story 5.2

**Description**
Implement emergency alert button for driver to trigger incident alerts.

**User Story**
As a driver, I need to quickly alert the school and police of an emergency situation so authorities respond quickly.

**Acceptance Criteria**
- ✅ Emergency button placement:
  - Bold red button (prominent) in ActiveTripScreen
  - Accessible from trip details header
  - Text: "🚨 Emergency Alert"
- ✅ Trigger flow:
  - On click: Show confirmation dialog: "Report emergency? This will alert the school, parents, and police."
  - Two buttons: "Cancel", "Confirm Emergency"
  - On confirm: POST /api/v1/transportation/emergencies
    - Body: { tripId, vehicleId, driverId, latitude, longitude, timestamp }
    - Message: "Emergency reported"
- ✅ Alert broadcast:
  - Server publishes emergency event to WebSocket: `school:{schoolId}`
  - Event: `emergency-alert` with alert details
  - Admins receive alert on dashboard (Epic 7)
  - Parents of students on trip receive notification (Epic 9)
  - Police can be called separately (out of scope, manual process)
- ✅ Escalation:
  - If no response from admin in 2 minutes: Automatically escalate (future feature)
- ✅ After alert:
  - Driver sees: "Emergency alert sent at HH:MM"
  - Button changes to "Cancel Emergency"
  - Canceling: POST /api/v1/transportation/emergencies/:id/cancel
- ✅ Limitations:
  - Can only trigger once per trip
  - Cannot trigger while offline (message: "Not connected. Check your internet.")

**Definition of Done**
- Emergency button visible on active trip screen
- Confirmation dialog shows
- Alert event received on admin dashboard
- Notification sent to parents

---

## EPIC 6: Mobile App - Parent Interface

**Epic ID:** T-EPIC-006
**Priority:** HIGH
**Duration:** 1 week
**Story Points:** 21
**Status:** Ready for Sprint 6

### Epic Description
Build React Native mobile app for parents to track their child's bus in real-time with notifications and trip history.

---

### Story 6.1: Parent App Setup & Navigation
**Story ID:** T-6-1
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** None (Mobile foundation)

**Description**
Create parent mobile app with authentication and core navigation.

**User Story**
As a parent, I need a mobile app to track my child's bus location so I know when to pick them up.

**Acceptance Criteria**
- ✅ Project setup:
  - Create React Native project with Expo
  - Directory: `mobile/parent-app/`
  - Install dependencies: react-native, expo, expo-location (for permissions), @react-navigation/native, socket.io-client, react-native-maps
- ✅ Navigation:
  - Tab navigator: Active Trip, Trip History, Settings
  - Stack navigators within tabs
  - Parent authentication flow
- ✅ Screens:
  - LoginScreen - Email/password login
  - ChildSelectionScreen - If parent has multiple children, select which child's trip to track
  - ActiveTripScreen - Live tracking map (Story 6.2)
  - TripHistoryScreen - Past trips with search/filter
  - SettingsScreen - Notifications, privacy, logout
- ✅ Authentication:
  - Parent login: POST /api/v1/auth/login with parent email/password
  - Multi-child support: GET /api/v1/students/my-children (list of children)
  - Select child: Store in AsyncStorage
  - Load child's current/next trip: GET /api/v1/transportation/children/:id/current-trip
- ✅ Deep linking:
  - When notification received, deep link to tracking screen
- ✅ Offline fallback:
  - Show last known trip status if offline
  - Show cached route and stops

**Definition of Done**
- App builds and runs
- Login works
- Child selection shows children
- Navigation between tabs works

---

### Story 6.2: Real-Time Vehicle Tracking Map
**Story ID:** T-6-2
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** Story 6.1, Epic 2.2

**Description**
Build live tracking map showing vehicle location, route, stops, and ETA.

**User Story**
As a parent, I need to see my child's bus location on a map in real-time so I know how far away it is.

**Acceptance Criteria**
- ✅ Map component:
  - Use react-native-maps (Google Maps on Android, Apple Maps on iOS)
  - Center on child's bus location
  - Follow vehicle as it moves (auto-pan)
  - Show route as polyline (gray)
  - Show route stops as markers (blue for upcoming, green for completed)
  - Show bus vehicle as custom marker (bus icon)
  - Show pickup/drop stop as highlighted marker (red)
  - Allow manual pan/zoom
- ✅ WebSocket connection:
  - Connect to Socket.IO on app launch (Story 6.1)
  - Subscribe to vehicle: `subscribe-vehicle` event with vehicleId
  - Listen for location updates: `location-update` event
  - Update map marker position in real-time
  - Handle disconnections gracefully (show "Updating..." spinner)
- ✅ ETA display:
  - Show large ETA text: "Arriving in 12 minutes"
  - Below: "4.5 km away"
  - Countdown timer: Updates every 10 seconds
  - Show next stop name
  - Color coding: Green (< 5 min), Yellow (5-15 min), Red (> 15 min)
- ✅ Trip details panel:
  - Slide-up bottom sheet showing:
    - Route name
    - Expected arrival time
    - Current distance to stop
    - Driver name
    - Vehicle number
    - Current bus location (lat/long)
  - Swipe down to minimize to small card
- ✅ Trip phases:
  - Phase 1: Waiting for bus (trip SCHEDULED, vehicle not yet on route)
    - Show: "Bus not yet en route. Estimated departure at 08:00"
  - Phase 2: Bus en route (trip IN_PROGRESS)
    - Show: Live map, ETA countdown
  - Phase 3: Child alighted (student marked ALIGHTED)
    - Show: "John has alighted. Safe drop-off confirmed"
  - Phase 4: Trip completed
    - Show: "Trip completed" with trip summary
- ✅ Refresh & manual update:
  - Pull-to-refresh: Forces API call to get latest location
  - Auto-refresh: Every 10 seconds via WebSocket
- ✅ Permissions:
  - Maps don't need location permission (parent location not tracked)
  - But may request for future "I'm home" feature

**Definition of Done**
- Map loads and centers on bus
- Vehicle marker updates in real-time
- ETA displays and counts down
- Trip phases show appropriate UI

---

### Story 6.3: Trip History & Search
**Story ID:** T-6-3
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Story 6.1

**Description**
Build trip history screen with search and filtering.

**User Story**
As a parent, I need to see past trips so I can verify attendance and check pickup/drop-off times.

**Acceptance Criteria**
- ✅ TripHistoryScreen:
  - GET /api/v1/students/:studentId/trips - Fetch past 30 days trips
  - Default sort: Date DESC (newest first)
  - Load more: Pagination, load 20 trips at a time
- ✅ Trip card format:
  - Date: "15 Jan 2025, Wednesday"
  - Route name
  - Boarding time: "08:15 AM" (actual)
  - Drop time: "08:45 AM" (actual)
  - Status badge: Green (completed), Gray (cancelled)
  - Tap to see details
- ✅ Filters:
  - Date range picker: Select from/to date
  - Route filter: Dropdown list of routes
  - Status filter: All, Completed, Cancelled
  - Apply filters: Refetch data with query params
- ✅ Search:
  - Search by route name
  - Real-time filter as user types
- ✅ Trip detail modal:
  - Show trip details: Route, boarding time, drop time, vehicle, driver
  - Show on map: Route and stops (read-only)
  - Show attendance: Confirm child boarded and alighted with times
  - Share button: Can share trip summary (future feature)

**Definition of Done**
- History list loads past trips
- Filters work (date, route, status)
- Trip details modal shows all info
- Pagination loads more trips when scrolling

---

### Story 6.4: Notifications & Push Alerts
**Story ID:** T-6-4
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Story 6.2, Epic 9

**Description**
Implement push notifications for trip events and alerts.

**User Story**
As a parent, I need to receive notifications about my child's trip so I don't have to constantly check the app.

**Acceptance Criteria**
- ✅ Notification setup:
  - Use expo-notifications or Firebase Cloud Messaging
  - Request notification permission on app launch
  - Implement notification handler to navigate to tracking screen when tapped
- ✅ Notification types:
  - Bus departed: "Your child's bus has departed from school"
    - Trigger: Trip status changes to IN_PROGRESS
  - Child boarded: "John has boarded the bus"
    - Trigger: Student marked BOARDED (Story 3.2)
  - Arriving soon: "Bus arriving in 10 minutes at your stop"
    - Trigger: ETA < 10 minutes
  - Arriving now: "Bus arriving now"
    - Trigger: ETA < 2 minutes
  - Child alighted: "John has safely alighted the bus"
    - Trigger: Student marked ALIGHTED
  - Emergency alert: "Emergency alert from bus. Contact school."
    - Trigger: Driver triggers emergency (Story 5.5)
- ✅ Notification settings:
  - Settings screen: Toggle each notification type on/off
  - Quiet hours: Set time range (e.g., 10 PM - 6 AM) when notifications disabled
  - Sound: Default, None, Custom
  - Vibration: On/Off
- ✅ Storage:
  - Save preferences in AsyncStorage
  - Send preferences to server on login
  - Server respects preferences (don't send disabled notifications)
- ✅ In-app indicators:
  - Badge count on app icon (1 if new notification)
  - Clear badge when user opens app
- ✅ Error handling:
  - If push notification service unavailable: Fall back to in-app banner
  - If token invalid: Request new token

**Definition of Done**
- Notification received when trip event occurs
- Settings control notification types
- Deep link works (opens tracking screen when notification tapped)
- Badge count accurate

---

## EPIC 7: Admin Dashboard - Web

**Epic ID:** T-EPIC-007
**Priority:** HIGH
**Duration:** 1 week
**Story Points:** 24
**Status:** Ready for Sprint 7

### Epic Description
Build web-based admin dashboard for live fleet management, reporting, and control.

---

### Story 7.1: Dashboard Layout & Navigation
**Story ID:** T-7-1
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** None (Web foundation)

**Description**
Create transportation admin dashboard with navigation and layout.

**User Story**
As an admin, I need a dashboard to manage the transportation system so I can oversee all operations in one place.

**Acceptance Criteria**
- ✅ Page structure:
  - Path: `/dashboard/transportation/`
  - Sidebar menu items:
    - Dashboard (home)
    - Live Tracking (map view)
    - Fleet Management (vehicles list)
    - Drivers (drivers list)
    - Routes (routes list)
    - Trips (today's trips)
    - Reports (analytics)
    - Emergency Console (alerts)
    - Settings
  - Top navigation: School selector, user profile, logout
- ✅ Dashboard home page:
  - KPIs in cards at top:
    - Active Vehicles: 12
    - On-Time Trips: 18/20 (90%)
    - Students On-Board: 185/245 (75%)
    - Alerts: 1 (badge count)
  - Charts:
    - Fleet utilization (pie: used vs idle)
    - Trip on-time percentage (trend line)
    - Route efficiency (bar chart: km per hour)
  - Recent alerts list
  - Today's trip summary
- ✅ Responsive design:
  - Desktop: Sidebar on left, content on right
  - Tablet: Collapsed sidebar, full content
  - Mobile: Hamburger menu
- ✅ Dark mode:
  - Toggle in settings
  - Persist in localStorage
- ✅ Real-time updates:
  - Auto-refresh dashboard KPIs every 30 seconds
  - Show "Last updated: X seconds ago"

**Definition of Done**
- Dashboard renders without errors
- Sidebar navigation works
- KPI cards display sample data
- Responsive design tested on desktop and mobile

---

### Story 7.2: Live Fleet Tracking Map
**Story ID:** T-7-2
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** Story 7.1, Epic 2.2

**Description**
Build live tracking map showing all vehicles on a map with real-time updates.

**User Story**
As an admin, I need to see all vehicles on a map so I can monitor fleet location and detect issues in real-time.

**Acceptance Criteria**
- ✅ Map component:
  - Use Leaflet.js (free, no API key required)
  - Show entire region/country initially
  - Vehicle markers on map:
    - Icon: Bus/vehicle icon colored by status
    - Label: Vehicle number (registration)
    - Clickable: Show vehicle details popup
  - Route lines: Show active routes as polylines
  - Stop markers: Small blue circles for each stop
  - Popup shows:
    - Vehicle number, status, driver name
    - Current location
    - Trip details (route, student count)
    - Actions: View trip, Emergency alert
- ✅ Real-time updates via WebSocket:
  - Connect to Socket.IO on page load
  - Subscribe to `school:{schoolId}` room
  - Listen for `location-update` events
  - Update vehicle markers in real-time without page refresh
  - Handle vehicle appearance/disappearance (new trips, trip completion)
- ✅ Filtering:
  - Filter by vehicle status: All, Active, Maintenance, Out of Service
  - Filter by route: Dropdown list
  - Zoom to filtered area
  - Search by vehicle number: Type and filter
- ✅ Heatmap (optional):
  - Show traffic density as color intensity
  - High density (red): Many vehicles in area
  - Low density (green): Few vehicles
- ✅ Trip animation (stretch goal):
  - Can replay a completed trip (vehicle trace on map)
  - Animation shows vehicle movement with time compression
  - Shows stops along the way

**Definition of Done**
- Map renders with vehicle markers
- Real-time updates work (vehicle moves on map)
- Filters work correctly
- Popup shows vehicle/trip details

---

### Story 7.3: Fleet Management CRUD UI
**Story ID:** T-7-3
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** Story 7.1, Epic 1.2

**Description**
Build UI for CRUD operations on vehicles.

**User Story**
As an admin, I need to manage vehicles (add, edit, delete) in the web dashboard so I can maintain the fleet.

**Acceptance Criteria**
- ✅ Vehicle list page:
  - Table with columns: Registration #, Type, Capacity, Status, Driver, Current Location, Actions
  - Sorting: Click column header to sort (asc/desc)
  - Filtering: Type dropdown, Status dropdown
  - Search: Registration # search box
  - Pagination: 20 vehicles per page
  - Edit icon: Opens edit modal
  - Delete icon: Opens confirmation, soft-deletes vehicle
  - Bulk actions: Select multiple vehicles, bulk delete/status change
- ✅ Add vehicle modal:
  - Form fields:
    - Registration number (required, validation: unique)
    - Type: Dropdown (BUS, VAN, CAR, AUTO, TEMPO)
    - Capacity: Number input (1-100)
    - GPS device ID: Text input (optional)
    - Purchase date: Date picker
  - Buttons: Save, Cancel
  - On save: POST /api/v1/transportation/vehicles
  - Success message: "Vehicle added successfully"
  - Validation errors: Show inline messages
- ✅ Edit vehicle modal:
  - Pre-fill form with vehicle data
  - Disable registration # (cannot change)
  - On save: PUT /api/v1/transportation/vehicles/:id
  - Show modified date/time
- ✅ Vehicle detail page:
  - View-only card showing full vehicle info
  - Maintenance history table: Date, Type, Status, Cost
  - Assignment history table: Driver, Vehicle, Date range
  - Add maintenance button: Opens form
  - Delete vehicle button: Soft delete (mark RETIRED)
- ✅ Responsive: Works on desktop and tablet

**Definition of Done**
- Vehicle list loads and displays
- Can add/edit/delete vehicle through UI
- Validation shows errors
- Delete confirmation prevents accidental deletion

---

### Story 7.4: Driver Management CRUD UI
**Story ID:** T-7-4
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Story 7.1, Epic 1.3

**Description**
Build UI for driver management (add, edit, assign vehicles).

**User Story**
As an admin, I need to manage drivers and their vehicle assignments in the dashboard.

**Acceptance Criteria**
- ✅ Driver list page:
  - Table: Name, License #, Phone, Status, Assigned Vehicle, Actions
  - Filter by status: All, Active, On Leave, Suspended, Resigned
  - Search by name or license
  - Pagination
- ✅ Add driver modal:
  - Fields: User (select from existing users), License #, License Expiry, Phone
  - Validation: License # unique, expiry > today
  - On save: POST /api/v1/transportation/drivers
- ✅ Edit driver modal:
  - Edit license, expiry, phone, status
  - PUT endpoint
- ✅ Assign vehicle button:
  - Modal: Select vehicle (dropdown), effective date range
  - POST /api/v1/transportation/drivers/:id/assign-vehicle
  - Show current assignment with end date
  - Can unassign: Soft delete (end date = today)
- ✅ Driver detail page:
  - Full driver info
  - Current vehicle assignment
  - Past assignments table
  - Trip history (last 10 trips)
  - Performance stats: Adherence %, on-time %

**Definition of Done**
- Driver list loads
- Can add/edit driver
- Vehicle assignment works
- Detail page shows full info

---

### Story 7.5: Route Management & Editor
**Story ID:** T-7-5
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Story 7.1, Epic 1.4

**Description**
Build UI for route management and stop sequencing editor.

**User Story**
As an admin, I need to create and edit routes with stops in the dashboard so I can design efficient transport routes.

**Acceptance Criteria**
- ✅ Route list page:
  - Table: Name, Status, Stops, Vehicles, Students, Actions
  - Filter by status
  - Search by name
- ✅ Add route modal:
  - Fields: Name, Start time (time picker), End time, Description
  - Validation: Start < End
  - POST /api/v1/transportation/routes
- ✅ Route editor page:
  - Two-pane layout:
    - Left: Route map (Leaflet)
    - Right: Stops list (sortable)
  - Map shows: Route stops as numbered markers
  - Stops list shows:
    - Stop name, location, wait time
    - Drag to reorder (updates sequence)
    - Delete button (removes stop)
    - Edit button (updates stop)
  - Add stop button:
    - Search/select from existing stops
    - Set wait time
    - POST /api/v1/transportation/routes/:id/stops
  - Assign vehicle dropdown
  - Assign driver dropdown
  - Optimize route button (Story 4.2)
  - Save button: Saves all changes
- ✅ Stop editor:
  - Modal with: Name, Latitude, Longitude, Type (Pickup/Drop/Both)
  - Show address (reverse geocoding from lat/long)
  - PUT /api/v1/transportation/routes/:id/stops/:stopId

**Definition of Done**
- Route list loads
- Can create route
- Route editor loads with stops
- Drag-drop reordering works
- Can add/remove stops

---

### Story 7.6: Emergency Console & Alert Management
**Story ID:** T-7-6
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Story 7.1, Story 5.5

**Description**
Build emergency alert console for monitoring and responding to incidents.

**User Story**
As an admin, I need to monitor emergency alerts and respond quickly so I can manage critical incidents.

**Acceptance Criteria**
- ✅ Emergency console page:
  - Large alert banner if active emergency:
    - Vehicle: AB-1234, Route: Route 1, Driver: John Smith
    - Alert time: 14:32
    - Status: ACTIVE
    - Location map: Show vehicle location
    - Actions: Acknowledge, Call emergency services, Cancel emergency
  - Historical alerts list:
    - Table with: Time, Vehicle, Route, Driver, Status (ACTIVE, ACKNOWLEDGED, RESOLVED, CANCELLED)
    - Filter by status, date range
- ✅ Alert received via WebSocket:
  - Listen for `emergency-alert` event on `school:{schoolId}` room
  - Show notification: Red banner or pop-up
  - Sound alert (configurable)
  - Desktop notification (browser)
- ✅ Acknowledge flow:
  - Click "Acknowledge" button
  - Updates alert status to ACKNOWLEDGED
  - Saves timestamp and admin name
  - Notification stays but color changes
- ✅ Emergency services:
  - "Call 911" button: Opens phone dial (if on mobile) or shows number to call
  - Can manually record: "Called 911 at 14:35"
- ✅ Cancel emergency:
  - "Cancel Emergency" button (only driver can cancel, or after manual confirmation)
  - Confirmation dialog: "Cancel emergency? This is irreversible."
  - Updates status to CANCELLED

**Definition of Done**
- Emergency alert received and displayed
- Acknowledge button works
- Historical alerts show in list
- Color/visual indicators show alert status

---

## EPIC 8: Safety & Compliance

**Epic ID:** T-EPIC-008
**Priority:** HIGH
**Duration:** 1 week
**Story Points:** 18
**Status:** Ready for Sprint 8

### Epic Description
Implement safety features including emergency alerts, geofencing, route compliance monitoring, and maintenance tracking.

---

### Story 8.1: Maintenance Tracking & Alerts
**Story ID:** T-8-1
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Epic 1.2

**Description**
Build maintenance log tracking and expiry alerts for vehicle maintenance.

**User Story**
As an admin, I need to track vehicle maintenance and get alerts when maintenance is due so I can ensure vehicle safety.

**Acceptance Criteria**
- ✅ Maintenance log API:
  - POST /api/v1/transportation/vehicles/:id/maintenance - Log maintenance
    - Fields: maintenanceType (enum), date, status, notes, cost
    - POST creates VehicleMaintenanceLog record
  - GET /api/v1/transportation/vehicles/:id/maintenance-history - Get logs
    - Returns: Paginated list sorted by date DESC
- ✅ Maintenance types & intervals:
  - Oil change: Every 5,000 km or 3 months
  - Tire rotation: Every 10,000 km or 6 months
  - Inspection: Every 6 months
  - Repair: As needed
  - Accident: Requires urgent inspection
- ✅ Alert logic:
  - Track: Last maintenance date for each type
  - Calculate: Days since last / km since last
  - Alert if: X days overdue or Y km overdue
  - Thresholds (configurable):
    - Oil change: 150 days or 5,500 km
    - Tire rotation: 220 days or 11,000 km
    - Inspection: 190 days
- ✅ Dashboard alerts:
  - Show overdue maintenance in red banner
  - Include in daily report: "2 vehicles overdue for maintenance"
  - Send email to admin weekly
- ✅ Maintenance queue:
  - Admin can mark vehicle "In Maintenance" (status = MAINTENANCE)
  - Cannot assign trip while in maintenance
  - Alert: "Cannot start trip. Vehicle in maintenance."
- ✅ Compliance report:
  - GET /api/v1/transportation/reports/maintenance-compliance
  - Date range: Last 90 days
  - Returns: Vehicles with overdue maintenance
  - CSV export available

**Definition of Done**
- Maintenance logged for vehicle
- Overdue maintenance alert shows
- Vehicle cannot be assigned trip while in maintenance
- Compliance report generated

---

### Story 8.2: Driver License Expiry Monitoring
**Story ID:** T-8-2
**Points:** 3
**Assignee:** Amelia (Developer)
**Dependencies:** Epic 1.3

**Description**
Monitor and alert on driver license expiry dates.

**User Story**
As an admin, I need to be alerted when driver licenses are about to expire so I can ensure only qualified drivers operate vehicles.

**Acceptance Criteria**
- ✅ Alert logic:
  - Check driver.licenseExpiry on every trip creation
  - If expiry < 30 days away: Yellow warning
  - If expiry < today: Red error, prevent trip assignment
  - Message: "Driver license expires on 30 Jan 2026. Renew now."
- ✅ Dashboard alert:
  - Show drivers with expiring licenses (< 30 days)
  - Button to contact driver / send reminder
- ✅ Scheduled job:
  - Daily task (3 AM): Check all drivers, send email alerts
  - Subject: "License expiry reminder for [driver name]"
- ✅ Report:
  - GET /api/v1/transportation/reports/driver-licenses
  - Show: Driver name, license #, expiry date, days remaining
  - Filter: Expiring soon (< 30 days)

**Definition of Done**
- License expiry check working
- Alert prevents trip with expired license
- Email reminder sent
- Report generated

---

### Story 8.3: Student Safety Verification
**Story ID:** T-8-3
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Story 3.2

**Description**
Verify all students boarded and alighted correctly, flag missing students.

**User Story**
As a school, I need to verify that all students are accounted for so I can ensure student safety.

**Acceptance Criteria**
- ✅ Trip completion checks:
  - On trip completion: Check all students on route
  - Flag students: Expected to board but marked ABSENT
  - Flag students: Expected to alight but didn't
  - Create SafetyLog record for each flag
- ✅ Missing student alert:
  - If student marked ABSENT but regularly boards: Yellow alert
  - If student marked ABSENT and parent hasn't been notified: Red alert
  - Alert: "John [Student ID] marked absent on Route 1. Verify with parent."
- ✅ Unaccounted student:
  - If student alighted but no boarding recorded: Flag discrepancy
  - Message: "Check if John physically boarded."
  - May indicate: Child not boarded, student list mismatch, data entry error
- ✅ End-of-day report:
  - GET /api/v1/transportation/reports/daily-safety-verification
  - Date filter
  - Shows: All missing/unaccounted students
  - CSV export for principal sign-off
- ✅ Parent notification:
  - If child marked absent: Automatically notify parent
  - Message: "John marked absent on Route 1 today. Please confirm."
  - Parent can respond: "He was sick" or "Check again"

**Definition of Done**
- Trip completion flags missing students
- Safety report generated
- Parent notified of absence
- Report saved for audit trail

---

### Story 8.4: GPS Data Privacy & Retention
**Story ID:** T-8-4
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Epic 2

**Description**
Implement GDPR-compliant GPS data retention and privacy controls.

**User Story**
As a school, I need to manage GPS data responsibly and comply with privacy regulations so we protect student and driver privacy.

**Acceptance Criteria**
- ✅ Data retention policy:
  - GPS data: 30 days in hot storage (PostgreSQL)
  - GPS data: 90 days in archive (S3 or similar)
  - Delete: Automatically after 90 days
  - Manual delete: Admin can force delete earlier
- ✅ Parent consent:
  - Parent opt-in: "I consent to GPS tracking of my child"
  - Stored in StudentRoute model: consentToTracking = true/false
  - If false: Don't collect/display child's location
  - Show in parent app: "Location tracking: OFF" (if not consented)
- ✅ Data access controls:
  - Parent: Can only view own child's trips
  - Admin: Can view all trips (audit log tracked)
  - Audit log: Every access of GPS data recorded
- ✅ Data export:
  - GDPR right to access: GET /api/v1/students/:id/data-export
  - Returns: All trips, locations, attendance for student
  - Format: JSON or CSV
  - Sent to parent email
- ✅ Deletion:
  - GDPR right to be forgotten: DELETE /api/v1/students/:id/data
  - Deletes: All GPS data, trips, attendance for student (older than 30 days)
  - Keeps: Current month data for safety audit
  - Confirmation email: "Your data has been deleted"
- ✅ Privacy settings page (admin):
  - Configure retention policy (days)
  - Configure data deletion automation
  - View audit log of access
  - Export audit log for compliance

**Definition of Done**
- Data retention working (records deleted after 90 days)
- Parent consent stored and enforced
- Data export creates file
- Audit log records access

---

## EPIC 9: Notifications & Alerts

**Epic ID:** T-EPIC-009
**Priority:** MEDIUM
**Duration:** 1 week
**Story Points:** 16
**Status:** Ready for Sprint 9

### Epic Description
Implement comprehensive notification system for trip events, alerts, and updates.

---

### Story 9.1: Trip Event Notifications
**Story ID:** T-9-1
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Epic 3, 6.4

**Description**
Send notifications to parents for all trip events: departure, arrival, boarding, alighting.

**User Story**
As a parent, I need notifications about my child's trip so I can stay informed without constantly checking the app.

**Acceptance Criteria**
- ✅ Notification triggers:
  1. **Trip departure**: Trip status → IN_PROGRESS
     - Message: "Bus departed from school. ETA 15 minutes."
     - Send to: Parents of students on route
  2. **Child boarded**: Student marked BOARDED
     - Message: "John has boarded the bus."
     - Send to: Parents of John
  3. **Arriving soon**: ETA < 10 minutes
     - Message: "Bus arriving in 10 minutes at your stop."
     - Send to: Parents of students on route
  4. **Arriving now**: ETA < 2 minutes
     - Message: "Bus arriving now at your stop."
     - Send to: Parents of students on route
  5. **Child alighted**: Student marked ALIGHTED
     - Message: "John has safely alighted."
     - Send to: Parents of John
  6. **Trip delayed**: Trip behind schedule by > 10 minutes
     - Message: "Bus is running 15 minutes late. Updated ETA 14:45."
     - Send to: Parents of students on route
- ✅ Notification channels:
  - Push notification (mobile)
  - SMS (if opted in)
  - Email (daily summary, optional)
- ✅ Notification preferences:
  - Parent can enable/disable each trigger type
  - Stored in ParentNotificationPreference model
  - Settable via API: PUT /api/v1/notification-preferences/:parentId
- ✅ Delivery:
  - Use existing notification module: notificationService.send()
  - Batch: Send to 100 parents at once
  - Retry: If failed, retry up to 3 times

**Definition of Done**
- Trip start notification sent and received
- Boarding notification sent to parents
- Notification preferences respected (can disable)

---

### Story 9.2: Emergency & Incident Alerts
**Story ID:** T-9-2
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Story 5.5, 8.3

**Description**
Send urgent alerts for emergencies and safety incidents.

**User Story**
As a parent, I need to be alerted immediately of emergencies so I can respond quickly.

**Acceptance Criteria**
- ✅ Emergency alert triggers:
  1. **Driver emergency**: Driver clicks emergency button (Story 5.5)
     - Message: "EMERGENCY ALERT: There is an emergency on your child's bus. Authorities have been contacted."
     - Recipient: Parents of all students on trip
     - Send via: Push (immediate), SMS (fallback)
     - No delay: Deliver within 30 seconds
  2. **Medical emergency**: (Future integration with health module)
     - Message: "Medical emergency reported on bus. Ambulance en route."
  3. **Accident**: Vehicle reported accident (manual)
     - Message: "Accident reported on Route 1. All students safe. Police en route."
  4. **Route deviation**: Vehicle deviates > 500m for > 15 min
     - Message: "Bus significantly off course. Investigating."
     - Recipient: Admin only (not parents)
- ✅ Escalation:
  - Level 1 (0-5 min): Notify parents
  - Level 2 (5-10 min): Notify principal, police
  - Level 3 (10+ min): Notify superintendent
  - Implemented via escalation rules (configurable)
- ✅ Acknowledgment:
  - Admin acknowledges emergency in console (Story 7.6)
  - Send follow-up to parents: "Situation acknowledged. Updates coming."
- ✅ Resolution:
  - Admin marks emergency as RESOLVED
  - Send to parents: "Emergency resolved at 14:45. All students safe."

**Definition of Done**
- Driver triggers emergency, parents notified within 30s
- Multiple notification channels attempted
- Escalation to principal/police working

---

### Story 9.3: Operational Alerts for Admins
**Story ID:** T-9-3
**Points:** 3
**Assignee:** Amelia (Developer)
**Dependencies:** Story 8.1, 8.2

**Description**
Send alerts to admins for operational issues: maintenance due, license expiry, route issues.

**User Story**
As an admin, I need operational alerts so I can proactively manage fleet operations and compliance.

**Acceptance Criteria**
- ✅ Alert types:
  1. **Maintenance due**: Vehicle overdue for scheduled maintenance
     - Message: "Vehicle AB-1234 overdue for oil change. Last service 120 days ago."
     - Frequency: Daily (morning)
  2. **License expiry**: Driver license expiring soon
     - Message: "Driver John Smith's license expires in 25 days. Renew now."
     - Frequency: Weekly
  3. **Trip scheduled**: Trip assigned but vehicle/driver missing
     - Message: "Trip on Route 1 at 08:00 missing vehicle assignment. Fix now."
     - Frequency: On demand (when trip created)
  4. **On-time performance**: Route consistently late
     - Message: "Route 1: 70% on-time this week (target: 85%). Review route times."
     - Frequency: Weekly summary
- ✅ Delivery:
  - Email to admin
  - In-app notification (dashboard banner)
  - SMS for critical alerts (optional)
- ✅ Preferences:
  - Admin can set alert types to ignore
  - Can set quiet hours (no alerts 10 PM - 6 AM)

**Definition of Done**
- Maintenance due alert received
- License expiry alert received
- Weekly summary email sent

---

### Story 9.4: Notification Center & History
**Story ID:** T-9-4
**Points:** 3
**Assignee:** Amelia (Developer)
**Dependencies:** Stories 9.1-9.3

**Description**
Build notification center in app for viewing notification history.

**User Story**
As a parent/admin, I need to view notification history so I can reference past alerts and events.

**Acceptance Criteria**
- ✅ Notification center (mobile app):
  - Tab in parent app: "Notifications"
  - List of last 30 notifications
  - Sortable by: Date (desc), Type, Trip
  - Search by: Trip date, vehicle #
  - Filters: Trip alerts, Emergencies, Operational
- ✅ Notification card format:
  - Time: "Today, 14:32"
  - Icon: Matching notification type
  - Title: "John has boarded"
  - Subtitle: "Route 1 - School to Home"
  - Tap to navigate to trip details
- ✅ Notification center (admin dashboard):
  - Similar to parent app
  - Filters: By type, date, user role
  - Export: CSV of notification history
- ✅ Read/Unread:
  - Mark as read when viewed
  - Show unread count on navigation
  - Bulk actions: Mark all as read
- ✅ Storage:
  - Store notifications in database: ParentNotification, AdminNotification tables
  - Retention: 90 days
  - Archive older notifications

**Definition of Done**
- Notification list loads
- Can filter and search
- Tap notification navigates to trip
- Unread count accurate

---

## EPIC 10: Testing & Deployment

**Epic ID:** T-EPIC-010
**Priority:** HIGH
**Duration:** 2 weeks
**Story Points:** 32
**Status:** Ready for Sprint 10

### Epic Description
Comprehensive testing strategy covering unit, integration, E2E, performance, and security testing. Blue-green deployment to production.

---

### Story 10.1: Unit Tests - Core Services
**Story ID:** T-10-1
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** All core services (Epic 1-4)

**Description**
Write unit tests for transportation services using Jest.

**User Story**
As a developer, I need unit tests so I can ensure service logic works correctly and prevent regressions.

**Acceptance Criteria**
- ✅ Test setup:
  - Configure Jest with TypeScript support
  - Create test helpers for mocking Prisma, Redis
  - Test database: Separate test database (SQLite or test container)
- ✅ Services to test:
  - `vehicle.service.ts`: CRUD, validation, filtering
  - `driver.service.ts`: CRUD, license validation
  - `route.service.ts`: Route creation, stop sequencing, validation
  - `gps-location.service.ts`: Location validation, rate limiting, ETA calculation
  - `route-optimization.service.ts`: Nearest neighbor algorithm, distance calculation
  - `trip.service.ts`: Trip lifecycle, student tracking
  - `geofence.service.ts`: Geofence detection, adherence calculation
  - `transport-pubsub.service.ts`: Pub/Sub publish/subscribe
- ✅ Test coverage targets:
  - Each service: 80% code coverage
  - Critical paths: 100% coverage
  - Edge cases: All validations tested
- ✅ Test structure:
  - Organize by method: `describe('VehicleService', () => { describe('create', () => {...})`
  - Test positive, negative, edge cases
  - Mock external dependencies (Prisma, Redis)
  - Use test data factory pattern
- ✅ Example tests:
  - `test('calculateDistance returns correct Haversine distance')`
  - `test('optimizeRoute returns sequence with lower total distance')`
  - `test('validateGPSLocation rejects invalid coordinates')`
  - `test('createTrip fails if vehicle not assigned to route')`
  - `test('markBoarded updates StudentTripRecord and publishes WebSocket event')`
- ✅ Test execution:
  - `npm run test` runs all tests
  - `npm run test:watch` for development
  - `npm run test:coverage` generates coverage report
  - CI/CD: Tests run on every commit

**Definition of Done**
- All services have >80% coverage
- All tests passing
- Coverage report generated
- CI integration working

---

### Story 10.2: API Integration Tests
**Story ID:** T-10-2
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** Epic 1-3 APIs

**Description**
Write integration tests for all REST API endpoints.

**User Story**
As a developer, I need integration tests so I can verify API endpoints work correctly with database and authentication.

**Acceptance Criteria**
- ✅ Test setup:
  - Use supertest library for HTTP testing
  - Test database: Clean before each test (reset sequence, truncate tables)
  - Test auth: Create test JWT tokens with different roles
  - Test multi-tenancy: Create test schools, verify schoolId filtering
- ✅ Endpoints to test:
  - All 40+ REST endpoints (from architecture doc)
  - Happy path: Successful request with valid data
  - Negative paths: Invalid input, missing fields, 404 not found
  - Authorization: Test ADMIN, PARENT, DRIVER roles
  - Multi-tenancy: Parent cannot access other school's data
- ✅ Test cases per endpoint:
  ```
  POST /vehicles:
    ✓ 201: Create vehicle with valid data
    ✓ 400: Invalid type enum
    ✓ 400: Capacity < 1
    ✓ 409: Duplicate registration number
    ✓ 401: No authentication
    ✓ 403: User not ADMIN/SUPER_ADMIN
  ```
- ✅ Database state:
  - Before each test: Seed schools, users, vehicles, drivers
  - After each test: Rollback transactions
  - Test isolation: Each test independent
- ✅ Error response testing:
  - Verify 400 includes validation error details
  - Verify 401 returns "Unauthorized"
  - Verify 403 returns "Forbidden"
  - Verify 404 returns "Not Found"
  - Verify 409 returns "Conflict"

**Definition of Done**
- All 40+ endpoints have positive and negative test cases
- All authorization tests passing
- Multi-tenancy tests passing
- API tests run in <30 seconds total

---

### Story 10.3: WebSocket & Real-Time Tests
**Story ID:** T-10-3
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Epic 2 (WebSocket)

**Description**
Test Socket.IO WebSocket connections and event flows.

**User Story**
As a developer, I need WebSocket tests so I can ensure real-time updates work correctly.

**Acceptance Criteria**
- ✅ Test setup:
  - Use Socket.IO test client library
  - Start test server with WebSocket
  - Mock Redis Pub/Sub (use in-memory redis or mock)
- ✅ Connection tests:
  - ✓ Client can connect with valid JWT
  - ✓ Client rejected with invalid JWT
  - ✓ Client rejected with expired token
  - ✓ Auto-reconnect on disconnect
  - ✓ Proper cleanup on disconnect
- ✅ Room subscription tests:
  - ✓ Client can subscribe to vehicle room: `subscribe-vehicle`
  - ✓ Client receives location updates after subscribe
  - ✓ Client stops receiving after unsubscribe
  - ✓ Multiple clients in same room receive same update
  - ✓ Authorization: Parent cannot subscribe to non-assigned vehicle
  - ✓ Unsubscribe removes client from room
- ✅ Real-time event tests:
  - ✓ GPS location POST triggers `location-update` event
  - ✓ Trip status change triggers `trip-status-update`
  - ✓ Student boarding triggers `student-status-update`
  - ✓ Emergency alert broadcasts to school room
  - ✓ Event delivery latency < 1 second
- ✅ Multi-server tests (if possible):
  - Simulate 2 server instances
  - GPS update on server A received by client on server B
  - Verify Redis Pub/Sub bridges servers

**Definition of Done**
- All connection tests passing
- All subscription/event tests passing
- Latency targets verified
- Auto-reconnect tested

---

### Story 10.4: End-to-End Tests
**Story ID:** T-10-4
**Points:** 8
**Assignee:** Amelia (Developer)
**Dependencies:** All features (Epics 1-9)

**Description**
Write E2E tests for complete user workflows.

**User Story**
As a QA tester, I need E2E tests so I can verify complete workflows work correctly across frontend and backend.

**Acceptance Criteria**
- ✅ Test environment:
  - Use Playwright (web) or Detox (mobile)
  - Test against staging environment
  - Database: Test data seeded before tests
  - Tests run in parallel (up to 5 concurrent)
- ✅ Web E2E tests (Playwright):
  1. **Admin creates route workflow**:
     - Login as admin
     - Navigate to routes page
     - Create new route (name, time)
     - Add 3 stops via map or list
     - Assign vehicle and driver
     - Save and verify route appears in list
  2. **Driver completes trip workflow**:
     - Login as driver (mobile or web)
     - See today's route
     - Start trip (status IN_PROGRESS)
     - Board first student (with photo)
     - Complete trip (auto-mark remaining as absent)
     - Verify trip report generated
  3. **Parent tracks child workflow**:
     - Login as parent
     - View child's active trip on map
     - See ETA countdown
     - Receive boarding notification
     - Receive alighting notification
     - See trip completed
  4. **Admin sees live map**:
     - Login as admin
     - Live tracking map shows 5+ vehicles
     - Click vehicle popup
     - See trip details
     - Verify real-time updates (vehicle moves on map)
  5. **Emergency workflow**:
     - Driver triggers emergency
     - Admin receives alert in emergency console
     - Alert shows on live map
     - Parents receive emergency notification
     - Admin acknowledges emergency
     - Follow-up sent to parents
- ✅ Mobile E2E tests (Detox):
  1. **Driver app trip workflow** (as above)
  2. **Parent app tracking workflow** (as above)
  3. **Offline support**:
     - Start active trip
     - Turn off network
     - Board students (queue locally)
     - Stop trip and complete
     - Turn network back on
     - Verify student boarding synced correctly
- ✅ Test execution:
  - `npm run test:e2e` runs all E2E tests
  - Generates HTML report with screenshots
  - Fails if any test fails (CI/CD gate)
  - Run time: < 10 minutes for all tests

**Definition of Done**
- All 5 web workflows tested and passing
- All 3 mobile workflows tested and passing
- HTML report generated
- No flaky tests (run 3x, all pass)

---

### Story 10.5: Performance & Load Tests
**Story ID:** T-10-5
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** All services

**Description**
Performance and load testing for real-time tracking scalability.

**User Story**
As a system architect, I need performance tests so I can verify the system handles 500+ concurrent users and 1000+ GPS updates per second.

**Acceptance Criteria**
- ✅ Load test setup:
  - Use Apache JMeter or k6
  - Simulate realistic traffic patterns
  - Test environment: Staging with production data volume
- ✅ GPS ingestion load test:
  - Simulate 100 drivers submitting GPS every 15 seconds
  - Throughput target: 1000 updates/sec processed
  - Response time target: < 100ms (p95)
  - CPU usage: < 50% on single server
  - Memory: < 80% of available
  - Verify no errors/timeouts
- ✅ WebSocket connection test:
  - Establish 500+ concurrent WebSocket connections
  - Simulate location updates while connected
  - Measure message delivery latency: < 1 second (p95)
  - Handle 100 concurrent subscriptions per room
  - Verify client count accurate
  - Memory per connection: < 50KB
- ✅ Dashboard load test:
  - Simulate 50 admin users viewing live map
  - Map renders with 100 vehicle markers
  - Real-time updates < 1 second
  - No frame drops (60 FPS target on web)
- ✅ Database query performance:
  - Location history query (7 days): < 500ms
  - Trip list with filters: < 300ms
  - Vehicle search (100 vehicles): < 200ms
  - Index verification: All slow queries have indexes
- ✅ Redis performance:
  - Cache set/get: < 10ms
  - Pub/Sub publish: < 50ms latency to subscribers
  - Memory usage: < 2GB for 100 active vehicles
- ✅ Battery test (mobile):
  - GPS tracking background for 4 hours
  - Battery drain: < 15% (acceptable for critical app)
  - Test on iPhone 12, Android flagship
- ✅ Reports:
  - Generate load test report with graphs
  - Identify bottlenecks if any
  - Create tuning recommendations

**Definition of Done**
- Load test passes all targets
- No errors/timeouts under load
- Performance report generated
- Bottlenecks identified and addressed

---

### Story 10.6: Security & Penetration Tests
**Story ID:** T-10-6
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** All endpoints, Auth, WebSocket

**Description**
Security testing for authorization, data isolation, and common vulnerabilities.

**User Story**
As a security officer, I need security tests so I can verify the system protects student and driver data.

**Acceptance Criteria**
- ✅ Authorization tests:
  - Parent cannot access other parent's children's data
  - Driver cannot access other driver's vehicle
  - TEACHER cannot delete routes/vehicles
  - STUDENT cannot create trips
  - Roles properly enforced on all endpoints (spot check 20 endpoints)
- ✅ Data isolation tests:
  - School A admin cannot see School B vehicles
  - Query filtering: Verify all queries filter by schoolId
  - WebSocket: Parent cannot subscribe to non-assigned vehicle
  - Attempt bypass: Try direct API call with school B ID in JWT
- ✅ Common vulnerabilities:
  - SQL injection: Test with SQL injection payloads (framework handles)
  - XSS: Test with malicious HTML in input fields
  - CSRF: Verify CSRF tokens on state-changing requests
  - Rate limiting: Test GPS endpoint with > 10 requests per minute
  - Input validation: Test with oversized, empty, null, special char inputs
- ✅ Authentication tests:
  - Expired token: Request with expired JWT, expect 401
  - Invalid token: Tamper with signature, expect 401
  - Missing token: Request without token, expect 401
  - Token refresh: Verify refresh endpoint works, issues new token
- ✅ Data privacy:
  - GPS data encrypted in transit (HTTPS/WSS)
  - Passwords hashed (bcrypt, not plain)
  - Tokens: JWT with secret key, not predictable
  - Photo storage: Only in authenticated endpoints, access verified
- ✅ Penetration test checklist:
  - OWASP Top 10 Coverage
  - Dependency scan: npm audit (no high/critical vulns)
  - Code scan: SonarQube or similar (no code smell issues)

**Definition of Done**
- All authorization tests passing
- No SQL injection, XSS, CSRF vulnerabilities found
- Rate limiting working
- Security report generated, no critical findings

---

### Story 10.7: Mobile App Testing
**Story ID:** T-10-7
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** Mobile apps (Epics 5-6)

**Description**
Manual and automated testing for iOS and Android mobile apps.

**User Story**
As a QA tester, I need mobile testing so I can ensure the driver and parent apps work correctly on real devices.

**Acceptance Criteria**
- ✅ Device testing:
  - iOS: iPhone 12, 14, 15 (latest 3 versions)
  - Android: Samsung S21, S23, Pixel 6 (latest 3 versions)
  - Orientations: Portrait and landscape
  - Screen sizes: Small (5"), medium (6"), large (6.7")
- ✅ Driver app testing:
  - Installation from TestFlight/Google Play (beta)
  - Login with test driver account
  - Grant location permission (foreground and background)
  - See today's route
  - Start trip, board students, complete trip
  - GPS location submitted to API
  - Boarding photos captured and uploaded
  - Offline mode: Turn airplane mode on, board students, turn off, verify sync
  - Notifications: Receive trip start, trip complete notifications
  - Battery: Monitor battery drain while app running
  - Crash testing: Force quit, reopen, verify data integrity
- ✅ Parent app testing:
  - Installation, login with test parent account
  - Select child (if multiple)
  - See active trip on map
  - Map updates as bus moves (real-time)
  - See ETA countdown
  - Receive boarding notification
  - Receive alighting notification
  - Tap notification, navigate to trip
  - Dark mode: Toggle and verify UI readable
  - Accessibility: Test with screen reader (VoiceOver/TalkBack)
  - Offline: See last known trip status
- ✅ Compatibility:
  - Test on iOS 14, 15, 16+ (latest 4 versions)
  - Test on Android 11, 12, 13, 14 (latest 4 versions)
  - Test with different app permissions scenarios
  - Test with various network conditions (WiFi, 4G, 3G)
- ✅ Store compliance:
  - App Store: Verify binary builds, test on TestFlight
  - Google Play: Verify APK builds, test on Google Play Console
  - Check app permissions, privacy policy, app description
- ✅ Test results:
  - Create bug report for any issues found
  - Verify fixes in next build
  - Sign-off: All devices passing

**Definition of Done**
- Driver app tested on iOS and Android
- Parent app tested on iOS and Android
- No critical bugs found
- Apps ready for app store submission

---

### Story 10.8: Documentation & Deployment Guide
**Story ID:** T-10-8
**Points:** 5
**Assignee:** Amelia (Developer)
**Dependencies:** All features

**Description**
Create deployment guide and runbooks for production deployment.

**User Story**
As a deployment engineer, I need deployment documentation so I can deploy the transportation module to production safely.

**Acceptance Criteria**
- ✅ Deployment guide:
  - Prerequisites: Node.js, PostgreSQL, Redis, Docker versions
  - Environment setup: .env variables explained
  - Database migration: `npx prisma migrate deploy`
  - Seed data: Run seed script for initial data
  - Service startup: Backend, Socket.IO server startup sequence
  - Health checks: Verify all services healthy
  - Pre-deployment checklist: All tests passing, no failing migrations
- ✅ Blue-Green deployment:
  - Deploy to Blue environment (new)
  - Run smoke tests on Blue
  - Gradually shift traffic: 5% → 25% → 50% → 100%
  - Monitor error rates, response times
  - If issues, rollback to Green
  - Keep Green running for 24 hours
  - Document decision log
- ✅ Feature flags:
  - Transportation module: Off by default
  - Enable per school (in settings)
  - Monitor for errors before enabling on all schools
  - Gradual rollout: 10% → 50% → 100%
- ✅ Rollback procedure:
  - If deployment fails: Document steps to rollback
  - Database rollback: `npx prisma migrate revert`
  - Cache invalidation: Clear Redis after rollback
  - Verify system stable before declaring success
- ✅ Monitoring:
  - Set up dashboards: WebSocket connections, GPS throughput, API latency
  - Set up alerts: High error rates, slow API responses, Redis issues
  - Log aggregation: All errors logged to ELK stack
  - Dashboard examples: Prometheus/Grafana setup
- ✅ Runbooks:
  - **Runbook 1: "GPS data not updating"**
    - Check 1: Are drivers submitting location? (check Redis cache count)
    - Check 2: Is WebSocket broadcasting? (check Pub/Sub channels)
    - Check 3: Is database saving? (check PostgreSQL GPS table)
    - Resolution steps if any fails
  - **Runbook 2: "WebSocket connections high"**
    - Check 1: Scan for memory leaks
    - Check 2: Verify room cleanup on disconnect
    - Check 3: Check for zombie connections
  - **Runbook 3: "Parents not receiving notifications"**
    - Check 1: Verify notification service running
    - Check 2: Check parent notification preferences
    - Check 3: Check phone token validity
  - More runbooks for common issues

**Definition of Done**
- Deployment guide written and tested (deploy to staging)
- Blue-green deployment executed successfully
- All runbooks created
- Team trained on deployment and rollback

---

## Summary

**Total Story Points:** 287 points
**Total Epics:** 10
**Total User Stories:** 48
**Estimated Duration:** 8 weeks (5-7 days per epic with parallel work)

### Epic Breakdown by Duration
- **Week 1:** Epic 1 (data models) - blocker for everything
- **Week 2:** Epics 2-3 (real-time tracking, trip management)
- **Week 3:** Epics 4-5 (optimization, driver mobile)
- **Week 4:** Epics 6-7 (parent mobile, admin web)
- **Week 5:** Epics 8-9 (safety, notifications)
- **Week 6-7:** Epic 10 part 1 (testing) - parallel with feature work
- **Week 8:** Epic 10 part 2 (deployment)

### Dependencies
- Epic 1 is critical blocker (all models)
- Epic 2 depends on Epic 1
- Epics 3-7 can start after Epic 1
- Epics 8-9 depend on earlier epics
- Epic 10 (testing) runs parallel after Week 2

### Success Metrics
✅ 48 user stories completed
✅ All acceptance criteria met
✅ 80%+ test coverage
✅ <5 second real-time latency
✅ 500+ concurrent connections supported
✅ 99.9% uptime target
✅ All compliance/safety requirements met

---

**Document Status:** Ready for Development Sprints

**Next Phase:** Phase 4 (UX/UI Design) or Phase 6 (Implementation Readiness Check)
