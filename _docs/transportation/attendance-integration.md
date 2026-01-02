# Attendance Integration API Documentation

## Overview

The Attendance Integration system syncs student boarding/alighting records from transportation trips to the school's attendance management system. It automatically creates attendance records, sends notifications to parents and teachers, and provides analytics on transportation-related attendance.

**Key Features:**
- Automatic attendance record creation from boarding/alighting data
- Parent notification for transportation absences
- Class teacher alerts for absent students
- Student attendance history by transportation
- Batch sync operations for multiple trips
- Sync status tracking and reversal
- Transportation attendance analytics and reports

**Story:** 3.3 - Attendance Integration
**Status:** In Development
**Endpoints:** 10 REST API endpoints
**Authentication:** Required (JWT)
**Authorization:** Role-based (ADMIN, SUPER_ADMIN, TEACHER)

---

## Data Model

### StudentAttendance Extension for Transportation

The StudentAttendance model is extended with a transportation link:

```typescript
interface StudentAttendance {
  id: string;                    // UUID
  studentId: string;             // FK to Student
  classId: string;               // FK to Class
  schoolId: string;              // FK to School
  attendanceDate: Date;          // Date of attendance
  status: AttendanceStatus;      // PRESENT | ABSENT | LEAVE | HALF_DAY
  remarks: string;               // Reason or notes
  transportationTripId?: string; // FK to Trip (for transportation-related attendance)
  createdAt: Date;
  updatedAt: Date;
}

enum AttendanceStatus {
  PRESENT     = "PRESENT",
  ABSENT      = "ABSENT",
  LEAVE       = "LEAVE",
  HALF_DAY    = "HALF_DAY"
}
```

### Attendance Sync Summary

```typescript
interface AttendanceSyncResult {
  tripId: string;
  tripDate: Date;
  syncedCount: number;          // Students synced successfully
  errorCount: number;           // Sync errors
  synced: {
    studentId: string;
    studentName: string;
    status: AttendanceStatus;
    attendanceId: string;
  }[];
  errors?: {
    studentId: string;
    studentName: string;
    error: string;
  }[];
}
```

---

## Attendance Sync Workflow

### Automatic Sync on Trip Completion

```
Trip Completed
    ↓
finalizeTripAttendance() called
    ↓
For Each Student on Trip:
    - Check StudentTripRecord status
    - If BOARDED/ALIGHTED → PRESENT
    - If ABSENT → ABSENT
    - Create/Update StudentAttendance record
    ↓
Sync Complete
    ├─ Parent notifications sent (optional)
    └─ Teacher alerts sent (optional)
```

### Manual Sync Option

Administrators can manually sync specific trips or batch-sync multiple trips:

```
Admin triggers sync
    ↓
POST /attendance/batch-sync with trip IDs
    ↓
For each trip:
    - Validate trip is COMPLETED
    - Check for existing attendance records
    - Create new or update existing
    ↓
Return batch results
```

---

## API Endpoints

### 1. Sync Trip Attendance to System

**Endpoint:** `POST /api/v1/transportation/trips/:tripId/attendance/sync`

**Authorization:** ADMIN, SUPER_ADMIN

**Request:** (Empty body)
```json
{}
```

**Description:**
Manually sync a trip's boarding records to the attendance system. Creates StudentAttendance records for all students on the trip based on their boarding status.

**Validation:**
- Trip must exist and be COMPLETED
- School context required

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "tripId": "trip-001",
    "tripDate": "2025-01-15T00:00:00.000Z",
    "syncedCount": 48,
    "errorCount": 2,
    "synced": [
      {
        "studentId": "student-001",
        "studentName": "Aarav Sharma",
        "status": "PRESENT",
        "attendanceId": "attendance-001"
      }
    ],
    "errors": [
      {
        "studentId": "student-999",
        "studentName": "Unknown Student",
        "error": "Student not found"
      }
    ],
    "message": "Synced 48 attendance records (2 errors)"
  }
}
```

**Error Cases:**
- 404: Trip not found or not COMPLETED
- 400: Trip already synced
- 401: Unauthorized

---

### 2. Get Student Attendance on Specific Date

**Endpoint:** `GET /api/v1/transportation/students/:studentId/attendance/:date`

**Authorization:** Any authenticated user

**Path Parameters:**
- `studentId`: Student UUID
- `date`: Attendance date (YYYY-MM-DD format)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "studentId": "student-001",
    "studentName": "Aarav Sharma",
    "attendanceDate": "2025-01-15T00:00:00.000Z",
    "status": "PRESENT",
    "remarks": "Present - Boarded at 07:35:30 - Alighted at 08:25:45",
    "transportationTripId": "trip-001",
    "tripInfo": {
      "tripId": "trip-001",
      "tripDate": "2025-01-15T00:00:00.000Z",
      "status": "COMPLETED"
    }
  }
}
```

