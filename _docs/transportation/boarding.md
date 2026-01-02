# Student Boarding & Alighting API Documentation

## Overview

The Boarding & Alighting system tracks student movement during transportation trips. It provides real-time verification of student pickup and dropoff, photo-based identity confirmation, and automated attendance integration.

**Key Features:**
- Manual student boarding confirmation with photo capture
- Geofence-triggered automatic boarding detection
- Student alighting confirmation with location verification
- Absence marking with reasons
- Pending boarding/alighting student lists (for driver app)
- Photo-based identity verification
- Real-time attendance tracking
- Trip attendance finalization

**Story:** 3.2 - Student Boarding/Alighting Tracking
**Status:** In Development
**Endpoints:** 10 REST API endpoints
**Authentication:** Required (JWT)
**Authorization:** Role-based (ADMIN, TEACHER as driver)

---

## Data Model

### StudentTripRecord Entity

Tracks individual student attendance for a specific trip.

```typescript
interface StudentTripRecord {
  id: string;                    // UUID
  studentId: string;             // FK to Student
  tripId: string;                // FK to Trip
  routeId: string;               // FK to Route
  pickupStopId: string;          // FK to Stop (where student boards)
  dropStopId: string;            // FK to Stop (where student alights)
  status: StudentTripStatus;     // BOARDED | ALIGHTED | ABSENT | NOT_BOARDED

  // Boarding information
  boardedAt: Date | null;        // When student boarded
  boardingPhoto: string | null;  // URL of boarding photo
  boardingAccuracy: number | null; // GPS accuracy at boarding (meters)

  // Alighting information
  alightedAt: Date | null;       // When student alighted
  alightingLatitude: number | null;  // GPS latitude at alighting
  alightingLongitude: number | null; // GPS longitude at alighting
  alightingAccuracy: number | null;  // GPS accuracy at alighting (meters)

  // Absence information
  absenceReason: string | null;  // Why student was absent

  createdAt: Date;
  updatedAt: Date;
}

enum StudentTripStatus {
  BOARDED     = "BOARDED",       // Student has boarded
  ALIGHTED    = "ALIGHTED",      // Student has alighted
  ABSENT      = "ABSENT",        // Student didn't board
  NOT_BOARDED = "NOT_BOARDED"    // No record yet
}
```

### Boarding Summary

Aggregated boarding status for a trip.

```typescript
interface TripBoardingSummary {
  tripId: string;
  tripDate: Date;
  status: TripStatus;           // SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED
  assignedStudents: number;     // Total students assigned to this trip
  boarded: number;              // Students currently on bus
  alighted: number;             // Students who got off
  absent: number;               // Students who didn't board
  notBoarded: number;           // No record yet
  attendancePercentage: number; // (boarded + alighted) / assigned * 100
  studentDetails: {
    boarded: StudentBoardingDetail[];
    alighted: StudentAlightingDetail[];
    absent: StudentAbsenceDetail[];
  };
}

interface StudentBoardingDetail {
  studentId: string;
  name: string;
  boardedAt: Date;
  boardingPhoto: string | null;
}

interface StudentAlightingDetail {
  studentId: string;
  name: string;
  alightedAt: Date;
}

interface StudentAbsenceDetail {
  studentId: string;
  name: string;
  reason: string | null;
}
```

---

## Boarding Workflow

### Student Journey on Trip

```
Trip Created (SCHEDULED)
    ↓
Trip Started (IN_PROGRESS)
    ↓
Student Boards at Pickup Stop
    ├─ recordBoardingAtPickup() - Manual boarding
    └─ autoMarkBoardingAtPickupStop() - Geofence-triggered
    ↓
Student on Bus (Status: BOARDED)
    ├─ boardingPhoto captured
    └─ attendance notification sent to parents
    ↓
Vehicle Arrives at Drop Stop
    ↓
Student Alights at Drop Stop
    └─ recordAlightingAtDropoff()
    ↓
Student Alighted (Status: ALIGHTED)
    └─ Attendance finalized as PRESENT

OR

Student Not Present at Pickup
    └─ markStudentAbsent()
    ↓
Student Marked Absent (Status: ABSENT)
    └─ Attendance finalized as ABSENT
```

