# HR Module Backend Services Documentation

## Overview

This document provides comprehensive documentation for all backend services created for the HR Module. These services handle business logic for employee management, payroll, leave management, performance reviews, and employee movements.

---

## Service Architecture

Each service follows a consistent pattern:
- **CRUD Operations**: Create, Read, Update, Delete methods
- **Filter/Search**: Support for filtering and pagination
- **Business Logic**: Complex calculations and workflows
- **Error Handling**: Validation and error messages
- **Type Safety**: Full TypeScript interfaces for all data structures

---

## Service Exports

All services can be imported from the central HR index:

```typescript
import {
  employeeService,
  designationService,
  salaryService,
  payslipService,
  salaryRevisionService,
  leaveBalanceService,
  performanceReviewService,
  employeePromotionService,
  employeeTransferService,
  employeeSeparationService,
} from '@/services/hr';
```

---

## Services Documentation

### 1. Employee Service (`employee.service.ts`)

**Purpose**: Manage employee records and profiles

**Key Methods**:

#### `createEmployee(data: CreateEmployeeData): Promise<Employee>`
Creates a new employee record with comprehensive validation.

```typescript
const employee = await employeeService.createEmployee({
  userId: 'user-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  employeeNo: 'EMP-001',
  employmentType: 'FULL_TIME',
  designationId: 'desig-123',
  departmentId: 'dept-123',
  joiningDate: new Date(),
  basicSalary: 50000,
});
```

#### `getEmployees(filters, pagination): Promise<{data, total}>`
Fetch employees with filters and pagination.

```typescript
const { data, total } = await employeeService.getEmployees({
  departmentId: 'dept-123',
  status: 'ACTIVE',
  search: 'john',
}, { page: 1, limit: 20 });
```

#### `getEmployeeById(id): Promise<Employee | null>`
Fetch a single employee with all relationships.

#### `updateEmployee(id, data): Promise<Employee>`
Update employee information with validation.

#### `getSubordinates(managerId): Promise<Employee[]>`
Get all employees reporting to a manager.

#### `updateEmployeeStatus(id, status): Promise<Employee>`
Update employee status (ACTIVE, INACTIVE, TERMINATED, etc.).

**Validations**:
- Unique employee number, email per organization
- User exists in system
- Designation and department exist
- Cannot have negative salary

---

### 2. Designation Service (`designation.service.ts`)

**Purpose**: Manage job titles and organizational hierarchy

**Key Methods**:

#### `createDesignation(data: CreateDesignationData): Promise<Designation>`
Create a new designation with hierarchy support.

```typescript
const designation = await designationService.createDesignation({
  name: 'Senior Developer',
  code: 'SDE',
  level: 2,
  minSalary: 60000,
  maxSalary: 100000,
  standardSalary: 80000,
});
```

#### `getDesignations(filters, pagination): Promise<{data, total}>`
Fetch designations with filtering.

#### `getDesignationHierarchy(): Promise<Designation[]>`
Get complete designation hierarchy tree.

#### `validateSalaryRange(designationId, salary): Promise<boolean>`
Validate if salary is within designation range.

**Validations**:
- Unique name and code
- No circular parent references
- Cannot delete designation with assigned employees
- Cannot delete designation with subordinates

---

### 3. Salary Service (`salary.service.ts`)

**Purpose**: Manage employee salary structure and calculations

**Key Methods**:

#### `createSalary(data: CreateSalaryData): Promise<Salary>`
Create salary record with automatic calculations.

```typescript
const salary = await salaryService.createSalary({
  employeeId: 'emp-123',
  basicSalary: 50000,
  dearness: 5000,
  houseRent: 10000,
  conveyance: 2000,
  medical: 1000,
  pf: 6250,        // 12.5% of basic
  esi: 325,        // 0.75% of basic
  month: 1,
  year: 2025,
  effectiveFrom: new Date(),
});
```

#### `getSalaries(filters, pagination): Promise<{data, total}>`
Fetch salary records with filtering by employee, month, year.

#### `getCurrentSalary(employeeId): Promise<Salary | null>`
Get the currently active salary for an employee.

#### `getEmployeeSalaryHistory(employeeId, limit): Promise<Salary[]>`
Get salary history for an employee (last 12 months by default).

