import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { parentController } from '../controllers/parent.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /parents/stats - Get parent statistics
router.get('/stats', parentController.getStats);

// GET /parents/user/:userId - Get parent by user ID
router.get('/user/:userId', parentController.getParentByUserId);

// POST /parents - Create new parent
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), parentController.createParent);

// GET /parents - List all parents
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), parentController.getAllParents);

// GET /parents/:id - Get parent by ID
router.get('/:id', parentController.getParent);

// PUT /parents/:id - Update parent
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'PARENT'), parentController.updateParent);

// DELETE /parents/:id - Delete parent
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), parentController.deleteParent);

// POST /parents/:id/children - Link children to parent
router.post('/:id/children', authorize('ADMIN', 'SUPER_ADMIN'), parentController.linkChildren);

// DELETE /parents/:id/children/:studentId - Unlink child
router.delete('/:id/children/:studentId', authorize('ADMIN', 'SUPER_ADMIN'), parentController.unlinkChild);

// GET /parents/:id/children - Get parent's children
router.get('/:id/children', parentController.getChildren);

// GET /parents/:id/payments - Get payment history
router.get('/:id/payments', parentController.getPaymentHistory);

export default router;
