# HR Module Documentation

## Overview

The HR Module is responsible for managing all human resources related functions including employee management, payroll, attendance, leave management, performance evaluation, and employee information. The module is designed to handle school staff including teachers, administrators, and support staff.

**Current Status**: Partially Implemented (Attendance & Leave only)
**Completion**: ~30%

---

## Table of Contents

1. [Module Features](#module-features)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Pages](#frontend-pages)
6. [Implementation Checklist](#implementation-checklist)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)

---

## Module Features

### Implemented Features ✅
- Teacher Attendance Tracking
- Leave Management with approval workflow
- Attendance History and Reports

### Pending Implementation 🔄
- Employee Records & Profiles with document storage (PAN, Aadhar, Bank details)
- Salary & Payroll Management with detailed calculations (Basic, DA, HRA, etc.)
- Salary Slip Generation and distribution
- Performance Evaluation with rating system
- Performance Review Cycle management
- Employee Directory with org chart
- Designation & Hierarchy Management
- Leave Balance Tracking with carry-over logic (NEW - CRITICAL)
- Attendance Regularization workflow (NEW - CRITICAL)
- Employee Qualifications & Certifications tracking (NEW)
- Promotion and Transfer management (NEW)
- Employee Separations & Final Settlement (NEW - CRITICAL)
- Salary Revisions with history tracking (NEW - CRITICAL)
- Employee Exit Management with checklist (NEW - CRITICAL)
- HR Analytics & Reports
- Disciplinary action records
- Compliance & Statutory tracking
- HR Dashboard with KPIs

---

## Database Schema

### Existing Models

#### 1. Teacher Model
```prisma
model Teacher {
  id                  String    @id @default(uuid())
  userId              String    @unique
  user                User      @relation(fields: [userId], references: [id])

  // Personal Information
  firstName           String
  lastName            String
  email              String    @unique
  phone              String?
  dateOfBirth        DateTime?
  gender             String?   // MALE, FEMALE, OTHER

  // Professional Information
  employeeNo         String    @unique
  designationId      String?
  departmentId       String
  department         Department @relation(fields: [departmentId], references: [id])
  joiningDate        DateTime

  // Status & Qualifications
  isActive           Boolean   @default(true)
  qualifications     String?   // JSON array of qualifications
  experience         Int?      // Years of experience

  // Relationships
  subjects           ClassSubject[]
  timetableSlots     TimetableSlot[]
  examInvigilations  ExamInvigilation[]
  attendance         TeacherAttendance[]
  leaves             Leave[]

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

#### 2. Department Model
```prisma
model Department {
  id                  String    @id @default(uuid())
  name               String    @unique
  code               String    @unique
  description        String?
  headId             String?   // Reference to teacher leading department

  // Relationships
  teachers           Teacher[]

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

#### 3. TeacherAttendance Model
```prisma
model TeacherAttendance {
  id                  String    @id @default(uuid())
  teacherId           String
  teacher             Teacher   @relation(fields: [teacherId], references: [id])

  date               DateTime
  status             String    // PRESENT, ABSENT, LEAVE, LATE, HALF_DAY

  // Attendance details
  checkInTime        DateTime?
  checkOutTime       DateTime?
  remarks            String?

  // Location tracking (optional)
  latitude           Float?
  longitude          Float?

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@unique([teacherId, date])
  @@index([date])
}
```

#### 4. Leave Model
```prisma
model Leave {
  id                  String    @id @default(uuid())
  teacherId           String
  teacher             Teacher   @relation(fields: [teacherId], references: [id])

  // Leave Details
  leaveType           String    // CASUAL, MEDICAL, EARNED, UNPAID, STUDY, EMERGENCY
  fromDate            DateTime
  toDate              DateTime
  totalDays           Int

  // Status & Approval
  status              String    @default("PENDING") // PENDING, APPROVED, REJECTED, CANCELLED
  reason              String
  appliedDate         DateTime  @default(now())

  // Approval Chain
  approvedById        String?
  approvedBy          User?     @relation("LeaveApprovedBy", fields: [approvedById], references: [id])
  approvalDate        DateTime?
  approvalRemarks     String?

  // Document Support
  documentUrl         String?   // For medical leave etc.

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([teacherId])
  @@index([status])
}
```

### Models to be Implemented 🔄

#### Employee Model (NEW)
```prisma
model Employee {
  id                  String    @id @default(uuid())
  userId              String    @unique
  user                User      @relation(fields: [userId], references: [id])

  // Personal Info
  firstName           String
  lastName            String
  email              String    @unique
  phone              String
  dateOfBirth        DateTime
  gender             String
  address            String?
  city               String?
  state              String?
  zipCode            String?

  // Professional Info
  employeeNo         String    @unique
  employmentType     String    // FULL_TIME, PART_TIME, CONTRACT, INTERN
  designationId      String
  designation        Designation @relation(fields: [designationId], references: [id])
  departmentId       String
  department         Department @relation(fields: [departmentId], references: [id])
  reportingToId      String?    // Manager/Superior
  reportingTo        Employee?  @relation("ManagerOf", fields: [reportingToId], references: [id])
  subordinates       Employee[] @relation("ManagerOf")

  // Dates
  joiningDate        DateTime
  exitDate           DateTime?

  // Compensation (linked to Salary model)
  basicSalary        Float?
  salaryGrade        String?
  salaryEffectiveFrom DateTime?

  // Status
  status             String    @default("ACTIVE") // ACTIVE, INACTIVE, TERMINATED, ON_LEAVE
  isActive           Boolean   @default(true)

  // Documents
  panNumber          String?
  aadharNumber       String?
  bankAccountNumber  String?
  bankIfscCode       String?

  // Relationships
  salaries           Salary[]
  payslips           Payslip[]
  performances       PerformanceReview[]
  disciplinaryActions DisciplinaryAction[]
  promotions         EmployeePromotion[]
  transfers          EmployeeTransfer[]
  separations        EmployeeSeparation[]
  qualifications     EmployeeQualification[]
  leaveBalance       LeaveBalance[]
  attendanceRegularization AttendanceRegularization[]
  salaryRevisions    SalaryRevision[]
  gratuity           Gratuity?
  exitChecklist      ExitChecklist[]

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

#### Salary Model (NEW)
```prisma
model Salary {
  id                  String    @id @default(uuid())
  employeeId          String
  employee            Employee  @relation(fields: [employeeId], references: [id])

  // Salary Components
  basicSalary         Float
  dearness            Float    @default(0)
  houseRent           Float    @default(0)
  conveyance          Float    @default(0)
  medical             Float    @default(0)
  otherAllowances     Float    @default(0)

  grossSalary         Float    // Calculated: sum of all allowances

  // Deductions
  pf                  Float    @default(0)     // Provident Fund
  esi                 Float    @default(0)    // Employee State Insurance
  professionalTax     Float    @default(0)
  incomeTax           Float    @default(0)
  otherDeductions     Float    @default(0)

  totalDeductions     Float    // Calculated
  netSalary           Float    // Calculated: grossSalary - totalDeductions

  // Period
  month               Int      // 1-12
  year                Int
  effectiveFrom       DateTime
  effectiveUpto       DateTime?

  // Status
  status              String   @default("ACTIVE") // ACTIVE, INACTIVE, MODIFIED

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([employeeId, month, year])
  @@index([employeeId])
}
```

#### Payslip Model (NEW)
```prisma
model Payslip {
  id                  String    @id @default(uuid())
  employeeId          String
  employee            Employee  @relation(fields: [employeeId], references: [id])

  // Period
  month               Int
  year                Int

  // Components (from current Salary record)
  basicSalary         Float
  dearness            Float
  houseRent           Float
  conveyance          Float
  medical             Float
  otherAllowances     Float
  grossSalary         Float

  // Attendance Impact
  workingDays         Int
  daysPresent         Int
  daysAbsent          Int

  // Adjustments
  bonus               Float    @default(0)
  advance             Float    @default(0)
  loanDeduction       Float    @default(0)

  // Deductions
  pf                  Float
  esi                 Float
  professionalTax     Float
  incomeTax           Float
  otherDeductions     Float
  totalDeductions     Float

  // Final Amount
  netPayable          Float    // grossSalary - totalDeductions + bonus - advance

  // Status
  status              String   @default("DRAFT") // DRAFT, FINALIZED, PAID, CANCELLED
  paidDate            DateTime?

  // PDF/Document
  documentUrl         String?  // URL to generated payslip PDF

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([employeeId, month, year])
  @@index([status])
}
```

#### PerformanceReview Model (UPDATED)
```prisma
model PerformanceReview {
  id                  String    @id @default(uuid())
  employeeId          String
  employee            Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  // Review Cycle (NEW - link to review cycle)
  reviewCycleId       String
  reviewCycle         ReviewCycle @relation(fields: [reviewCycleId], references: [id])

  // Review Period
  reviewPeriod        String   // "Q1 2024", "Annual 2024", etc.
  year                Int
  quarter             Int?     // 1-4 for quarterly reviews

  // Ratings (1-5 scale)
  technicalSkills     Int
  communication       Int
  teamwork            Int
  initiative          Int
  reliability         Int
  customerService     Int?

  overallRating       Float    // Average of all ratings

  // Review Details
  strengths           String?  // JSON array or text
  weaknesses          String?
  developmentAreas    String?
  comments            String?

  // Reviewer
  reviewedById        String
  reviewedBy          User     @relation(fields: [reviewedById], references: [id])
  reviewDate          DateTime

  // Action Items
  trainingNeeded      String?
  promotionEligible   Boolean  @default(false)
  raisesPercentage    Float?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([employeeId, reviewCycleId])
  @@index([employeeId])
  @@index([year])
}
```

#### Designation Model (NEW)
```prisma
model Designation {
  id                  String    @id @default(uuid())
  name               String    @unique
  code               String    @unique
  description        String?

  // Hierarchy
  level              Int       // 1=Senior, 2=Middle, 3=Junior
  parentDesignationId String?
  parentDesignation  Designation? @relation("DesignationHierarchy", fields: [parentDesignationId], references: [id])
  subordinateDesignations Designation[] @relation("DesignationHierarchy")

  // Salary Info
  minSalary          Float?
  maxSalary          Float?
  standardSalary     Float?

  // Relationships
  employees          Employee[]

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

#### DisciplinaryAction Model (NEW)
```prisma
model DisciplinaryAction {
  id                  String    @id @default(uuid())
  employeeId          String
  employee            Employee  @relation(fields: [employeeId], references: [id])

  actionType         String    // VERBAL_WARNING, WRITTEN_WARNING, SUSPENSION, TERMINATION, MEMO
  description        String
  reason             String

  actionDate         DateTime
  effectiveFrom      DateTime
  effectiveUpto      DateTime?

  status             String    @default("ACTIVE") // ACTIVE, CLOSED, APPEALED

  // Approval
  approvedById       String?
  approvedBy         User?     @relation(fields: [approvedById], references: [id])
  approvalDate       DateTime?

  documentUrl        String?   // Link to official document

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@index([employeeId])
}
```

#### LeaveBalance Model (NEW - CRITICAL)
```prisma
model LeaveBalance {
  id                  String    @id @default(uuid())

  employeeId          String
  employee            Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  // Academic Year
  academicYear        String    // e.g., "2024-2025"
  academicYearId      String?

  // Leave Type Balances
  casualLeave         Float     @default(0)   // Total days
  earnedLeave         Float     @default(0)   // Total days
  medicalLeave        Float     @default(0)   // Total days
  unpaidLeave         Float     @default(0)   // Total days
  studyLeave          Float     @default(0)   // Total days
  maternityLeave      Float     @default(0)   // Total days
  paternity Leave     Float     @default(0)   // Total days
  bereavement Leave   Float     @default(0)   // Total days

  // Used & Available
  casualLeaveUsed     Float     @default(0)
  earnedLeaveUsed     Float     @default(0)
  medicalLeaveUsed    Float     @default(0)
  unpaidLeaveUsed     Float     @default(0)

  // Carry Over (from previous year)
  carryOverDays       Float     @default(0)
  carryOverExpiry     DateTime? // Date after which carry over is forfeited
  carryOverUsed       Float     @default(0)

  // Calculation
  lastCalculatedDate  DateTime? // When balances were last calculated
  nextCalculationDate DateTime? // When next calculation is due (quarterly/annually)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([employeeId, academicYear])
  @@index([employeeId])
}
```

#### AttendanceRegularization Model (NEW - CRITICAL)
```prisma
model AttendanceRegularization {
  id                  String    @id @default(uuid())

  employeeId          String
  employee            Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  // Original Record
  originalDate        DateTime
  originalStatus      String    // What was marked (ABSENT, LATE, etc.)

  // Requested Change
  requestedStatus     String    // What employee wants (PRESENT, LEAVE, etc.)
  reason              String    // Explanation for regularization
  supportingDoc       String?   // URL to supporting document

  // Approval Workflow
  status              String    @default("PENDING") // PENDING, APPROVED, REJECTED
  requestedDate       DateTime  @default(now())

  approvedById        String?
  approvedBy          User?     @relation(fields: [approvedById], references: [id])
  approvalDate        DateTime?
  approvalRemarks     String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([employeeId, originalDate])
  @@index([status])
  @@index([originalDate])
}
```

#### EmployeeQualification Model (NEW - CRITICAL)
```prisma
model EmployeeQualification {
  id                  String    @id @default(uuid())

  employeeId          String
  employee            Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  // Qualification Details
  qualificationType   String    // DEGREE, DIPLOMA, CERTIFICATION, PROFESSIONAL
  qualificationName   String    // "B.Tech", "M.A.", "B.Ed", etc.
  institution         String    // University/Institute name
  fieldOfStudy        String?   // Subject specialization

  // Dates
  startDate           DateTime?
  endDate             DateTime?
  completionDate      DateTime

  // Grade/Score
  grade               String?   // Grade or CGPA
  percentageObtained  Float?

  // Verification
  certificateUrl      String?   // URL to certificate document
  isVerified          Boolean   @default(false)
  verificationDate    DateTime?
  verifiedBy          String?   // User ID

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([employeeId])
}
```

#### EmployeePromotion Model (NEW - CRITICAL)
```prisma
model EmployeePromotion {
  id                  String    @id @default(uuid())

  employeeId          String
  employee            Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  // Previous Role
  previousDesignationId String
  previousDesignation String
  previousDepartmentId  String?
  previousDepartment    String?
  previousSalary      Float?

  // New Role
  newDesignationId    String
  newDesignation      String
  newDepartmentId     String?
  newDepartment       String?
  newSalary           Float?

  // Promotion Details
  promotionDate       DateTime
  promotionReason     String?
  performanceRating   Float?    // From performance review

  // Approval
  approvedById        String?
  approvedBy          User?     @relation(fields: [approvedById], references: [id])
  approvalDate        DateTime?

  // Status
  status              String    @default("APPROVED") // PROPOSED, APPROVED, REJECTED, ACTIVE
  effectiveFrom       DateTime

  documentUrl         String?   // Official promotion letter

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([employeeId])
  @@index([promotionDate])
}
```

#### EmployeeTransfer Model (NEW)
```prisma
model EmployeeTransfer {
  id                  String    @id @default(uuid())

  employeeId          String
  employee            Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  // From Location/Department
  fromDepartmentId    String
  fromDepartment      String
  fromLocation        String?

  // To Location/Department
  toDepartmentId      String
  toDepartment        String
  toLocation          String?

  // Transfer Details
  transferDate        DateTime
  transferReason      String
  initiatedBy         String?   // Who initiated transfer

  // Approval
  approvedById        String?
  approvedBy          User?     @relation(fields: [approvedById], references: [id])
  approvalDate        DateTime?

  // Status
  status              String    @default("PENDING") // PENDING, APPROVED, REJECTED, COMPLETED

  // Documents
  transferOrder       String?   // URL to official order

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([employeeId])
  @@index([transferDate])
}
```

#### EmployeeSeparation Model (NEW - CRITICAL - FINAL SETTLEMENT)
```prisma
model EmployeeSeparation {
  id                  String    @id @default(uuid())

  employeeId          String
  employee            Employee  @relation(fields: [employeeId], references: [id])

  // Separation Details
  separationDate      DateTime
  separationType      String    // RESIGNATION, RETIREMENT, TERMINATION, REDUNDANCY, DEATH, OTHER
  reason              String
  reasonDescription   String?

  // Notice & Effective
  noticeDate          DateTime?
  noticePeriod        Int?      // days
  effectiveDate       DateTime

  // Last Salary Info
  lastSalaryMonth     Int?
  lastSalaryYear      Int?

  // Final Settlement
  finalSettlementAmount Float?  // Total final amount
  fulFinalSettlement  Boolean   @default(false)

  // Calculation Breakup
  basicSalaryDue      Float?    // Pro-rata salary
  allowancesDue       Float?
  earnedLeavePayout   Float?    // Encashment of earned leave
  gratuity            Float?    // As per policy
  bonusAdjustment     Float?
  loanRecovery        Float?    // Any pending loans
  otherAdjustments    Float?

  settlementStatus    String    @default("PENDING") // PENDING, INITIATED, PARTIAL, COMPLETE
  settlementDate      DateTime?

  // Clearance
  exitChecklistId     String?
  exitChecklist       ExitChecklist? @relation(fields: [exitChecklistId], references: [id])

  // Full & Final Settlement
  ffsApprovedBy       String?
  ffsApprovalDate     DateTime?

  // Experience Certificate
  certIssuanceDate    DateTime?
  certDocumentUrl     String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([employeeId])
  @@index([separationDate])
}
```

#### ExitChecklist Model (NEW - CRITICAL)
```prisma
model ExitChecklist {
  id                  String    @id @default(uuid())

  employeeId          String
  employee            Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  separationId        String
  separation          EmployeeSeparation @relation(fields: [separationId], references: [id], onDelete: Cascade)

  // Physical Items Return
  idCardReturned      Boolean   @default(false)
  accessCardsReturned Boolean   @default(false)
  officeKeysReturned  Boolean   @default(false)
  laptopReturned      Boolean   @default(false)
  phoneReturned       Boolean   @default(false)
  otherItemsReturned  String?   // List of other items

  // Financial Clearance
  libraryBookClearance Boolean @default(false)
  accountsClearance   Boolean   @default(false)  // Check for pending advances/dues
  noOutstandingFines  Boolean   @default(false)

  // Administrative
  documentHandover    Boolean   @default(false)  // All documents handed over
  leaveAdjustment     Boolean   @default(false)  // Leave calculated and adjusted
  confidentialityAck  Boolean   @default(false)  // Signed NDA/Confidentiality

  // Approval
  checkedBy           String?   // User who verified
  checkedDate         DateTime?
  approvedBy          String?   // Final approval
  approvalDate        DateTime?

  // Status
  completionStatus    String    @default("PENDING") // PENDING, IN_PROGRESS, COMPLETE
  remarks             String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([separationId])
  @@index([completionStatus])
}
```

#### SalaryRevision Model (NEW - CRITICAL)
```prisma
model SalaryRevision {
  id                  String    @id @default(uuid())

  employeeId          String
  employee            Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  // Previous Salary
  previousBasicSalary Float
  previousGrossSalary Float?

  // New Salary
  newBasicSalary      Float
  newGrossSalary      Float?

  // Revision Details
  revisionReason      String    // PROMOTION, INCREMENT, MARKET_ADJUSTMENT, POLICY_CHANGE, PERFORMANCE
  revisionPercentage  Float?    // If percentage increase
  fixedAmount         Float?    // If fixed amount increase

  // Effective Date
  effectiveFrom       DateTime
  approvedDate        DateTime

  // Approval
  approvedById        String
  approvedBy          User      @relation(fields: [approvedById], references: [id])

  // Documentation
  letterUrl           String?   // Official salary revision letter

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([employeeId])
  @@index([effectiveFrom])
}
```

#### ReviewCycle Model (NEW - CRITICAL)
```prisma
model ReviewCycle {
  id                  String    @id @default(uuid())

  // Cycle Details
  name               String    @unique // "Annual 2024", "Q1 2024", etc.
  cycleType          String    // ANNUAL, QUARTERLY, HALF_YEARLY, CUSTOM
  academicYear       String    // "2024-2025"
  academicYearId     String?

  // Timeline
  startDate           DateTime
  endDate             DateTime
  reviewSubmissionDeadline DateTime?
  reviewCompletionDeadline DateTime?

  // Configuration
  isActive            Boolean   @default(true)
  includesPromotion   Boolean   @default(false)
  includessalaryRevision Boolean @default(false)

  // Scope
  applicableDepartments String[]? // If specific departments, else all
  applicableDesignations String[]? // If specific designations, else all

  // Status
  status              String    @default("PLANNED") // PLANNED, ONGOING, SUBMITTED, COMPLETED, CANCELLED

  // Reviews conducted in this cycle
  reviews             PerformanceReview[]

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([status])
  @@index([academicYear])
}
```

#### Gratuity Model (NEW - CRITICAL FOR SETTLEMENT)
```prisma
model Gratuity {
  id                  String    @id @default(uuid())

  employeeId          String
  employee            Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  // Gratuity Calculation
  yearsOfService      Float     // Calculated
  lastDrawnSalary     Float
  gratuityRate        Float     // As per policy (e.g., 15 days per year or 0.5x monthly)
  gratuityPolicy      String    // Reference to which policy applies

  // Calculation Details
  formula             String    // Description of calculation method
  calculatedAmount    Float
  calculationDate     DateTime

  // Approval
  approvedById        String?
  approvedBy          User?     @relation(fields: [approvedById], references: [id])
  approvalDate        DateTime?

  // Finalization
  paymentDate         DateTime?
  paymentMethod       String?   // BANK_TRANSFER, CHEQUE, CASH
  status              String    @default("CALCULATED") // CALCULATED, APPROVED, PAID

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([employeeId])
  @@index([status])
}
```

---

## API Endpoints

### Currently Implemented

#### Attendance Endpoints
```
GET    /api/v1/attendance              - Get all attendance records (with filters)
POST   /api/v1/attendance              - Create attendance record
GET    /api/v1/attendance/{id}         - Get specific attendance record
PUT    /api/v1/attendance/{id}         - Update attendance record
DELETE /api/v1/attendance/{id}         - Delete attendance record
GET    /api/v1/attendance/teacher/{id} - Get teacher attendance history
```

#### Leave Endpoints
```
GET    /api/v1/leaves                  - Get all leave requests (with filters)
POST   /api/v1/leaves                  - Apply for leave
GET    /api/v1/leaves/{id}             - Get specific leave request
PUT    /api/v1/leaves/{id}             - Update leave request
DELETE /api/v1/leaves/{id}             - Cancel leave request (if pending)
PUT    /api/v1/leaves/{id}/approve     - Approve leave request
PUT    /api/v1/leaves/{id}/reject      - Reject leave request
GET    /api/v1/leaves/teacher/{id}     - Get teacher's leave history
```

### To Be Implemented 🔄

#### Employee Management Endpoints
```
GET    /api/v1/employees               - Get all employees (with filters, pagination)
POST   /api/v1/employees               - Create new employee
GET    /api/v1/employees/{id}          - Get employee details
PUT    /api/v1/employees/{id}          - Update employee information
DELETE /api/v1/employees/{id}          - Deactivate employee
GET    /api/v1/employees/{id}/report   - Get employee report (full details)
GET    /api/v1/employees/department/{id} - Get employees by department
GET    /api/v1/employees/designation/{id} - Get employees by designation
```

#### Salary & Payroll Endpoints
```
GET    /api/v1/salaries                - Get all salary records
POST   /api/v1/salaries                - Create salary record
GET    /api/v1/salaries/{id}           - Get salary details
PUT    /api/v1/salaries/{id}           - Update salary
GET    /api/v1/salaries/employee/{id}  - Get employee's salary history

GET    /api/v1/payslips                - Get all payslips (with filters)
GET    /api/v1/payslips/{id}           - Get payslip details
GET    /api/v1/payslips/{id}/pdf       - Download payslip PDF
POST   /api/v1/payslips/generate       - Generate payslips for month
```

#### Performance Review Endpoints
```
GET    /api/v1/reviews                 - Get all performance reviews
POST   /api/v1/reviews                 - Create performance review
GET    /api/v1/reviews/{id}            - Get review details
PUT    /api/v1/reviews/{id}            - Update review
GET    /api/v1/reviews/employee/{id}   - Get employee's review history
GET    /api/v1/reviews/pending         - Get pending reviews to submit
```

#### Disciplinary Action Endpoints
```
GET    /api/v1/disciplinary            - Get all disciplinary actions
POST   /api/v1/disciplinary            - Record disciplinary action
GET    /api/v1/disciplinary/{id}       - Get action details
PUT    /api/v1/disciplinary/{id}       - Update action
GET    /api/v1/disciplinary/employee/{id} - Get employee's actions
```

#### Leave Balance Endpoints (NEW - CRITICAL)
```
GET    /api/v1/leave-balance           - Get all leave balances
GET    /api/v1/leave-balance/{id}      - Get employee leave balance
POST   /api/v1/leave-balance/calculate - Calculate/reset leave balances
POST   /api/v1/leave-balance/carry-over - Process year-end carry-over
GET    /api/v1/leave-balance/employee/{id} - Get employee's balance for year
GET    /api/v1/leave-balance/report    - Leave balance report
```

#### Attendance Regularization Endpoints (NEW - CRITICAL)
```
GET    /api/v1/regularization          - Get all regularization requests
POST   /api/v1/regularization          - Submit regularization request
GET    /api/v1/regularization/{id}     - Get request details
PUT    /api/v1/regularization/{id}/approve - Approve regularization
PUT    /api/v1/regularization/{id}/reject  - Reject regularization
GET    /api/v1/regularization/pending  - Get pending requests
GET    /api/v1/regularization/employee/{id} - Get employee's requests
```

#### Employee Qualification Endpoints (NEW)
```
GET    /api/v1/qualifications          - Get all qualifications
POST   /api/v1/qualifications          - Add qualification
GET    /api/v1/qualifications/{id}     - Get qualification details
PUT    /api/v1/qualifications/{id}     - Update qualification
DELETE /api/v1/qualifications/{id}     - Remove qualification
GET    /api/v1/qualifications/employee/{id} - Get employee's qualifications
PUT    /api/v1/qualifications/{id}/verify - Verify qualification
```

#### Promotion & Transfer Endpoints (NEW - CRITICAL)
```
GET    /api/v1/promotions              - Get all promotions
POST   /api/v1/promotions              - Create promotion
GET    /api/v1/promotions/{id}         - Get promotion details
PUT    /api/v1/promotions/{id}/approve - Approve promotion
GET    /api/v1/promotions/employee/{id} - Get employee's promotions

GET    /api/v1/transfers               - Get all transfers
POST   /api/v1/transfers               - Create transfer request
GET    /api/v1/transfers/{id}          - Get transfer details
PUT    /api/v1/transfers/{id}/approve  - Approve transfer
GET    /api/v1/transfers/employee/{id} - Get employee's transfers
```

#### Employee Separation Endpoints (NEW - CRITICAL - FINAL SETTLEMENT)
```
GET    /api/v1/separations             - Get all separations
POST   /api/v1/separations             - Create separation record
GET    /api/v1/separations/{id}        - Get separation details
PUT    /api/v1/separations/{id}        - Update separation

GET    /api/v1/separations/{id}/calculation - Get final settlement calculation
POST   /api/v1/separations/{id}/calculate   - Calculate final settlement
PUT    /api/v1/separations/{id}/approve-settlement - Approve settlement
POST   /api/v1/separations/{id}/generate-cert - Generate experience certificate

GET    /api/v1/exit-checklist/{id}     - Get exit checklist
PUT    /api/v1/exit-checklist/{id}     - Update checklist items
PUT    /api/v1/exit-checklist/{id}/complete - Mark checklist complete
```

#### Salary Revision Endpoints (NEW - CRITICAL)
```
GET    /api/v1/salary-revisions        - Get all revisions
POST   /api/v1/salary-revisions        - Create salary revision
GET    /api/v1/salary-revisions/{id}   - Get revision details
PUT    /api/v1/salary-revisions/{id}/approve - Approve revision
GET    /api/v1/salary-revisions/employee/{id} - Get employee revisions
GET    /api/v1/salary-revisions/history/{id} - Get salary history
```

#### Review Cycle Endpoints (NEW - CRITICAL)
```
GET    /api/v1/review-cycles           - Get all review cycles
POST   /api/v1/review-cycles           - Create review cycle
GET    /api/v1/review-cycles/{id}      - Get cycle details
PUT    /api/v1/review-cycles/{id}      - Update cycle
PUT    /api/v1/review-cycles/{id}/activate - Activate cycle
PUT    /api/v1/review-cycles/{id}/close - Close cycle

GET    /api/v1/review-cycles/{id}/pending-reviews - Get pending reviews
GET    /api/v1/review-cycles/{id}/summary - Get cycle summary
```

#### Gratuity Endpoints (NEW - CRITICAL FOR SETTLEMENT)
```
GET    /api/v1/gratuity/{id}           - Get gratuity calculation
POST   /api/v1/gratuity/{id}/calculate - Calculate gratuity
PUT    /api/v1/gratuity/{id}/approve   - Approve gratuity
POST   /api/v1/gratuity/{id}/pay       - Record gratuity payment
GET    /api/v1/gratuity/pending        - Get pending gratuities
```

---

## Backend Implementation

### Current Structure

```
backend/src/
├── controllers/
│   ├── attendance.controller.ts ✅
│   └── leave.controller.ts ✅
├── services/
│   ├── attendance.service.ts ✅
│   └── leave.service.ts ✅
├── routes/
│   ├── attendance.routes.ts ✅
│   └── leave.routes.ts ✅
```

### To Be Implemented 🔄

```
backend/src/
├── controllers/
│   ├── employee.controller.ts
│   ├── salary.controller.ts
│   ├── payslip.controller.ts
│   ├── performance.controller.ts
│   ├── designation.controller.ts
│   ├── disciplinary.controller.ts
│   ├── leave-balance.controller.ts (NEW - CRITICAL)
│   ├── attendance-regularization.controller.ts (NEW - CRITICAL)
│   ├── qualification.controller.ts (NEW)
│   ├── promotion.controller.ts (NEW - CRITICAL)
│   ├── transfer.controller.ts (NEW)
│   ├── separation.controller.ts (NEW - CRITICAL)
│   ├── exit-checklist.controller.ts (NEW - CRITICAL)
│   ├── salary-revision.controller.ts (NEW - CRITICAL)
│   ├── review-cycle.controller.ts (NEW - CRITICAL)
│   └── gratuity.controller.ts (NEW - CRITICAL)
├── services/
│   ├── employee.service.ts
│   ├── salary.service.ts
│   ├── payslip.service.ts
│   ├── performance.service.ts
│   ├── designation.service.ts
│   ├── disciplinary.service.ts
│   ├── leave-balance.service.ts (NEW - CRITICAL)
│   ├── attendance-regularization.service.ts (NEW - CRITICAL)
│   ├── qualification.service.ts (NEW)
│   ├── promotion.service.ts (NEW - CRITICAL)
│   ├── transfer.service.ts (NEW)
│   ├── separation.service.ts (NEW - CRITICAL)
│   ├── exit-checklist.service.ts (NEW - CRITICAL)
│   ├── salary-revision.service.ts (NEW - CRITICAL)
│   ├── review-cycle.service.ts (NEW - CRITICAL)
│   └── gratuity.service.ts (NEW - CRITICAL)
├── routes/
│   ├── employee.routes.ts
│   ├── salary.routes.ts
│   ├── payslip.routes.ts
│   ├── performance.routes.ts
│   ├── designation.routes.ts
│   ├── disciplinary.routes.ts
│   ├── leave-balance.routes.ts (NEW - CRITICAL)
│   ├── attendance-regularization.routes.ts (NEW - CRITICAL)
│   ├── qualification.routes.ts (NEW)
│   ├── promotion.routes.ts (NEW - CRITICAL)
│   ├── transfer.routes.ts (NEW)
│   ├── separation.routes.ts (NEW - CRITICAL)
│   ├── exit-checklist.routes.ts (NEW - CRITICAL)
│   ├── salary-revision.routes.ts (NEW - CRITICAL)
│   ├── review-cycle.routes.ts (NEW - CRITICAL)
│   └── gratuity.routes.ts (NEW - CRITICAL)
├── utils/
│   ├── salary-calculator.ts      (CRITICAL: Calculate salary components with TDS, PF, ESI, deductions)
│   ├── payslip-generator.ts      (Generate payslips with pro-rata calculations)
│   ├── payslip-pdf-generator.ts  (Create PDF payslips)
│   ├── leave-calculator.ts       (NEW - CRITICAL: Calculate leave balance, carry-over)
│   ├── settlement-calculator.ts  (NEW - CRITICAL: Calculate final settlement, gratuity)
│   ├── gratuity-calculator.ts    (NEW - CRITICAL: Calculate gratuity per policy)
│   └── attendance-regularizer.ts (NEW: Regularization approval logic)
```

### Implementation Notes

1. **Authentication**: All endpoints require authentication. Designate endpoints by user role:
   - ADMIN/HR_OFFICER: Full access to all employee data
   - MANAGER: Can view subordinates' data and approve leaves
   - TEACHER/EMPLOYEE: Can view own data only

2. **Error Handling**: Implement standardized error responses
   - 400: Bad Request (validation errors)
   - 401: Unauthorized
   - 403: Forbidden (insufficient permissions)
   - 404: Not Found
   - 500: Server Error

3. **Data Validation**:
   - Email validation and uniqueness
   - Date validations (DOB, joining date, etc.)
   - Salary amount validations (non-negative)
   - Leave balance validations

---

## Frontend Pages

### Currently Implemented ✅

```
/dashboard/attendance
├── Teacher Attendance List
├── Attendance History
├── Mark Attendance (bulk)
└── Attendance Reports

/dashboard/attendance/history
├── View attendance history
└── Filter by date range
```

### To Be Implemented 🔄

```
/dashboard/hr/
├── HR Dashboard (overview, stats)
├── /dashboard/hr/employees
│   ├── Employee list (searchable, filterable)
│   ├── /dashboard/hr/employees/[id] (employee profile)
│   └── Create/Edit employee (form)
├── /dashboard/hr/salary
│   ├── Salary management list
│   ├── /dashboard/hr/salary/[id] (salary details)
│   └── Create/Edit salary (form)
├── /dashboard/hr/payslips
│   ├── Payslip list (monthly view)
│   ├── /dashboard/hr/payslips/[id] (payslip details & download)
│   └── Generate payslips (bulk operation)
├── /dashboard/hr/performance
│   ├── Performance reviews list
│   ├── /dashboard/hr/performance/[id] (review details)
│   └── Create/Edit review (form)
├── /dashboard/hr/designations
│   ├── Designation hierarchy view
│   ├── Create/Edit designation
├── /dashboard/hr/disciplinary
│   ├── Disciplinary actions list
│   ├── Create/Edit action
│   └── View action history
└── /dashboard/hr/departments
    ├── Department list
    └── Create/Edit department
```

---

## Implementation Checklist

### Phase 1: Core Employee & Leave Management (Week 1-2)
- [ ] Create Employee, Designation, Department, LeaveBalance models
- [ ] Implement employee CRUD with document upload (PAN, Aadhar, Bank)
- [ ] Implement LeaveBalance tracking service
- [ ] Create leave balance calculation logic (initial, annual reset)
- [ ] Create employee API routes
- [ ] Create frontend employee management pages
- [ ] Add employee search, filtering, org chart

### Phase 2: Attendance Regularization (Week 2-3) - CRITICAL
- [ ] Create AttendanceRegularization model
- [ ] Implement regularization request workflow
- [ ] Create approval/rejection logic
- [ ] Create frontend regularization request submission
- [ ] Create manager approval interface
- [ ] Link regularization to attendance records

### Phase 3: Qualifications, Promotions & Transfers (Week 3-4) - CRITICAL
- [ ] Create EmployeeQualification, EmployeePromotion, EmployeeTransfer models
- [ ] Implement qualification management with verification
- [ ] Implement promotion workflow (propose → approve → activate)
- [ ] Implement transfer request workflow
- [ ] Create associated controllers, services, routes
- [ ] Create frontend pages for all three features
- [ ] Add approval workflows

### Phase 4: Salary & Payroll System (Week 4-5) - CRITICAL
- [ ] Create Salary, SalaryRevision models
- [ ] Implement DETAILED salary-calculator.ts:
  - [ ] Basic salary component
  - [ ] Dearness allowance (DA), House Rent (HRA), Conveyance, Medical
  - [ ] Gross salary calculation
  - [ ] PF (Provident Fund) calculation: 12% on basic
  - [ ] ESI (Employee State Insurance) calculation: 0.75% on total
  - [ ] Professional tax: Based on salary slabs per state
  - [ ] Income tax (TDS) calculation: Based on income tax brackets
  - [ ] Other deductions
  - [ ] Net salary calculation
- [ ] Create salary revision tracking with approval
- [ ] Implement salary history maintenance
- [ ] Create API endpoints for salary management
- [ ] Create frontend salary management pages

### Phase 5: Payslip Generation (Week 5-6)
- [ ] Create Payslip model
- [ ] Implement payslip-generator.ts:
  - [ ] Auto-calculate from Salary + attendance adjustments
  - [ ] Pro-rata calculation for partial months (joining/separation)
  - [ ] Attendance impact on salary
  - [ ] Bonus, advance, loan deduction handling
  - [ ] Finalize payslip for month
- [ ] Implement payslip-pdf-generator.ts for PDF generation
- [ ] Create payslip download functionality
- [ ] Create payslip display pages
- [ ] Add payslip distribution (email, portal)

### Phase 6: Leave Balance & Carry-Over (Week 6-7) - CRITICAL
- [ ] Implement leave-calculator.ts:
  - [ ] Initial leave allocation per designation/policy
  - [ ] Year-end carry-over logic
  - [ ] Carry-over expiry handling
  - [ ] Leave balance updates on approval/usage
  - [ ] Leave encashment on separation
- [ ] Implement automatic balance calculations
- [ ] Create leave policy configuration
- [ ] Create carry-over process (yearly)
- [ ] Create leave balance report

### Phase 7: Performance Reviews & Review Cycles (Week 7-8) - CRITICAL
- [ ] Create ReviewCycle, PerformanceReview models with links
- [ ] Implement review cycle management (create, activate, close)
- [ ] Implement performance review submission workflow
- [ ] Create rating system (1-5 for multiple parameters)
- [ ] Link performance reviews to promotion eligibility
- [ ] Link performance reviews to salary revision
- [ ] Create review dashboard
- [ ] Create reviewer and employee views

### Phase 8: Employee Separation & Final Settlement (Week 8-9) - CRITICAL
- [ ] Create EmployeeSeparation, ExitChecklist, Gratuity models
- [ ] Implement separation-calculator.ts:
  - [ ] Pro-rata basic salary due
  - [ ] Allowances due
  - [ ] Earned leave encashment (per policy)
  - [ ] Gratuity calculation (per policy formula)
  - [ ] Bonus adjustment
  - [ ] Loan recovery
  - [ ] Net final settlement amount
- [ ] Implement gratuity-calculator.ts:
  - [ ] Years of service calculation
  - [ ] Last drawn salary identification
  - [ ] Gratuity formula application (e.g., 15 days per year, 0.5x monthly)
  - [ ] Policy-based calculation
- [ ] Create exit checklist management:
  - [ ] Physical items return tracking
  - [ ] Financial clearance
  - [ ] Administrative clearance
  - [ ] Document handover
- [ ] Create separation approval workflow
- [ ] Generate experience certificate
- [ ] Create final settlement approval and payment
- [ ] Create frontend separation pages and forms

### Phase 9: Disciplinary & Backup Systems (Week 9-10)
- [ ] Create DisciplinaryAction model
- [ ] Implement disciplinary action workflow
- [ ] Create disciplinary action approval
- [ ] Create frontend disciplinary pages
- [ ] Implement automatic leave balance reset on year-end
- [ ] Implement backup and restore procedures for payroll

### Phase 10: HR Dashboard & Reports (Week 10-11) - CRITICAL
- [ ] Create HR dashboard with key metrics:
  - [ ] Total employees by department/designation
  - [ ] Salary expense summary
  - [ ] Leave utilization stats
  - [ ] Performance review completion status
  - [ ] Upcoming separations
  - [ ] Promotion/transfer statistics
- [ ] Create payroll reports:
  - [ ] Monthly salary register
  - [ ] PF/ESI/TDS reports for statutory filing
  - [ ] Salary variation report
  - [ ] Departmental payroll summary
- [ ] Create leave reports:
  - [ ] Leave balance sheet
  - [ ] Leave utilization report
  - [ ] Carry-over report
- [ ] Create employee reports:
  - [ ] Employee directory
  - [ ] Departmental headcount
  - [ ] Qualification matrix
- [ ] Add export to Excel/PDF
- [ ] Create audit trail reports

### Phase 11: Integration & Compliance (Week 11-12) - CRITICAL
- [ ] Integrate with Finance module for salary payment
- [ ] Create statutory compliance reports:
  - [ ] Form 16 (Income tax)
  - [ ] PF statement
  - [ ] ESI statement
- [ ] Implement audit trail for all salary/employee changes
- [ ] Create backup procedures for payroll data
- [ ] Validate TDS calculations per latest tax brackets
- [ ] Test PF/ESI calculations per statutory rules

### Phase 12: Testing & Optimization (Week 12-13)
- [ ] Unit test salary calculator with various scenarios
- [ ] Unit test leave balance calculations
- [ ] Unit test settlement calculator
- [ ] Integration test payslip generation
- [ ] Integration test leave balance updates
- [ ] Integration test separation workflow
- [ ] Performance test with large employee datasets
- [ ] Security audit of sensitive data access
- [ ] User acceptance testing with HR team
- [ ] Training for HR staff

---

## Error Handling

Standardized error response format:

```json
{
  "success": false,
  "error": "Error message here",
  "details": {
    "field": "Additional context if applicable"
  }
}
```

### Common HR Module Errors

#### Employee Management
- **DUPLICATE_EMPLOYEE**: Employee ID already exists
- **EMPLOYEE_NOT_FOUND**: Employee record not found
- **INVALID_DESIGNATION**: Designation does not exist or is inactive
- **EMPLOYEE_STILL_ACTIVE**: Cannot process action on active employee

#### Leave & Attendance
- **LEAVE_BALANCE_EXCEEDED**: Employee has insufficient leave balance
- **INVALID_DATE_RANGE**: End date must be after start date
- **LEAVE_ALREADY_EXISTS**: Leave record already exists for this period
- **INSUFFICIENT_LEAVE_BALANCE**: Not enough leave balance for requested days
- **INVALID_LEAVE_TYPE**: Leave type is not valid or not applicable
- **PAST_DATE_REGULARIZATION**: Cannot regularize attendance for dates beyond regularization window

#### Salary & Payroll
- **INVALID_SALARY_AMOUNT**: Salary amount cannot be negative or zero
- **ACTIVE_SALARY_CONFLICT**: An active salary record already exists for this employee
- **SALARY_COMPONENT_MISMATCH**: Salary components don't match policy
- **INVALID_PF_CONTRIBUTION**: PF calculation doesn't match statutory rules (12% on basic)
- **INVALID_ESI_CONTRIBUTION**: ESI calculation doesn't match statutory rules (0.75%)
- **INVALID_TDS_CALCULATION**: TDS not calculated per income tax brackets
- **INVALID_PROFESSIONAL_TAX**: Professional tax doesn't match state slabs
- **PAYSLIP_ALREADY_GENERATED**: Payslip already generated for this month
- **NEGATIVE_NET_SALARY**: Net salary cannot be negative (check deductions)
- **MISSING_BANK_DETAILS**: Bank account details required for salary payment
- **INVALID_SALARY_REVISION_AMOUNT**: Revision amount doesn't meet minimum increase

#### Separation & Settlement
- **EMPLOYEE_NOT_SEPARATING**: Employee is not marked for separation
- **INCOMPLETE_EXIT_CHECKLIST**: Exit checklist not complete, cannot finalize settlement
- **INVALID_SETTLEMENT_CALCULATION**: Settlement calculation error
- **GRATUITY_CALCULATION_ERROR**: Unable to calculate gratuity (missing policy)
- **INSUFFICIENT_SERVICE_FOR_GRATUITY**: Less than 5 years of service (check policy)
- **FINAL_SETTLEMENT_PENDING**: Final settlement payment still pending
- **LEAVE_ENCASHMENT_ERROR**: Unable to calculate leave encashment

#### Performance & Reviews
- **REVIEW_CYCLE_NOT_ACTIVE**: Review cycle is not active
- **EMPLOYEE_ALREADY_REVIEWED**: Employee already has a review in this cycle
- **INVALID_RATING**: Rating must be between 1-5
- **INVALID_REVIEW_PERIOD**: Review period is not valid

#### Promotion & Transfer
- **PROMOTION_ALREADY_PENDING**: Pending promotion already exists
- **INVALID_NEW_DESIGNATION**: New designation is same as current
- **TRANSFER_ALREADY_PENDING**: Pending transfer already exists
- **INSUFFICIENT_PERMISSIONS**: User cannot access this data or approve this action

---

## Security Considerations

### 1. Role-Based Access Control (RBAC) - CRITICAL

**ADMIN**: Full unrestricted access
- Create/modify/delete all employee records
- Access all salary data
- Access all personal information
- Approve all actions
- Access audit trail

**HR_OFFICER**: HR department operations
- Create/edit employee records (except final approval)
- View all salary data
- Process payroll
- Generate reports and analytics
- Approve leave requests
- Initiate separations
- Cannot: Delete employees, override final approvals, access audit trail (admin only)

**MANAGER/DEPARTMENT_HEAD**: Limited staff management
- View own department employees (list only)
- View subordinates' basic info (no salary)
- Approve leave requests for subordinates only
- Provide performance reviews for subordinates only
- Cannot: Access salary, delete employees, access other departments

**EMPLOYEE**: Personal data access only
- View own employee record (no salary unless own)
- View own salary and payslips
- View own leave balance and usage
- Submit leave requests
- View own performance reviews
- Cannot: Access other employees' data, modify own record, delete data

**PARENT**: Limited child view
- View child's basic employee info (if child is staff)
- Cannot: Access any HR data, modify anything

### 2. Data Sensitivity & Encryption - CRITICAL

**Salary Data**: HIGHLY CONFIDENTIAL
- Store encrypted at rest
- Encrypt in transit (HTTPS only)
- Only HR_OFFICER and ADMIN can view
- Employee can view only own salary
- Manager cannot view subordinate salary
- All salary access logged

**Bank Details**: ENCRYPTED
- PAN, Aadhar, Bank Account Number: Encrypted storage
- Accessible only to HR_OFFICER for payroll processing
- Mask display (show only last 4 digits)
- All access logged

**Performance Reviews**: CONFIDENTIAL
- Only reviewer, reviewed employee, and HR_OFFICER can view
- Anonymous to other employees
- Cannot be deleted (retention required)
- All access logged

**Disciplinary Actions**: CONFIDENTIAL
- Only employee, HR_OFFICER, and ADMIN can view
- Restricted from third parties
- Cannot be deleted (retention required)
- All access logged

**Leave Applications**: MODERATE SENSITIVITY
- Employee can view own
- Manager can view subordinates'
- HR_OFFICER can view all
- Cannot modify after approval

### 3. Salary Calculation Security - CRITICAL

**Validation Requirements**:
- All salary components must be ≥ 0
- Gross salary must equal basic + allowances
- PF calculation: Exactly 12% of basic salary (statutory requirement)
- ESI calculation: Exactly 0.75% of total (statutory requirement)
- Professional tax: Match state slabs (can't be overridden)
- TDS: Match official income tax brackets (can't be under-calculated)
- Net salary must be: Gross - Deductions (must be positive)

**Approval Workflow**:
- Salary creation requires HR_OFFICER
- Salary revision requires HR_OFFICER and ADMIN approval
- No retroactive salary changes without audit trail

### 4. Payroll Processing Security - CRITICAL

**Payslip Generation**:
- Can only generate for months where attendance is finalized
- Pro-rata calculation must account for joining/separation date
- Final review required before marking paid
- Cannot delete finalized payslips

**Payslip Distribution**:
- Email only to employee (no CC to others)
- Require password/OTP for PDF download
- Log all downloads

### 5. Leave Balance Security - CRITICAL

**Balance Integrity**:
- Leave balance changes only through approved leave requests
- Carry-over logic must be transparent and auditable
- Cannot manually adjust without approval
- Year-end calculation must be verified by manager and HR

**Encashment**:
- Earned leave encashment only on separation
- Calculation per policy (usually not 100%)
- Included in final settlement amount

### 6. Separation & Settlement Security - CRITICAL

**Workflow Enforcement**:
1. Separation record created
2. Exit checklist initiated
3. Leave encashment calculated
4. Final settlement calculated
5. Settlement requires ADMIN approval
6. Payment marked and logged
7. Experience certificate issued

**Security Controls**:
- Cannot mark employee active after separation
- All settlement components must be verified
- Gratuity calculation must match policy
- No partial settlements (all-or-nothing)
- Final settlement amount logged for audit

### 7. Audit Trail - MANDATORY

**What to Log**:
- ALL salary modifications: old value, new value, who, when, reason
- ALL leave balance changes: what changed, who approved
- ALL employee record changes: field, old value, new value
- ALL payroll processing: which employees, amounts, processor
- ALL access to sensitive data: who accessed, when, what data
- ALL separations: dates, amounts, approvals

**Log Retention**: Minimum 7 years for payroll data

### 8. Regulatory Compliance - CRITICAL

**Tax Compliance**:
- TDS must be calculated per latest income tax brackets
- No employee should have negative TDS (under-taxation)
- Quarterly TDS deposits must be tracked
- Form 24Q filing data must be available

**Statutory Compliance**:
- PF contributions: Exactly 12% employee + 12% employer on basic
- ESI contributions: Exactly 0.75% employee + 3.25% employer (or state rate)
- Professional Tax: Per state regulations
- Labor law compliance: Wages Act, Shops & Establishment Act

### 9. Password & Authentication

- Salary viewing requires re-authentication
- Approval actions require OTP
- No bulk export of salary data
- API keys for payroll integrations must be rotated quarterly

### 10. Incident Reporting

**Critical Incidents** (Report to Principal/Admin immediately):
- Any salary discrepancy > 5% from expected
- Any employee accessing others' salary data
- Any failed gratuity calculation
- Any negative net salary generated
- Any TDS under-calculation detected
- Failed separation process with unresolved items

---
   - Log all performance reviews
   - Log all disciplinary actions
   - Track who changed what and when

4. **Compliance**
   - PAN and Aadhar data: Encrypted
   - Salary calculations: Compliant with local labor laws
   - Leave policies: Configurable per region
   - Payslip generation: Secure PDF generation

---

## Related Documentation

- [Database Schema Documentation](./DATABASE.md)
- [Authentication & Authorization](./AUTH.md)
- [API Response Standards](./API_STANDARDS.md)
