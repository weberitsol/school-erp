import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get my tasks (assigned to current user)
router.get('/my', taskController.getMyTasks);

// Get task stats
router.get('/stats', authorize('ADMIN', 'SUPER_ADMIN'), taskController.getStats);

// List all tasks
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), taskController.getAll);

// Get task by ID
router.get('/:id', taskController.getById);

// Create new task (Admin only)
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), taskController.create);

// Update task
router.put('/:id', taskController.update);

// Update task status only
router.patch('/:id/status', taskController.updateStatus);

// Delete task (Admin only)
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), taskController.delete);

export default router;