**Error Cases:**
- 400: Invalid date format
- 401: Unauthorized

---

### 3. Get Class Attendance Summary for Date

**Endpoint:** `GET /api/v1/transportation/classes/:classId/attendance/:date`

**Authorization:** Any authenticated user

**Path Parameters:**
- `classId`: Class UUID
- `date`: Attendance date (YYYY-MM-DD format)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "classId": "class-001",
    "attendanceDate": "2025-01-15T00:00:00.000Z",
    "totalStudents": 50,
    "summary": {
      "present": 48,
      "absent": 2,
      "leave": 0,
      "unmarked": 0,
      "attendancePercentage": 96
    },
    "transportationAbsent": {
      "count": 2,
      "students": [
        {
          "studentId": "student-002",
          "studentName": "Bhavna Gupta",
          "reason": "Absent - Sick"
        },
        {
          "studentId": "student-005",
          "studentName": "Esha Malhotra",
          "reason": "Absent - No reason provided"
        }
      ]
    }
  }
}
```

---

### 4. Send Absence Notification to Parent

**Endpoint:** `POST /api/v1/transportation/students/:studentId/notify-absence`

**Authorization:** ADMIN, TEACHER

**Request:**
```json
{
  "tripId": "trip-001",
  "reason": "Sick"
}
```

**Request Body:**
- `tripId`: Required - Trip UUID
- `reason`: Optional - Reason for absence

**Description:**
Manually trigger absence notification to parent. Sends SMS/email/push notification with student absence details.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "notificationId": "notif-001",
    "recipientPhone": "+91-9876543210",
    "recipientEmail": "parent@example.com",
    "status": "sent",
    "message": "Absence notification sent to parent"
  }
}
```

**Error Cases:**
- 400: Missing tripId
- 404: Student or trip not found
- 401: Unauthorized

---

### 5. Notify Class Teachers of Absences

**Endpoint:** `POST /api/v1/transportation/classes/:classId/notify-absences/:date`

**Authorization:** ADMIN, TEACHER

**Path Parameters:**
- `classId`: Class UUID
- `date`: Attendance date (YYYY-MM-DD)

**Request:** (Empty body)
```json
{}
```

**Description:**
Send notifications to all class teachers about transportation-related absences for the date. Helps teachers follow up with absent students.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "classId": "class-001",
    "className": "12A",
    "attendanceDate": "2025-01-15T00:00:00.000Z",
    "absentCount": 2,
    "teachersNotified": 3,
    "teachers": [
      {
        "teacherId": "teacher-001",
        "teacherName": "Mrs. Sharma",
        "email": "sharma@school.com",
        "notificationId": "notif-001"
      }
    ],
    "message": "Notified 3 teachers about 2 transportation absences"
  }
}
```

**Error Cases:**
- 400: Invalid date format
- 404: Class not found
- 401: Unauthorized

---

### 6. Get Student Transportation Attendance History

**Endpoint:** `GET /api/v1/transportation/students/:studentId/attendance-history`

**Authorization:** Any authenticated user

**Query Parameters:**
- `limit`: Optional - Number of records (default: 30, max: 365)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "studentId": "student-001",
    "totalRecords": 20,
    "records": [
      {
        "attendanceDate": "2025-01-15T00:00:00.000Z",
        "status": "PRESENT",
        "remarks": "Present - Boarded at 07:35:30 - Alighted at 08:25:45",
        "tripId": "trip-001",
        "route": "Route A - North Zone"
      },
      {
        "attendanceDate": "2025-01-14T00:00:00.000Z",
        "status": "ABSENT",
        "remarks": "Absent - Sick",
        "tripId": "trip-002",
        "route": "Route A - North Zone"
      }
    ]
  }
}
```

---

### 7. Batch Sync Multiple Trips

**Endpoint:** `POST /api/v1/transportation/attendance/batch-sync`

