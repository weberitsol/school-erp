import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { invoiceController } from '../controllers/invoice.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Invoice endpoints
// GET /invoices - Get all invoices
router.get('/', invoiceController.getInvoices);

// POST /invoices/generate - Generate single invoice
router.post('/generate', authorize('ADMIN', 'SUPER_ADMIN'), invoiceController.generateInvoice);

// POST /invoices/bulk-generate - Bulk generate invoices
router.post('/bulk-generate', authorize('ADMIN', 'SUPER_ADMIN'), invoiceController.bulkGenerateInvoices);

// GET /invoices/stats - Get invoice statistics
router.get('/stats', authorize('ADMIN', 'SUPER_ADMIN'), invoiceController.getInvoiceStats);

// GET /invoices/overdue - Get overdue invoices
router.get('/overdue', authorize('ADMIN', 'SUPER_ADMIN'), invoiceController.getOverdueInvoices);

// GET /invoices/:id - Get specific invoice
router.get('/:id', invoiceController.getInvoiceById);

// PUT /invoices/:id/status - Update invoice status
router.put('/:id/status', authorize('ADMIN', 'SUPER_ADMIN'), invoiceController.updateInvoiceStatus);

// PUT /invoices/:id/cancel - Cancel invoice
router.put('/:id/cancel', authorize('ADMIN', 'SUPER_ADMIN'), invoiceController.cancelInvoice);

// GET /invoices/:invoiceId/pdf - Download invoice PDF
router.get('/:invoiceId/pdf', invoiceController.downloadInvoice);

export default router;
