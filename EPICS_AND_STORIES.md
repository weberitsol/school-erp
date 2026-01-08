# Epics and User Stories - HR, Hostel, Mess, and Store Modules

## Overview

This document contains complete epics and user stories for the 4 modules to enable independent development. Each story is self-contained with acceptance criteria, technical tasks, and dependencies clearly specified.

**Format**: Each story follows Agile standards with:
- Story ID (unique identifier)
- Epic name
- User story (As a... I want... So that...)
- Acceptance criteria
- Technical tasks
- Story points
- Dependencies
- Priority

---

# HR MODULE EPICS & STORIES

## Epic: HR-E1 - Employee Management System

**Description**: Create comprehensive employee records management system including personal, professional, and compensation details.

---

### Story: HR-1.1 - Create Employee Database Models
**Story Points**: 5
**Priority**: P0 (Critical)
**Sprint**: Week 1
**Dependencies**: None

**User Story**:
As a database developer, I want to create Prisma models for Employee, Designation, and Department, so that I can store and manage employee records.

**Acceptance Criteria**:
- [ ] Employee model created with all required fields (userId, firstName, lastName, email, phone, DOB, gender, employeeNo, designation, department, joiningDate, status, qualifications, experience)
- [ ] Designation model created with hierarchy support (name, code, level, parentDesignationId, subordinateDesignations, minSalary, maxSalary)
- [ ] Department model created (name, code, description, headId)
- [ ] All relationships defined correctly (User -> Employee, Employee -> Designation, Employee -> Department)
- [ ] Unique constraints added (employeeNo, email on Employee; name/code on Designation and Department)
- [ ] Database indexes created for frequently queried fields (email, employeeNo, status)
- [ ] Migration file created and tested

**Technical Tasks**:
1. Add Employee, Designation, Department models to `backend/prisma/schema.prisma`
2. Update User model with optional relations to Employee
3. Create migration: `npx prisma migrate dev --name add_hr_employee_models`
4. Test schema validity with `npx prisma generate`
5. Verify relationships in Prisma Studio

**Testing**:
- Unit test: Verify model structure
- Integration test: Create/read employee records
- Query test: Test all relationship queries

---

### Story: HR-1.2 - Implement Employee Service Layer
**Story Points**: 8
**Priority**: P0
**Sprint**: Week 1-2
**Dependencies**: HR-1.1

**User Story**:
As a backend developer, I want to create employee service with CRUD operations and business logic, so that I can manage employee data consistently.

**Acceptance Criteria**:
- [ ] Employee service created with methods: create, getAll, getById, update, getByEmail, getByEmployeeNo, getByDepartment, getByDesignation, deactivateEmployee
- [ ] Service validates unique fields (email, employeeNo)
- [ ] Service checks department and designation exist before assignment
- [ ] Service supports filtering (by status, department, designation, search term)
- [ ] Service supports pagination (page, limit)
- [ ] Service includes error handling for duplicate keys, invalid references
- [ ] getAllEmployees returns with department and designation relations
- [ ] Service includes methods to update status (ACTIVE, INACTIVE, TERMINATED)

**Technical Tasks**:
1. Create `backend/src/services/employee.service.ts`
2. Implement PrismaClient integration
3. Add error handling and validation
4. Create interfaces for filters and pagination
5. Add unit tests for each method
6. Document service methods with JSDoc

**Testing**:
- Unit tests: 10 test cases covering CRUD operations
- Integration tests: Database transactions
- Error handling tests: Duplicate email, invalid department, etc.

---

### Story: HR-1.3 - Create Employee API Controller & Routes
**Story Points**: 8
**Priority**: P0
**Sprint**: Week 2
**Dependencies**: HR-1.2

**User Story**:
As an API developer, I want to create REST endpoints for employee management, so that the frontend can manage employee data.

**Acceptance Criteria**:
- [ ] GET /api/v1/employees - List all employees with filters
- [ ] POST /api/v1/employees - Create new employee
- [ ] GET /api/v1/employees/{id} - Get employee details
- [ ] PUT /api/v1/employees/{id} - Update employee
- [ ] DELETE /api/v1/employees/{id} - Deactivate employee (soft delete)
- [ ] GET /api/v1/employees/department/{id} - Get employees by department
- [ ] GET /api/v1/employees/designation/{id} - Get employees by designation
- [ ] GET /api/v1/employees/{id}/report - Get full employee report
- [ ] All endpoints require authentication
- [ ] ADMIN role required for all operations
- [ ] Proper error responses (400, 401, 403, 404, 500)

**Technical Tasks**:
1. Create `backend/src/controllers/employee.controller.ts`
2. Create `backend/src/routes/employee.routes.ts`
3. Implement authentication middleware
4. Implement role-based authorization
5. Add request validation middleware
6. Integrate with employee service
7. Register routes in `backend/src/app.ts`
8. Create API documentation in comments

**Testing**:
- Endpoint tests: All 8 endpoints with valid/invalid data
- Auth tests: Missing token, invalid token, insufficient role
- Validation tests: Required fields, data format validation

---

### Story: HR-1.4 - Build Employee Management Frontend Pages
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 2-3
**Dependencies**: HR-1.3

**User Story**:
As a frontend developer, I want to create employee management pages, so that HR staff can manage employee records through the UI.

**Acceptance Criteria**:
- [ ] Employee list page with searchable table (name, email, employeeNo, department, designation, status)
- [ ] Add pagination (10 items per page)
- [ ] Add filters (status, department, designation)
- [ ] Add search by name/email/employeeNo
- [ ] Create employee detail page with full information
- [ ] Create/Edit employee form with validation
- [ ] Form fields: firstName, lastName, email, phone, DOB, gender, employeeNo, designation, department, joiningDate, qualifications, experience, status
- [ ] Delete confirmation dialog
- [ ] Toast notifications for success/error
- [ ] Loading states on async operations
- [ ] Responsive design (mobile, tablet, desktop)

**Technical Tasks**:
1. Create `frontend/src/app/(dashboard)/hr/employees/page.tsx` (list page)
2. Create `frontend/src/app/(dashboard)/hr/employees/[id]/page.tsx` (detail page)
3. Create `frontend/src/app/(dashboard)/hr/employees/[id]/edit/page.tsx` (edit page)
4. Create `frontend/src/app/(dashboard)/hr/employees/new/page.tsx` (create page)
5. Create `frontend/src/components/hr/EmployeeForm.tsx` (form component)
6. Create `frontend/src/services/hr/employee.service.ts` (service layer)
7. Add form validation library integration
8. Implement error handling with user feedback

**Testing**:
- Component tests: Rendering, user interactions
- E2E tests: Create, read, update, delete employee
- Form validation tests: All field validations
- API integration tests: Service calls and error handling

---

## Epic: HR-E2 - Salary & Payroll System

**Description**: Complete salary and payroll management including salary structure, salary slips, and deductions.

---

### Story: HR-2.1 - Create Salary Database Models
**Story Points**: 5
**Priority**: P0
**Sprint**: Week 3
**Dependencies**: HR-1.1

**User Story**:
As a database developer, I want to create Prisma models for Salary, Payslip, and related entities, so that I can store salary and payroll information.

**Acceptance Criteria**:
- [ ] Salary model created (employeeId, basicSalary, allowances, grossSalary, deductions, netSalary, month, year, effectiveFrom, status)
- [ ] Payslip model created (employeeId, month, year, salary components, deductions, workingDays, daysPresent, netPayable, status, paidDate)
- [ ] Both models have unique constraints (employeeId, month, year)
- [ ] Relationships defined to Employee model
- [ ] Indexes created on (employeeId, month, year, status)
- [ ] Enum for PaymentStatus (DRAFT, FINALIZED, PAID, CANCELLED)
- [ ] Migration created and tested

**Technical Tasks**:
1. Add Salary model to schema.prisma
2. Add Payslip model to schema.prisma
3. Create PaymentStatus enum
4. Add relationships to Employee model
5. Run migration: `npx prisma migrate dev --name add_salary_payslip_models`
6. Test with Prisma Studio

---

### Story: HR-2.2 - Implement Salary Service & Calculations
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 3-4
**Dependencies**: HR-2.1, HR-1.2

**User Story**:
As a backend developer, I want to create salary service with calculation utilities, so that salary components can be accurately calculated.

**Acceptance Criteria**:
- [ ] Salary service created with: create, getAll, getById, update, getByEmployee, getBySalaryMonth
- [ ] Salary calculator utility created with methods:
  - [ ] calculateGrossSalary(basicSalary, allowances) = sum of all allowances
  - [ ] calculateNetSalary(grossSalary, deductions) = grossSalary - totalDeductions
  - [ ] validateSalaryAmount(amount) = amount must be positive
- [ ] Deduction calculator for:
  - [ ] PF (Provident Fund) = 12% of basic salary
  - [ ] ESI (Employee State Insurance) = 0.75% of gross (if applicable)
  - [ ] Professional Tax = based on salary slab
  - [ ] Income Tax = based on tax slab (TDS)
- [ ] Service includes validation (salary > 0, deductions < gross)
- [ ] Service prevents duplicate salary for same employee in same month
- [ ] Service calculates salary history for employee
- [ ] Error handling for invalid data

**Technical Tasks**:
1. Create `backend/src/services/salary.service.ts`
2. Create `backend/src/utils/salary-calculator.ts`
3. Implement deduction calculation logic
4. Add unit tests for all calculations
5. Create validation utility
6. Add error handling
7. Document calculation formulas

**Testing**:
- Unit tests: All calculation methods with various inputs
- Edge case tests: Minimum salary, maximum salary, deductions > gross
- Validation tests: Negative amounts, invalid dates

---

### Story: HR-2.3 - Create Payslip Generation Service
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 4
**Dependencies**: HR-2.2

**User Story**:
As a backend developer, I want to create payslip generation and PDF service, so that payslips can be generated and downloaded.

**Acceptance Criteria**:
- [ ] Payslip service created with: generatePayslips(month, year), getPayslip, getByEmployee, markAsPaid
- [ ] Payslip generation automatically:
  - [ ] Fetch current salary record for employee
  - [ ] Calculate attendance impact on salary (if applicable)
  - [ ] Apply bonuses and deductions
  - [ ] Calculate net payable amount
  - [ ] Create Payslip record with status DRAFT
- [ ] Payslip PDF generator utility:
  - [ ] Generate professional PDF with company header
  - [ ] Include employee details, salary components, deductions, net amount
  - [ ] Include working days, days present, days absent
  - [ ] Include payment status and date
  - [ ] Return PDF buffer
- [ ] Payslips can only be generated for employees with active salary record
- [ ] Support bulk generation (for all employees in a month)
- [ ] Finalize payslip (change status to FINALIZED before paying)
- [ ] Mark payslip as PAID with payment date
- [ ] Store PDF URL for retrieval

**Technical Tasks**:
1. Create `backend/src/services/payslip.service.ts`
2. Create `backend/src/utils/payslip-generator.ts`
3. Create `backend/src/utils/payslip-pdf-generator.ts`
4. Integrate with PDF library (pdfkit or similar)
5. Implement attendance impact calculation
6. Add unit tests for generation logic
7. Add PDF generation tests
8. Add error handling for no salary record

**Testing**:
- Unit tests: Payslip generation logic
- PDF tests: Valid PDF generated, file size > 0
- Integration tests: Full payslip workflow
- Edge cases: No salary record, no attendance data

