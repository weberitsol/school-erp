# HR Module Frontend Services

Complete service layer for HR module frontend integration with backend API.

## Services Overview

All services are located in `/frontend/src/services/hr/` and follow a consistent pattern with:
- Type-safe interfaces for data structures
- Pagination support where applicable
- Error handling with descriptive messages
- Direct API client integration

### Available Services

1. **employee.service.ts** - Employee management
   - CRUD operations
   - Search and filtering
   - Department and reporting hierarchy
   - Status management

2. **designation.service.ts** - Job titles and hierarchy
   - Designation CRUD
   - Hierarchy structure
   - Salary range validation
   - Level-based queries

3. **salary.service.ts** - Salary structure management
   - Salary creation and updates
   - Current salary queries
   - Salary history tracking
   - Payroll calculations

4. **payslip.service.ts** - Payslip generation and management
   - Payslip CRUD
   - Bulk generation
   - Status transitions (draft → finalized → paid)
   - Monthly statistics

5. **leave-balance.service.ts** - Leave entitlements
   - Balance creation per academic year
   - Leave deduction and restoration
   - Available balance calculations
   - Carry-over processing

6. **performance-review.service.ts** - Performance management
   - Review CRUD
   - Promotion eligibility tracking
   - Rating calculations (1-5 scale)
   - Statistics by cycle and department

7. **employee-promotion.service.ts** - Promotions
   - Promotion creation and tracking
   - Approval workflow
   - Statistics by designation

8. **employee-transfer.service.ts** - Department transfers
   - Transfer requests
   - Approval/rejection workflow
   - Department statistics
   - Incoming/outgoing transfers

9. **employee-separation.service.ts** - Employee exits
   - Separation initiation
   - Settlement calculations
   - Experience certificate generation
   - Statistics by type and status

10. **salary-revision.service.ts** - Salary changes
    - Revision tracking
    - Reason categorization
    - Total increase calculations

11. **index.ts** - Central export point
    - Exports all services
    - Type definitions

## Usage

### Import Services

```typescript
import {
  employeeService,
  designationService,
  salaryService,
  // ... other services
} from '@/services/hr';
```

### Example: Fetching Employees

```typescript
const { data: employees, total } = await employeeService.getAll({
  status: 'ACTIVE',
  page: 1,
  limit: 20,
});
```

### Example: Creating a Salary

```typescript
const salary = await salaryService.create({
  employeeId: 'emp-123',
  basicSalary: 50000,
  dearness: 5000,
  houseRent: 10000,
  month: 1,
  year: 2025,
});
```

## Frontend Pages

All pages are located in `/frontend/src/app/(dashboard)/admin/hr/`:

| Page | Route | Features |
|------|-------|----------|
| Employees | `/admin/hr/employees` | CRUD, search, status management |
| Designations | `/admin/hr/designations` | CRUD, hierarchy, salary ranges |
| Salaries | `/admin/hr/salaries` | CRUD with components, monthly view |
| Payslips | `/admin/hr/payslips` | Generation, finalization, payment tracking |
| Leave Management | `/admin/hr/leave-management` | Balance view, leave deduction |
| Performance Reviews | `/admin/hr/performance-reviews` | Rating input, promotion eligibility |
| Promotions | `/admin/hr/promotions` | Proposal, approval workflow |
| Transfers | `/admin/hr/transfers` | Request, approval/rejection |
| Separations | `/admin/hr/separations` | Initiation, settlement calculation |

## API Endpoints

All services communicate with backend API at `/api/v1/hr/`:

```
POST   /employees                              - Create employee
GET    /employees                              - List employees with filters
GET    /employees/:id                          - Get single employee
PUT    /employees/:id                          - Update employee
DELETE /employees/:id                          - Delete employee
GET    /employees/number/:employeeNo           - Get by employee number
GET    /employees/department/:departmentId     - Get by department
GET    /employees/:managerId/subordinates      - Get reporting chain
PUT    /employees/:id/status                   - Update status

POST   /designations                           - Create designation
GET    /designations                           - List designations
GET    /designations/:id                       - Get single designation
PUT    /designations/:id                       - Update designation
DELETE /designations/:id                       - Delete designation
GET    /designations/hierarchy                 - Get full hierarchy
POST   /designations/validate-salary           - Validate salary range
GET    /designations/level/:level              - Get by level

POST   /salaries                               - Create salary
GET    /salaries                               - List salaries
GET    /salaries/:id                           - Get single salary
PUT    /salaries/:id                           - Update salary
DELETE /salaries/:id                           - Delete salary
GET    /salaries/employee/:employeeId/current  - Get current salary
GET    /salaries/employee/:employeeId/history  - Get history
POST   /salaries/payroll/calculate             - Calculate payroll
POST   /salaries/:id/recalculate               - Recalculate

POST   /payslips                               - Create payslip
POST   /payslips/generate                      - Bulk generate
GET    /payslips                               - List payslips
GET    /payslips/:id                           - Get single payslip
PUT    /payslips/:id                           - Update payslip
GET    /payslips/stats                         - Monthly statistics
POST   /payslips/:id/finalize                  - Finalize payslip
POST   /payslips/:id/mark-paid                 - Mark as paid
POST   /payslips/:id/cancel                    - Cancel payslip

POST   /leave-balances                         - Create balance
GET    /leave-balances                         - List balances
GET    /leave-balances/:id                     - Get single balance
PUT    /leave-balances/:id                     - Update balance
DELETE /leave-balances/:id                     - Delete balance
POST   /leave-balances/:id/deduct              - Deduct leave
POST   /leave-balances/:id/restore             - Restore leave
GET    /leave-balances/:id/available/:leaveType - Check available
GET    /leave-balances/employee/:id/current    - Get current balance
POST   /leave-balances/:id/carry-over          - Process carry-over

// ... and more endpoints for other resources
```

## Type Safety

All data structures are fully typed:

```typescript
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  // ... more fields
}

interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  // ... required fields only
}
```

## Error Handling

Services throw descriptive errors that are caught and displayed in UI:

```typescript
try {
  await employeeService.create(data);
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  // "Employee with this employee number already exists"
}
```

## Performance Considerations

- All list endpoints support pagination (page, limit)
- Filtering is context-aware per resource
- Related data is included via `include` queries
- Responses are normalized for efficient rendering

## Testing

Services can be tested independently with mock data:

```typescript
const mockEmployee = {
  id: 'emp-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  // ... rest of fields
};
```

## Future Enhancements

- [ ] Batch operations (bulk update)
- [ ] Export functionality (CSV/Excel)
- [ ] Advanced filtering UI components
- [ ] Real-time updates with WebSocket
- [ ] Caching layer for frequently accessed data
- [ ] Offline support with service workers