#### `calculateTotalPayroll(month, year): Promise<{totalGross, totalDeductions, totalNet}>`
Calculate total payroll for a month.

**Calculations**:
- Gross Salary = Basic + DA + HRA + Conveyance + Medical + Other Allowances
- Total Deductions = PF + ESI + Professional Tax + Income Tax + Other Deductions
- Net Salary = Gross - Deductions

**Validations**:
- Unique salary per employee per month/year
- Valid month (1-12)
- Month/year cannot be in future

---

### 4. Payslip Service (`payslip.service.ts`)

**Purpose**: Generate and manage employee payslips

**Key Methods**:

#### `createPayslip(data: CreatePayslipData): Promise<Payslip>`
Create a payslip for an employee.

```typescript
const payslip = await payslipService.createPayslip({
  employeeId: 'emp-123',
  month: 1,
  year: 2025,
  basicSalary: 50000,
  // ... salary components ...
  workingDays: 22,
  daysPresent: 20,
  daysAbsent: 2,
  bonus: 5000,
});
```

#### `generatePayslips(month, year, employeeIds?): Promise<Payslip[]>`
Generate payslips for all or specific employees for a month.

```typescript
const payslips = await payslipService.generatePayslips(1, 2025);
```

#### `finalizePayslip(id): Promise<Payslip>`
Finalize a draft payslip (cannot be modified after).

#### `markPayslipAsPaid(id, paidDate?): Promise<Payslip>`
Mark payslip as paid.

#### `getPayslipStats(month, year): Promise<{total, draft, finalized, paid, cancelled}>`
Get payslip statistics for a month.

**Status Flow**: `DRAFT` → `FINALIZED` → `PAID`

**Validations**:
- Cannot modify finalized payslips
- Attendance data must exist
- Cannot pay cancelled payslips

---

### 5. Salary Revision Service (`salary-revision.service.ts`)

**Purpose**: Track salary changes and revisions

**Key Methods**:

#### `createSalaryRevision(data: CreateSalaryRevisionData): Promise<SalaryRevision>`
Record a salary revision.

```typescript
const revision = await salaryRevisionService.createSalaryRevision({
  employeeId: 'emp-123',
  previousBasicSalary: 50000,
  newBasicSalary: 55000,
  revisionReason: 'PROMOTION',
  effectiveFrom: new Date(),
  approvedById: 'user-123',
});
```

#### `getLatestSalaryRevision(employeeId): Promise<SalaryRevision | null>`
Get the most recent salary revision.

#### `calculateTotalSalaryIncrease(employeeId): Promise<{totalIncrease, percentageIncrease, revisionCount}>`
Calculate total salary increase over time.

#### `getRevisionStatsByReason(): Promise<Array>`
Get statistics on revisions by reason (PROMOTION, INCREMENT, etc.).

**Revision Reasons**:
- PROMOTION
- INCREMENT
- MARKET_ADJUSTMENT
- POLICY_CHANGE
- PERFORMANCE

**Validations**:
- New salary must be >= previous salary
- Approver must exist
- Automatic percentage/amount calculation

---

### 6. Leave Balance Service (`leave-balance.service.ts`)

**Purpose**: Manage leave balances and deductions

**Key Methods**:

#### `createLeaveBalance(data: CreateLeaveBalanceData): Promise<LeaveBalance>`
Create leave balance for an academic year.

```typescript
const balance = await leaveBalanceService.createLeaveBalance({
  employeeId: 'emp-123',
  academicYear: '2024-2025',
  casualLeave: 12,
  earnedLeave: 20,
  medicalLeave: 10,
});
```

#### `deductLeave(id, deduction): Promise<LeaveBalance>`
Deduct leave when approved.

```typescript
await leaveBalanceService.deductLeave(balanceId, {
  leaveType: 'CASUAL',
  days: 2,
});
```

#### `restoreLeave(id, restoration): Promise<LeaveBalance>`
Restore leave if request is cancelled.

#### `getAvailableLeave(id, leaveType): Promise<number>`
Get available balance for a leave type.

#### `getCurrentLeaveBalance(employeeId): Promise<LeaveBalance | null>`
Get current year's leave balance.