---

### Story: HR-2.4 - Build Salary Management Frontend
**Story Points**: 13
**Priority**: P1
**Sprint**: Week 4-5
**Dependencies**: HR-2.3

**User Story**:
As a frontend developer, I want to create salary and payslip management pages, so that HR can manage salary and generate payslips.

**Acceptance Criteria**:
- [ ] Salary list page showing all salary records with filters (employee, status, year/month)
- [ ] Create/Edit salary form with fields: basicSalary, allowances, deductions, effective date
- [ ] Salary detail page showing breakdown of components
- [ ] Payslip list page showing all payslips (employee, month/year, status, paidDate)
- [ ] Payslip detail page with full breakdown and download PDF button
- [ ] Generate payslips bulk operation (select month/year, click generate)
- [ ] Finalize payslips (change status to FINALIZED)
- [ ] Mark payslip as paid (record payment date)
- [ ] Salary history chart for each employee
- [ ] Responsive design and loading states
- [ ] Form validation and error messages

**Technical Tasks**:
1. Create `frontend/src/app/(dashboard)/hr/salary/page.tsx`
2. Create `frontend/src/app/(dashboard)/hr/salary/[id]/page.tsx`
3. Create `frontend/src/app/(dashboard)/hr/payslips/page.tsx`
4. Create `frontend/src/app/(dashboard)/hr/payslips/[id]/page.tsx`
5. Create salary form component
6. Create payslip detail component
7. Create salary history chart component
8. Implement service layer for salary and payslip
9. Add PDF download functionality

**Testing**:
- Component tests: All pages and components
- E2E tests: Salary creation, payslip generation, PDF download
- Form validation tests

---

## Epic: HR-E3 - Performance & Discipline Management

**Description**: Performance reviews and disciplinary action tracking.

---

### Story: HR-3.1 - Create Performance & Discipline Models
**Story Points**: 5
**Priority**: P1
**Sprint**: Week 5
**Dependencies**: HR-1.1

**User Story**:
As a database developer, I want to create models for performance reviews and disciplinary actions, so that I can track employee performance and discipline.

**Acceptance Criteria**:
- [ ] PerformanceReview model created with rating fields (1-5): technicalSkills, communication, teamwork, initiative, reliability, customerService
- [ ] PerformanceReview model includes: overallRating (average), strengths, weaknesses, developmentAreas, comments, reviewedBy, reviewDate
- [ ] DisciplinaryAction model created with types: VERBAL_WARNING, WRITTEN_WARNING, SUSPENSION, TERMINATION, MEMO
- [ ] DisciplinaryAction includes: actionType, description, reason, actionDate, approvedBy, status (ACTIVE, CLOSED, APPEALED)
- [ ] Both models linked to Employee
- [ ] Relationships and constraints properly defined
- [ ] Migration created and tested

**Technical Tasks**:
1. Add PerformanceReview model to schema.prisma
2. Add DisciplinaryAction model to schema.prisma
3. Create enums for actionTypes and status
4. Add relationships to Employee and User
5. Run migration
6. Test with Prisma Studio

---

### Story: HR-3.2 - Implement Performance Review Service
**Story Points**: 8
**Priority**: P1
**Sprint**: Week 5
**Dependencies**: HR-3.1, HR-1.2

**User Story**:
As a backend developer, I want to create performance review service, so that I can manage and track employee reviews.

**Acceptance Criteria**:
- [ ] Service methods: create, getAll, getById, update, getByEmployee, getPending, approve
- [ ] Validation: Rating values 1-5, review date in valid range
- [ ] Calculate overall rating as average of all ratings
- [ ] Support filtering (by employee, year, quarter, reviewer)
- [ ] Track reviewer (who conducted the review)
- [ ] Include action items (training, promotion eligibility)
- [ ] Error handling for invalid ratings, duplicate reviews in same period

**Technical Tasks**:
1. Create `backend/src/services/performance.service.ts`
2. Implement rating validation
3. Add overall rating calculation
4. Add filtering and pagination
5. Add unit tests
6. Document service methods

---

### Story: HR-3.3 - Implement Disciplinary Action Service
**Story Points**: 8
**Priority**: P1
**Sprint**: Week 5
**Dependencies**: HR-3.1, HR-1.2

**User Story**:
As a backend developer, I want to create disciplinary action service, so that I can record and track employee discipline.

**Acceptance Criteria**:
- [ ] Service methods: record, getAll, getById, update, getByEmployee, approve, closeAction
- [ ] Validation: Valid action types, action date <= current date
- [ ] Link to employee record
- [ ] Track approver and approval date
- [ ] Support status transitions (ACTIVE -> CLOSED or APPEALED)
- [ ] Include document attachment (scanned notice, etc.)
- [ ] Error handling for invalid action types, approval on already closed actions

**Technical Tasks**:
1. Create `backend/src/services/disciplinary.service.ts`
2. Implement action type validation
3. Add status transition logic
4. Add approval workflow
5. Add unit tests
6. Document service methods

---

## Epic: HR-E4 - HR Reporting & Analytics

**Description**: HR dashboards and reports for analytics.

---

### Story: HR-4.1 - Create HR Dashboard & Reports API
**Story Points**: 10
**Priority**: P2
**Sprint**: Week 6
**Dependencies**: HR-1.3, HR-2.3, HR-3.2, HR-3.3

**User Story**:
As a backend developer, I want to create API endpoints for HR analytics and reports, so that dashboards can display key metrics.

**Acceptance Criteria**:
- [ ] GET /api/v1/hr/dashboard - Key metrics: total employees, payroll cost, average salary, new hires, departures
- [ ] GET /api/v1/hr/reports/payroll - Monthly payroll summary
- [ ] GET /api/v1/hr/reports/attendance - Attendance statistics
- [ ] GET /api/v1/hr/reports/performance - Performance statistics
- [ ] GET /api/v1/hr/reports/discipline - Disciplinary action records
- [ ] GET /api/v1/hr/reports/turnover - Employee turnover analysis
- [ ] All reports support date range filtering
- [ ] All reports support department filtering
- [ ] All reports include export to CSV (optional)

**Technical Tasks**:
1. Create report service methods
2. Create controller methods
3. Create routes
4. Implement aggregation queries
5. Add CSV export if needed
6. Add unit tests
7. Performance optimize queries

---

### Story: HR-4.2 - Build HR Dashboard Frontend
**Story Points**: 13
**Priority**: P2
**Sprint**: Week 6-7
**Dependencies**: HR-4.1

**User Story**:
As a frontend developer, I want to create HR dashboard and reports pages, so that HR managers can see analytics.

**Acceptance Criteria**:
- [ ] HR Dashboard page with key metrics cards (total employees, payroll cost, etc.)
- [ ] Charts: Department-wise employee distribution, salary distribution, payroll trends
- [ ] Reports page with links to different reports
- [ ] Payroll Report: Monthly summary, total payroll, department-wise breakdown
- [ ] Attendance Report: Employee-wise attendance, department trends
- [ ] Performance Report: Performance ratings distribution, review statistics
- [ ] Discipline Report: Action types, action timeline
- [ ] Turnover Report: New hires, departures, turnover rate
- [ ] Date range picker for all reports
- [ ] Filter by department
- [ ] Export to CSV button (if implemented in backend)
- [ ] Loading states and error handling
- [ ] Responsive design

**Technical Tasks**:
1. Create `frontend/src/app/(dashboard)/hr/dashboard/page.tsx`
2. Create `frontend/src/app/(dashboard)/hr/reports/page.tsx`
3. Create individual report pages for each report type
4. Create dashboard card components
5. Create chart components (using Chart.js or similar)
6. Implement data filtering and export
7. Add unit and component tests

---

---

# HOSTEL MANAGEMENT MODULE EPICS & STORIES

## Epic: HOS-E1 - Hostel Core Management

**Description**: Basic hostel and room management infrastructure.

---

### Story: HOS-1.1 - Create Hostel Database Models
**Story Points**: 8
**Priority**: P0
**Sprint**: Week 7-8
**Dependencies**: None

**User Story**:
As a database developer, I want to create Prisma models for Hostel, Room, and related entities, so that I can manage hostel and room data.

**Acceptance Criteria**:
- [ ] Hostel model created (name, code, hostelType, capacity, address, city, state, zipCode, phone, email, warden, isActive, checkInTime, checkOutTime)
- [ ] Room model created (hostelId, roomNumber, floor, roomType, capacity, currentOccupancy, status, condition, amenities, baseFee)
- [ ] RoomAllocation model created (roomId, studentId, allocationDate, deallocationDate, academicYearId, status, deallocationReason)
- [ ] RoomCheckInOut model created (allocationId, checkInDate, checkOutDate, lastCheckInDate, isCurrentlyInHostel, status)
- [ ] All relationships properly defined
- [ ] Unique constraints (hostelId+roomNumber on Room, roomId+studentId+academicYearId on RoomAllocation)
- [ ] Indexes on frequently queried fields
- [ ] Migration created and tested

**Technical Tasks**:
1. Add Hostel, Room, RoomAllocation, RoomCheckInOut models to schema.prisma
2. Create enums for roomTypes, statuses, hostelTypes
3. Add relationships to School, Class, Student, User models
4. Run migration
5. Test with Prisma Studio

---

### Story: HOS-1.2 - Create Hostel Service Layer
**Story Points**: 10
**Priority**: P0
**Sprint**: Week 8
**Dependencies**: HOS-1.1

**User Story**:
As a backend developer, I want to create hostel and room services with CRUD operations, so that I can manage hostels and rooms.

**Acceptance Criteria**:
- [ ] Hostel service: create, getAll, getById, update, getStatistics (occupancy, fees collected, violations count)
- [ ] Room service: create, getAll, getById, update, getByHostel, getAvailable (by type, capacity), getOccupancy
- [ ] Room allocation service: allocate, deallocate, getByStudent, getByRoom, transfer
- [ ] Check-in/out service: checkIn, checkOut, getHistory, getCurrentGuests
- [ ] Validation: Room capacity checks, prevent duplicate allocation, validate status transitions
- [ ] Error handling: Room full, student already allocated, invalid hostel, etc.

**Technical Tasks**:
1. Create `backend/src/services/hostel.service.ts`
2. Create `backend/src/services/room.service.ts`
3. Create `backend/src/services/room-allocation.service.ts`
4. Create `backend/src/services/check-in-out.service.ts`
5. Implement occupancy calculation utilities
6. Add unit tests
7. Add validation logic

---

### Story: HOS-1.3 - Create Hostel & Room API Endpoints
**Story Points**: 10
**Priority**: P0
**Sprint**: Week 8-9
**Dependencies**: HOS-1.2

**User Story**:
As an API developer, I want to create REST endpoints for hostel and room management, so that frontend can manage hostels and rooms.

**Acceptance Criteria**:
- [ ] Hostel endpoints: GET /hostels, POST, GET /{id}, PUT /{id}, GET /{id}/statistics
- [ ] Room endpoints: GET /rooms, POST, GET /{id}, PUT /{id}, GET /hostel/{id}, GET /available
- [ ] Allocation endpoints: POST /allocations, GET, GET /{id}, DELETE /{id} (deallocate), GET /student/{id}, GET /room/{id}
- [ ] Check-in/out endpoints: POST /check-in, POST /check-out, GET /{id}/history, GET /hostel/{id}/current-guests
- [ ] Authentication required for all endpoints
- [ ] ADMIN/HOSTEL_WARDEN role required for create/update
- [ ] Proper error responses and validation