---

## API Endpoints

### 1. Record Student Boarding at Pickup Stop

**Endpoint:** `POST /api/v1/transportation/trips/:tripId/boarding/pickup`

**Authorization:** ADMIN, TEACHER (driver)

**Request:**
```json
{
  "studentId": "student-001",
  "pickupStopId": "stop-001",
  "photoUrl": "https://storage.example.com/boarding-photos/student-001-20250115.jpg",
  "accuracy": 12.5
}
```

**Path Parameters:**
- `tripId`: Trip ID (trip must be IN_PROGRESS)

**Request Body:**
- `studentId`: Required - Student UUID
- `pickupStopId`: Required - Pickup stop for this student
- `photoUrl`: Optional - URL of student photo for verification
- `accuracy`: Optional - GPS accuracy in meters at boarding time

**Validation:**
- Trip must exist and be IN_PROGRESS
- Student must be assigned to this trip with this pickup stop
- Pickup stop must be on the trip's route
- Student cannot board twice
- School context required

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "studentId": "student-001",
    "studentName": "Aarav Sharma",
    "tripId": "trip-001",
    "status": "BOARDED",
    "boardedAt": "2025-01-15T07:35:30.000Z",
    "photoUrl": "https://storage.example.com/boarding-photos/student-001-20250115.jpg",
    "message": "Student boarded successfully"
  }
}
```

**Error Cases:**
- 400: Missing studentId or pickupStopId
- 400: Student already boarded
- 400: Student not assigned to this trip
- 404: Trip not found or not IN_PROGRESS
- 404: Pickup stop not on this route
- 401: Unauthorized

---

### 2. Record Student Alighting at Drop Stop

**Endpoint:** `POST /api/v1/transportation/trips/:tripId/alighting/dropoff`

**Authorization:** ADMIN, TEACHER (driver)

**Request:**
```json
{
  "studentId": "student-001",
  "dropStopId": "stop-005",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "accuracy": 8.3
}
```

**Request Body:**
- `studentId`: Required - Student UUID
- `dropStopId`: Required - Drop stop for this student
- `latitude`: Optional - GPS latitude at alighting
- `longitude`: Optional - GPS longitude at alighting
- `accuracy`: Optional - GPS accuracy in meters

**Validation:**
- Trip must be IN_PROGRESS
- Student must have boarded this trip
- Drop stop must match student's assigned drop stop
- Student cannot alight twice

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "studentId": "student-001",
    "studentName": "Aarav Sharma",
    "tripId": "trip-001",
    "status": "ALIGHTED",
    "boardedAt": "2025-01-15T07:35:30.000Z",
    "alightedAt": "2025-01-15T08:25:45.000Z",
    "message": "Student alighted successfully"
  }
}
```

**Error Cases:**
- 400: Student hasn't boarded yet
- 400: Drop stop doesn't match assigned drop stop
- 400: Student already alighted
- 404: Trip not found or not IN_PROGRESS
- 401: Unauthorized

---

### 3. Mark Student Absent

**Endpoint:** `POST /api/v1/transportation/trips/:tripId/attendance/absent`

**Authorization:** ADMIN, TEACHER (driver)

**Request:**
```json
{
  "studentId": "student-002",
  "reason": "Sick"
}
```

**Request Body:**
- `studentId`: Required - Student UUID
- `reason`: Optional - Reason for absence (e.g., "Sick", "Holiday", "Other")