#### `processCarryOver(id): Promise<LeaveBalance>`
Process carry-over from previous year.

**Leave Types**:
- CASUAL
- EARNED
- MEDICAL
- UNPAID
- STUDY
- MATERNITY
- PATERNITY
- BEREAVEMENT

**Validations**:
- Cannot deduct more than available
- Carry-over must not be expired
- Academic year format: "YYYY-YYYY" (e.g., "2024-2025")

---

### 7. Performance Review Service (`performance-review.service.ts`)

**Purpose**: Manage performance reviews and ratings

**Key Methods**:

#### `createPerformanceReview(data: CreatePerformanceReviewData): Promise<PerformanceReview>`
Create a performance review.

```typescript
const review = await performanceReviewService.createPerformanceReview({
  employeeId: 'emp-123',
  reviewCycleId: 'cycle-123',
  reviewPeriod: 'Annual 2024',
  year: 2024,
  technicalSkills: 4,      // 1-5 scale
  communication: 3,
  teamwork: 4,
  initiative: 4,
  reliability: 5,
  customerService: 3,
  reviewedById: 'user-123',
  reviewDate: new Date(),
  promotionEligible: true,
  raisesPercentage: 10,
});
```

#### `getPerformanceReviews(filters, pagination): Promise<{data, total}>`
Fetch reviews with filtering.

#### `getPromotionEligibleEmployees(): Promise<PerformanceReview[]>`
Get employees marked for promotion.

#### `getCyclePerformanceStats(cycleId): Promise<{...}>`
Get statistics for a review cycle.

```typescript
const stats = await performanceReviewService.getCyclePerformanceStats(cycleId);
// Returns: totalReviews, averageRating, highestRating, lowestRating, promotionEligibleCount
```

#### `getDepartmentPerformanceStats(departmentId): Promise<{...}>`
Get department-level performance statistics.

**Rating Scale**: 1-5 for all criteria

**Overall Rating Calculation**: Average of all individual ratings

**Validations**:
- Ratings must be 1-5
- Unique review per employee per cycle
- Reviewer must exist
- Review cycle must exist

---

### 8. Employee Promotion Service (`employee-promotion.service.ts`)

**Purpose**: Manage employee promotions

**Key Methods**:

#### `createPromotion(data: CreatePromotionData): Promise<EmployeePromotion>`
Create a promotion record.

```typescript
const promotion = await employeePromotionService.createPromotion({
  employeeId: 'emp-123',
  previousDesignationId: 'desig-1',
  newDesignationId: 'desig-2',
  newSalary: 60000,
  promotionDate: new Date(),
  promotionReason: 'Performance excellence',
  effectiveFrom: new Date(),
  approvedById: 'user-123',
});
```

#### `approvePromotion(id, approvedById): Promise<EmployeePromotion>`
Approve promotion and update employee record.

#### `getPromotionsByDateRange(startDate, endDate): Promise<EmployeePromotion[]>`
Get promotions in a date range.

#### `getPromotionStatsByDesignation(): Promise<Array>`
Get promotion statistics by designation.

**Status Flow**: `PROPOSED` → `APPROVED` → `ACTIVE`

**Validations**:
- New designation must exist
- Cannot promote to same designation
- Cannot reduce salary without approval
- Cannot have duplicate promotions

---

### 9. Employee Transfer Service (`employee-transfer.service.ts`)

**Purpose**: Manage employee transfers between departments

**Key Methods**:

#### `createTransfer(data: CreateTransferData): Promise<EmployeeTransfer>`
Create a transfer request.

```typescript
const transfer = await employeeTransferService.createTransfer({
  employeeId: 'emp-123',
  fromDepartmentId: 'dept-1',
  toDepartmentId: 'dept-2',
  transferDate: new Date(),
  transferReason: 'Organizational restructuring',
  effectiveFrom: new Date(),
});
```

#### `approveTransfer(id, approvedById): Promise<EmployeeTransfer>`
Approve transfer and update employee department.

#### `getDepartmentTransfers(departmentId): Promise<{incoming, outgoing}>`
Get incoming and outgoing transfers for a department.