**Technical Tasks**:
1. Create `backend/src/controllers/hostel.controller.ts`
2. Create `backend/src/controllers/room.controller.ts`
3. Create `backend/src/controllers/room-allocation.controller.ts`
4. Create `backend/src/routes/hostel.routes.ts`
5. Create routes files for other controllers
6. Register routes in app.ts
7. Add authentication and authorization middleware
8. Add request validation

---

### Story: HOS-1.4 - Build Hostel Management Frontend Pages
**Story Points**: 16
**Priority**: P0
**Sprint**: Week 9-10
**Dependencies**: HOS-1.3

**User Story**:
As a frontend developer, I want to create hostel and room management pages, so that hostel staff can manage hostels and rooms.

**Acceptance Criteria**:
- [ ] Hostel list page with searchable table
- [ ] Hostel detail page showing occupancy, fees, statistics
- [ ] Create/Edit hostel form
- [ ] Room list page (searchable, filterable by hostel, floor, type, status)
- [ ] Room detail page showing current occupants, allocation history
- [ ] Create/Edit room form
- [ ] Room allocation form (select hostel, room, student)
- [ ] Deallocate/vacate form with reason selection
- [ ] Check-in/check-out interface
- [ ] Current guests list page
- [ ] Responsive design, loading states, error handling

**Technical Tasks**:
1. Create `frontend/src/app/(dashboard)/hostel/` folder structure
2. Create hostel management pages (list, detail, edit, create)
3. Create room management pages
4. Create allocation management pages
5. Create check-in/out interface
6. Create service layer for hostel module
7. Implement components and forms
8. Add validation and error handling

---

## Epic: HOS-E2 - Hostel Fees & Billing

**Description**: Hostel fee structure and billing management.

---

### Story: HOS-2.1 - Create Hostel Fee Models
**Story Points**: 5
**Priority**: P0
**Sprint**: Week 10
**Dependencies**: HOS-1.1

**User Story**:
As a database developer, I want to create Hostel Fee model, so that I can manage hostel fees.

**Acceptance Criteria**:
- [ ] HostelFee model created (hostelId, name, description, amount, frequency, academicYearId, roomType, isActive, dueDay)
- [ ] Support multiple fees per hostel (accommodation, utilities, maintenance, etc.)
- [ ] Optional room type-specific fees
- [ ] Unique constraint: hostelId + name + academicYearId
- [ ] Integration with Finance module (for billing)

**Technical Tasks**:
1. Add HostelFee model to schema.prisma
2. Create enums for frequency
3. Add relationships to Hostel and AcademicYear
4. Run migration

---

### Story: HOS-2.2 - Implement Hostel Fee Service & Billing
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 10-11
**Dependencies**: HOS-2.1, HOS-1.2

**User Story**:
As a backend developer, I want to create fee service and billing logic, so that hostel fees can be calculated and billed.

**Acceptance Criteria**:
- [ ] Hostel fee CRUD service (create, getAll, getById, update)
- [ ] Billing service: calculateMonthlyBill, generateBills, getOutstandingBills
- [ ] Bill calculation includes: baseFee + room premium - discounts
- [ ] Generate monthly bills for all allocated students
- [ ] Track payment status (pending, partial, paid, overdue)
- [ ] Integration with Finance module for creating fee records
- [ ] Late fee calculation (if configured)
- [ ] Error handling for missing fees, allocation mismatches

**Technical Tasks**:
1. Create `backend/src/services/hostel-fee.service.ts`
2. Create billing calculation utilities
3. Integrate with Finance module API
4. Add unit tests for billing logic
5. Implement late fee calculation (if required)

---

## Epic: HOS-E3 - Violations & Complaints

**Description**: Tracking hostel violations and complaints.

---

### Story: HOS-3.1 - Create Violation & Complaint Models
**Story Points**: 5
**Priority**: P1
**Sprint**: Week 11
**Dependencies**: HOS-1.1

**User Story**:
As a database developer, I want to create models for violations and complaints, so that I can track issues.

**Acceptance Criteria**:
- [ ] HostelViolation model (allocationId, violationType, description, violationDate, reportedDate, reportedBy, action, fineAmount, suspensionDays, status)
- [ ] HostelComplaint model (hostelId, studentId, complaintType, title, description, severity, lodgedDate, status, priority, assignedTo, resolutionNotes)
- [ ] Violation types: missing curfew, unauthorized guest, noise, cleanliness, damage, other
- [ ] Complaint types: maintenance, cleanliness, food (if hostel has mess), staff, roommate, noise, safety
- [ ] Status tracking: Open, In Progress, Resolved, Closed
- [ ] Priority levels: Low, Normal, High, Urgent
- [ ] Models linked to Student, User, RoomAllocation

**Technical Tasks**:
1. Add HostelViolation and HostelComplaint models
2. Create enums for types and statuses
3. Add relationships
4. Run migration

---

### Story: HOS-3.2 - Implement Violation & Complaint Services
**Story Points**: 10
**Priority**: P1
**Sprint**: Week 11-12
**Dependencies**: HOS-3.1, HOS-1.2

**User Story**:
As a backend developer, I want to create services for violations and complaints, so that I can manage them.

**Acceptance Criteria**:
- [ ] Violation service: recordViolation, getAll, getById, update, getByStudent, approve, closeViolation, recordAppeal
- [ ] Complaint service: lodge, getAll, getById, update, assign, resolve, close
- [ ] Support filtering (status, severity, priority, date range)
- [ ] Approval workflow for violations
- [ ] Appeal mechanism for violations
- [ ] Error handling for invalid status transitions

**Technical Tasks**:
1. Create violation service
2. Create complaint service
3. Implement approval workflow
4. Add unit tests
5. Add status transition validation

---

---

# MESS MANAGEMENT MODULE EPICS & STORIES

## Epic: MESS-E1 - Mess Core Management

**Description**: Mess facility and meal plan management.

---

### Story: MESS-1.1 - Create Mess Database Models
**Story Points**: 8
**Priority**: P0
**Sprint**: Week 12-13
**Dependencies**: None

**User Story**:
As a database developer, I want to create Prisma models for Mess, MealPlan, and Menu, so that I can manage mess operations.

**Acceptance Criteria**:
- [ ] Mess model (name, code, capacity, address, manager, isActive, cuisineType)
- [ ] MealPlan model (messId, name, code, includesBreakfast/Lunch/Dinner/Snacks, monthlyPrice, dietaryOptions, isActive)
- [ ] Menu model (messId, menuDate, dayOfWeek, isHoliday, holidayName)
- [ ] Meal model (menuId, mealType, dishName, description, category, calories, allergens, cost)
- [ ] All models properly related
- [ ] Unique constraints for key fields
- [ ] Migration created and tested

**Technical Tasks**:
1. Add Mess, MealPlan, Menu, Meal models
2. Create enums for mealTypes, cuisineTypes, dietaryCategories
3. Add relationships
4. Run migration

---

### Story: MESS-1.2 - Create Mess Service Layer
**Story Points**: 10
**Priority**: P0
**Sprint**: Week 13
**Dependencies**: MESS-1.1

**User Story**:
As a backend developer, I want to create mess and meal plan services, so that I can manage mess operations.

**Acceptance Criteria**:
- [ ] Mess service: create, getAll, getById, update, getStatistics (enrolled students, revenue, feedback score)
- [ ] MealPlan service: create, getAll, getById, update, getByMess
- [ ] Menu service: create, getMenuForDate, getMonthlyMenu, updateDailyMenu
- [ ] Meal service: create, getAll, getById, getByMenu, getMealVariants (veg/non-veg)
- [ ] Validation: Valid dietary categories, allergen tracking
- [ ] Error handling

**Technical Tasks**:
1. Create mess service
2. Create meal plan service
3. Create menu service
4. Create meal service
5. Add unit tests
6. Add validation logic

---

### Story: MESS-1.3 - Create Mess API Endpoints
**Story Points**: 10
**Priority**: P0
**Sprint**: Week 13-14
**Dependencies**: MESS-1.2

**User Story**:
As an API developer, I want to create REST endpoints for mess management, so that frontend can manage mess operations.

**Acceptance Criteria**:
- [ ] Mess endpoints: GET, POST, GET /{id}, PUT /{id}, GET /{id}/statistics
- [ ] MealPlan endpoints: GET, POST, GET /{id}, PUT /{id}
- [ ] Menu endpoints: GET /menus, POST, GET /date/{date}, PUT /{id}
- [ ] Meal endpoints: GET, POST, GET /{id}, PUT /{id}, DELETE /{id}
- [ ] All endpoints with authentication and proper authorization
- [ ] Error responses and validation

**Technical Tasks**:
1. Create controllers for mess, meal plan, menu, meal
2. Create routes
3. Register routes
4. Add middleware

---

## Epic: MESS-E2 - Student Enrollment & Billing

**Description**: Student enrollment in meal plans and billing.

---

### Story: MESS-2.1 - Create Enrollment & Billing Models
**Story Points**: 5
**Priority**: P0
**Sprint**: Week 14
**Dependencies**: MESS-1.1

**User Story**:
As a database developer, I want to create enrollment and billing models, so that I can manage student meal plans and billing.

**Acceptance Criteria**:
- [ ] MessEnrollment model (studentId, messId, mealPlanId, startDate, endDate, dietaryPreference, allergies, restrictions, status)
- [ ] MealAttendance model (enrollmentId, mealId, attendanceDate, attended)
- [ ] MessBill model (enrollmentId, billingMonth, billingYear, baseCost, additionalCharges, discount, totalAmount, paidAmount, status)
- [ ] ExtraMealBooking model (enrollmentId, mealDate, mealType, mealCost, status)
- [ ] Models properly related and constrained

**Technical Tasks**:
1. Add models to schema.prisma
2. Create enums for dietaryPreferences, statuses
3. Add relationships to Student, Mess, MealPlan
4. Run migration

---

### Story: MESS-2.2 - Implement Enrollment & Billing Services
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 14-15
**Dependencies**: MESS-2.1, MESS-1.2

**User Story**:
As a backend developer, I want to create enrollment and billing services, so that students can enroll and be billed.

**Acceptance Criteria**:
- [ ] Enrollment service: enroll, unenroll, getByStudent, getByMess, updatePreferences, validateCapacity
- [ ] Attendance service: markAttendance, getHistory, getMonthlySummary
- [ ] Billing service: generateBills, calculateBill, recordPayment, getOutstandingBills
- [ ] Bill calculation: basePlanCost + extraMeals - discount + lateFee
- [ ] Extra meal booking service: book, confirm, cancel, getByDate
- [ ] Integration with Finance module for bill creation
- [ ] Error handling: capacity exceeded, enrollment conflicts, invalid dates

**Technical Tasks**:
1. Create enrollment service
2. Create attendance service
3. Create billing service
4. Create extra meal booking service
5. Add unit tests
6. Implement Finance module integration

---

## Epic: MESS-E3 - Feedback & Complaints

**Description**: Feedback collection and complaint management.

---

### Story: MESS-3.1 - Create Feedback Models
**Story Points**: 3
**Priority**: P1
**Sprint**: Week 15
**Dependencies**: MESS-1.1

**User Story**:
As a database developer, I want to create models for feedback and complaints, so that quality can be tracked.

