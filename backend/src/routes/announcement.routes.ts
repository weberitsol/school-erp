import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { announcementController } from '../controllers/announcement.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /announcements/stats - Get announcement statistics
router.get('/stats', announcementController.getStats);

// GET /announcements/active - Get active announcements
router.get('/active', announcementController.getActive);

// GET /announcements/audience/:audience - Get announcements for specific audience
router.get('/audience/:audience', announcementController.getByAudience);

// POST /announcements - Create announcement
router.post('/', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), announcementController.create);

// GET /announcements - List all announcements
router.get('/', announcementController.getAll);

// GET /announcements/:id - Get announcement by ID
router.get('/:id', announcementController.getById);

// PUT /announcements/:id - Update announcement
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), announcementController.update);

// POST /announcements/:id/publish - Publish announcement
router.post('/:id/publish', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), announcementController.publish);

// DELETE /announcements/:id - Delete announcement
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), announcementController.delete);

export default router;