**Authorization:** ADMIN, SUPER_ADMIN

**Request:**
```json
{
  "tripIds": ["trip-001", "trip-002", "trip-003"]
}
```

**Request Body:**
- `tripIds`: Required - Array of trip UUIDs (max 100 per batch)

**Description:**
Sync multiple trips to attendance system in a single operation. Useful for catching up on pending syncs.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "totalTrips": 3,
    "totalSynced": 144,
    "totalErrors": 3,
    "results": [
      {
        "tripId": "trip-001",
        "syncedCount": 48,
        "errorCount": 1,
        "message": "Synced 48 attendance records (1 error)"
      },
      {
        "tripId": "trip-002",
        "syncedCount": 49,
        "errorCount": 1,
        "message": "Synced 49 attendance records (1 error)"
      },
      {
        "tripId": "trip-003",
        "syncedCount": 47,
        "errorCount": 1,
        "message": "Synced 47 attendance records (1 error)"
      }
    ],
    "message": "Synced 144 attendance records from 3 trips"
  }
}
```

**Error Cases:**
- 400: Missing tripIds or empty array
- 400: More than 100 trips in batch
- 401: Unauthorized

---

### 8. Revert Trip Attendance Sync

**Endpoint:** `DELETE /api/v1/transportation/trips/:tripId/attendance/revert`

**Authorization:** ADMIN, SUPER_ADMIN

**Request:** (Empty body)
```json
{}
```

**Description:**
Remove all attendance records created from a trip sync. Used if trip data was incorrect and needs to be re-synced with corrected data.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "tripId": "trip-001",
    "deletedRecords": 48,
    "message": "Reverted 48 attendance records for trip"
  }
}
```

---

### 9. Get Trip Attendance Sync Status

**Endpoint:** `GET /api/v1/transportation/trips/:tripId/attendance/sync-status`

**Authorization:** Any authenticated user

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "tripId": "trip-001",
    "tripDate": "2025-01-15T00:00:00.000Z",
    "tripStatus": "COMPLETED",
    "syncStatus": "FULLY_SYNCED",
    "totalStudents": 50,
    "syncedRecords": 50,
    "pendingRecords": 0,
    "message": "Trip is fully synced to attendance"
  }
}
```

**Sync Status Values:**
- **FULLY_SYNCED**: All students have attendance records
- **PARTIALLY_SYNCED**: Some students have attendance records
- **NOT_SYNCED**: No attendance records created yet

---

### 10. Get Transportation Attendance Report

**Endpoint:** `GET /api/v1/transportation/attendance/report`

**Authorization:** ADMIN, SUPER_ADMIN

**Query Parameters:**
- `startDate`: Required - Start date (YYYY-MM-DD)
- `endDate`: Required - End date (YYYY-MM-DD)

**Example Request:**
```
GET /api/v1/transportation/attendance/report?startDate=2025-01-01&endDate=2025-01-31
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "reportPeriod": {
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-01-31T23:59:59.999Z"
    },
    "summary": {
      "totalRecords": 1200,
      "present": 1150,
      "absent": 40,
      "leave": 10,
      "attendancePercentage": 96
    },
    "classwiseStats": [
      {
        "classId": "class-001",
        "className": "12A",
        "present": 480,
        "absent": 15,
        "leave": 5
      },
      {
        "classId": "class-002",
        "className": "12B",
        "present": 495,
        "absent": 10,
        "leave": 5
      }
    ],
    "frequentAbsentees": [
      {
        "studentId": "student-999",
        "studentName": "Frequent Absentee",
        "className": "12A",
        "absenceCount": 8
      },
      {
        "studentId": "student-888",
        "studentName": "Another Absent Student",
        "className": "12B",
        "absenceCount": 6
      }
    ]
  }
}
```

**Error Cases:**
- 400: Missing startDate or endDate
- 400: Invalid date format
- 400: startDate > endDate
- 401: Unauthorized (requires ADMIN/SUPER_ADMIN)

---

## Business Logic

### Attendance Status Mapping

Boarding status → Attendance status mapping:

| Boarding Status | Attendance Status | Remarks |
|---|---|---|
| BOARDED (not alighted) | PRESENT | Student boarded but trip incomplete |
| ALIGHTED | PRESENT | Student completed full journey |
| ABSENT | ABSENT | Student didn't board |
| NOT_BOARDED | ABSENT | No boarding record created |

### Conflict Resolution

If attendance already exists for a student on a date:
- Check if it was created from transportation (has transportationTripId)
- If yes: Update with new status and remarks
- If no: Don't override (manual attendance takes precedence)
- Allow revert to fix incorrect syncs

### Notification Strategy

**Parent Notifications:**
- Triggered when student marked ABSENT
- Contains: Student name, route, date, reason
- Sent via: SMS/Email/Push (configurable)
- Delayed: Can be queued for batch sending

**Teacher Notifications:**
- Triggered daily/on-demand
- Contains: List of absent students and reasons
- Recipients: All teachers assigned to class
- Purpose: Enable follow-up and action

---

## Integration with Existing Attendance System

### Data Flow

```
Transportation Module
    ↓