**Acceptance Criteria**:
- [ ] MealFeedback model (enrollmentId, messId, mealId, feedbackType, rating 1-5, comment, isAnonymous, reviewed, actionTaken)
- [ ] MessComplaint model (enrollmentId, messId, complaintType, title, description, severity, reportedDate, status, priority, assignedTo, resolutionNotes)
- [ ] Feedback types: meal quality, taste, quantity, cleanliness, service
- [ ] Complaint types: food quality, hygiene, staff, billing, service
- [ ] Severity levels: Low, Medium, High, Critical

**Technical Tasks**:
1. Add models to schema.prisma
2. Create enums
3. Add relationships
4. Run migration

---

### Story: MESS-3.2 - Implement Feedback & Complaint Services
**Story Points**: 10
**Priority**: P1
**Sprint**: Week 15-16
**Dependencies**: MESS-3.1, MESS-1.2

**User Story**:
As a backend developer, I want to create feedback and complaint services, so that quality issues can be tracked.

**Acceptance Criteria**:
- [ ] Feedback service: submit, getAll, getById, markReviewed, getAverageRating
- [ ] Complaint service: lodge, getAll, getById, assign, resolve, close
- [ ] Feedback aggregation by meal, date, feedback type
- [ ] Complaint workflow: Open -> In Progress -> Resolved -> Closed
- [ ] Support filtering and reporting

**Technical Tasks**:
1. Create feedback service
2. Create complaint service
3. Add aggregation logic
4. Add unit tests

---

---

# STORE/INVENTORY MODULE EPICS & STORIES

## Epic: STORE-E1 - Store & Item Management

**Description**: Store and inventory item catalog management.

---

### Story: STORE-1.1 - Create Store Database Models
**Story Points**: 10
**Priority**: P0
**Sprint**: Week 16-17
**Dependencies**: None

**User Story**:
As a database developer, I want to create Prisma models for Store, Item, and related entities, so that I can manage inventory.

**Acceptance Criteria**:
- [ ] Store model (name, code, storeType, location, address, phone, email, storeKeeper, isActive, storageCapacity)
- [ ] ItemCategory model (name, code, description, parentCategoryId for hierarchy)
- [ ] Unit model (name, shortName, description)
- [ ] InventoryItem model (name, description, sku, barcode, categoryId, unitId, reorderPoint, reorderQuantity, unitCost, requiresSerialNo, requiresExpiryDate, isActive)
- [ ] StockLevel model (storeId, itemId, currentQuantity, reservedQuantity, availableQuantity, lastMovementDate)
- [ ] All relationships properly defined
- [ ] Unique constraints on sku, barcode
- [ ] Indexes on frequently queried fields
- [ ] Migration created

**Technical Tasks**:
1. Add all models to schema.prisma
2. Create enums for storeTypes
3. Add relationships
4. Create category hierarchy logic
5. Run migration
6. Test with Prisma Studio

---

### Story: STORE-1.2 - Create Store & Item Services
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 17-18
**Dependencies**: STORE-1.1

**User Story**:
As a backend developer, I want to create store and item services, so that I can manage stores and items.

**Acceptance Criteria**:
- [ ] Store service: create, getAll, getById, update, getStatistics (inventory value, item count, stock health)
- [ ] Item service: create, getAll, getById, update, getByCategory, getBySku/Barcode, getByStatus
- [ ] Category service: create, getAll, getHierarchy, update, getByParent
- [ ] Unit service: create, getAll, getById, update
- [ ] StockLevel service: getAll, getByStore, getByItem, updateLevel, getLowStock, getOverstock
- [ ] Validation: Unique SKU/barcode, valid units, category hierarchy
- [ ] Error handling

**Technical Tasks**:
1. Create store service
2. Create item service
3. Create category service
4. Create unit service
5. Create stock level service
6. Add unit tests
7. Add inventory calculation utilities

---

### Story: STORE-1.3 - Create Store & Item API Endpoints
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 18
**Dependencies**: STORE-1.2

**User Story**:
As an API developer, I want to create REST endpoints for store and item management, so that frontend can manage inventory.

**Acceptance Criteria**:
- [ ] Store endpoints: GET, POST, GET /{id}, PUT /{id}, GET /{id}/statistics
- [ ] Item endpoints: GET, POST, GET /{id}, PUT /{id}, DELETE /{id}, GET /category/{id}, GET /sku/{sku}
- [ ] Category endpoints: GET, POST, GET /{id}, PUT /{id}, GET /hierarchy
- [ ] Unit endpoints: GET, POST, GET /{id}, PUT /{id}
- [ ] StockLevel endpoints: GET, GET /store/{id}, GET /low, GET /overstock
- [ ] Authentication and authorization required
- [ ] Error responses and validation

**Technical Tasks**:
1. Create controllers for all services
2. Create routes
3. Register routes
4. Add middleware
5. Add request validation

---

### Story: STORE-1.4 - Build Store & Item Management Frontend
**Story Points**: 16
**Priority**: P0
**Sprint**: Week 18-20
**Dependencies**: STORE-1.3

**User Story**:
As a frontend developer, I want to create store and item management pages, so that staff can manage inventory items.

**Acceptance Criteria**:
- [ ] Store list page with searchable table
- [ ] Store detail page with inventory statistics
- [ ] Create/Edit store form
- [ ] Item list page (searchable, filterable by category, status)
- [ ] Item detail page with stock levels by store
- [ ] Create/Edit item form with category and unit selection
- [ ] Category management page with hierarchy view
- [ ] Unit management page
- [ ] Stock level overview page (spreadsheet view of all stores/items)
- [ ] Low stock alerts
- [ ] Overstock alerts
- [ ] Responsive design, loading states, error handling

**Technical Tasks**:
1. Create `frontend/src/app/(dashboard)/inventory/` folder structure
2. Create store management pages
3. Create item management pages
4. Create category management page
5. Create stock level overview page
6. Create service layer for store module
7. Implement components and forms
8. Add validation

---

## Epic: STORE-E2 - Stock Movements

**Description**: Stock in/out, transfers, and adjustments.

---

### Story: STORE-2.1 - Create Stock Movement Models
**Story Points**: 8
**Priority**: P0
**Sprint**: Week 20
**Dependencies**: STORE-1.1

**User Story**:
As a database developer, I want to create stock movement models, so that I can track inventory movements.

**Acceptance Criteria**:
- [ ] StockMovement model (storeId, itemId, movementType IN/OUT/TRANSFER/ADJUSTMENT/DAMAGE, quantity, direction, serialNumbers, batchNo, expiryDate, referenceDocNo, referenceType, reason, movementDate, movedBy)
- [ ] StockTransfer model (fromStoreId, toStoreId, transferDate, expectedDeliveryDate, status PENDING/IN_TRANSIT/RECEIVED)
- [ ] StockAdjustment model (storeId, itemId, adjustmentType PHYSICAL_COUNT/DAMAGE/LOSS, currentQuantity, adjustedQuantity, reason, adjustedBy, approvedBy, status)
- [ ] Models properly related
- [ ] Audit trail fields (movedBy, adjustedBy, approvedBy, timestamps)

**Technical Tasks**:
1. Add models to schema.prisma
2. Create enums for movementTypes, adjustmentTypes
3. Add relationships
4. Run migration

---

### Story: STORE-2.2 - Implement Stock Movement Services
**Story Points**: 16
**Priority**: P0
**Sprint**: Week 20-21
**Dependencies**: STORE-2.1, STORE-1.2

**User Story**:
As a backend developer, I want to create stock movement services, so that I can track and update stock levels.

**Acceptance Criteria**:
- [ ] Stock In service (from purchase): recordStockIn, validate receipt, update stock level, check for overstock alert
- [ ] Stock Out service (requisition issue): recordStockOut, validate availability, update stock level, check for low stock alert
- [ ] Stock Transfer service: initiateTransfer, recordTransferOut, recordTransferIn, validate both sides
- [ ] Stock Adjustment service: recordAdjustment, requestApproval, approveAdjustment, applyAdjustment
- [ ] Movement history: getMovements, getByItem, getByDateRange, getByMovementType
- [ ] Validation: Check stock availability, valid types, proper approvals
- [ ] Error handling: Insufficient stock, invalid reference, approval errors

**Technical Tasks**:
1. Create stock movement service
2. Create transfer service
3. Create adjustment service
4. Implement stock level update logic
5. Add alert generation logic
6. Add unit tests
7. Add transaction support for data consistency

---

## Epic: STORE-E3 - Purchase Orders

**Description**: Purchase order creation, approval, and receipt.

---

### Story: STORE-3.1 - Create Purchase Order Models
**Story Points**: 5
**Priority**: P0
**Sprint**: Week 21
**Dependencies**: STORE-1.1

**User Story**:
As a database developer, I want to create purchase order models, so that I can track purchase orders.

**Acceptance Criteria**:
- [ ] PurchaseOrder model (storeId, poNumber, vendorId, orderDate, expectedDeliveryDate, actualDeliveryDate, subtotal, tax, shipping, discount, totalAmount, paymentTerms, paymentStatus, paidAmount, receivedQuantity, status DRAFT/APPROVED/ORDERED/RECEIVED)
- [ ] PurchaseOrderItem model (poId, itemId, orderedQuantity, receivedQuantity, rejectedQuantity, unitPrice, amount)
- [ ] Vendor model (name, code, contact, address, gstNumber, panNumber, vendorType, isActive, performance ratings)
- [ ] Models properly related and constrained

**Technical Tasks**:
1. Add models to schema.prisma
2. Create enums for status, paymentStatus, vendorType
3. Add relationships
4. Run migration

---

### Story: STORE-3.2 - Implement Purchase Order Services
**Story Points**: 16
**Priority**: P0
**Sprint**: Week 21-22
**Dependencies**: STORE-3.1, STORE-1.2

**User Story**:
As a backend developer, I want to create purchase order services, so that I can manage POs and vendor purchases.

**Acceptance Criteria**:
- [ ] PO service: create, getAll, getById, update, delete (draft only), approvePO, orderItems
- [ ] Goods receipt service: receiveGoods, recordReceipt, qualityCheck (reject items)
- [ ] Payment tracking: recordPayment, updatePaymentStatus
- [ ] Vendor service: create, getAll, getById, update, getOrderHistory, getPerformanceMetrics
- [ ] PO generation: Auto-calculate totals, validate items exist, check vendor active
- [ ] Validation: PO can't be edited after approved, received quantity <= ordered, payment tracking
- [ ] Error handling: Invalid vendor, duplicate PO number, item not found

**Technical Tasks**:
1. Create purchase order service
2. Create goods receipt service
3. Create vendor service
4. Add PO calculation and validation utilities
5. Integrate with stock movement (auto record stock in on receipt)
6. Add unit tests

---

## Epic: STORE-E4 - Requisitions

**Description**: Requisition creation, approval, and fulfillment.

---

### Story: STORE-4.1 - Create Requisition Models
**Story Points**: 5
**Priority**: P0
**Sprint**: Week 22
**Dependencies**: STORE-1.1

**User Story**:
As a database developer, I want to create requisition models, so that I can track inventory requisitions.

**Acceptance Criteria**:
- [ ] Requisition model (storeId, requisitionNo, requesterUserId, requisitionDate, requiredByDate, status PENDING/APPROVED/REJECTED/FULFILLED, approvedBy, approvalDate, fulfilledDate, reason, priority, remarks)
- [ ] RequisitionItem model (requisitionId, itemId, requestedQuantity, approvedQuantity, issuedQuantity, remarks)
- [ ] Models properly related and constrained