**Validation:**
- Trip must exist
- Student must be assigned to trip
- Cannot mark boarded/alighted students as absent

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "studentId": "student-002",
    "studentName": "Bhavna Gupta",
    "tripId": "trip-001",
    "status": "ABSENT",
    "reason": "Sick",
    "message": "Student marked absent"
  }
}
```

**Error Cases:**
- 400: Student already boarded/alighted
- 404: Trip not found
- 401: Unauthorized

---

### 4. Get Trip Boarding Summary

**Endpoint:** `GET /api/v1/transportation/trips/:tripId/boarding/summary`

**Authorization:** Any authenticated user

**Description:** Get aggregated boarding status for all students on a trip.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "tripId": "trip-001",
    "tripDate": "2025-01-15T00:00:00.000Z",
    "status": "IN_PROGRESS",
    "assignedStudents": 50,
    "boarded": 48,
    "alighted": 35,
    "absent": 2,
    "notBoarded": 0,
    "attendancePercentage": 96,
    "studentDetails": {
      "boarded": [
        {
          "studentId": "student-001",
          "name": "Aarav Sharma",
          "boardedAt": "2025-01-15T07:35:30.000Z",
          "boardingPhoto": "https://storage.example.com/boarding-photos/student-001-20250115.jpg"
        }
      ],
      "alighted": [
        {
          "studentId": "student-001",
          "name": "Aarav Sharma",
          "alightedAt": "2025-01-15T08:25:45.000Z"
        }
      ],
      "absent": [
        {
          "studentId": "student-002",
          "name": "Bhavna Gupta",
          "reason": "Sick"
        }
      ]
    }
  }
}
```

---

### 5. Get Student Boarding History

**Endpoint:** `GET /api/v1/transportation/trips/:tripId/students/:studentId/boarding`

**Authorization:** Any authenticated user

**Path Parameters:**
- `tripId`: Trip ID
- `studentId`: Student ID

**Description:** Get detailed boarding/alighting record for a specific student on a specific trip.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "studentId": "student-001",
    "studentName": "Aarav Sharma",
    "studentClass": "12A",
    "tripId": "trip-001",
    "routeName": "Route A - North Zone",
    "status": "ALIGHTED",
    "boardedAt": "2025-01-15T07:35:30.000Z",
    "boardingPhoto": "https://storage.example.com/boarding-photos/student-001-20250115.jpg",
    "boardingAccuracy": 12.5,
    "alightedAt": "2025-01-15T08:25:45.000Z",
    "alightingLatitude": 12.9716,
    "alightingLongitude": 77.5946,
    "absenceReason": null
  }
}
```

**Error Cases:**
- 404: Trip not found
- 401: Unauthorized

---

### 6. Auto-Board Students at Pickup Stop (Geofence)

**Endpoint:** `POST /api/v1/transportation/trips/:tripId/boarding/auto`

**Authorization:** ADMIN, TEACHER (driver)

**Request:**
```json
{
  "pickupStopId": "stop-001"
}
```

**Description:**
Called when vehicle reaches/leaves a pickup stop. Automatically marks all assigned students as boarded if they haven't been boarded yet. Used for geofence-triggered automatic boarding.

**Validation:**
- Trip must be IN_PROGRESS
- Pickup stop must be on the trip's route
- Only creates records for students without existing boarding data

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "pickupStopId": "stop-001",
    "tripId": "trip-001",
    "autoBoarded": [
      {
        "studentId": "student-001",
        "studentName": "Aarav Sharma",
        "status": "auto-boarded"
      },
      {
        "studentId": "student-003",
        "studentName": "Chirag Desai",
        "status": "auto-boarded"
      }
    ],
    "count": 2,
    "message": "2 students auto-boarded"
  }
}
```

**Error Cases:**
- 400: Missing pickupStopId
- 404: Trip not found or not IN_PROGRESS
- 401: Unauthorized

---

### 7. Get Pending Boarding Students

**Endpoint:** `GET /api/v1/transportation/trips/:tripId/boarding/pending`

**Authorization:** Any authenticated user

**Description:** Get list of students assigned to trip who haven't boarded yet. Used by driver app to show "who still needs to board".

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "tripId": "trip-001",
    "pendingCount": 3,
    "students": [
      {
        "studentId": "student-004",
        "name": "Diana Mehta",
        "pickupStop": "stop-001",
        "dropStop": "stop-005"
      },
      {
        "studentId": "student-005",
        "name": "Esha Malhotra",
        "pickupStop": "stop-002",
        "dropStop": "stop-006"
      }
    ]
  }
}
```

---

### 8. Get Pending Alighting Students

**Endpoint:** `GET /api/v1/transportation/trips/:tripId/alighting/pending`

**Authorization:** Any authenticated user

**Description:** Get list of students currently on bus who haven't alighted yet. Used by driver app to show "who still needs to get off".

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "tripId": "trip-001",
    "pendingCount": 8,
    "students": [
      {
        "studentId": "student-001",
        "name": "Aarav Sharma",
        "boardedAt": "2025-01-15T07:35:30.000Z",
        "assignedDropStop": "stop-005"
      },
      {
        "studentId": "student-003",
        "name": "Chirag Desai",
        "boardedAt": "2025-01-15T07:38:00.000Z",
        "assignedDropStop": "stop-007"
      }
    ]
  }
}
```

