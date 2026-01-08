# Hostel Management Module Documentation

## Overview

The Hostel Management Module handles all operations related to student accommodation including hostel management, room allocation, occupancy tracking, hostel fees, rules enforcement, and hostel staff management. This module supports multiple hostels with different room types and capacity management.

**Current Status**: Not Implemented
**Completion**: 0%
**Priority**: High

---

## Table of Contents

1. [Module Features](#module-features)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Pages](#frontend-pages)
6. [Implementation Checklist](#implementation-checklist)
7. [Business Logic](#business-logic)
8. [Error Handling](#error-handling)

---

## Module Features

### Core Features
- Multiple hostel management
- Room type and capacity management
- Student room allocation and reassignment
- Room condition inspection and tracking (NEW - CRITICAL)
- Occupancy tracking and management
- Hostel fee management with Finance integration (NEW - CRITICAL)
- Student billing and dues collection (NEW - CRITICAL)
- Check-in/Check-out tracking
- Guest/Visitor management with approval workflow (NEW - CRITICAL)
- Guest house management for visitors (NEW - CRITICAL)
- Hostel rules and violation tracking with appeals (NEW)
- Violation appeal and review process (NEW)
- Hostel staff assignment
- Leave applications for hostel students with approval
- Maintenance request tracking with completion
- Hostel notices and announcements
- Hostel attendance/curfew tracking (NEW - CRITICAL)

### Reporting & Analytics
- Occupancy reports
- Fee collection reports
- Violation/Discipline reports
- Hostel-wise statistics
- Room utilization analysis

---

## Database Schema

### Core Models to be Implemented

#### Hostel Model
```prisma
model Hostel {
  id                  String    @id @default(uuid())

  // Basic Information
  name               String    @unique
  code               String    @unique
  hostelType         String    // BOYS, GIRLS, MIXED
  capacity           Int       // Total capacity

  // Contact & Location
  address            String
  city               String
  state              String
  zipCode            String
  phone              String
  email              String?

  // Management
  wardenId           String?
  warden             User?     @relation("HostelWarden", fields: [wardenId], references: [id])
  superviserIds      String[]  // Array of superviser user IDs (optional)

  // Operational
  isActive           Boolean   @default(true)
  checkInTime        String?   // HH:MM format, e.g., "14:00"
  checkOutTime       String?   // HH:MM format, e.g., "08:00"
  visitorCheckInTime String?
  visitorCheckOutTime String?

  // Relationships
  rooms              Room[]
  allocations        RoomAllocation[]
  fees               HostelFee[]
  rules              HostelRule[]
  staff              HostelStaff[]
  complaints         HostelComplaint[]
  notices            HostelNotice[]
  visitors           HostelVisitor[]
  guestHouses        GuestHouse[]
  billing            HostelBilling[]

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

#### Room Model
```prisma
model Room {
  id                  String    @id @default(uuid())

  hostelId            String
  hostel              Hostel    @relation(fields: [hostelId], references: [id], onDelete: Cascade)

  // Room Information
  roomNumber          String
  floor               Int
  roomType            String    // SINGLE, DOUBLE, TRIPLE, DORMITORY
  capacity            Int       // Max students allowed

  // Current Status
  currentOccupancy    Int       @default(0) // Current students in room
  status              String    @default("AVAILABLE") // AVAILABLE, FULL, MAINTENANCE, CLOSED
  condition           String    // GOOD, FAIR, POOR, NEEDS_REPAIR

  // Features & Amenities
  amenities           String[]  // ["AC", "WIFI", "HOT_WATER", "ATTACH_BATHROOM"]
  hasAttachBathroom   Boolean   @default(false)
  hasSharedBathroom   Boolean   @default(true)
  hasFurniture        Boolean   @default(true)

  // Pricing (if different room types have different fees)
  baseFee             Float?    // Optional: if room has custom fee

  // Relationships
  allocations         RoomAllocation[]
  inspections         RoomInspection[]
  maintenanceRequests MaintenanceRequest[]

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([hostelId, roomNumber])
  @@index([hostelId])
  @@index([status])
}
```

#### RoomAllocation Model
```prisma
model RoomAllocation {
  id                  String    @id @default(uuid())

  // Room & Student
  roomId              String
  room                Room      @relation(fields: [roomId], references: [id], onDelete: Restrict)

  studentId           String
  student             Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)

  // Allocation Details
  allocationDate      DateTime  @default(now())
  deallocationDate    DateTime? // When student left the room

  // Semester/Academic Year
  academicYearId      String
  academicYear        AcademicYear @relation(fields: [academicYearId], references: [id])

  // Status
  status              String    @default("ALLOCATED") // ALLOCATED, VACATED, TRANSFERRED

  // Reason for deallocation (if applicable)
  deallocationReason  String?   // GRADUATION, TRANSFER, EXPULSION, OPTED_OUT

  // Relationships
  checkInOut          RoomCheckInOut[]
  violations          HostelViolation[]
  attendance          HostelAttendance[]
  billing             HostelBilling[]

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([roomId, studentId, academicYearId])
  @@index([studentId])
  @@index([status])
}
```

#### RoomCheckInOut Model
```prisma
model RoomCheckInOut {
  id                  String    @id @default(uuid())

  allocationId        String
  allocation          RoomAllocation @relation(fields: [allocationId], references: [id], onDelete: Cascade)

  // Check-in/out dates
  checkInDate         DateTime?  // Initial check-in
  checkOutDate        DateTime?  // Final checkout
  lastCheckInDate     DateTime?  // Last time student checked in (for semester start)
  lastCheckOutDate    DateTime?  // Last time student checked out (for semester end)

  // Gate check-in/out (daily tracking)
  gateCheckInTime     DateTime?
  gateCheckOutTime    DateTime?
  gateCheckInDate     DateTime?

  // Status during stay
  isCurrentlyInHostel Boolean   @default(true)
  status              String    // CHECKED_IN, CHECKED_OUT, ON_LEAVE

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([allocationId])
}
```

#### HostelFee Model
```prisma
model HostelFee {
  id                  String    @id @default(uuid())

  hostelId            String
  hostel              Hostel    @relation(fields: [hostelId], references: [id])

  // Fee Structure
  name               String     // "Monthly Hostel Fee", "Maintenance Fee", etc.
  description        String?
  amount             Float
  frequency          String     // MONTHLY, QUARTERLY, ANNUALLY, ONE_TIME


  // Academic Year
  academicYearId     String?
  academicYear       AcademicYear? @relation(fields: [academicYearId], references: [id])

  // Room Type specific (optional)
  roomType           String?    // If fee varies by room type

  // Status
  isActive           Boolean    @default(true)
  dueDay             Int?       // Day of month when fee is due (1-31)

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@unique([hostelId, name, academicYearId])
}
```

#### HostelRule Model
```prisma
model HostelRule {
  id                  String    @id @default(uuid())

  hostelId            String
  hostel              Hostel    @relation(fields: [hostelId], references: [id])

  title              String
  description        String
  category           String     // CONDUCT, CURFEW, GUESTS, NOISE, CLEANLINESS, MAINTENANCE
  severity           String     // MINOR, MAJOR, CRITICAL
  consequence        String     // Action taken if violated (fine, suspension, expulsion)

  isActive           Boolean    @default(true)

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt
}
```

#### HostelViolation Model
```prisma
model HostelViolation {
  id                  String    @id @default(uuid())

  // Student & Room
  allocationId        String
  allocation          RoomAllocation @relation(fields: [allocationId], references: [id])

  // Violation Details
  ruleId              String?
  violationType       String     // MISSING_CURFEW, UNAUTHORIZED_GUEST, NOISE, CLEANLINESS, DAMAGE, OTHER

  description        String
  violationDate      DateTime
  reportedDate       DateTime   @default(now())

  // Reporter
  reportedById       String
  reportedBy         User       @relation(fields: [reportedById], references: [id])

  // Action Taken
  action             String     // VERBAL_WARNING, WRITTEN_WARNING, FINE, SUSPENSION, EXPULSION
  fineAmount         Float?
  suspensionDays     Int?

  // Status
  status             String     @default("REPORTED") // REPORTED, INVESTIGATING, RESOLVED, APPEALED

  // Appeal (if applicable)
  appealReason       String?
  appealStatus       String?    // PENDING, APPROVED, REJECTED

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@index([allocationId])
  @@index([status])
}
```

#### HostelComplaint Model
```prisma
model HostelComplaint {
  id                  String    @id @default(uuid())

  hostelId            String
  hostel              Hostel    @relation(fields: [hostelId], references: [id])

  // Complaint Details
  complaintType      String     // MAINTENANCE, CLEANLINESS, FOOD, STAFF, ROOMMATE, NOISE, SAFETY
  title              String
  description        String

  // Reporter
  lodgedById         String
  lodgedBy           User       @relation(fields: [lodgedById], references: [id])
  lodgedDate         DateTime   @default(now())

  // Status
  status             String     @default("OPEN") // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  priority           String     @default("NORMAL") // LOW, NORMAL, HIGH, URGENT

  // Resolution
  assignedToId       String?    // Staff member assigned
  assignedTo         User?      @relation("ComplaintAssignedTo", fields: [assignedToId], references: [id])

  resolutionNotes    String?
  resolvedDate       DateTime?

  attachmentUrl      String?    // Photo/video of issue

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@index([status])
  @@index([priority])
}
```

#### HostelStaff Model
```prisma
model HostelStaff {
  id                  String    @id @default(uuid())

  hostelId            String
  hostel              Hostel    @relation(fields: [hostelId], references: [id])

  userId              String
  user                User      @relation(fields: [userId], references: [id])

  // Staff Role
  role               String     // WARDEN, SUPERVISOR, CARETAKER, SECURITY, CLEANER
  designation        String?

  // Contact
  phone              String
  email              String?

  // Employment
  joiningDate        DateTime
  exitDate           DateTime?

  status             String     @default("ACTIVE") // ACTIVE, INACTIVE, SUSPENDED

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@unique([hostelId, userId])
}
```

#### HostelVisitor Model
```prisma
model HostelVisitor {
  id                  String    @id @default(uuid())

  hostelId            String
  hostel              Hostel    @relation(fields: [hostelId], references: [id])

  // Visitor Details
  visitorName        String
  relationship       String     // PARENT, SIBLING, FRIEND, RELATIVE, OTHER
  contact            String?
  idProof            String?    // ID type: AADHAR, PAN, PASSPORT, LICENSE

  // Visit Details
  studentId          String
  student            Student    @relation(fields: [studentId], references: [id])

  checkInTime        DateTime
  checkOutTime       DateTime?

  visitPurpose       String?
  remarks            String?

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@index([hostelId])
  @@index([studentId])
}
```

#### HostelLeaveApplication Model
```prisma
model HostelLeaveApplication {
  id                  String    @id @default(uuid())

  studentId           String
  student             Student   @relation(fields: [studentId], references: [id])

  // Leave Details
  fromDate            DateTime
  toDate              DateTime
  reason              String

  // Approval
  status              String    @default("PENDING") // PENDING, APPROVED, REJECTED
  approvedById        String?
  approvedBy          User?     @relation(fields: [approvedById], references: [id])
  approvalDate        DateTime?
  approvalRemarks     String?

  // Contact during leave
  contactNumber       String?
  alternateAddress    String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([studentId])
}
```

#### HostelNotice Model
```prisma
model HostelNotice {
  id                  String    @id @default(uuid())

  hostelId            String
  hostel              Hostel    @relation(fields: [hostelId], references: [id])

  title              String
  content            String     // Rich text content
  noticeType         String     // ANNOUNCEMENT, WARNING, EMERGENCY, GENERAL

  postedBy           String
  postedByUser       User       @relation(fields: [postedBy], references: [id])
  postedDate         DateTime   @default(now())

  // Visibility
  targetAudience     String     // ALL_STUDENTS, ALL_PARENTS, SPECIFIC_ROOM, SPECIFIC_CLASS

  // Validity
  validFrom          DateTime
  validUpto          DateTime?

  isPinned           Boolean    @default(false)

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@index([hostelId])
}
```

#### Maintenance Request Model
```prisma
model MaintenanceRequest {
  id                  String    @id @default(uuid())

  roomId              String
  room                Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)

  // Issue Details
  issueType          String     // PLUMBING, ELECTRICAL, FURNITURE, CLEANING, HVAC, OTHER
  description        String
  severity           String     // LOW, MEDIUM, HIGH

  // Request
  requestedBy        String
  requestedByUser    User       @relation(fields: [requestedBy], references: [id])
  requestedDate      DateTime   @default(now())

  // Status
  status             String     @default("OPEN") // OPEN, IN_PROGRESS, COMPLETED, CANCELLED
  assignedToId       String?
  assignedTo         User?      @relation("MaintenanceAssignedTo", fields: [assignedToId], references: [id])

  // Completion
  completedDate      DateTime?
  completionNotes    String?
  cost               Float?

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@index([roomId])
  @@index([status])
}
```

#### RoomInspection Model (NEW - CRITICAL)
```prisma
model RoomInspection {
  id                  String    @id @default(uuid())

  roomId              String
  room                Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)

  // Inspection Type
  inspectionType      String    // PRE_ALLOCATION, POST_CHECKOUT, QUARTERLY, DAMAGE_REPORT, ANNUAL
  inspectionDate      DateTime
  scheduledFor        DateTime? // If pre-scheduled

  // Inspector
  inspectedBy         String
  inspectedByUser     User      @relation(fields: [inspectedBy], references: [id])

  // Room Condition Assessment
  cleanliness         Int       // 1-5 scale
  furniture           Int       // Condition 1-5
  fixtures            Int       // Condition 1-5 (lights, fans, AC, etc.)
  plumbing            Int       // Condition 1-5
  electrical          Int       // Condition 1-5
  bedding             Int       // Condition 1-5

  overallScore        Int       // Average of above

  // Issues Found
  issuesFound         String?   // JSON array of issues
  damageFound         Boolean   @default(false)
  damageDescription   String?
  damageCost          Float?

  // Images
  imageUrls           String[]  // Photos of room condition

  // Follow-up
  followUpRequired    Boolean   @default(false)
  followUpDate        DateTime?
  followUpNotes       String?

  // Approval
  approvedBy          String?
  approvalDate        DateTime?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([roomId])
  @@index([inspectionDate])
  @@index([inspectionType])
}
```

#### HostelAttendance Model (NEW - CRITICAL FOR CURFEW TRACKING)
```prisma
model HostelAttendance {
  id                  String    @id @default(uuid())

  allocationId        String
  allocation          RoomAllocation @relation(fields: [allocationId], references: [id], onDelete: Cascade)

  studentId           String
  student             Student   @relation(fields: [studentId], references: [id])

  // Date & Time
  attendanceDate      DateTime
  checkInTime         DateTime?
  checkOutTime        DateTime?

  // Status
  status              String    // PRESENT, ABSENT, ON_LEAVE, LATE_CHECKIN, EARLY_CHECKOUT
  reason              String?   // If absent/late/early

  // Curfew
  curfewViolation     Boolean   @default(false)
  curfewTime          String?   // What time rule was violated

  // Notes
  remarks             String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([allocationId, attendanceDate])
  @@index([studentId])
  @@index([attendanceDate])
}
```

#### HostelVisitor Model (UPDATED - WITH APPROVAL WORKFLOW)
```prisma
model HostelVisitor {
  id                  String    @id @default(uuid())

  hostelId            String
  hostel              Hostel    @relation(fields: [hostelId], references: [id])

  // Visitor Details
  visitorName        String
  relationship       String     // PARENT, SIBLING, FRIEND, RELATIVE, OTHER
  contact            String?
  idProof            String?    // ID type: AADHAR, PAN, PASSPORT, LICENSE
  idProofNumber      String?    // ID number for verification

  // Student & Visit
  studentId          String
  student            Student    @relation(fields: [studentId], references: [id], onDelete: Cascade)

  visitPurpose       String?
  plannedVisitDate   DateTime   // When visitor plans to come
  visitDuration      Int?       // Expected duration in hours

  // Approval Workflow (NEW - CRITICAL)
  approvalStatus     String     @default("PENDING") // PENDING, APPROVED, REJECTED
  requestedDate      DateTime   @default(now())
  approvedBy         String?
  approvedByUser     User?      @relation(fields: [approvedBy], references: [id])
  approvalDate       DateTime?
  approvalRemarks    String?

  // Actual Visit
  actualCheckInTime  DateTime?
  actualCheckOutTime DateTime?
  remarks            String?

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@index([hostelId])
  @@index([studentId])
  @@index([approvalStatus])
  @@index([plannedVisitDate])
}
```

#### GuestHouse Model (NEW - CRITICAL FOR MULTI-DAY GUESTS)
```prisma
model GuestHouse {
  id                  String    @id @default(uuid())

  hostelId            String
  hostel              Hostel    @relation(fields: [hostelId], references: [id], onDelete: Cascade)

  // Guest House Details
  name               String
  capacity           Int       // Single/Double/Dormitory
  roomType           String    // SINGLE, DOUBLE, DORMITORY
  bedCount           Int

  // Features
  hasAttachedBath    Boolean   @default(false)
  hasKitchen         Boolean   @default(false)
  hasFurniture       Boolean   @default(true)
  amenities          String[]  // AC, TV, WiFi, etc.

  // Operational
  checkInTime        String?   // HH:MM
  checkOutTime       String?   // HH:MM
  maxStayDays        Int?      // Maximum consecutive stay
  dailyRate          Float     // Cost per day/night

  // Status
  isActive           Boolean   @default(true)
  isMaintenance      Boolean   @default(false)

  // Bookings
  bookings           GuestHouseBooking[]

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@unique([hostelId, name])
  @@index([hostelId])
}
```

#### GuestHouseBooking Model (NEW - CRITICAL)
```prisma
model GuestHouseBooking {
  id                  String    @id @default(uuid())

  guestHouseId        String
  guestHouse         GuestHouse @relation(fields: [guestHouseId], references: [id], onDelete: Cascade)

  // Guest Details
  guestName          String
  relationship       String     // PARENT, RELATIVE, FRIEND, OTHER
  contactNumber      String
  email              String?

  // Related Student (if applicable)
  studentId          String?
  student            Student?   @relation(fields: [studentId], references: [id])

  // Booking Details
  checkInDate        DateTime
  checkOutDate       DateTime
  numberOfNights     Int        // Calculated from dates
  numberOfGuests     Int

  // Cost & Payment
  dailyRate          Float
  totalCost          Float      // Calculated: dailyRate * numberOfNights
  advancePaid        Float      @default(0)
  balanceDue         Float      // Calculated: totalCost - advancePaid

  // Status
  bookingStatus      String     @default("PENDING") // PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED

  // Approval (NEW)
  approvedBy         String?
  approvalDate       DateTime?

  // Check-in/out
  actualCheckInTime  DateTime?
  actualCheckOutTime DateTime?

  // Notes
  remarks            String?
  specialRequests    String?

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@index([guestHouseId])
  @@index([studentId])
  @@index([bookingStatus])
  @@index([checkInDate])
}
```

#### HostelBilling Model (NEW - CRITICAL - LINKS TO FINANCE)
```prisma
model HostelBilling {
  id                  String    @id @default(uuid())

  allocationId        String
  allocation          RoomAllocation @relation(fields: [allocationId], references: [id])

  hostelId            String
  hostel              Hostel    @relation(fields: [hostelId], references: [id])

  studentId           String
  student             Student   @relation(fields: [studentId], references: [id])

  // Billing Period
  billingMonth        Int       // 1-12
  billingYear         Int
  billingDate         DateTime  @default(now())

  // Fees (from HostelFee)
  hostelFeeAmount     Float
  additionalCharges   Float     @default(0) // Guest house, extra amenities, etc.
  discount            Float     @default(0)

  totalAmount         Float     // Calculated: hostelFeeAmount + additionalCharges - discount
  paidAmount          Float     @default(0)
  balanceDue          Float     // Calculated: totalAmount - paidAmount

  // Status
  status              String    @default("PENDING") // PENDING, PARTIAL, PAID, OVERDUE
  dueDate             DateTime?
  paidDate            DateTime?

  // Payment Details
  paymentMethod       String?   // CASH, CHEQUE, BANK_TRANSFER, ONLINE
  transactionId       String?

  // Finance Integration (NEW - CRITICAL)
  invoiceId           String?   // Link to Finance Invoice
  linkedToFinance     Boolean   @default(false)

  remarks             String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([allocationId, billingMonth, billingYear])
  @@index([status])
  @@index([studentId])
  @@index([hostelId])
}
```

#### ViolationAppeal Model (NEW)
```prisma
model ViolationAppeal {
  id                  String    @id @default(uuid())

  violationId         String
  violation           HostelViolation @relation(fields: [violationId], references: [id], onDelete: Cascade)

  studentId           String
  student             Student   @relation(fields: [studentId], references: [id])

  // Appeal Details
  appealReason        String    // Explanation for appeal
  supportingDocs      String[]  // URLs to documents (proofs, etc.)

  // Submission
  submittedDate       DateTime  @default(now())

  // Review
  status              String    @default("PENDING") // PENDING, ACCEPTED, REJECTED
  reviewedBy          String?
  reviewDate          DateTime?
  reviewRemarks       String?

  // Outcome
  actionTaken         String?   // What was changed (e.g., fine reduced, warning removed)
  newPenalty          String?   // If penalty was modified

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([violationId])
  @@index([studentId])
  @@index([status])
}
```

---

## API Endpoints

### Hostel Management Endpoints
```
GET    /api/v1/hostels                    - Get all hostels
POST   /api/v1/hostels                    - Create new hostel
GET    /api/v1/hostels/{id}               - Get hostel details
PUT    /api/v1/hostels/{id}               - Update hostel information
DELETE /api/v1/hostels/{id}               - Deactivate hostel
GET    /api/v1/hostels/{id}/statistics   - Get hostel statistics (occupancy, fees collected, violations)
GET    /api/v1/hostels/{id}/occupancy    - Get current occupancy details
```

### Room Management Endpoints
```
GET    /api/v1/rooms                      - Get all rooms (with filters)
POST   /api/v1/rooms                      - Create new room
GET    /api/v1/rooms/{id}                 - Get room details
PUT    /api/v1/rooms/{id}                 - Update room information
DELETE /api/v1/rooms/{id}                 - Delete room
GET    /api/v1/rooms/hostel/{hostelId}   - Get rooms by hostel
GET    /api/v1/rooms/available            - Get available rooms (by type, capacity)
```

### Room Allocation Endpoints
```
GET    /api/v1/allocations                - Get all allocations (with filters)
POST   /api/v1/allocations                - Allocate room to student
GET    /api/v1/allocations/{id}           - Get allocation details
PUT    /api/v1/allocations/{id}           - Update allocation
DELETE /api/v1/allocations/{id}           - Deallocate (vacate) student
GET    /api/v1/allocations/student/{id}  - Get student's allocations
GET    /api/v1/allocations/room/{id}     - Get room's allocation history
```

### Room Inspection Endpoints (NEW)
```
GET    /api/v1/inspections                - Get all inspections (with filters: type, status, date range)
POST   /api/v1/inspections                - Create room inspection
GET    /api/v1/inspections/{id}           - Get inspection details
PUT    /api/v1/inspections/{id}           - Update inspection
GET    /api/v1/rooms/{id}/inspections     - Get inspection history for a room
GET    /api/v1/inspections/type/{type}   - Get inspections by type (PRE_ALLOCATION, POST_CHECKOUT, QUARTERLY, etc.)
GET    /api/v1/inspections/report        - Generate inspection report (damage summary, status, recommendations)
POST   /api/v1/inspections/{id}/approve  - Approve inspection
GET    /api/v1/inspections/overdue        - Get overdue inspections
```

### Hostel Attendance Endpoints (NEW)
```
GET    /api/v1/attendance                 - Get attendance records (with filters: student, hostel, date range)
POST   /api/v1/attendance/checkin         - Record check-in with time
POST   /api/v1/attendance/checkout        - Record check-out with time
GET    /api/v1/attendance/{id}            - Get individual attendance record
PUT    /api/v1/attendance/{id}            - Update attendance record (for regularization)
GET    /api/v1/attendance/student/{id}   - Get student's attendance history
GET    /api/v1/attendance/curfew-violations - Get curfew violations (students checked in after curfew)
GET    /api/v1/attendance/daily/{date}    - Get daily hostel attendance report
GET    /api/v1/attendance/report          - Generate attendance analytics report (attendance %, late arrivals)
```

### Hostel Fee & Billing Endpoints (ENHANCED)
```
GET    /api/v1/hostel-fees                - Get all hostel fees
POST   /api/v1/hostel-fees                - Create fee structure
PUT    /api/v1/hostel-fees/{id}           - Update fee
DELETE /api/v1/hostel-fees/{id}           - Delete fee

GET    /api/v1/billing                    - Get hostel bills (with filters: student, status, date range)
POST   /api/v1/billing/generate           - Generate bills for students/semester
GET    /api/v1/billing/{id}               - Get billing details
PUT    /api/v1/billing/{id}               - Update bill status (PENDING, PARTIAL, PAID, OVERDUE)
PUT    /api/v1/billing/{id}/link-finance  - Link bill to Finance invoice (CRITICAL - NEW)
POST   /api/v1/billing/{id}/payment       - Record payment for bill
GET    /api/v1/billing/student/{id}      - Get student's billing history
GET    /api/v1/billing/outstanding        - Get outstanding bills (overdue)
GET    /api/v1/billing/collection-report  - Generate billing & collection report
GET    /api/v1/billing/finance-sync       - Get billing sync status with Finance module
```

### Hostel Rules & Violations Endpoints
```
GET    /api/v1/hostel-rules               - Get hostel rules
POST   /api/v1/hostel-rules               - Create rule
PUT    /api/v1/hostel-rules/{id}          - Update rule

GET    /api/v1/violations                 - Get all violations (with filters: student, hostel, date range)
POST   /api/v1/violations                 - Record violation
GET    /api/v1/violations/{id}            - Get violation details
PUT    /api/v1/violations/{id}            - Update violation status
```

### Violation Appeal Endpoints (NEW)
```
GET    /api/v1/appeals                    - Get all appeals (with filters: status, student, date range)
POST   /api/v1/violations/{id}/appeal     - Submit appeal for violation
GET    /api/v1/appeals/{id}               - Get appeal details
PUT    /api/v1/appeals/{id}               - Update appeal (add review details)
PUT    /api/v1/appeals/{id}/review        - Review appeal (approve/reject with action)
GET    /api/v1/appeals/student/{id}      - Get student's appeals history
GET    /api/v1/appeals/pending             - Get pending appeals for review
```

### Guest House & Visitor Management Endpoints (ENHANCED)
```
GET    /api/v1/guest-houses               - Get all guest houses
POST   /api/v1/guest-houses               - Create guest house
GET    /api/v1/guest-houses/{id}          - Get guest house details
PUT    /api/v1/guest-houses/{id}          - Update guest house

GET    /api/v1/guest-bookings             - Get guest house bookings (with filters: status, date range)
POST   /api/v1/guest-bookings             - Create booking request (PENDING)
GET    /api/v1/guest-bookings/{id}        - Get booking details
PUT    /api/v1/guest-bookings/{id}        - Update booking details
PUT    /api/v1/guest-bookings/{id}/approve - Approve booking (by warden)
PUT    /api/v1/guest-bookings/{id}/checkin - Check-in guest
PUT    /api/v1/guest-bookings/{id}/checkout - Check-out guest
POST   /api/v1/guest-bookings/{id}/payment - Record payment
GET    /api/v1/guest-bookings/student/{id} - Get student's bookings
GET    /api/v1/guest-bookings/report      - Generate guest house occupancy report

GET    /api/v1/visitors                   - Get visitor logs (with filters: student, date range)
POST   /api/v1/visitors/request           - Request visitor approval (NEW - approval workflow)
GET    /api/v1/visitors/requests          - Get pending visitor approval requests
PUT    /api/v1/visitors/{id}/approve      - Approve visitor request (NEW - warden action)
PUT    /api/v1/visitors/{id}/reject       - Reject visitor request (NEW)
POST   /api/v1/visitors/check-in          - Check-in visitor (after approval)
PUT    /api/v1/visitors/{id}/check-out    - Check-out visitor
GET    /api/v1/visitors/hostel/{id}      - Get visitor history for hostel
GET    /api/v1/visitors/report            - Generate visitor log report
```

### Complaints Endpoints
```
GET    /api/v1/complaints                 - Get all complaints (with filters: status, hostel, date range)
POST   /api/v1/complaints                 - Lodge complaint
GET    /api/v1/complaints/{id}            - Get complaint details
PUT    /api/v1/complaints/{id}            - Update complaint
PUT    /api/v1/complaints/{id}/resolve    - Mark complaint as resolved
```

### Leave Application Endpoints
```
GET    /api/v1/hostel-leave               - Get leave applications (with filters: status, student)
POST   /api/v1/hostel-leave               - Apply for hostel leave
GET    /api/v1/hostel-leave/{id}          - Get leave details
PUT    /api/v1/hostel-leave/{id}/approve  - Approve leave
PUT    /api/v1/hostel-leave/{id}/reject   - Reject leave
```

### Notice & Announcement Endpoints
```
GET    /api/v1/notices                    - Get hostel notices
POST   /api/v1/notices                    - Create notice
PUT    /api/v1/notices/{id}               - Update notice
DELETE /api/v1/notices/{id}               - Delete notice
```

### Maintenance Endpoints
```
GET    /api/v1/maintenance                - Get maintenance requests
POST   /api/v1/maintenance                - Create maintenance request
PUT    /api/v1/maintenance/{id}           - Update request status
```

---

## Backend Implementation

### Directory Structure
```
backend/src/
├── controllers/
│   ├── hostel.controller.ts
│   ├── room.controller.ts
│   ├── room-allocation.controller.ts
│   ├── room-inspection.controller.ts (NEW)
│   ├── hostel-attendance.controller.ts (NEW)
│   ├── guest-house.controller.ts (NEW)
│   ├── guest-house-booking.controller.ts (NEW)
│   ├── hostel-billing.controller.ts (NEW)
│   ├── hostel-fee.controller.ts
│   ├── hostel-violation.controller.ts
│   ├── violation-appeal.controller.ts (NEW)
│   ├── hostel-complaint.controller.ts
│   ├── hostel-visitor.controller.ts (UPDATED)
│   ├── hostel-leave.controller.ts
│   └── hostel-notice.controller.ts
├── services/
│   ├── hostel.service.ts
│   ├── room.service.ts
│   ├── room-allocation.service.ts
│   ├── room-inspection.service.ts (NEW)
│   ├── hostel-attendance.service.ts (NEW)
│   ├── guest-house.service.ts (NEW)
│   ├── guest-house-booking.service.ts (NEW)
│   ├── hostel-billing.service.ts (NEW)
│   ├── hostel-fee.service.ts
│   ├── hostel-violation.service.ts
│   ├── violation-appeal.service.ts (NEW)
│   ├── hostel-complaint.service.ts
│   ├── hostel-visitor.service.ts (UPDATED)
│   ├── hostel-leave.service.ts
│   └── hostel-notice.service.ts
├── routes/
│   ├── hostel.routes.ts
│   ├── room.routes.ts
│   ├── allocations.routes.ts
│   ├── inspections.routes.ts (NEW)
│   ├── attendance.routes.ts (NEW)
│   ├── guest-houses.routes.ts (NEW)
│   ├── guest-bookings.routes.ts (NEW)
│   ├── billing.routes.ts (NEW)
│   ├── violations.routes.ts
│   ├── appeals.routes.ts (NEW)
│   ├── complaints.routes.ts
│   ├── visitors.routes.ts (UPDATED)
│   ├── leaves.routes.ts
│   └── notices.routes.ts
└── utils/
    ├── room-allocation.utils.ts (Assignment algorithms)
    ├── occupancy.utils.ts (Occupancy calculations)
    ├── room-inspection.utils.ts (NEW - Inspection scoring, damage assessment)
    ├── attendance.utils.ts (NEW - Curfew time tracking, violation detection)
    ├── billing.utils.ts (NEW - Bill generation, calculation, Finance sync)
    ├── guest-booking.utils.ts (NEW - Cost calculation, room availability)
    └── appeal.utils.ts (NEW - Appeal workflow validation, penalty updates)
```

### New Service Implementations Required

#### room-inspection.service.ts
```typescript
class RoomInspectionService {
  // Methods:
  - async createInspection(roomId, type, details): Create new inspection
  - async updateInspection(id, updates): Update existing inspection
  - async getInspectionsByRoom(roomId, filters): Get inspection history
  - async getInspectionsByType(type, filters): Get inspections by type
  - async generateInspectionReport(hostelId, dateRange): Generate report
  - async calculateInspectionScore(inspectionData): Score calculation (average of criteria)
  - async getOverdueInspections(): Get inspections overdue for completion
  - async approveInspection(id, approvedBy): Mark as approved
}
```

#### hostel-attendance.service.ts
```typescript
class HostelAttendanceService {
  // Methods:
  - async recordCheckIn(allocationId, timestamp): Record student check-in
  - async recordCheckOut(allocationId, timestamp): Record student check-out
  - async detectCurfewViolation(checkInTime, curfewTime): Check for violation
  - async getAttendanceHistory(studentId, dateRange): Get student attendance
  - async getCurfewViolations(hostelId, dateRange): Get curfew violations
  - async generateDailyReport(hostelDate): Generate daily attendance report
  - async generateAnalyticsReport(hostelId, dateRange): Generate analytics
  - async updateAttendanceForRegularization(id, newData): Regularize attendance
}
```

#### hostel-billing.service.ts (CRITICAL - FINANCE INTEGRATION)
```typescript
class HostelBillingService {
  // Methods:
  - async generateBills(hostelId, month, year): Generate monthly bills
  - async getBillDetails(billId): Get detailed bill info
  - async updateBillStatus(billId, newStatus): Update status
  - async linkBillToFinance(billId, invoiceId): Link to Finance invoice (CRITICAL)
  - async recordPayment(billId, amount, method): Record payment
  - async syncWithFinance(billId): Sync payment status to Finance module
  - async getOutstandingBills(hostelId, daysOverdue): Get overdue bills
  - async generateCollectionReport(hostelId, dateRange): Generate report
  - async calculateBillAmount(hostelId, studentId, month): Calculate bill
}
```

#### guest-house-booking.service.ts
```typescript
class GuestHouseBookingService {
  // Methods:
  - async createBooking(guestHouseId, guestInfo, dates): Create booking
  - async getAvailableRooms(guestHouseId, checkInDate, nights): Check availability
  - async calculateBookingCost(roomType, nights): Calculate total cost
  - async approveBooking(bookingId, approvedBy): Approve by warden
  - async updateBookingStatus(bookingId, newStatus): Update status
  - async checkInGuest(bookingId, actualTime): Record check-in
  - async checkOutGuest(bookingId, actualTime): Record check-out
  - async recordPayment(bookingId, amount): Record guest payment
}
```

#### violation-appeal.service.ts
```typescript
class ViolationAppealService {
  // Methods:
  - async submitAppeal(violationId, studentId, reason, docs): Submit appeal
  - async getStudentAppeals(studentId, filters): Get student's appeals
  - async getPendingAppeals(hostelId): Get pending appeals for review
  - async reviewAppeal(appealId, reviewedBy, decision, remarks): Review appeal
  - async updateViolationBasedOnAppeal(violationId, newPenalty): Update violation
  - async getAppealStats(hostelId, dateRange): Get appeal statistics
}
```

---

## Frontend Pages

### Dashboard
```
/dashboard/hostel/
├── Hostel Overview/Dashboard
│   ├── Key statistics (occupancy, fees, complaints, inspections overdue)
│   ├── Curfew violations this month
│   ├── Outstanding billing summary
│   ├── Pending appeals & approvals
│   ├── Upcoming events/notices
│   └── Quick actions (check-in, inspections, approvals)
```

### Hostel Management
```
/dashboard/hostel/hostels
├── Hostel list view
├── /dashboard/hostel/hostels/[id]
│   ├── Hostel details page
│   ├── Room management
│   ├── Staff management
│   ├── Fee structure
│   ├── Rules management
│   ├── Guest Houses (NEW)
│   └── Billing Summary (NEW)
└── Create/Edit hostel form
```

### Room Management
```
/dashboard/hostel/rooms
├── Room list (by hostel, with occupancy)
├── /dashboard/hostel/rooms/[id]
│   ├── Room details
│   ├── Current occupants
│   ├── Allocation history
│   ├── Maintenance requests
│   └── Inspection history (NEW)
└── Create/Edit room form
```

### Room Allocation
```
/dashboard/hostel/allocations
├── Current allocations list
├── /dashboard/hostel/allocations/[id]
│   ├── Allocation details
│   ├── Check-in/out history
│   ├── Violations for this allocation
│   ├── Attendance records (NEW)
│   └── Billing history (NEW)
└── New allocation form
```

### Room Inspections (NEW)
```
/dashboard/hostel/inspections
├── Inspections list (by type, status, room)
├── /dashboard/hostel/inspections/[id]
│   ├── Inspection details
│   ├── Scoring breakdown (1-5 ratings)
│   ├── Damage photos & notes
│   ├── Follow-up required items
│   └── Approval workflow
├── Create inspection form (PRE_ALLOCATION, POST_CHECKOUT, QUARTERLY, ANNUAL)
├── Inspection reports (by type, by room, by date range)
└── Overdue inspections list
```

### Hostel Attendance & Curfew (NEW)
```
/dashboard/hostel/attendance
├── Quick check-in/out interface (student barcode scan or manual)
├── Daily attendance report (for specific date)
├── Curfew violations log (students checked in late)
├── Student attendance history (by student)
├── Attendance analytics (attendance %, late patterns)
└── Regularization requests (for attendance updates)
```

### Guest House Management (NEW)
```
/dashboard/hostel/guest-houses
├── Guest House list view
├── /dashboard/hostel/guest-houses/[id]
│   ├── Guest house details
│   ├── Room details & amenities
│   ├── Current & upcoming bookings
│   └── Guest House rules
├── Create/Edit guest house form

/dashboard/hostel/guest-bookings
├── Bookings list (by status: PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT)
├── /dashboard/hostel/guest-bookings/[id]
│   ├── Booking details
│   ├── Guest information
│   ├── Cost breakdown
│   ├── Approval workflow (warden action)
│   ├── Check-in/out interface
│   ├── Payment recording
│   └── Status updates
├── Create booking form (student initiates)
├── Occupancy report
└── Booking calendar view
```

### Visitor Management (ENHANCED - NEW APPROVAL WORKFLOW)
```
/dashboard/hostel/visitors
├── Visitor approval requests list (PENDING status)
├── /dashboard/hostel/visitor-requests/[id]
│   ├── Visitor request details
│   ├── Approval/Rejection form (warden action)
│   └── Request history
├── Approved visitor log (with check-in/out times)
├── /dashboard/hostel/visitors/[id]
│   ├── Visitor check-in form (after approval)
│   ├── Check-out interface
│   └── Visitor history by student
├── Request visitor form (student initiates)
└── Visitor report (by hostel, by date range)
```

### Violations & Discipline
```
/dashboard/hostel/violations
├── Violations list (with filters: student, hostel, date range)
├── /dashboard/hostel/violations/[id]
│   ├── Violation details
│   ├── Penalty/Fine information
│   ├── Appeal submission form (student action - NEW)
│   └── Appeal status (if submitted)
└── Record violation form (warden action)
```

### Violation Appeals (NEW)
```
/dashboard/hostel/appeals
├── Appeals list (by status: PENDING, ACCEPTED, REJECTED)
├── /dashboard/hostel/appeals/[id]
│   ├── Appeal details
│   ├── Supporting documents view
│   ├── Review form (warden/admin action)
│   ├── Decision & remarks
│   └── Action taken on violation
├── Pending approvals view (for warden)
└── Appeal statistics & history
```

### Complaints
```
/dashboard/hostel/complaints
├── Complaints list (with status filter)
├── /dashboard/hostel/complaints/[id]
│   ├── Complaint details
│   ├── Status updates
│   └── Resolution notes
└── Lodge complaint form
```

### Hostel Billing (NEW)
```
/dashboard/hostel/billing
├── Bills list (by student, status, month)
├── /dashboard/hostel/billing/[id]
│   ├── Bill details with line items
│   ├── Fee breakdown (hostel fee, additional charges, discount)
│   ├── Payment recording interface
│   ├── Finance invoice link status (NEW)
│   └── Payment history
├── Outstanding bills (overdue tracking)
├── Billing & collection report
└── Finance sync status (NEW - shows if bills are linked to Finance invoices)
```

### Leave Applications
```
/dashboard/hostel/leave
├── Leave applications list (with status)
├── /dashboard/hostel/leave/[id]
│   ├── Application details
│   └── Approval form
└── Apply for leave form
```

### Notices
```
/dashboard/hostel/notices
├── Notice board (pinned items first)
├── Filter by type
└── Notice detail page (full content)
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Create all database models (Prisma migrations) - including new 7 models
- [ ] Create seed data for testing
- [ ] Implement Hostel CRUD operations
- [ ] Implement Room CRUD operations
- [ ] Create API routes for hostels and rooms
- [ ] Frontend: Hostel list and management pages
- [ ] Frontend: Room management pages

### Phase 2: Room Allocation (Week 3)
- [ ] Implement RoomAllocation CRUD
- [ ] Create room allocation algorithm/logic
- [ ] Implement check-in/check-out functionality
- [ ] Create API routes for allocations
- [ ] Frontend: Allocation management pages
- [ ] Frontend: Check-in/check-out interface

### Phase 3: Room Inspections (NEW - Week 4)
- [ ] Implement RoomInspection CRUD with scoring logic
- [ ] Create inspection type workflow (PRE_ALLOCATION, POST_CHECKOUT, QUARTERLY, ANNUAL)
- [ ] Implement photo upload for damage documentation
- [ ] Create inspection report generation
- [ ] Create API routes for inspections
- [ ] Frontend: Room inspection management & reporting pages
- [ ] Integrate inspection results with room allocation

### Phase 4: Hostel Attendance & Curfew (NEW - Week 5)
- [ ] Implement HostelAttendance check-in/check-out with timestamps
- [ ] Create curfew violation detection logic
- [ ] Implement attendance regularization workflow
- [ ] Create daily and analytics reports
- [ ] Create API routes for attendance
- [ ] Frontend: Quick check-in/out interface (barcode scanning ready)
- [ ] Frontend: Attendance tracking and violation reporting pages

### Phase 5: Fees & Billing (ENHANCED - Week 6)
- [ ] Implement enhanced Hostel Fee structure (now Hostel fees + Guest house + additional charges)
- [ ] Implement HostelBilling model and bill generation
- [ ] Create Finance module integration (invoice linking - CRITICAL)
- [ ] Implement bill payment recording
- [ ] Create billing collection reports
- [ ] Create API routes for billing
- [ ] Frontend: Enhanced billing management pages
- [ ] Finance sync verification

### Phase 6: Guest House Management (NEW - Week 7)
- [ ] Implement GuestHouse CRUD operations
- [ ] Implement GuestHouseBooking model with approval workflow
- [ ] Create cost calculation for different room types
- [ ] Implement booking status workflow (PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT)
- [ ] Create payment recording for guest bookings
- [ ] Create API routes for guest houses and bookings
- [ ] Frontend: Guest house management pages
- [ ] Frontend: Guest booking creation and approval workflow

### Phase 7: Visitor Management Enhancement (NEW - Week 8)
- [ ] Update HostelVisitor model with approval workflow
- [ ] Implement visitor request submission by students
- [ ] Implement warden approval/rejection workflow
- [ ] Create check-in/out functionality after approval
- [ ] Create visitor log and report generation
- [ ] Create API routes for visitor approvals
- [ ] Frontend: Visitor request form (student)
- [ ] Frontend: Visitor approval management (warden)
- [ ] Frontend: Visitor check-in/out interface

### Phase 8: Violations, Appeals & Complaints (ENHANCED - Week 9)
- [ ] Implement Violation tracking (existing)
- [ ] Implement ViolationAppeal model with full workflow
- [ ] Create appeal submission form (student action)
- [ ] Create appeal review & decision workflow (warden/admin action)
- [ ] Implement appeal-based penalty updates
- [ ] Implement Complaint system
- [ ] Create approval workflows
- [ ] Create API routes (updated with appeals)
- [ ] Frontend: Violation and appeal management pages
- [ ] Frontend: Complaint management pages

### Phase 9: Other Features (Week 10)
- [ ] Implement Leave applications
- [ ] Implement Notice board
- [ ] Implement Maintenance requests
- [ ] Create corresponding API routes and frontend pages
- [ ] Quality assurance for all features

### Phase 10: Testing & Integration (Week 11)
- [ ] Test all CRUD operations (including new models)
- [ ] Test complex workflows (room inspections, attendance tracking, billing, approvals, appeals)
- [ ] Test Finance module integration (invoice creation and sync)
- [ ] Test cross-module data consistency
- [ ] Add validations and error handling for all new features
- [ ] Performance testing and optimization
- [ ] Security testing (RBAC, data privacy)

### Phase 11: Documentation & Training (Week 12)
- [ ] Update API documentation
- [ ] Create user guides for each feature
- [ ] Document approval workflows and business rules
- [ ] Record demo videos for key features
- [ ] Train staff on new features (especially wardens and admin)

### Phase 12: Deployment & Post-Launch (Week 13)
- [ ] Data migration and seeding
- [ ] Staging environment testing
- [ ] Production deployment
- [ ] Post-launch support and bug fixes
- [ ] Gather user feedback
- [ ] Documentation refinements

---

## Business Logic

### Room Allocation Algorithm
1. Get all unallocated students for semester
2. Get available rooms with capacity
3. Match room type preferences with availability
4. Allocate by class/year priority
5. Consider gender-based rules
6. Ensure pre-allocation inspection is complete
7. Track allocation for fee billing and attendance

### Room Inspection Logic
```
Inspection Types:
1. PRE_ALLOCATION: Before student moves in
   - Check room cleanliness, furniture, fixtures
   - Document baseline condition
   - Student can only move in if APPROVED

2. POST_CHECKOUT: When student vacates
   - Check for damages beyond normal wear
   - Calculate damage charges if needed
   - Required before next student allocation

3. QUARTERLY: Every 3 months
   - Maintenance check
   - Safety inspection (fire exits, electrical, plumbing)
   - Preventive maintenance identification

4. ANNUAL: Yearly deep inspection
   - Complete overhaul assessment
   - Structural issues identification
   - Major repairs planning

Inspection Scoring:
- Each criterion (cleanliness, furniture, fixtures, plumbing, electrical, bedding) rated 1-5
- Overall Score = Average of all criteria (1-5 scale)
- Score ≥ 4: ACCEPTABLE
- Score 3-4: ACCEPTABLE with follow-up
- Score < 3: NOT ACCEPTABLE - requires action

Damage Assessment:
- If damage > threshold amount (configurable per hostel)
- Charge student for repairs
- Create maintenance request automatically
```

### Occupancy Calculation
```
Occupancy Percentage = (Current Students / Capacity) * 100
Available Capacity = Total Capacity - Current Students
Occupancy Status:
  - < 50% = UNDER_UTILIZED
  - 50-80% = HEALTHY
  - 80-95% = FULL
  - >= 95% = OVER_CAPACITY (if applicable)
```

### Hostel Attendance & Curfew Logic
```
Check-in/Check-out Tracking:
- Student checks in with time (automatic timestamp)
- Student checks out with time (automatic timestamp)
- System detects curfew violations automatically

Curfew Violation Detection:
- If check-in time > curfew time → VIOLATION
- Store violation flag in HostelAttendance record
- Can trigger hostel rule violation record

Attendance Calculation:
- Present = checked in on given day
- Absent = no check-in record
- Late Arrival = checked in after curfew time
- On Leave = have active leave application

Attendance Reports:
- Daily attendance: List of students checked in for a date
- Student history: Timeline of check-in/out for a student
- Violation report: All curfew violations (by date, student, hostel)
- Analytics: Attendance %, late arrival patterns, frequently late students
```

### Hostel Billing Logic (CRITICAL - FINANCE INTEGRATION)
```
Bill Generation:
1. For each student with active room allocation
2. Calculate billing month/year
3. Look up hostel fee from HostelFee
4. Add any additional charges (guest house, extra amenities, damage)
5. Apply discounts if any
6. Calculate total amount
7. Set due date based on fee configuration
8. Create HostelBilling record with status = PENDING

Bill Amount Calculation:
Hostel Fee Amount = Base Fee + (Room Type Premium if applicable)
Additional Charges = Guest house bookings + Damage charges + Extra amenities
Discount = Any configured discounts
Total Amount = Hostel Fee Amount + Additional Charges - Discount
Balance Due = Total Amount - Paid Amount

Bill Status Tracking:
- PENDING: Bill generated but no payment
- PARTIAL: Some payment received (paidAmount > 0 and < totalAmount)
- PAID: Full payment received (paidAmount = totalAmount)
- OVERDUE: Not paid by due date

CRITICAL - Finance Module Integration:
1. When bill is generated → Create invoice in Finance module
2. Link HostelBilling.invoiceId to Finance Invoice
3. Set linkedToFinance = true
4. When payment received → Update Finance module
5. Finance module handles actual payment tracking
6. Hostel module stays in sync with Finance payments

Late Fee Calculation (if configured):
Days Late = Current Date - Due Date
Late Fee = Days Late × Daily Late Fee Rate (if configured)
Updated Total Amount = Total Amount + Late Fee
```

### Guest House Booking Logic
```
Booking Status Workflow:
1. PENDING: Student requests booking
2. CONFIRMED: Warden approves booking (room assigned, dates locked)
3. CHECKED_IN: Guest checked in on arrival date
4. CHECKED_OUT: Guest checked out on departure date (complete)

Cost Calculation:
Daily Rate = Set per room type for guest house
Number of Nights = CheckOutDate - CheckInDate
Total Cost = Daily Rate × Number of Nights
Advance Paid = Student/Parent pays before check-in
Balance Due = Total Cost - Advance Paid

Room Availability Check:
- Before confirming booking
- Check if room has overlapping bookings
- Check room capacity
- Return available room count for requested dates

Booking Cancellation:
- If cancelled before check-in: Full refund (minus processing fee if configured)
- If cancelled after check-in: No refund for used nights
```

### Violation Appeal Logic
```
Appeal Workflow:
1. PENDING: Student submits appeal with reason and documents
2. SUBMITTED: Appeal received, waiting for review
3. ACCEPTED: Appeal approved - penalty reduced or waived
4. REJECTED: Appeal rejected - original penalty stands

Review Process:
- Warden/Admin reviews appeal
- Verifies supporting documents
- Makes decision (accept/reject)
- Documents decision and remarks
- If accepted: updates violation penalty

Appeal-Based Violation Updates:
If appeal is ACCEPTED:
- Update original HostelViolation record
- Change penalty amount (reduce or waive)
- Change status to reflect appeal outcome
- Add action taken note

Appeal Timeline:
- Initial submission: Student-initiated
- Review deadline: Should be within 7 days
- Final decision: Document decision and communicate to student
```

---

## Error Handling

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Room Allocation Errors
- **ROOM_FULL**: Room has reached maximum capacity
- **INVALID_ALLOCATION**: Student already allocated to another room
- **DUPLICATE_ENTRY**: Student already allocated for this period
- **INVALID_DATE_RANGE**: End date before start date
- **ROOM_NOT_AVAILABLE**: Room status is not AVAILABLE
- **PRE_ALLOCATION_INSPECTION_PENDING**: Room pre-allocation inspection not approved yet
- **OUTSTANDING_FEES**: Student has unpaid hostel fees
- **VIOLATION_UNRESOLVED**: Student has unresolved violations

### Room Inspection Errors (NEW)
- **INSPECTION_NOT_FOUND**: Inspection record not found
- **INSPECTION_TYPE_INVALID**: Invalid inspection type
- **INSPECTION_INCOMPLETE**: All criteria must be scored (1-5)
- **INSPECTION_APPROVAL_PENDING**: Inspection awaiting approval
- **ROOM_INSPECTION_OVERDUE**: Scheduled inspection overdue
- **DAMAGE_THRESHOLD_EXCEEDED**: Damage charges exceed configurable threshold
- **INVALID_INSPECTION_SCORE**: Inspection score out of range (1-5)

### Hostel Attendance Errors (NEW)
- **ATTENDANCE_NOT_FOUND**: Attendance record not found
- **DUPLICATE_CHECKIN**: Student already checked in for today
- **CHECKOUT_WITHOUT_CHECKIN**: Student cannot check out without check-in
- **FUTURE_DATE_ATTENDANCE**: Cannot record attendance for future date
- **CURFEW_VIOLATION_DETECTED**: Student checked in after curfew time
- **ATTENDANCE_REGULARIZATION_DENIED**: Request to regularize attendance denied
- **INVALID_ATTENDANCE_TIME**: Invalid check-in/out time

### Hostel Billing Errors (NEW - CRITICAL)
- **BILLING_NOT_FOUND**: Bill not found
- **BILL_ALREADY_PAID**: Bill is already paid (status = PAID)
- **INVALID_PAYMENT_AMOUNT**: Payment amount exceeds bill amount
- **FINANCE_SYNC_FAILED**: Failed to sync bill with Finance module (CRITICAL)
- **INVOICE_CREATION_FAILED**: Failed to create Finance invoice (CRITICAL)
- **INVOICE_LINK_FAILED**: Failed to link bill to Finance invoice
- **ALLOCATION_NOT_FOUND**: Room allocation not found for billing
- **INVALID_BILLING_MONTH**: Billing month/year is invalid
- **DUPLICATE_BILL**: Bill already exists for this allocation and period

### Guest House Booking Errors (NEW)
- **GUEST_HOUSE_NOT_FOUND**: Guest house not found
- **NO_ROOMS_AVAILABLE**: No rooms available for selected dates
- **INVALID_BOOKING_DATES**: Check-out date must be after check-in date
- **BOOKING_NOT_FOUND**: Booking not found
- **BOOKING_ALREADY_APPROVED**: Booking is already approved/confirmed
- **BOOKING_APPROVAL_REQUIRED**: Booking must be approved before check-in
- **GUEST_ALREADY_CHECKEDIN**: Guest already checked in
- **INVALID_CHECKOUT**: Guest must be checked in before check-out
- **ROOM_CAPACITY_EXCEEDED**: Number of guests exceeds room capacity
- **INVALID_ROOM_TYPE**: Invalid room type for guest house

### Violation Appeal Errors (NEW)
- **APPEAL_NOT_FOUND**: Appeal not found
- **VIOLATION_NOT_FOUND**: Violation not found
- **DUPLICATE_APPEAL**: Appeal already submitted for this violation
- **APPEAL_ALREADY_REVIEWED**: Appeal already reviewed (cannot change decision)
- **INVALID_APPEAL_STATUS**: Invalid appeal status value
- **INVALID_DECISION**: Invalid decision (must be ACCEPTED or REJECTED)
- **SUPPORTING_DOCS_REQUIRED**: Supporting documents required for appeal
- **REVIEW_PERIOD_EXPIRED**: Appeal review period has expired
- **NO_PENALTY_UPDATE_RIGHTS**: User does not have rights to update penalty

### Visitor Management Errors (NEW)
- **VISITOR_REQUEST_NOT_FOUND**: Visitor request not found
- **VISITOR_REQUEST_ALREADY_APPROVED**: Request already approved/rejected
- **VISITOR_APPROVAL_REQUIRED**: Visitor must be approved before check-in
- **VISITOR_ALREADY_CHECKEDIN**: Visitor already checked in
- **VISITOR_NOT_CHECKEDIN**: Visitor not checked in yet
- **INVALID_VISITOR_RELATIONSHIP**: Invalid visitor relationship type
- **VISITOR_REQUEST_EXPIRED**: Visitor request approval expired
- **DUPLICATE_VISITOR_REQUEST**: Pending request already exists for this visitor

---

## Security & Access Control

### Role-Based Access Control (RBAC)

**ADMIN Role**
- Full access to all hostel modules and data
- Can create/edit/delete hostels, rooms, fees, rules
- Can perform all inspections and approvals
- Can view all student data and payment records
- Can manage staff and access control
- Can review and approve appeals
- Can override any hostel operation

**HOSTEL_WARDEN Role**
- Full access to their assigned hostel only
- Can create/edit/delete rooms and allocations (for their hostel)
- Can record violations and manage complaints
- Can approve visitor requests
- Can approve guest house bookings
- Can review and approve violation appeals
- Can view all student data for their hostel
- Can generate hostel reports
- **CANNOT**: Create/delete hostels, manage other hostels, access Finance module

**HOSTEL_SUPERVISOR Role**
- Limited warden access
- Can view hostel data and records
- Can record check-in/out and attendance
- Can lodge complaints
- Can view violations (read-only)
- **CANNOT**: Approve violations, manage allocations, approve visitor requests

**STUDENT Role**
- Can view own room assignment and hostel details
- Can request visitor approval (NEW - approval workflow)
- Can view own violations (if any)
- Can submit violation appeals (NEW)
- Can lodge complaints
- Can apply for hostel leave
- Can request guest house booking (NEW)
- Can view own billing status (NEW)
- **CANNOT**: View other students' data, edit any records, approve anything

**PARENT Role**
- Can view child's hostel assignment and details
- Can view child's billing status (NEW)
- Can view child's violations (if any)
- **CANNOT**: Edit any data, lodge complaints, approve anything

### CRITICAL - Data Privacy & Security Restrictions

**Student Personal Data** (CRITICAL PROTECTION)
- Restrict to: Admin, Hostel Warden (for their hostel), Student (own data), Parent (child's data)
- **NEVER** expose student data to other students
- **ENCRYPT**: Phone numbers, email addresses in database
- **AUDIT**: All access to student personal data must be logged

**Violation & Discipline Records** (CONFIDENTIAL)
- Restrict to: Admin, Hostel Warden (for their hostel)
- **NEVER** expose to parents or other students
- Exceptions: Student can view own violations
- **AUDIT**: All access to violation records

**Payment & Billing Records** (SENSITIVE)
- Restrict to: Admin, Hostel Warden (for their hostel), Student (own billing), Parent (child's billing)
- **ENCRYPT**: Bank details, transaction IDs
- **AUDIT**: All payment transactions must be auditable
- **Finance Module**: Only authorized staff can access

**Room Inspection Reports** (CONFIDENTIAL)
- Restrict to: Admin, Hostel Warden (for their hostel)
- **NEVER** expose to students or parents
- Damage assessment photos restricted to facility management

**Appeal Records** (SENSITIVE)
- Restrict to: Admin, Hostel Warden (for their hostel), Student (own appeals)
- Supporting documents restricted to reviewers

**Visitor & Attendance Records** (RESTRICTED)
- Student can view own records
- Warden can view hostel records
- Detailed logs restricted to admin
- **AUDIT**: Curfew violations and late arrivals

**Guest House Records** (OPERATIONAL)
- Restrict to: Admin, Hostel Warden (for their hostel)
- Student can view own bookings
- **ENCRYPT**: Guest contact information

### CRITICAL - Finance Module Integration Security

**Finance API Access**
- Only backend services can call Finance APIs (never expose to frontend)
- Use service-to-service authentication (JWT with restricted scopes)
- All bill-to-invoice links must be validated before sync
- Payment sync must be one-way (Hostel → Finance only)

**Billing Authority**
- Only ADMIN and HOSTEL_WARDEN can generate bills
- Only ADMIN can link hostel bills to Finance invoices
- Payment updates from Finance must auto-update Hostel bills

**Audit Trail**
- All billing operations must be logged
- All Finance sync operations must be logged
- All payment records must be immutable (no editing, only corrections)

### Data Access Restrictions Summary Table

```
                  | Admin | Warden | Supervisor | Student | Parent
================================================================================
Room Allocation   | RWD   | RWD*   | R          | R-own   | R-own
Inspections       | RWD   | RWD*   | R          | N       | N
Attendance        | RWD   | RWD*   | R          | R-own   | N
Violations        | RWD   | RWD*   | R          | R-own   | N
Appeals           | RWD   | RWD*   | N          | RW-own  | N
Complaints        | RWD   | RWD*   | R          | RW-own  | N
Visitors          | RWD   | RWA*   | N          | RW-own  | N
Guest Bookings    | RWD   | RWA*   | N          | RW-own  | N
Billing           | RWD   | RWA*   | N          | R-own   | R-own
Guest Houses      | RWD   | RWD*   | N          | N       | N

Legend:
R = Read, W = Write, D = Delete, A = Approve, * = For own hostel only
N = No Access
R-own = Read own records only
RW-own = Read & Write own records only
RWA = Read, Write, and Approve
```

---

## Related Documentation
- [Database Schema](./DATABASE.md)
- [API Standards](./API_STANDARDS.md)
- [Finance Module](./FINANCE_MODULE.md) - For fee integration