**Technical Tasks**:
1. Add models to schema.prisma
2. Create enums for status, priority
3. Add relationships to User, Store, Item
4. Run migration

---

### Story: STORE-4.2 - Implement Requisition Services
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 22-23
**Dependencies**: STORE-4.1, STORE-1.2

**User Story**:
As a backend developer, I want to create requisition services, so that I can manage requisitions and approvals.

**Acceptance Criteria**:
- [ ] Requisition service: create, getAll, getById, update (draft/pending), cancelRequisition
- [ ] Approval service: approveRequisition, rejectRequisition, getForApproval
- [ ] Fulfillment service: issueItems, getIssueHistory, completeRequisition
- [ ] Validation: Can only approve pending, can't change after approved, request quantity <= available stock
- [ ] Reserve stock when approved (reduces availableQuantity), release on rejection
- [ ] Error handling: Requisition not found, invalid status, insufficient stock, approval errors

**Technical Tasks**:
1. Create requisition service
2. Create approval service
3. Create fulfillment service
4. Implement stock reservation logic
5. Add workflow validation
6. Add unit tests
7. Integrate with stock movement (auto record stock out on issue)

---

## Epic: STORE-E5 - Inventory Reports & Analytics

**Description**: Inventory reports, analytics, and dashboards.

---

### Story: STORE-5.1 - Create Inventory Report APIs
**Story Points**: 16
**Priority**: P1
**Sprint**: Week 23-24
**Dependencies**: STORE-1.3, STORE-2.2, STORE-3.2, STORE-4.2

**User Story**:
As a backend developer, I want to create report endpoints for inventory analytics, so that dashboards can display key metrics.

**Acceptance Criteria**:
- [ ] GET /api/v1/reports/inventory-valuation - Total inventory value (with FIFO/LIFO/WAC method selection)
- [ ] GET /api/v1/reports/stock-movement - Stock movement over date range
- [ ] GET /api/v1/reports/low-stock - Items below reorder point
- [ ] GET /api/v1/reports/slow-moving - Items with minimal movement
- [ ] GET /api/v1/reports/vendor-performance - Vendor metrics (on-time delivery, quality, price)
- [ ] GET /api/v1/reports/budget-vs-actual - PO budget vs actual spending
- [ ] All reports support filtering (date range, store, category, vendor)
- [ ] Support CSV export (optional)

**Technical Tasks**:
1. Create inventory valuation logic (FIFO, LIFO, WAC)
2. Create report service methods
3. Create controller methods
4. Create aggregation queries
5. Add CSV export if needed
6. Performance optimize queries
7. Add caching for heavy reports

---

### Story: STORE-5.2 - Build Inventory Dashboard Frontend
**Story Points**: 16
**Priority**: P1
**Sprint**: Week 24-25
**Dependencies**: STORE-5.1

**User Story**:
As a frontend developer, I want to create inventory dashboard and reports pages, so that managers can see analytics.

**Acceptance Criteria**:
- [ ] Inventory Dashboard: Total inventory value, items count, low stock alerts, recent movements
- [ ] Stock Level Dashboard: Current stock levels (spreadsheet view), stock status indicators
- [ ] Inventory Valuation Report: Total value by category, store, valuation method
- [ ] Stock Movement Report: Movements by date, type, item, department
- [ ] Low Stock Report: Items below reorder, reorder quantity, supplier info
- [ ] Slow Moving Items: Items with minimal movement, recommendations to sell/dispose
- [ ] Vendor Performance Report: On-time delivery %, quality rating, price comparison
- [ ] Budget vs Actual Report: Category-wise spending vs budget
- [ ] Date range picker, filters (store, category, vendor, department)
- [ ] Export to CSV button
- [ ] Charts and visualizations
- [ ] Responsive design

**Technical Tasks**:
1. Create `frontend/src/app/(dashboard)/inventory/dashboard/page.tsx`
2. Create report pages for each report type
3. Create dashboard card components
4. Create chart components
5. Create report service layer
6. Implement filtering and export
7. Add unit and component tests

---

# UPDATED STORIES - NEW MODELS (PHASE 2)

## HR Module - New Models (Advanced HR Features)

### Epic: HR-E3 - Leave & Attendance Management

#### Story: HR-3.1 - Implement Leave Balance & Tracking (NEW)
**Story Points**: 8
**Priority**: P0
**Sprint**: Week 5-6
**Dependencies**: HR-1.1

**User Story**:
As an HR manager, I want to track leave balances per employee per type, so that employees can request leave against available balance.

**Acceptance Criteria**:
- [ ] LeaveBalance model created with automatic carry-over logic
- [ ] Leave balance calculates remaining days (allocated - used)
- [ ] Support multiple leave types (Casual, Sick, Earned, Unpaid)
- [ ] Track carry-over from previous year (max 5 days)
- [ ] Support encashment on separation
- [ ] LeaveBalance updated when leave requests are approved
- [ ] Service prevents approval if insufficient balance
- [ ] Generate leave balance report per employee

**Technical Tasks**:
1. Create `LeaveBalance` and `LeaveEncashment` models in schema
2. Create `backend/src/services/leave-balance.service.ts`
3. Create `backend/src/utils/leave-calculator.ts` (carry-over, encashment)
4. Create API endpoints: GET/POST/PUT leave balances
5. Create frontend leave balance dashboard
6. Integrate with leave request approval workflow

**Testing**:
- Unit tests: Leave calculations, carry-over logic
- Integration tests: Approve leave, update balance
- Edge cases: Insufficient balance, max carry-over

---

#### Story: HR-3.2 - Employee Separations & Exit Management (NEW)
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 6-7
**Dependencies**: HR-3.1, HR-1.1

**User Story**:
As an HR administrator, I want to manage employee separations with final settlement calculations, so that exit process is properly tracked and documented.

**Acceptance Criteria**:
- [ ] EmployeeSeparation model created with types (RESIGNATION, RETIREMENT, TERMINATION)
- [ ] ExitChecklist model tracks clearances (IT, Finance, Library, etc.)
- [ ] Final settlement calculated: Pro-rata salary + Leave encashment + Gratuity
- [ ] TDS calculation on final settlement
- [ ] Experience certificate generation
- [ ] All data frozen after separation (no edits)
- [ ] Separation report with settlement breakdown
- [ ] Scheduled job to deactivate employee after separation date

**Technical Tasks**:
1. Create `EmployeeSeparation`, `ExitChecklist`, `Gratuity` models
2. Create `backend/src/services/separation.service.ts`
3. Create `backend/src/utils/settlement-calculator.ts` (gratuity formula)
4. Create `backend/src/utils/gratuity-calculator.ts` (per policy)
5. Create API endpoints: manage separations, exit checklists
6. Create separation report page
7. Create experience certificate generation

**Testing**:
- Unit tests: Settlement calculations, TDS
- Integration tests: Complete separation workflow
- Edge cases: Mid-month separation, multiple pending leaves

---

### Epic: HR-E4 - Employee Development & Promotions

#### Story: HR-3.3 - Promotions & Transfer Workflow (NEW)
**Story Points**: 10
**Priority**: P1
**Sprint**: Week 7-8
**Dependencies**: HR-1.1

**User Story**:
As an HR manager, I want to manage employee promotions and transfers with approval workflow, so that career movements are properly tracked.

**Acceptance Criteria**:
- [ ] EmployeePromotion model with workflow (PROPOSED → APPROVED → ACTIVATED)
- [ ] EmployeeTransfer model with similar workflow
- [ ] Track salary revision during promotion
- [ ] Support conditional approvals (HR → Manager → Director)
- [ ] Update employee's designation and salary on activation
- [ ] Maintain history of all promotions/transfers
- [ ] Generate promotion/transfer letters

**Technical Tasks**:
1. Create `EmployeePromotion`, `EmployeeTransfer` models
2. Create `backend/src/services/promotion.service.ts`
3. Create `backend/src/services/transfer.service.ts`
4. Create approval workflow logic
5. Create API endpoints for workflow
6. Create frontend promotion request page
7. Create letter generation utility

---

#### Story: HR-3.4 - Performance Reviews & Qualifications (NEW)
**Story Points**: 10
**Priority**: P1
**Sprint**: Week 8-9
**Dependencies**: HR-1.1

**User Story**:
As an HR manager, I want to track employee qualifications and performance review cycles, so that development plans can be created.

**Acceptance Criteria**:
- [ ] EmployeeQualification model tracks education/certifications with verification
- [ ] ReviewCycle model schedules annual/quarterly reviews
- [ ] PerformanceReview linked to ReviewCycle
- [ ] Support multiple reviewers (Manager, HR, Director)
- [ ] Calculate overall performance rating (1-5 scale)
- [ ] Generate review summary report
- [ ] Link qualifications to promotion eligibility

**Technical Tasks**:
1. Create `EmployeeQualification`, `ReviewCycle` models
2. Update `PerformanceReview` with cycle linking
3. Create `backend/src/services/qualification.service.ts`
4. Create `backend/src/services/review-cycle.service.ts`
5. Create API endpoints for qualifications and cycles
6. Create review cycle management page
7. Create performance summary reports

---

---

## Hostel Module - New Models (Advanced Features)

### Epic: HOS-E2 - Room Inspections & Maintenance

#### Story: HOS-2.1 - Room Inspection System (NEW)
**Story Points**: 10
**Priority**: P0
**Sprint**: Week 7-8
**Dependencies**: HOS-1.1

**User Story**:
As a hostel warden, I want to conduct pre-allocation, post-checkout, and regular room inspections, so that room quality is maintained and damage charges are tracked.

**Acceptance Criteria**:
- [ ] RoomInspection model with types (PRE_ALLOCATION, POST_CHECKOUT, QUARTERLY, ANNUAL)
- [ ] 1-5 scoring for each criterion (cleanliness, furniture, fixtures, plumbing, electrical, bedding)
- [ ] Overall score calculated as average
- [ ] Damage photo upload and documentation
- [ ] Inspection score threshold (≥4: ACCEPTABLE, 3-4: ACCEPTABLE_WITH_NOTES, <3: NOT_ACCEPTABLE)
- [ ] Auto-block room allocation if pre-allocation inspection not approved
- [ ] Damage charge calculation if >threshold
- [ ] Overdue inspection alerts

**Technical Tasks**:
1. Create `RoomInspection` model
2. Create `backend/src/services/room-inspection.service.ts`
3. Create `backend/src/utils/room-inspection-calculator.ts`
4. Create API endpoints: create, view, approve inspections
5. Create room inspection management page
6. Create damage charge creation workflow
7. Add photo upload to inspection form

**Testing**:
- Unit tests: Score calculations, thresholds
- Integration tests: Inspection workflow, blocking allocations
- E2E tests: Full inspection with photos

---

#### Story: HOS-2.2 - Hostel Attendance & Curfew Tracking (NEW)
**Story Points**: 10
**Priority**: P0
**Sprint**: Week 8-9
**Dependencies**: HOS-1.1

**User Story**:
As a hostel warden, I want to track student check-in/check-out times and detect curfew violations, so that discipline can be enforced.

**Acceptance Criteria**:
- [ ] HostelAttendance model with check-in/check-out timestamps
- [ ] Automatic curfew violation detection (check-in after configured time)
- [ ] Attendance regularization workflow for special cases
- [ ] Daily attendance report (list of checked-in students)
- [ ] Attendance analytics (attendance %, late arrival patterns)
- [ ] Integration with violation system for repeat offenders
- [ ] Curfew violation report for dean/management