---

### 9. Update Boarding Photo

**Endpoint:** `PUT /api/v1/transportation/trips/:tripId/students/:studentId/boarding/photo`

**Authorization:** ADMIN, TEACHER (driver)

**Request:**
```json
{
  "photoUrl": "https://storage.example.com/boarding-photos/student-001-20250115-updated.jpg"
}
```

**Request Body:**
- `photoUrl`: Required - New photo URL

**Description:** Update or replace student's boarding photo. Used if initial photo was unclear or missing.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "studentId": "student-001",
    "tripId": "trip-001",
    "photoUrl": "https://storage.example.com/boarding-photos/student-001-20250115-updated.jpg",
    "message": "Boarding photo updated"
  }
}
```

**Error Cases:**
- 400: Missing photoUrl
- 404: Student boarding record not found
- 401: Unauthorized

---

### 10. Finalize Trip Attendance

**Endpoint:** `POST /api/v1/transportation/trips/:tripId/attendance/finalize`

**Authorization:** ADMIN, SUPER_ADMIN

**Request:** (Empty body)
```json
{}
```

**Description:**
Called when trip is marked COMPLETED. Finalizes all student attendance records and prepares data for sync with school attendance system. Should be called automatically when `tripController.completeTrip()` is invoked.

**Validation:**
- Trip must exist
- Trip should be COMPLETED status (called after completion)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "tripId": "trip-001",
    "totalRecords": 50,
    "boarded": 48,
    "alighted": 48,
    "absent": 2,
    "message": "Trip attendance finalized - ready for attendance sync"
  }
}
```

---

## Business Logic & Validation

### Pickup Stop Validation

When recording boarding:
- Student must have a StudentRoute record for this trip's route
- StudentRoute.pickupStopId must match the provided pickupStopId
- The pickup stop must exist on the trip's route
- Pickup occurs in sequence (driver must visit stops in order)

### Drop Stop Validation

When recording alighting:
- StudentRoute.dropStopId must match the provided dropStopId
- Student must have boarded (boardedAt must be set)
- Alighting can only happen if student boarded
- Drop stops can be visited in any order (students may get off at different times)

### Attendance Integration

When trip is completed:
- Status BOARDED + ALIGHTED → Attendance PRESENT
- Status ABSENT → Attendance ABSENT
- Status BOARDED (not alighted) → Attendance PRESENT (attended pickup)
- Coordinates and photos stored for audit trail

### Photo Storage

- Photo URLs should point to secure cloud storage (AWS S3, Azure Blob, etc.)
- Photos are optional but recommended for verification
- Photos should have timestamps and student IDs in filename
- Photos can be updated if initial capture was poor

---

## Real-time Broadcasting

When boarding/alighting events occur, Socket.IO broadcasts are sent:

### Student Boarded Event
```typescript
// Broadcast to trip room
io.of('/transport').to(`trip:${tripId}`).emit('student:boarded', {
  tripId: string;
  studentId: string;
  studentName: string;
  boardedAt: Date;
  boardingPhoto?: string;
  pendingBoardingCount: number;
});
```

### Student Alighted Event
```typescript
io.of('/transport').to(`trip:${tripId}`).emit('student:alighted', {
  tripId: string;
  studentId: string;
  studentName: string;
  alightedAt: Date;
  pendingAlightingCount: number;
});
```

### Trip Boarding Summary Update
```typescript
io.of('/transport').to(`trip:${tripId}`).emit('boarding:summary', {
  tripId: string;
  boarded: number;
  alighted: number;
  absent: number;
  attendancePercentage: number;
  timestamp: Date;
});
```

---