StudentTripRecord (boarding/alighting)
    ↓
finalizeTripAttendance()
    ↓
StudentAttendance (with transportationTripId link)
    ↓
School Attendance System
    ├─ Class attendance reports
    ├─ Student attendance history
    ├─ Attendance analytics
    └─ Performance dashboards
```

### API Compatibility

- Uses existing StudentAttendance model
- Adds optional `transportationTripId` field
- Maintains backward compatibility with manual attendance
- Supports class teacher queries
- Integrates with existing notification system

---

## Performance Considerations

### Indexing Strategy

Recommended database indexes:

```sql
-- Attendance lookup by student and date
CREATE INDEX idx_attendance_student_date ON StudentAttendance(studentId, attendanceDate);

-- Trip-based attendance sync tracking
CREATE INDEX idx_attendance_trip ON StudentAttendance(transportationTripId);

-- Class attendance reporting
CREATE INDEX idx_attendance_class_date ON StudentAttendance(classId, attendanceDate);

-- Student history queries
CREATE INDEX idx_attendance_student_history ON StudentAttendance(studentId, attendanceDate DESC);
```

### Caching Strategy

Redis cache recommendations:

```
- Student daily attendance: 24h TTL
  Key: attendance:student:{studentId}:{date}

- Class summary: 6h TTL
  Key: attendance:class:{classId}:{date}

- Trip sync status: 1h TTL
  Key: attendance:trip:sync:{tripId}