#### `getTransferStatsByDepartment(): Promise<Array>`
Get transfer statistics by department (inbound, outbound, net change).

**Status Flow**: `PENDING` → `APPROVED` → `COMPLETED`

**Validations**:
- Cannot transfer to same department
- Employee must be in "from" department
- Both departments must exist
- Cannot have pending transfer already

---

### 10. Employee Separation Service (`employee-separation.service.ts`)

**Purpose**: Manage employee exits and final settlements

**Key Methods**:

#### `createSeparation(data: CreateSeparationData): Promise<EmployeeSeparation>`
Initiate employee separation process.

```typescript
const separation = await employeeSeparationService.createSeparation({
  employeeId: 'emp-123',
  separationDate: new Date(),
  separationType: 'RESIGNATION',
  reason: 'Pursuing higher education',
  effectiveDate: new Date('2025-02-28'),
});
```

#### `calculateSettlement(id, calculation): Promise<EmployeeSeparation>`
Calculate final settlement amount.

```typescript
await employeeSeparationService.calculateSettlement(separationId, {
  basicSalaryDue: 10000,
  allowancesDue: 2000,
  earnedLeavePayout: 25000,
  gratuity: 50000,
  bonusAdjustment: 0,
  loanRecovery: -5000,
  otherAdjustments: 0,
});
```

#### `approveFinalSettlement(id, approvedById): Promise<EmployeeSeparation>`
Final approval and settlement completion.

#### `generateExperienceCertificate(id, documentUrl): Promise<EmployeeSeparation>`
Generate and attach experience certificate.

#### `getSeparationStats(): Promise<{...}>`
Get separation statistics.

**Separation Types**:
- RESIGNATION
- RETIREMENT
- TERMINATION
- REDUNDANCY
- DEATH
- OTHER

**Settlement Status Flow**: `PENDING` → `INITIATED` → `PARTIAL` → `COMPLETE`

**Settlement Calculation**:
- Pro-rata salary
- Earned leave encashment
- Gratuity (based on policy)
- Unpaid salary/dues
- Minus loan recovery

**Validations**:
- Exit checklist must be complete
- Cannot have multiple active separations
- Approver must exist
- Final settlement amount must be calculated

---

## Common Patterns

### Pagination

All list methods support pagination:

```typescript
const { data, total } = await employeeService.getEmployees(filters, {
  page: 1,      // 1-indexed
  limit: 20,    // Items per page
});
```

### Filtering

Services support context-aware filtering:

```typescript
const { data, total } = await salaryService.getSalaries({
  employeeId: 'emp-123',
  status: 'ACTIVE',
  month: 1,
  year: 2025,
});
```

### Error Handling

Services throw descriptive errors:

```typescript
try {
  await employeeService.createEmployee(data);
} catch (error) {
  console.error(error.message);
  // "Employee with this email already exists"
}
```

---

## Integration with Controllers

Services should be used in controllers as follows:

```typescript
// employee.controller.ts
import { employeeService } from '@/services/hr';

export const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    res.status(201).json(employee);
  } catch (error) {
    next(error);
  }
};
```

---

## Testing Services

Each service can be unit tested independently:

```typescript
describe('EmployeeService', () => {
  it('should create an employee', async () => {
    const employee = await employeeService.createEmployee({
      // ... test data
    });

    expect(employee).toBeDefined();
    expect(employee.email).toBe('test@example.com');
  });
});
```

---

## Performance Considerations

1. **Database Indexes**: Services rely on Prisma indexes for efficient queries
2. **Pagination**: Always use pagination for list endpoints
3. **Include Strategy**: Services use selective `include` for relationship loading
4. **Caching**: Implement caching layer for frequently accessed data (e.g., current salary)

---

## Future Enhancements

1. **Batch Operations**: Add bulk create/update methods
2. **Export Functions**: CSV/Excel export for reports
3. **Webhooks**: Trigger webhooks on salary/separation changes
4. **Audit Logging**: Complete audit trail for compliance
5. **Notifications**: Email notifications for approvals
6. **Advanced Analytics**: Dashboard metrics and trends

---

## Support

For issues or questions about services:
1. Check method documentation in service file
2. Review Prisma error messages
3. Check validation rules section
4. Refer to HR module documentation

