import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { feeController } from '../controllers/fee.controller';

const router = Router();

router.use(authenticate);

// Fee Structure endpoints
// GET /fees/structure - Get fee structures
router.get('/structure', feeController.getFeeStructures);

// POST /fees/structure - Create fee structure
router.post('/structure', authorize('ADMIN', 'SUPER_ADMIN'), feeController.createFeeStructure);

// GET /fees/structure/:id - Get fee structure by ID
router.get('/structure/:id', feeController.getFeeStructureById);

// PUT /fees/structure/:id - Update fee structure
router.put('/structure/:id', authorize('ADMIN', 'SUPER_ADMIN'), feeController.updateFeeStructure);

// DELETE /fees/structure/:id - Delete fee structure
router.delete('/structure/:id', authorize('ADMIN', 'SUPER_ADMIN'), feeController.deleteFeeStructure);

// Payment endpoints
// GET /fees/payments - Get fee payments
router.get('/payments', feeController.getPayments);

// POST /fees/payments - Record fee payment
router.post('/payments', authorize('ADMIN', 'SUPER_ADMIN'), feeController.recordPayment);

// GET /fees/dues - Get pending dues
router.get('/dues', feeController.getPendingDues);

// GET /fees/report - Get fee collection report
router.get('/report', authorize('ADMIN', 'SUPER_ADMIN'), feeController.getPaymentReport);

// GET /fees/payments/:paymentId/receipt - Download receipt PDF
router.get('/payments/:paymentId/receipt', feeController.downloadReceipt);

export default router;