```

### Batch Operations

- Batch sync: Process up to 100 trips per request
- Batch notifications: Queue and send in batches (50 per minute)
- Historical reports: Use date range filters and pagination

---

## Error Handling

### Common Error Scenarios

**Sync Conflicts:**
```json
{
  "success": false,
  "error": "Cannot sync trip - attendance already exists for 5 students"
}
```

**Missing Data:**
```json
{
  "success": false,
  "error": "Trip not found or not COMPLETED"
}
```

**Notification Failures:**
```json
{
  "success": true,
  "data": {
    "notificationId": "notif-001",
    "status": "queued",
    "message": "Notification queued - delivery pending"
  }
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, sync, notification |
| 201 | Created | Attendance record created |
| 400 | Bad Request | Validation failure, format error |
| 401 | Unauthorized | Missing JWT or school context |
| 403 | Forbidden | Insufficient role authorization |
| 404 | Not Found | Student, class, or trip not found |
| 500 | Server Error | Database or system error |

---

## Usage Examples

### Example 1: Automatic Sync After Trip Completion

```bash
# 1. Trip completed by driver
curl -X POST http://localhost:5000/api/v1/transportation/trips/trip-001/complete \
  -H "Authorization: Bearer DRIVER_TOKEN"

# Backend automatically calls:
# boardingController.finalizeTripAttendance() →
# attendanceIntegrationService.syncTripAttendanceToSystem()

# 2. Verify sync status
curl -X GET http://localhost:5000/api/v1/transportation/trips/trip-001/attendance/sync-status \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Response: FULLY_SYNCED with 50 attendance records created
```

### Example 2: Manual Sync and Notification

```bash
# 1. Check pending sync status
curl -X GET http://localhost:5000/api/v1/transportation/trips/trip-002/attendance/sync-status \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Response: NOT_SYNCED

# 2. Manually sync trip
curl -X POST http://localhost:5000/api/v1/transportation/trips/trip-002/attendance/sync \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Response: 48 synced, 2 errors

# 3. Notify class teachers about absences
curl -X POST "http://localhost:5000/api/v1/transportation/classes/class-001/notify-absences/2025-01-15" \
  -H "Authorization: Bearer TEACHER_TOKEN"

# Response: 2 absences, 3 teachers notified
```

### Example 3: Batch Sync Multiple Trips

```bash
# Sync multiple pending trips
curl -X POST http://localhost:5000/api/v1/transportation/attendance/batch-sync \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tripIds": ["trip-001", "trip-002", "trip-003", "trip-004", "trip-005"]
  }'

# Response: 240 records synced from 5 trips
```

### Example 4: Generate Monthly Attendance Report

```bash
# Get transportation attendance report for January
curl -X GET "http://localhost:5000/api/v1/transportation/attendance/report?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Response:
# {
#   "summary": {
#     "totalRecords": 1200,
#     "present": 1150,
#     "absent": 40,
#     "attendancePercentage": 96
#   },
#   "classwiseStats": [...]
#   "frequentAbsentees": [...]
# }
```

### Example 5: Student Attendance History

```bash
# Get student's transportation attendance for last 30 days
curl -X GET "http://localhost:5000/api/v1/transportation/students/student-001/attendance-history?limit=30" \
  -H "Authorization: Bearer PARENT_TOKEN"

# Response: List of 20 attendance records with route and status info
```

---

## Admin Dashboard Integration

### Recommended Dashboard Widgets

1. **Trip Sync Status Widget**
   - Shows percentage of trips synced
   - Pending trips to sync
   - Recent sync activity

2. **Attendance Overview**
   - Daily attendance percentage
   - Class-wise breakdown
   - Trend chart (7-day, 30-day)

3. **Absence Alerts**
   - Today's absences by cause
   - Frequent absentees
   - Absence trends

4. **Notification Status**
   - Parent notifications sent
   - Teacher alerts delivered
   - Pending notifications

5. **Reports**
   - Monthly attendance reports
   - Class-wise analytics
   - Student-wise history

---

## Security Considerations

### Authorization

| Endpoint | Roles | Permission |
|----------|-------|-----------|
| Sync Trip | ADMIN/SUPER_ADMIN | Create attendance |
| Get Attendance | Any | Read own/child record |
| Class Summary | Any | Read class data |
| Notify Parent | ADMIN/TEACHER | Send notification |
| Notify Teachers | ADMIN/TEACHER | Send notification |
| History | Any | Read history |
| Batch Sync | ADMIN/SUPER_ADMIN | Bulk operation |
| Revert Sync | ADMIN/SUPER_ADMIN | Delete attendance |
| Sync Status | Any | Read status |
| Report | ADMIN/SUPER_ADMIN | Analytics access |

### Data Isolation

- All queries filtered by schoolId
- Students can only see own attendance
- Parents see only their children's records
- Teachers see their class attendance
- Cross-school access prevented

### Audit Trail

- All sync operations logged with timestamp
- Revert operations tracked
- Manual notifications logged
- Attendance corrections recorded

---

## Related Documentation

- **Boarding & Alighting:** `_docs/transportation/boarding.md`
- **Trip Management:** `_docs/transportation/trip-management.md`
- **GPS Tracking:** `_docs/transportation/gps-tracking.md`
- **School Attendance System:** `_docs/attendance/api.md`

---

## Future Enhancements (Post-Story 3.3)

1. **Automated Parent SMS/Email**
   - Integrate with SMS gateway
   - Email notifications with templates
   - Configurable notification triggers

2. **Absence Excuse System**
   - Parents submit absence excuse
   - Teachers approve/reject
   - Automatic status update in attendance

3. **Mobile App Notifications**
   - Push notifications to parent app
   - Real-time absence alerts
   - Historical view in app

4. **Advanced Analytics**
   - Predictive absence detection
   - Pattern analysis (chronic absentees)
   - Cause analysis (weather, holidays, etc.)

5. **Integration with Leave Management**
   - Link transportation absence to leave request
   - Automatic leave status sync
   - Coordinated notification

---

## Changelog

### Version 1.0 (Story 3.3 - In Development)
- Initial release: 10 endpoints for attendance integration
- Automatic sync from boarding records
- Parent and teacher notifications
- Attendance reporting and analytics
- Batch sync and revert operations
- Full school integration

---

**Last Updated:** January 2025
**Maintained By:** Development Team
**API Version:** v1
**Database Version:** Prisma ORM with PostgreSQL