**Technical Tasks**:
1. Create `HostelAttendance` model
2. Create `backend/src/services/hostel-attendance.service.ts`
3. Create `backend/src/utils/curfew-violation-detector.ts`
4. Create quick check-in/out interface (barcode scanning ready)
5. Create API endpoints: record attendance, generate reports
6. Create attendance tracking page
7. Create curfew violation analysis page

**Testing**:
- Unit tests: Violation detection logic
- Integration tests: Check-in/out, violation creation
- E2E tests: Complete attendance workflow

---

### Epic: HOS-E3 - Guest House & Visitor Management

#### Story: HOS-2.3 - Guest House Booking System (NEW)
**Story Points**: 13
**Priority**: P1
**Sprint**: Week 9-10
**Dependencies**: HOS-1.1

**User Story**:
As a student, I want to book multi-day visitor accommodation in guest houses, so that family and friends can stay at school facilities.

**Acceptance Criteria**:
- [ ] GuestHouse model with room types and amenities
- [ ] GuestHouseBooking model with status workflow (PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT)
- [ ] Room availability checking for date range
- [ ] Cost calculation (daily rate × nights)
- [ ] Booking approval workflow (student request → warden approval)
- [ ] Payment recording with advance payment option
- [ ] Check-in/out interface with timing
- [ ] Guest details and relationship tracking
- [ ] Occupancy report and booking calendar

**Technical Tasks**:
1. Create `GuestHouse`, `GuestHouseBooking` models
2. Create `backend/src/services/guest-house-booking.service.ts`
3. Create `backend/src/utils/guest-booking-calculator.ts`
4. Create room availability checking logic
5. Create API endpoints: create booking, approve, check-in/out
6. Create booking management page (student + warden views)
7. Create occupancy calendar view

**Testing**:
- Unit tests: Availability checking, cost calculations
- Integration tests: Booking workflow, approval
- E2E tests: Full booking from request to checkout

---

#### Story: HOS-2.4 - Visitor Approval Workflow (NEW)
**Story Points**: 8
**Priority**: P1
**Sprint**: Week 10-11
**Dependencies**: HOS-1.1

**User Story**:
As a student, I want to request visitor approval before check-in, so that hostel security is maintained.

**Acceptance Criteria**:
- [ ] Updated HostelVisitor model with approval workflow
- [ ] Student submits visitor request (name, relationship, date, time)
- [ ] Warden approves/rejects requests
- [ ] Approved visitors can check-in (system generates pass)
- [ ] Check-out required to complete visit record
- [ ] Visitor history report per student
- [ ] Rejected request notification to student
- [ ] Pass cancellation workflow

**Technical Tasks**:
1. Update `HostelVisitor` model with approval fields
2. Create `backend/src/services/visitor-approval.service.ts`
3. Create API endpoints: request, approve, reject, check-in/out
4. Create visitor request form (student)
5. Create approval management page (warden)
6. Create visitor check-in interface
7. Generate and track visitor passes

---

### Epic: HOS-E4 - Billing & Violations

#### Story: HOS-2.5 - Hostel Billing & Finance Integration (NEW)
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 11-12
**Dependencies**: HOS-1.1

**User Story**:
As an accountant, I want to generate hostel bills linked to Finance module, so that payments can be tracked and reconciled.

**Acceptance Criteria**:
- [ ] HostelBilling model with Finance invoice linking (CRITICAL)
- [ ] Auto-generate bills for allocated students each month
- [ ] Include hostel fee + additional charges (guest house, damage, etc.)
- [ ] Link to Finance module invoices (invoiceId field)
- [ ] Automatic sync with Finance module on payment
- [ ] Outstanding bills report (overdue tracking)
- [ ] Billing collection analytics
- [ ] Finance sync verification interface

**Technical Tasks**:
1. Create `HostelBilling` model with Finance integration
2. Create `backend/src/services/hostel-billing.service.ts`
3. Create `backend/src/utils/billing-calculator.ts`
4. Create Finance API integration layer
5. Create bill generation scheduled job
6. Create API endpoints: generate bills, link Finance, payment sync
7. Create billing management page
8. Create collection report and sync status page

**Testing**:
- Unit tests: Billing calculations
- Integration tests: Finance invoice creation, sync
- E2E tests: Full billing workflow with Finance

---

#### Story: HOS-2.6 - Violation Appeals & Resolution (NEW)
**Story Points**: 10
**Priority**: P1
**Sprint**: Week 12-13
**Dependencies**: HOS-1.2

**User Story**:
As a student, I want to appeal hostel violations with supporting documents, so that disciplinary decisions can be reviewed.

**Acceptance Criteria**:
- [ ] ViolationAppeal model with document upload
- [ ] Appeal workflow (PENDING → ACCEPTED/REJECTED)
- [ ] Student submits appeal with explanation and proof
- [ ] Warden/admin reviews and makes decision
- [ ] Approved appeals update original violation (reduce/waive penalty)
- [ ] Rejection notification with explanation
- [ ] Appeal history maintained
- [ ] Appeal analytics report

**Technical Tasks**:
1. Create `ViolationAppeal` model
2. Create `backend/src/services/violation-appeal.service.ts`
3. Create appeal submission form with document upload
4. Create API endpoints: submit, review, approve/reject
5. Create appeal management page (warden)
6. Create appeal tracking page (student)
7. Create document viewer for appeal supports

---

---

## Mess Module - New Models (Food Safety & Management)

### Epic: MESS-E2 - Food Management & Safety

#### Story: MESS-2.1 - Food Item & Recipe Management (NEW)
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 12-13
**Dependencies**: MESS-1.1

**User Story**:
As a mess manager, I want to maintain food items database with recipes and ingredients, so that menus can be planned with nutritional information.

**Acceptance Criteria**:
- [ ] FoodItem model with nutrition data (calories, protein, fat, carbs)
- [ ] Recipe model with ingredients and cooking instructions
- [ ] RecipeIngredient tracks quantity and unit conversions
- [ ] Support meal variants (veg/non-veg/vegan) per recipe
- [ ] MealVariant model for serving options
- [ ] Recipe modification history
- [ ] Nutrition calculation per serving
- [ ] Recipe cost calculation (ingredient prices)
- [ ] Search and filter by nutrition criteria

**Technical Tasks**:
1. Create `FoodItem`, `Recipe`, `RecipeIngredient`, `MealVariant` models
2. Create `backend/src/services/food-item.service.ts`
3. Create `backend/src/services/recipe.service.ts`
4. Create `backend/src/utils/nutrition-calculator.ts`
5. Create `backend/src/utils/recipe-cost-calculator.ts`
6. Create API endpoints for CRUD operations
7. Create food items and recipe management pages
8. Create nutrition database page

---

#### Story: MESS-2.2 - Allergen Tracking & Student Safety (NEW - CRITICAL)
**Story Points**: 13
**Priority**: P0 (CRITICAL)
**Sprint**: Week 13-14
**Dependencies**: MESS-2.1

**User Story**:
As a mess manager, I want to track student allergies and prevent allergen exposure, so that student health is protected.

**Acceptance Criteria**:
- [ ] Allergen model with common allergens (8+ types: peanuts, dairy, gluten, shellfish, eggs, etc.)
- [ ] StudentAllergy model with doctor verification and severity levels (MILD, MODERATE, SEVERE, ANAPHYLAXIS)
- [ ] Mandatory medical document upload for allergies
- [ ] StudentMealChoice captures variant selection AND allergen verification
- [ ] CRITICAL BLOCK: Cannot serve meal if allergen not verified or not in choice
- [ ] Daily allergen warnings per meal
- [ ] Allergen incident reporting
- [ ] Emergency contact alerts for anaphylaxis risk
- [ ] Allergen audit trail (compliance requirement)

**Technical Tasks**:
1. Create `Allergen`, `StudentAllergy`, `StudentMealChoice` models
2. Create `backend/src/services/allergen.service.ts`
3. Create `backend/src/utils/allergen-validator.ts` (CRITICAL - blocks unsafe meal serving)
4. Create API endpoints: manage allergies, verify for meal serving
5. Create allergy management page (student health info)
6. Create meal preparation checklist with allergen warnings
7. Create allergen incident report system
8. Implement meal serving validation (CRITICAL - blocks unsafe serving)

**Testing**:
- Unit tests: Allergen blocking logic, severity levels
- Integration tests: Meal serving, allergen validation
- E2E tests: Full allergen workflow, incident reporting
- CRITICAL: Test that system blocks serving without proper verification

---

#### Story: MESS-2.3 - Menu Approval & Kitchen Safety (NEW)
**Story Points**: 10
**Priority**: P0
**Sprint**: Week 14-15
**Dependencies**: MESS-2.2

**User Story**:
As a nutrition officer, I want to approve menus with health inspections, so that food safety and nutrition standards are met.

**Acceptance Criteria**:
- [ ] MenuApproval model with nutritionist review workflow
- [ ] KitchenHygieneChecklist for daily QC (scoring 1-5)
- [ ] Daily inspection checklist: cleanliness, temperature, storage, staff hygiene
- [ ] Menu approval states: PROPOSED → REVIEWED → APPROVED
- [ ] Hygiene check scoring (cleanliness, staff, storage, utensils, pest control)
- [ ] CRITICAL: Cannot serve if hygiene < 3
- [ ] Remedial action tracking for hygiene failures
- [ ] Hygiene certification requirement for kitchen staff
- [ ] Monthly hygiene report for health authority

**Technical Tasks**:
1. Create `MenuApproval`, `KitchenHygieneChecklist`, `MessStaff` models
2. Create `backend/src/services/menu-approval.service.ts`
3. Create `backend/src/services/kitchen-hygiene.service.ts`
4. Create `backend/src/utils/hygiene-calculator.ts`
5. Create API endpoints for approvals and inspections
6. Create menu approval workflow page (nutritionist)
7. Create daily hygiene checklist page (kitchen manager)
8. Create hygiene report and certification page

**Testing**:
- Unit tests: Hygiene scoring, blocking logic
- Integration tests: Menu approval, inspection workflow
- E2E tests: Complete menu-to-serving workflow with safety checks

---

### Epic: MESS-E3 - Feedback & Complaints

#### Story: MESS-2.4 - Feedback Collection & Analysis (NEW)
**Story Points**: 8
**Priority**: P1
**Sprint**: Week 15-16
**Dependencies**: MESS-1.1

**User Story**:
As a mess committee, I want to collect student feedback on meals and track action items, so that meal quality improves.

**Acceptance Criteria**:
- [ ] MealFeedback model with rating (1-5) and comments
- [ ] FeedbackAction model to track improvements made
- [ ] Weekly feedback report (trending complaints)
- [ ] Action item tracking (issue → assigned to → resolved)
- [ ] Feedback analytics (quality trends, most complained dishes)
- [ ] Communication to students on resolved issues
- [ ] Positive feedback highlighting

**Technical Tasks**:
1. Create `MealFeedback`, `FeedbackAction` models
2. Create `backend/src/services/feedback.service.ts`
3. Create feedback submission form (student)
4. Create API endpoints for feedback and actions
5. Create feedback analysis page
6. Create action item tracking page
7. Create feedback trends report

---

---

## Store/Inventory Module - New Models (Advanced Inventory)

