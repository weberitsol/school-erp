import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /parents - List all parents (Admin only)
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  res.json({ success: true, message: 'Parent list endpoint', data: [] });
});

// GET /parents/:id - Get parent by ID
router.get('/:id', async (req, res) => {
  res.json({ success: true, message: 'Get parent endpoint' });
});

// POST /parents - Create new parent
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  res.json({ success: true, message: 'Create parent endpoint' });
});

// PUT /parents/:id - Update parent
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'PARENT'), async (req, res) => {
  res.json({ success: true, message: 'Update parent endpoint' });
});

// GET /parents/:id/children - Get parent's children
router.get('/:id/children', async (req, res) => {
  res.json({ success: true, message: 'Parent children endpoint' });
});

export default router;
