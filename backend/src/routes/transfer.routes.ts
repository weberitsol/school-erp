import { Router } from 'express';
import { batchTransferController } from '../controllers/batch-transfer.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get transfer history
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), batchTransferController.getTransferHistory);

// Get student transfer history
router.get(
  '/student/:studentId',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  batchTransferController.getStudentTransferHistory
);

// Get transfer by ID
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN'), batchTransferController.getTransferById);

// Transfer single student (Admin only)
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), batchTransferController.transferStudent);

// Bulk transfer students (Admin only)
router.post('/bulk', authorize('ADMIN', 'SUPER_ADMIN'), batchTransferController.bulkTransferStudents);

export default router;