### Epic: STORE-E3 - Goods Receipt & Quality Control

#### Story: STORE-3.1 - Goods Receipt & QC Inspection (NEW - CRITICAL)
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 7-8
**Dependencies**: STORE-1.3

**User Story**:
As a store manager, I want to receive goods with QC inspection and create stock batches, so that quality and batch tracking are maintained.

**Acceptance Criteria**:
- [ ] GoodsReceipt model linked to PO with inspection workflow
- [ ] GoodsReceiptItem tracks received vs ordered quantities
- [ ] ReceiptInspection with 1-5 scoring (packaging, quality, labels, documentation, quantity)
- [ ] Receipt workflow: PENDING → INSPECTING → ACCEPTED/REJECTED
- [ ] CRITICAL: Cannot accept goods without passing inspection
- [ ] Batch creation on acceptance (StockBatch)
- [ ] Batch details: batchNo, expiry date, manufacturing date, quality grade
- [ ] Damage charge calculation if threshold exceeded
- [ ] Photo documentation of inspection

**Technical Tasks**:
1. Create `GoodsReceipt`, `GoodsReceiptItem`, `ReceiptInspection` models
2. Create `backend/src/services/goods-receipt.service.ts`
3. Create `backend/src/utils/receipt-inspection-calculator.ts`
4. Create batch creation logic on acceptance
5. Create API endpoints: create receipt, inspect, accept/reject
6. Create goods receipt workflow page
7. Create inspection management page with photo upload
8. Create batch from receipt automatic creation

**Testing**:
- Unit tests: Inspection scoring, batch creation
- Integration tests: Full receipt workflow, QC blocking
- E2E tests: Receipt to batch creation

---

#### Story: STORE-3.2 - Stock Batch Management & Expiry (NEW)
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 8-9
**Dependencies**: STORE-3.1

**User Story**:
As an inventory manager, I want to track stock batches with expiry dates and prevent expired item issue, so that product quality is ensured.

**Acceptance Criteria**:
- [ ] StockBatch model with batch/lot tracking
- [ ] Mandatory expiry date for consumables
- [ ] Quality grade assignment (A/B/C)
- [ ] Shelf location tracking
- [ ] Batch consumption FIFO/LIFO logic
- [ ] CRITICAL: System blocks issuing expired batches
- [ ] Expiry alerts (30 days before)
- [ ] Batch status tracking (ACTIVE, FULLY_CONSUMED, EXPIRED, REJECTED)
- [ ] Quantity tracking per batch (received, consumed, damaged)
- [ ] Batch valuation separate (for FIFO/LIFO calculations)

**Technical Tasks**:
1. Create `StockBatch` model
2. Create `backend/src/services/stock-batch.service.ts`
3. Create `backend/src/utils/batch-tracking.ts` (FIFO/LIFO consumption)
4. Create batch expiry alert system
5. Create API endpoints: manage batches, issue from batch
6. Create batch management page
7. Create expiry alert and monitoring dashboard
8. Add expiry check before issuing stock (CRITICAL)

**Testing**:
- Unit tests: Batch consumption, expiry blocking
- Integration tests: Batch tracking, FIFO/LIFO
- E2E tests: Full batch lifecycle with expiry

---

### Epic: STORE-E4 - Inventory Valuation & Analysis

#### Story: STORE-3.3 - Inventory Valuation Methods (NEW - CRITICAL)
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 9-10
**Dependencies**: STORE-3.2

**User Story**:
As a financial controller, I want to calculate inventory value using FIFO/LIFO/WAC methods, so that financial reports are accurate.

**Acceptance Criteria**:
- [ ] StockValuation model tracking valuation method
- [ ] StockValuationDetail for per-batch calculations
- [ ] FIFO algorithm: oldest batches consumed first (detailed example provided)
- [ ] LIFO algorithm: newest batches consumed first
- [ ] WAC algorithm: weighted average cost across all batches
- [ ] Method change creates audit trail with impact analysis
- [ ] Valuation comparison reports (FIFO vs LIFO vs WAC)
- [ ] Period-over-period variance analysis
- [ ] Only ADMIN can change method
- [ ] Finance module notified of valuation changes

**Technical Tasks**:
1. Create `StockValuation`, `StockValuationDetail` models
2. Create `backend/src/services/stock-valuation.service.ts`
3. Create `backend/src/utils/valuation-fifo.ts` (FIFO algorithm)
4. Create `backend/src/utils/valuation-lifo.ts` (LIFO algorithm)
5. Create `backend/src/utils/valuation-wac.ts` (WAC algorithm)
6. Create valuation calculation engine
7. Create API endpoints: calculate, view, compare methods
8. Create valuation analysis page with method comparison

**Testing**:
- Unit tests: All three algorithms with various batch scenarios
- Integration tests: Valuation calculation, history tracking
- E2E tests: Method comparison, audit trail

---

#### Story: STORE-3.4 - 3-Way Matching & Invoice Reconciliation (NEW - CRITICAL)
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 10-11
**Dependencies**: STORE-3.1

**User Story**:
As a procurement officer, I want to match PO, Receipt, and Invoice line items, so that discrepancies are detected before payment.

**Acceptance Criteria**:
- [ ] InvoiceLineItemMapping model linking PO → Receipt → Invoice
- [ ] Automatic variance detection (quantity & price)
- [ ] CRITICAL: Cannot process payment without matching completion
- [ ] Variance flags: MATCHED, QUANTITY_VARIANCE, PRICE_VARIANCE, UNMATCHED
- [ ] Threshold-based variance review (e.g., 5% for price, 2 units for quantity)
- [ ] Variance percentage calculation and trending
- [ ] Approval workflow for matched items
- [ ] 3-way matching variance report
- [ ] Finance module integration for payment authorization

**Technical Tasks**:
1. Create `InvoiceLineItemMapping` model
2. Create `backend/src/services/invoice-matching.service.ts`
3. Create `backend/src/utils/goods-receipt-3way-matching.ts` (variance detection)
4. Create matching calculation and flagging logic
5. Create API endpoints: create mappings, review, approve
6. Create matching management page
7. Create variance analysis and resolution page
8. Integrate with Finance for payment blocking

**Testing**:
- Unit tests: Variance detection, threshold logic
- Integration tests: Full matching workflow
- E2E tests: Complete 3-way matching with payment

---

### Epic: STORE-E5 - Advanced Analytics & Recommendations

#### Story: STORE-3.5 - Stock Aging & Write-off Analysis (NEW)
**Story Points**: 10
**Priority**: P1
**Sprint**: Week 11-12
**Dependencies**: STORE-2.2

**User Story**:
As an inventory analyst, I want to track slow-moving items with aging categories, so that write-off decisions can be made.

**Acceptance Criteria**:
- [ ] StockAging model categorizing items (FRESH, NORMAL, AGING, STAGNANT)
- [ ] Age categories: 0-90, 90-180, 180-365, >365 days
- [ ] Last issued date tracking
- [ ] Write-off risk calculation (daysSinceIssue / 365) * 100
- [ ] Quantity in each age range
- [ ] Recommendations: sell, donate, scrap, retain
- [ ] Aging analysis report with risk assessment
- [ ] Stagnant items alert (>365 days)
- [ ] Action item tracking for write-offs

**Technical Tasks**:
1. Create `StockAging` model
2. Create `backend/src/services/stock-aging.service.ts`
3. Create `backend/src/utils/stock-aging-calculator.ts`
4. Create aging category assignment logic
5. Create API endpoints: analyze aging, generate reports
6. Create aging analysis dashboard
7. Create stagnant items alert system
8. Create write-off recommendation page

---

#### Story: STORE-3.6 - Smart Reorder Point Recommendations (NEW)
**Story Points**: 10
**Priority**: P1
**Sprint**: Week 12-13
**Dependencies**: STORE-2.2

**User Story**:
As an inventory manager, I want to receive data-driven reorder point recommendations based on consumption patterns, so that stock-outs are minimized.

**Acceptance Criteria**:
- [ ] ReorderPointRecommendation model with analysis period
- [ ] Average daily/monthly consumption calculation
- [ ] Vendor lead time factoring
- [ ] Safety stock calculation (variability buffer)
- [ ] Formula: ReorderPoint = (AvgDaily × LeadTime) + SafetyStock
- [ ] Current vs recommended comparison
- [ ] Analysis justification and reasoning
- [ ] Recommendation approval workflow
- [ ] Effectiveness tracking (stock-outs prevented)

**Technical Tasks**:
1. Create `ReorderPointRecommendation` model
2. Create `backend/src/services/reorder-recommendation.service.ts`
3. Create `backend/src/utils/reorder-analyzer.ts` (pattern analysis)
4. Create consumption pattern analysis logic
5. Create API endpoints: analyze, view recommendations, accept/reject
6. Create recommendation analysis page
7. Create effectiveness report (stock-outs prevented)

---

#### Story: STORE-3.7 - Vendor Performance Analytics (NEW)
**Story Points**: 8
**Priority**: P1
**Sprint**: Week 13-14
**Dependencies**: STORE-1.3

**User Story**:
As a procurement manager, I want to track vendor performance metrics, so that supplier quality and reliability can be assessed.

**Acceptance Criteria**:
- [ ] VendorPerformanceMetric model with monthly calculations
- [ ] On-time delivery percentage tracking
- [ ] Quality metrics (rejection rate)
- [ ] Price competitiveness analysis
- [ ] Order value and frequency tracking
- [ ] Overall performance score (1-5 scale)
- [ ] Performance trend analysis
- [ ] Vendor ranking report
- [ ] Recommended actions (reward, improve, replace)

**Technical Tasks**:
1. Create `VendorPerformanceMetric` model
2. Create `backend/src/services/vendor-performance.service.ts`
3. Create performance calculation logic
4. Create API endpoints: calculate metrics, view reports
5. Create vendor performance dashboard
6. Create performance trend analysis page
7. Create vendor ranking report

---

### Epic: STORE-E6 - Inventory Control & Verification

#### Story: STORE-3.8 - Cycle Count & Reconciliation (NEW)
**Story Points**: 13
**Priority**: P0
**Sprint**: Week 14-15
**Dependencies**: STORE-2.2

**User Story**:
As a store manager, I want to conduct periodic cycle counts with automated variance reconciliation, so that system accuracy is maintained.

**Acceptance Criteria**:
- [ ] InventoryCycleCount model for scheduling and tracking
- [ ] Physical count recording
- [ ] Automatic variance calculation (system vs physical)
- [ ] Variance percentage flagging (> threshold)
- [ ] CRITICAL: Auto-create StockAdjustment for variance > threshold
- [ ] Root cause analysis (THEFT, DAMAGE, SHRINKAGE, ERROR)
- [ ] Approval workflow for variances
- [ ] Cycle count report with variance analysis
- [ ] Trend analysis (repeated discrepancies)

**Technical Tasks**:
1. Create `InventoryCycleCount` model
2. Create `backend/src/services/cycle-count.service.ts`
3. Create `backend/src/utils/cycle-count-reconciliation.ts`
4. Create variance reconciliation logic
5. Create auto-adjustment creation on variance
6. Create API endpoints: schedule, count, reconcile
7. Create cycle count interface with counting tools
8. Create variance analysis and reconciliation page

**Testing**:
- Unit tests: Variance detection, threshold logic
- Integration tests: Full cycle count workflow
- E2E tests: Complete counting with auto-adjustments

---