## Error Handling

### Common Error Responses

**400 Bad Request - Invalid Stop:**
```json
{
  "success": false,
  "error": "Student's assigned drop stop is stop-005, not stop-004"
}
```

**400 Bad Request - Already Boarded:**
```json
{
  "success": false,
  "error": "Student has already boarded this trip"
}
```

**400 Bad Request - Not Boarded Yet:**
```json
{
  "success": false,
  "error": "Student has not boarded this trip yet"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Student boarding record not found"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | GET requests, successful updates |
| 201 | Created | Successful boarding/alighting/absence recording |
| 400 | Bad Request | Validation failure, invalid state |
| 401 | Unauthorized | Missing JWT or school context |
| 403 | Forbidden | Insufficient role authorization |
| 404 | Not Found | Trip, student, or record not found |
| 500 | Server Error | Database or system error |

---

## Usage Examples

### Example 1: Morning Trip Boarding Flow

```bash
# 1. Trip already created and started by admin
# GET active trips
curl -X GET http://localhost:5000/api/v1/transportation/trips/active \
  -H "Authorization: Bearer DRIVER_TOKEN"

# Response includes tripId: trip-001

# 2. Vehicle approaches first pickup stop - auto-board students
curl -X POST http://localhost:5000/api/v1/transportation/trips/trip-001/boarding/auto \
  -H "Authorization: Bearer DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupStopId": "stop-001"
  }'

# Response: 2 students auto-boarded

# 3. Check pending boarding students
curl -X GET http://localhost:5000/api/v1/transportation/trips/trip-001/boarding/pending \
  -H "Authorization: Bearer DRIVER_TOKEN"

# 4. One student arrives late - manual boarding with photo
curl -X POST http://localhost:5000/api/v1/transportation/trips/trip-001/boarding/pickup \
  -H "Authorization: Bearer DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-004",
    "pickupStopId": "stop-001",
    "photoUrl": "https://storage.example.com/boarding-photos/student-004-20250115-073630.jpg",
    "accuracy": 12.5
  }'

# 5. Get boarding summary
curl -X GET http://localhost:5000/api/v1/transportation/trips/trip-001/boarding/summary \
  -H "Authorization: Bearer DRIVER_TOKEN"

# Response shows 3 boarded, 0 alighted, 0 absent, 47 not boarded yet
```

### Example 2: Student Alighting Flow

```bash
# 1. Vehicle arrives at first drop stop
# GET pending alighting students
curl -X GET http://localhost:5000/api/v1/transportation/trips/trip-001/alighting/pending \
  -H "Authorization: Bearer DRIVER_TOKEN"

# Response shows 48 students still on bus

# 2. Student alights with GPS location
curl -X POST http://localhost:5000/api/v1/transportation/trips/trip-001/alighting/dropoff \
  -H "Authorization: Bearer DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-001",
    "dropStopId": "stop-005",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "accuracy": 8.3
  }'

# 3. Check updated summary
curl -X GET http://localhost:5000/api/v1/transportation/trips/trip-001/boarding/summary \
  -H "Authorization: Bearer DRIVER_TOKEN"

# Response shows 48 boarded, 1 alighted, 0 absent
```

### Example 3: Mark Student Absent

```bash
# 1. Trip started, student doesn't show up at pickup
curl -X POST http://localhost:5000/api/v1/transportation/trips/trip-001/attendance/absent \
  -H "Authorization: Bearer DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-002",
    "reason": "Reported sick"
  }'

# 2. Get updated summary
curl -X GET http://localhost:5000/api/v1/transportation/trips/trip-001/boarding/summary \
  -H "Authorization: Bearer DRIVER_TOKEN"

