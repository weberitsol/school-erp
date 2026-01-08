# Finance Module Frontend Services

Complete service layer for Finance module frontend integration with backend API.

## Services Overview

All services are located in `/frontend/src/services/finance/` and follow a consistent pattern with:
- Type-safe interfaces for data structures
- Pagination support where applicable
- Error handling with descriptive messages
- Centralized API client integration
- Token management for authenticated requests

### Available Services

1. **fee-structure.service.ts** - Fee structure management
   - CRUD operations
   - Search and filtering by class, academic year, status
   - Pagination support

2. **payments.service.ts** - Payment recording and tracking
   - Record new payments
   - Retrieve payments with filtering (date, status, method)
   - Track pending dues
   - Generate payment reports
   - Download receipt PDFs

3. **invoices.service.ts** - Invoice generation and management
   - Generate single student invoices
   - Bulk generate invoices for class/section
   - Update invoice status
   - Cancel invoices
   - View invoice statistics
   - Get overdue invoices
   - Download invoice PDFs

## Usage

### Import Services

```typescript
import {
  feeStructureService,
  paymentsService,
  invoicesService,
} from '@/services/finance';
```

### Example: Fetching Fee Structures

```typescript
const { data: feeStructures, total } = await feeStructureService.getAll({
  search: 'tuition',
  classId: 'class-123',
  isActive: true,
  page: 1,
  limit: 20,
});
```

### Example: Recording a Payment

```typescript
const payment = await paymentsService.recordPayment({
  studentId: 'student-456',
  invoiceId: 'invoice-789',
  amount: 50000,
  paymentMethod: 'BANK_TRANSFER',
  transactionReference: 'TXN123456',
  paymentDate: new Date(),
});
```

### Example: Generating Invoices

```typescript
// Generate for single student
const invoice = await invoicesService.generate({
  studentId: 'student-123',
  feeStructureIds: ['fee-1', 'fee-2'],
  discount: 5000,
  tax: 2000,
  dueDate: '2025-02-28',
});

// Bulk generate for class
const invoices = await invoicesService.bulkGenerate({
  classId: 'class-10-A',
  feeStructureIds: ['fee-1', 'fee-2'],
  discount: 5000,
  tax: 2000,
  dueDate: '2025-02-28',
});
```

## Frontend Pages

All pages are located in `/frontend/src/app/(dashboard)/finance/`:

| Page | Route | Features |
|------|-------|----------|
| Fee Structure | `/finance/fee-structure` | CRUD, search, filtering, pagination |
| Payments | `/finance/payments` | Record, filter, report, receipt download |
| Invoices | `/finance/invoices` | Generate, bulk generate, status update, PDF download |

## Data Structures

### FeeStructure
```typescript
interface FeeStructure {
  id: string;
  name: string;
  description: string;
  academicYearId: string;
  classId: string;
  amount: number;
  frequency: 'One-time' | 'Monthly' | 'Quarterly' | 'Annually';
  dueDay: number;
  lateFee: number;
  lateFeeAfterDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### FeePayment
```typescript
interface FeePayment {
  id: string;
  studentId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  transactionReference: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  receiptUrl: string;
  createdAt: string;
  updatedAt: string;
}
```

### FeeInvoice
```typescript
interface FeeInvoice {
  id: string;
  studentId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  totalPaid: number;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  lineItems: InvoiceLineItem[];
  payments: FeePayment[];
  documentUrl: string;
  createdAt: string;
  updatedAt: string;
}
```

### PaymentReport
```typescript
interface PaymentReport {
  payments: FeePayment[];
  summary: {
    totalPayments: number;
    totalFees: number;
    totalCollected: number;
    totalLateFees: number;
  };
}
```

### InvoiceStats
```typescript
interface InvoiceStats {
  totalInvoices: number;
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}
```

## API Endpoints

All services communicate with backend API at `/api/v1/`:

```
POST   /fees/structure                       - Create fee structure
GET    /fees/structure                       - List fee structures with filters
GET    /fees/structure/:id                   - Get single fee structure
PUT    /fees/structure/:id                   - Update fee structure
DELETE /fees/structure/:id                   - Delete fee structure

GET    /fees/payments                        - List payments with filters
POST   /fees/payments                        - Record payment
GET    /fees/dues                            - Get pending dues
GET    /fees/report                          - Get payment report
GET    /fees/payments/:id/receipt            - Download receipt PDF

GET    /invoices                             - List invoices with filters
POST   /invoices/generate                    - Generate single invoice
POST   /invoices/bulk-generate               - Bulk generate invoices
GET    /invoices/:id                         - Get single invoice
PUT    /invoices/:id/status                  - Update invoice status
PUT    /invoices/:id/cancel                  - Cancel invoice
GET    /invoices/stats                       - Get invoice statistics
GET    /invoices/overdue                     - Get overdue invoices
GET    /invoices/:id/pdf                     - Download invoice PDF
```

## Type Safety

All data structures are fully typed with TypeScript interfaces for compile-time safety:

```typescript
// Fully typed API responses
interface FeeStructureResponse {
  data: FeeStructure[];
  total: number;
}

interface PaymentResponse {
  data: FeePayment[];
  total: number;
}
```

## Error Handling

Services throw errors that should be caught in component try/catch blocks:

```typescript
try {
  const payment = await paymentsService.recordPayment(paymentData);
  toast({ title: 'Success', description: 'Payment recorded' });
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  toast({
    title: 'Error',
    description: message,
    variant: 'destructive',
  });
}
```

## Authentication

Services automatically handle authentication using:
1. JWT Bearer tokens from localStorage
2. Authorization headers in API requests
3. Token parsing from auth store state

```typescript
// Token is retrieved from auth store automatically
private getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem('school-erp-auth');
    if (stored) {
      const authData = JSON.parse(stored);
      return authData.state?.accessToken || authData.accessToken || null;
    }
  } catch (e) {
    console.error('Failed to parse auth from localStorage:', e);
  }
  return null;
}
```

## Performance Considerations

- List endpoints support pagination (page, limit)
- Filtering is context-aware per resource
- Responses are normalized for efficient rendering
- PDF downloads trigger browser download without page navigation

## Testing

Services can be tested independently with mock data:

```typescript
const mockFeeStructure = {
  id: 'fee-1',
  name: 'Monthly Tuition',
  classId: 'class-10-A',
  amount: 50000,
  frequency: 'Monthly',
  dueDay: 10,
  lateFee: 500,
  lateFeeAfterDays: 10,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

## Future Enhancements

- [ ] Batch operations (bulk update)
- [ ] Advanced filtering UI components
- [ ] Real-time updates with WebSocket
- [ ] Caching layer for frequently accessed data
- [ ] Offline support with service workers
- [ ] Payment receipt email delivery
- [ ] Invoice reminder notifications
- [ ] Dunning management for overdue accounts

## Related Modules

- **Student Module**: Student information and enrollment
- **Academic Module**: Class and section management
- **Reporting Module**: Financial reports and analytics

## See Also

- [API Documentation](/docs/api/finance.md)
- [Finance Pages Implementation](/frontend/src/app/(dashboard)/finance)
- [API Client](/frontend/src/lib/api-client.ts)
