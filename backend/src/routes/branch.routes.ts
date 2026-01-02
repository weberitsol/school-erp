import { Router } from 'express';
import { branchController } from '../controllers/branch.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List all branches
router.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), branchController.getAll);

// Get branch by ID
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), branchController.getById);

// Create new branch (Admin only)
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), branchController.create);

// Update branch (Admin only)
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), branchController.update);

// Delete branch (Admin only)
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), branchController.delete);

export default router;