# Response now shows 1 absent
```

### Example 4: Finalize Attendance After Trip Completion

```bash
# 1. Trip completed by admin/driver
curl -X POST http://localhost:5000/api/v1/transportation/trips/trip-001/complete \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 2. Finalize attendance (may be called automatically)
curl -X POST http://localhost:5000/api/v1/transportation/trips/trip-001/attendance/finalize \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Response: 50 records total, 48 boarded/alighted = PRESENT, 2 absent = ABSENT
# Data ready for sync with attendance module
```

---

## Mobile App Integration

### Driver App Requirements

**Boarding Confirmation Screen:**
- Display: Student name, photo, assigned pickup stop
- Action: Tap to confirm boarding
- Optional: Capture photo with device camera
- Alternative: Scan QR code or RFID

**Pending Students List:**
- Call `/trips/:tripId/boarding/pending`
- Auto-refresh every 10 seconds
- Highlight students not yet boarded
- Tap to record boarding

**Current Students (On Bus):**
- Call `/trips/:tripId/alighting/pending`
- Show assigned drop stops
- Tap to record alighting
- GPS auto-capture at dropoff

---

## Performance Considerations

### Indexing Strategy

Database indexes recommended on:
- `StudentTripRecord(tripId, status)` - Boarding summary queries
- `StudentTripRecord(studentId, tripId)` - Individual record lookup
- `StudentTripRecord(boardedAt)` - Timestamp filtering
- `StudentRoute(routeId, studentId)` - Validation queries

### Caching Strategy

Redis caching recommended for:
- Trip boarding summary: 10s TTL (updates frequently during trip)
- Pending students list: 15s TTL (driver app uses frequently)
- Student boarding history: 5m TTL (doesn't change during trip)

### Query Optimization

- Always filter by tripId for trip-specific queries
- Use school context to limit student set
- Pagination not typically needed (max 100 students per trip)
- Batch operations for auto-boarding multiple students

---

## Security Considerations

### Photo Storage

- Store photos in secure cloud storage with private ACLs
- Generate signed URLs with expiration (24 hours)
- Include student ID and timestamp in filename
- Never expose raw photo URLs in API responses
- Encrypt photo URLs in transit

### Authorization

| Endpoint | POST | GET | PUT |
|----------|------|-----|-----|
| Board Student | ADMIN/TEACHER | - | - |
| Alight Student | ADMIN/TEACHER | - | - |
| Mark Absent | ADMIN/TEACHER | - | - |
| Boarding Summary | - | Any | - |
| Boarding History | - | Any | - |
| Auto-board | ADMIN/TEACHER | - | - |
| Pending Boarding | - | Any | - |
| Pending Alighting | - | Any | - |
| Update Photo | ADMIN/TEACHER | - | ADMIN/TEACHER |
| Finalize Attendance | ADMIN/SUPER_ADMIN | - | - |

### Data Isolation

- All queries filtered by schoolId
- Students can only see their own boarding records
- Parents can see their children's boarding records
- Teachers can see boarding for trips they drive

---

## Related Documentation

- **Trip Management:** `_docs/transportation/trip-management.md`
- **GPS Tracking:** `_docs/transportation/gps-tracking.md`
- **ETA Calculation:** `_docs/transportation/eta-calculation.md`
- **Real-time Broadcasting:** `_docs/transportation/location-broadcasting.md`
- **Attendance Integration (Story 3.3):** `_docs/transportation/attendance-integration.md`

---

## Next Steps (Story 3.3)

The following will be implemented in Story 3.3 - Attendance Integration:

1. **Automatic Attendance Record Creation**
   - When finalizeTripAttendance() called
   - Create StudentAttendance records
   - Set PRESENT for boarded/alighted, ABSENT for marked absent

2. **Sync with School Attendance System**
   - Push attendance to main StudentAttendance table
   - Update class-wise attendance reports
   - Send notifications to class teachers

3. **Absence Notifications**
   - Notify parents of student absence
   - Notify class teacher for follow-up
   - Auto-excuse if valid reason provided

4. **Attendance Analytics**
   - Transportation attendance dashboard
   - Monthly/weekly attendance reports
   - Trend analysis (frequent absentees)

---

## Changelog

### Version 1.0 (Story 3.2 - In Development)
- Initial release: 10 endpoints for boarding/alighting tracking
- Photo-based identity verification
- Geofence-triggered auto-boarding
- Real-time attendance state management
- Pending student lists for driver app
- Trip attendance finalization

---

**Last Updated:** January 2025
**Maintained By:** Development Team
**API Version:** v1
**Database Version:** Prisma ORM with PostgreSQL
