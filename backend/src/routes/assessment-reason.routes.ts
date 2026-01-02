import { Router } from 'express';
import { assessmentReasonController } from '../controllers/assessment-reason.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List all assessment reasons
router.get('/', assessmentReasonController.getAll);

// Get assessment reason by ID
router.get('/:id', assessmentReasonController.getById);

// Create new assessment reason (Admin only)
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), assessmentReasonController.create);

// Update assessment reason (Admin only)
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), assessmentReasonController.update);

// Delete assessment reason (Admin only)
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), assessmentReasonController.delete);

export default router;
