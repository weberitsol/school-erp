import { Router } from 'express';
import { tagController } from '../controllers/tag.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Search tags (must be before /:id to avoid conflict)
router.get('/search', tagController.search);

// Get tag categories
router.get('/categories', tagController.getCategories);

// List all tags
router.get('/', tagController.getAll);

// Get tag by ID
router.get('/:id', tagController.getById);

// Create new tag (Admin only)
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), tagController.create);

// Update tag (Admin only)
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), tagController.update);

// Delete tag (Admin only)
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), tagController.delete);

export default router;