#### Story: STORE-3.9 - GL Account Mapping & Finance Integration (NEW - CRITICAL)
**Story Points**: 10
**Priority**: P0
**Sprint**: Week 15-16
**Dependencies**: STORE-1.3

**User Story**:
As a financial controller, I want to map stock movements to GL accounts, so that inventory changes are automatically posted to Finance.

**Acceptance Criteria**:
- [ ] GLAccountMapping model for item/category/movement type
- [ ] GL account assignment by: item OR category (hierarchy)
- [ ] Debit/credit account designation per movement type
- [ ] Cost center tracking for allocations
- [ ] Valuation method tied to GL accounts
- [ ] All movements require valid GL mapping (CRITICAL)
- [ ] Automatic GL posting from backend (not frontend)
- [ ] Finance module reconciliation
- [ ] GL mapping audit trail

**Technical Tasks**:
1. Create `GLAccountMapping` model
2. Create `backend/src/services/gl-mapping.service.ts`
3. Create GL mapping validation in movement creation
4. Create Finance API integration for GL posting
5. Create GL account selector page
6. Create API endpoints: manage mappings, test posting
7. Create GL mapping configuration page
8. Implement GL validation in all stock movement services

**Testing**:
- Unit tests: GL account validation
- Integration tests: GL posting on movement
- E2E tests: Complete movement with GL posting

---



## Priority Matrix

### P0 (Critical - Start Immediately)

**HR Module:**
- HR-1.1 to HR-1.4 (Employee management) - Week 1-3
- HR-2.1 to HR-2.4 (Salary system) - Week 3-5
- HR-3.1 (Leave Balance Tracking) - Week 5-6
- HR-3.2 (Employee Separations & Exit) - Week 6-7

**Hostel Module:**
- HOS-1.1 to HOS-1.4 (Core hostel management) - Week 7-10
- HOS-2.5 (Hostel Billing & Finance Integration) - **CRITICAL** - Week 11-12

**Mess Module:**
- MESS-1.1 to MESS-1.3 (Core mess management) - Week 12-14
- MESS-2.2 (Allergen Tracking & Student Safety) - **CRITICAL (P0)** - Week 13-14

**Store Module:**
- STORE-1.1 to STORE-1.4 (Core store management) - Week 1-4 (Parallel with HR)
- STORE-2.1, STORE-2.2 (Stock movements) - Week 4-6
- STORE-3.1 (Goods Receipt & QC Inspection) - **CRITICAL (P0)** - Week 7-8
- STORE-3.3 (Inventory Valuation Methods) - **CRITICAL (P0)** - Week 9-10
- STORE-3.4 (3-Way Matching & Invoice Reconciliation) - **CRITICAL (P0)** - Week 10-11
- STORE-3.9 (GL Account Mapping & Finance Integration) - **CRITICAL (P0)** - Week 15-16

### P1 (High Priority - Secondary Phase)

**HR Module:**
- HR-3.3 (Promotions & Transfer Workflow) - Week 7-8
- HR-3.4 (Performance Reviews & Qualifications) - Week 8-9
- HR-4.x (HR Reports & Analytics)

**Hostel Module:**
- HOS-2.1 (Room Inspection System) - Week 7-8
- HOS-2.2 (Hostel Attendance & Curfew Tracking) - Week 8-9
- HOS-2.3 (Guest House Booking System) - Week 9-10
- HOS-2.4 (Visitor Approval Workflow) - Week 10-11
- HOS-2.6 (Violation Appeals & Resolution) - Week 12-13
- HOS-3.x (Violations & Complaints)

**Mess Module:**
- MESS-2.1 (Food Item & Recipe Management) - Week 12-13
- MESS-2.3 (Menu Approval & Kitchen Safety) - Week 14-15
- MESS-2.4 (Feedback Collection & Analysis) - Week 15-16
- MESS-3.x (Additional Feedback & Complaints)

**Store Module:**
- STORE-3.2 (Stock Batch Management & Expiry) - Week 8-9
- STORE-3.5 (Stock Aging & Write-off Analysis) - Week 11-12
- STORE-3.6 (Smart Reorder Point Recommendations) - Week 12-13
- STORE-3.7 (Vendor Performance Analytics) - Week 13-14
- STORE-3.8 (Cycle Count & Reconciliation) - Week 14-15
- STORE-5.x (Reports & Analytics)

---

## Dependency Graph

```
HR Module:
  HR-1.1 -> HR-1.2 -> HR-1.3 -> HR-1.4
  HR-2.1 -> HR-2.2 -> HR-2.3 -> HR-2.4
  HR-1.4 -> HR-3.1 (Leave balance depends on employee data)
  HR-3.1 -> HR-3.2 (Separations depend on leave records)
  HR-3.2 -> HR-3.3 (Promotions depend on employee history)
  HR-3.1, HR-3.2, HR-3.3 -> HR-3.4 (Performance reviews need baseline)
  HR-2.4, HR-3.4 -> HR-4.x (Reports depend on all employee data)

Hostel Module:
  HOS-1.1 -> HOS-1.2 -> HOS-1.3 -> HOS-1.4 (Core setup)
  HOS-1.4 -> HOS-2.1 (Room inspection after rooms allocated)
  HOS-1.4 -> HOS-2.2 (Attendance tracking after allocation)
  HOS-1.4 -> HOS-2.3 (Guest house separate from main hostel)
  HOS-1.2 -> HOS-2.4 (Visitor approval after hostel setup)
  HOS-1.4 -> HOS-2.5 (Billing after room allocation)
  HOS-1.3 -> HOS-2.6 (Appeals for existing violations)
  HOS-2.1, HOS-2.2, HOS-2.5 -> HOS-3.x (Issue management)

Mess Module:
  MESS-1.1 -> MESS-1.2 -> MESS-1.3 (Core setup)
  MESS-1.3 -> MESS-2.1 (Food items for menu planning)
  MESS-1.3 -> MESS-2.2 (Allergen tracking for safety)
  MESS-2.1 -> MESS-2.3 (Menu approval needs food items)
  MESS-1.3, MESS-2.2 -> MESS-2.4 (Feedback collection)
  MESS-2.4 -> MESS-3.x (Complaint management)

Store Module:
  STORE-1.1 -> STORE-1.2 -> STORE-1.3 -> STORE-1.4 (Core setup)
  STORE-1.3, STORE-2.1 -> STORE-3.1 (Goods receipt for POs)
  STORE-3.1 -> STORE-3.2 (Batch creation on receipt)
  STORE-1.4 -> STORE-3.3 (Valuation for inventory costing)
  STORE-1.4, STORE-3.1 -> STORE-3.4 (3-way matching for invoices)
  STORE-1.2 -> STORE-3.5 (Stock aging analysis)
  STORE-1.2, STORE-3.5 -> STORE-3.6 (Reorder recommendations)
  STORE-1.4 -> STORE-3.7 (Vendor performance tracking)
  STORE-1.2 -> STORE-3.8 (Cycle count verification)
  STORE-3.3, STORE-3.4 -> STORE-3.9 (GL mapping for all movements)
  STORE-3.1 to STORE-3.8 -> STORE-4.1 (POs depend on core setup)
  STORE-3.2 to STORE-3.8 -> STORE-5.x (Reports depend on all features)
```

---

## Implementation Sequence

### Recommended Execution Plan (Optimized for Parallel Execution)

**Phase 1 - Foundation (Weeks 1-5): HR & Store Core Setup**
- **HR Module**:
  - HR-1.1 to HR-1.4: Employee management (Weeks 1-3)
  - HR-2.1 to HR-2.4: Salary system (Weeks 3-5)
- **Store Module**:
  - STORE-1.1 to STORE-1.4: Core store management (Weeks 1-4)
  - STORE-2.1, STORE-2.2: Stock movements (Weeks 4-6)

**Phase 2 - HR Advanced Features (Weeks 5-9)**
- HR-3.1: Leave Balance Tracking (Weeks 5-6)
- HR-3.2: Employee Separations & Exit (Weeks 6-7)
- HR-3.3: Promotions & Transfer Workflow (Weeks 7-8)
- HR-3.4: Performance Reviews & Qualifications (Weeks 8-9)

**Phase 3 - Hostel & Store Advanced Features (Weeks 7-13)**
- **Hostel Module**:
  - HOS-1.1 to HOS-1.4: Core hostel management (Weeks 7-10)
  - HOS-2.1: Room Inspection System (Weeks 7-8)
  - HOS-2.2: Hostel Attendance & Curfew Tracking (Weeks 8-9)
  - HOS-2.3: Guest House Booking System (Weeks 9-10)
  - HOS-2.4: Visitor Approval Workflow (Weeks 10-11)
  - HOS-2.5: Hostel Billing & Finance Integration - **CRITICAL** (Weeks 11-12)
  - HOS-2.6: Violation Appeals & Resolution (Weeks 12-13)
- **Store Module**:
  - STORE-3.1: Goods Receipt & QC Inspection - **CRITICAL** (Weeks 7-8)
  - STORE-3.2: Stock Batch Management & Expiry (Weeks 8-9)
  - STORE-3.3: Inventory Valuation Methods - **CRITICAL** (Weeks 9-10)
  - STORE-3.4: 3-Way Matching & Invoice Reconciliation - **CRITICAL** (Weeks 10-11)
  - STORE-3.5: Stock Aging & Write-off Analysis (Weeks 11-12)
  - STORE-3.6: Smart Reorder Point Recommendations (Weeks 12-13)
  - STORE-3.7: Vendor Performance Analytics (Weeks 13-14)
  - STORE-3.8: Cycle Count & Reconciliation (Weeks 14-15)
  - STORE-3.9: GL Account Mapping & Finance Integration - **CRITICAL** (Weeks 15-16)

**Phase 4 - Mess Module & Final Store (Weeks 12-16)**
- **Mess Module**:
  - MESS-1.1 to MESS-1.3: Core mess management (Weeks 12-14)
  - MESS-2.1: Food Item & Recipe Management (Weeks 12-13)
  - MESS-2.2: Allergen Tracking & Student Safety - **CRITICAL** (Weeks 13-14)
  - MESS-2.3: Menu Approval & Kitchen Safety (Weeks 14-15)
  - MESS-2.4: Feedback Collection & Analysis (Weeks 15-16)

**Phase 5 - Finalization & Testing (Weeks 14-17)**
- All module-specific and integration testing
- User acceptance testing (UAT)
- Performance optimization
- Documentation completion
- Deployment to staging and production

### Total Duration

**Critical Path**: 16 weeks (approximately 4 months)
**With Testing & Deployment**: 17 weeks (approximately 4.25 months)

**Key Parallelization**:
- HR and Store can run completely in parallel (independent modules)
- Hostel and Store Phase 3 overlap (Weeks 7-16)
- Mess starts while Hostel and Store are finishing (Week 12 onwards)
- Testing can begin on completed modules while others continue
- No sequential bottlenecks with this schedule

---

## Next Steps After Context Ends

1. **Start with HR-1.1**: Create Prisma models
2. **Follow the dependency chain**: Complete each story sequentially
3. **Refer to module documentation**: Each story references the relevant module doc for details
4. **Use acceptance criteria**: Verify story completion against acceptance criteria
5. **Run tests**: Implement unit and integration tests as specified
6. **Create PRs**: Each story should result in a PR for code review
7. **Deploy**: Deploy to staging, test, then production

---

End of Epics and Stories Document
